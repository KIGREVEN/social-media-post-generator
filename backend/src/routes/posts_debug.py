from flask import Blueprint, request, jsonify
from src.models import db, User, Post, PostUsage
from src.services.openai_service import OpenAIService
import requests
from datetime import datetime

posts_debug_bp = Blueprint('posts_debug', __name__)

@posts_debug_bp.route('/generate', methods=['POST', 'OPTIONS'])
def debug_generate_post():
    """Generate a social media post using AI (debug - no auth required)."""
    if request.method == 'OPTIONS':
        # Handle CORS preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response
        
    try:
        # Use a default user for debug purposes
        user = User.query.filter_by(username='admin').first()
        if not user:
            # Create a default user if none exists
            user = User(username='debug_user', email='debug@example.com', role='user')
            user.set_password('debug123')
            db.session.add(user)
            db.session.commit()
        
        current_user_id = user.id
        
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
        
        # Initialize OpenAI service
        openai_service = OpenAIService()
        
        # Generate post content
        post_content = openai_service.generate_post(
            profile_url=profile_url,
            post_theme=post_theme,
            additional_details=additional_details,
            platform=platform
        )
        
        # Create post record
        post = Post(
            user_id=current_user_id,
            title=post_theme[:200],  # Limit title length
            content=post_content,
            platform=platform,
            post_theme=post_theme,
            profile_url=profile_url,
            additional_details=additional_details
        )
        
        # Generate image if requested
        if generate_image:
            try:
                image_url = openai_service.generate_image(post_content)
                post.image_url = image_url
            except Exception as e:
                print(f"Image generation failed: {e}")
                # Continue without image
        
        db.session.add(post)
        
        # Update usage tracking
        post_usage.increment_posts_generated()
        
        db.session.commit()
        
        return jsonify({
            'post': post.to_dict(),
            'message': 'Post generated successfully',
            'remaining_posts': post_usage.get_remaining_posts()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Unexpected error',
            'details': str(e)
        }), 500

@posts_debug_bp.route('/', methods=['GET', 'OPTIONS'])
def debug_get_posts():
    """Get user's posts (debug - no auth required)."""
    if request.method == 'OPTIONS':
        # Handle CORS preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
        
    try:
        # Use a default user for debug purposes
        user = User.query.filter_by(username='admin').first()
        current_user_id = user.id if user else 1
        
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

