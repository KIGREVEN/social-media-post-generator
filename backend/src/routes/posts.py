from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models import db, User, Post, PostUsage
from src.services.openai_service import OpenAIService
import requests
from datetime import datetime

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_post():
    """Generate a social media post using AI."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check user's post usage limits
        post_usage = PostUsage.query.filter_by(user_id=current_user_id).first()
        if not post_usage:
            post_usage = PostUsage(user_id=current_user_id)
            db.session.add(post_usage)
            db.session.commit()
        
        if not post_usage.can_generate_post():
            return jsonify({
                'error': 'Monthly post limit reached',
                'remaining_posts': post_usage.get_remaining_posts(),
                'monthly_limit': post_usage.monthly_limit
            }), 429
        
        data = request.get_json()
        
        profile_url = data.get('profile_url')
        post_theme = data.get('post_theme')
        additional_details = data.get('additional_details', '')
        generate_image = data.get('generate_image', False)
        platform = data.get('platform', 'linkedin')
        
        if not profile_url or not post_theme:
            return jsonify({'error': 'Profile URL and post theme are required'}), 400
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Invalid platform'}), 400
        
        # Initialize OpenAI service with detailed error handling
        try:
            from flask import current_app
            import openai
            
            # Debug: Check if API key is available
            api_key = current_app.config.get('OPENAI_API_KEY')
            if not api_key:
                return jsonify({
                    'error': 'OpenAI API key not configured in Flask app',
                    'debug_info': 'OPENAI_API_KEY environment variable missing'
                }), 500
            
            # Debug: Show API key preview
            key_preview = f"{api_key[:10]}...{api_key[-4:]}" if len(api_key) > 14 else "key_too_short"
            
            # Set API key explicitly
            openai.api_key = api_key
            
            # Test API connectivity first
            try:
                test_response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "test"}],
                    max_tokens=1
                )
            except openai.error.AuthenticationError as auth_error:
                return jsonify({
                    'error': 'OpenAI Authentication Error',
                    'details': str(auth_error),
                    'api_key_preview': key_preview,
                    'debug_info': 'API key is invalid or expired'
                }), 401
            except openai.error.RateLimitError as rate_error:
                return jsonify({
                    'error': 'OpenAI Rate Limit Error',
                    'details': str(rate_error),
                    'debug_info': 'Too many requests to OpenAI API'
                }), 429
            except Exception as openai_error:
                return jsonify({
                    'error': 'OpenAI API Error',
                    'details': str(openai_error),
                    'api_key_preview': key_preview,
                    'debug_info': 'General OpenAI API error'
                }), 500
            
            # If we get here, OpenAI is working
            openai_service = OpenAIService()
            
        except ValueError as e:
            return jsonify({
                'error': 'OpenAI Service Configuration Error',
                'details': str(e)
            }), 500
        except Exception as e:
            return jsonify({
                'error': 'OpenAI Service Initialization Error',
                'details': str(e)
            }), 500
        
        # Generate the post content with specific error handling
        try:
            post_content = openai_service.generate_social_media_post(
                profile_url=profile_url,
                post_theme=post_theme,
                additional_details=additional_details,
                platform=platform
            )
        except openai.error.AuthenticationError as auth_error:
            return jsonify({
                'error': 'Invalid OpenAI API key',
                'details': str(auth_error),
                'debug_info': 'Authentication failed during post generation'
            }), 401
        except openai.error.RateLimitError as rate_error:
            return jsonify({
                'error': 'OpenAI rate limit exceeded',
                'details': str(rate_error)
            }), 429
        except openai.error.InvalidRequestError as req_error:
            return jsonify({
                'error': 'Invalid request to OpenAI',
                'details': str(req_error)
            }), 400
        except Exception as e:
            return jsonify({
                'error': 'Post generation failed',
                'details': str(e),
                'debug_info': 'Error in generate_social_media_post function'
            }), 500
        
        # Generate image if requested
        generated_image_url = None
        if generate_image:
            try:
                # Create image prompt based on post theme
                image_prompt = openai_service.create_image_prompt(
                    post_theme=post_theme,
                    company_info=f"Website: {profile_url}"
                )
                
                generated_image_url = openai_service.generate_image(image_prompt)
                
            except Exception as e:
                # Don't fail the entire request if image generation fails
                print(f"Image generation failed: {str(e)}")
        
        # Create and save the post
        post = Post(
            user_id=current_user_id,
            title=post_theme[:200],  # Truncate to fit title field
            content=post_content,
            profile_url=profile_url,
            post_theme=post_theme,
            additional_details=additional_details,
            generated_image_url=generated_image_url,
            platform=platform
        )
        
        db.session.add(post)
        
        # Update usage counter
        post_usage.increment_generated()
        
        db.session.commit()
        
        return jsonify({
            'post': post.to_dict(),
            'remaining_posts': post_usage.get_remaining_posts(),
            'message': 'Post generated successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Unexpected error',
            'details': str(e)
        }), 500

@posts_bp.route('/', methods=['GET'])
@posts_bp.route('', methods=['GET'])
@jwt_required()
def get_posts():
    """Get user's posts."""
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        posts = Post.query.filter_by(user_id=current_user_id)\
                         .order_by(Post.created_at.desc())\
                         .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'posts': [post.to_dict() for post in posts.items],
            'total': posts.total,
            'pages': posts.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@posts_bp.route('/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post(post_id):
    """Get a specific post."""
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        return jsonify({'post': post.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@posts_bp.route('/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    """Update a post."""
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'title' in data:
            post.title = data['title'][:200]
        
        if 'content' in data:
            post.content = data['content']
        
        if 'platform' in data:
            if data['platform'] in ['linkedin', 'facebook', 'twitter', 'instagram']:
                post.platform = data['platform']
        
        db.session.commit()
        
        return jsonify({
            'post': post.to_dict(),
            'message': 'Post updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """Delete a post."""
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Post deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@posts_bp.route('/<int:post_id>/publish', methods=['POST'])
@jwt_required()
def publish_post(post_id):
    """Publish a post to social media."""
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        data = request.get_json()
        platform = data.get('platform')
        
        if not platform:
            return jsonify({'error': 'Platform is required'}), 400
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Invalid platform'}), 400
        
        # TODO: Implement actual social media publishing
        # For now, just mark as posted
        post.mark_as_posted(platform)
        
        # Update usage counter
        post_usage = PostUsage.query.filter_by(user_id=current_user_id).first()
        if post_usage:
            post_usage.increment_posted()
        
        db.session.commit()
        
        return jsonify({
            'post': post.to_dict(),
            'message': f'Post published to {platform} successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@posts_bp.route('/usage', methods=['GET'])
@jwt_required()
def get_usage():
    """Get user's post usage statistics."""
    try:
        current_user_id = get_jwt_identity()
        post_usage = PostUsage.query.filter_by(user_id=current_user_id).first()
        
        if not post_usage:
            post_usage = PostUsage(user_id=current_user_id)
            db.session.add(post_usage)
            db.session.commit()
        
        return jsonify({'usage': post_usage.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@posts_bp.route('/generate-test', methods=['POST'])
def generate_post_test():
    """Test-Route für Post-Generierung ohne JWT."""
    try:
        print("🧪 Test-Route aufgerufen - ohne JWT-Authentifizierung")
        
        data = request.get_json()
        profile_url = data.get('profile_url')
        post_theme = data.get('post_theme')
        platform = data.get('platform', 'linkedin')
        
        if not profile_url or not post_theme:
            return jsonify({'error': 'Profile URL and post theme are required'}), 400
        
        # Direkte OpenAI-Integration ohne User-Checks
        try:
            import os
            api_key = os.environ.get('OPENAI_API_KEY')
            if not api_key:
                return jsonify({
                    'error': 'OpenAI API key not configured',
                    'debug_info': 'OPENAI_API_KEY environment variable missing'
                }), 500
            
            # OpenAI API direkt verwenden
            import openai
            openai.api_key = api_key
            
            # Test API-Konnektivität
            test_response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            
            # Generiere tatsächlichen Post
            prompt = f"""
            Erstelle einen professionellen {platform} Post über das Thema: {post_theme}
            Basierend auf der Website: {profile_url}
            
            Der Post sollte:
            - Professionell und ansprechend sein
            - Relevante Hashtags enthalten
            - Call-to-Action haben
            - Für {platform} optimiert sein
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            post_content = response.choices[0].message.content.strip()
            
            return jsonify({
                'success': True,
                'post_content': post_content,
                'platform': platform,
                'debug_info': 'Test-Route erfolgreich - OpenAI funktioniert!'
            }), 200
            
        except Exception as openai_error:
            return jsonify({
                'error': 'OpenAI API Error',
                'details': str(openai_error),
                'debug_info': 'Fehler bei OpenAI-Kommunikation'
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': 'Server Error',
            'details': str(e),
            'debug_info': 'Allgemeiner Server-Fehler'
        }), 500

