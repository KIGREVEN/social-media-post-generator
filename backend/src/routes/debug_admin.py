from flask import Blueprint, request, jsonify
from src.models import db, User, Post, SocialAccount, PostUsage

debug_admin_bp = Blueprint('debug_admin', __name__)

@debug_admin_bp.route('/debug-stats', methods=['GET'])
def get_debug_stats():
    """Get system statistics without JWT (debug only)."""
    try:
        # Get user statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        admin_users = User.query.filter_by(role='admin').count()
        
        # Get post statistics
        total_posts = Post.query.count()
        posted_posts = Post.query.filter_by(is_posted=True).count()
        
        # Get social account statistics
        total_social_accounts = SocialAccount.query.count()
        active_social_accounts = SocialAccount.query.filter_by(is_active=True).count()
        
        # Platform breakdown
        platform_stats = {}
        platforms = ['linkedin', 'facebook', 'twitter', 'instagram']
        for platform in platforms:
            platform_stats[platform] = SocialAccount.query.filter_by(platform=platform, is_active=True).count()
        
        return jsonify({
            'users': {
                'total': total_users,
                'active': active_users,
                'admins': admin_users
            },
            'posts': {
                'total': total_posts,
                'posted': posted_posts,
                'draft': total_posts - posted_posts
            },
            'social_accounts': {
                'total': total_social_accounts,
                'active': active_social_accounts,
                'by_platform': platform_stats
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_admin_bp.route('/debug-users', methods=['GET'])
def get_debug_users():
    """Get all users without JWT (debug only)."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        users = User.query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'pagination': {
                'page': users.page,
                'pages': users.pages,
                'per_page': users.per_page,
                'total': users.total,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_admin_bp.route('/debug-posts', methods=['GET'])
def get_debug_posts():
    """Get all posts without JWT (debug only)."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        posts = Post.query.paginate(
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

