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
        # Get the real current user from JWT token
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
        
        profile_url = data.get('profile_url', '')
        post_theme = data.get('post_theme')
        additional_details = data.get('additional_details', '')
        generate_image = data.get('generate_image', False)
        platform = data.get('platform', 'linkedin')
        
        # Profile URL is optional for Content-Planner generated posts
        if not post_theme:
            return jsonify({'error': 'Post theme is required'}), 400
        
        # Use a default profile URL if none provided (for Content-Planner)
        if not profile_url:
            profile_url = 'https://example.com'
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Invalid platform'}), 400
        
        # Initialize OpenAI service
        try:
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
        
        # Generate the post content
        try:
            post_content = openai_service.generate_social_media_post(
                profile_url=profile_url,
                post_theme=post_theme,
                additional_details=additional_details,
                platform=platform
            )
        except Exception as e:
            return jsonify({
                'error': 'Post generation failed',
                'details': str(e)
            }), 500
        
        # Generate image if requested
        generated_image_url = None
        if generate_image:
            try:
                # Create image prompt based on the GENERATED POST CONTENT (not just theme)
                image_prompt = openai_service.create_image_prompt(
                    post_content=post_content,  # Use the actual generated post content
                    platform=platform
                )
                
                # Get platform-specific image size
                image_size = openai_service.get_platform_image_size(platform)
                
                # Generate image with platform-specific size
                generated_image_url = openai_service.generate_image(
                    prompt=image_prompt,
                    size=image_size
                )
                
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
        # Get the real current user from JWT token
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
        # Get the real current user from JWT token
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
        # Get the real current user from JWT token
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
        # Get the real current user from JWT token
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
        # Get the real current user from JWT token
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
def get_usage():
    """Get user's post usage statistics."""
    try:
        # Verwende admin user als Standard
        user = User.query.filter_by(username='admin').first()
        current_user_id = user.id if user else 1
        
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
        
        # Direkte OpenAI-Integration mit HTTP API calls
        try:
            openai_service = OpenAIService()
            
            # Generiere Post
            post_content = openai_service.generate_social_media_post(
                profile_url=profile_url,
                post_theme=post_theme,
                additional_details="",
                platform=platform
            )
            
            return jsonify({
                'success': True,
                'post_content': post_content,
                'platform': platform,
                'debug_info': 'Test-Route erfolgreich - OpenAI HTTP API funktioniert!'
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

