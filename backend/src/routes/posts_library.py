from flask import Blueprint, request, jsonify
from src.models import db, User, Post
from datetime import datetime
from sqlalchemy import desc

posts_library_bp = Blueprint('posts_library', __name__)

@posts_library_bp.route('/posts', methods=['GET'])
def get_user_posts():
    """Get all posts for the current user with pagination and filtering."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        platform = request.args.get('platform')
        search = request.args.get('search')
        
        # Build query
        query = Post.query.filter_by(user_id=current_user_id)
        
        # Apply filters
        if platform:
            query = query.filter(Post.platform == platform)
        
        if search:
            query = query.filter(
                db.or_(
                    Post.title.ilike(f'%{search}%'),
                    Post.content.ilike(f'%{search}%'),
                    Post.post_theme.ilike(f'%{search}%')
                )
            )
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Post.created_at))
        
        # Paginate
        posts = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'posts': [post.to_dict() for post in posts.items],
            'pagination': {
                'page': posts.page,
                'pages': posts.pages,
                'per_page': posts.per_page,
                'total': posts.total,
                'has_next': posts.has_next,
                'has_prev': posts.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@posts_library_bp.route('/posts/<int:post_id>', methods=['GET'])
def get_post_details(post_id):
    """Get detailed information about a specific post."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        return jsonify(post.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@posts_library_bp.route('/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """Update a specific post."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'title' in data:
            post.title = data['title']
        if 'content' in data:
            post.content = data['content']
        if 'post_theme' in data:
            post.post_theme = data['post_theme']
        if 'additional_details' in data:
            post.additional_details = data['additional_details']
        if 'platform' in data:
            if data['platform'] in ['linkedin', 'facebook', 'twitter', 'instagram']:
                post.platform = data['platform']
        
        db.session.commit()
        
        return jsonify(post.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@posts_library_bp.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """Delete a specific post."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Post deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@posts_library_bp.route('/posts/<int:post_id>/duplicate', methods=['POST'])
def duplicate_post(post_id):
    """Create a duplicate of an existing post."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        original_post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        if not original_post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Create duplicate
        duplicate = Post(
            user_id=current_user_id,
            title=f"{original_post.title} (Kopie)" if original_post.title else None,
            content=original_post.content,
            profile_url=original_post.profile_url,
            post_theme=original_post.post_theme,
            additional_details=original_post.additional_details,
            generated_image_url=original_post.generated_image_url,
            platform=original_post.platform,
            is_posted=False,  # Reset posting status
            posted_at=None
        )
        
        db.session.add(duplicate)
        db.session.commit()
        
        return jsonify(duplicate.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@posts_library_bp.route('/posts/stats', methods=['GET'])
def get_posts_stats():
    """Get statistics about user's posts."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        # Get total posts count
        total_posts = Post.query.filter_by(user_id=current_user_id).count()
        
        # Get posts by platform
        platform_stats = {}
        for platform in ['linkedin', 'facebook', 'twitter', 'instagram']:
            count = Post.query.filter_by(user_id=current_user_id, platform=platform).count()
            platform_stats[platform] = count
        
        # Get posted vs draft posts
        posted_count = Post.query.filter_by(user_id=current_user_id, is_posted=True).count()
        draft_count = total_posts - posted_count
        
        # Get recent posts (last 7 days)
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_posts = Post.query.filter(
            Post.user_id == current_user_id,
            Post.created_at >= week_ago
        ).count()
        
        return jsonify({
            'total_posts': total_posts,
            'platform_stats': platform_stats,
            'posted_count': posted_count,
            'draft_count': draft_count,
            'recent_posts': recent_posts
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

