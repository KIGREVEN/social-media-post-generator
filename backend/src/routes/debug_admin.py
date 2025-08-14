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
        
        # Get subscription statistics
        subscription_stats = {}
        subscriptions = ['free', 'basic', 'premium', 'enterprise']
        for subscription in subscriptions:
            subscription_stats[subscription] = User.query.filter_by(subscription=subscription).count()
        
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
                'admins': admin_users,
                'by_subscription': subscription_stats
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


@debug_admin_bp.route('/debug-users', methods=['POST', 'OPTIONS'])
def create_debug_user():
    """Create a new user without JWT (debug only)."""
    if request.method == 'OPTIONS':
        # Handle CORS preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # Validate password length
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Validate role
        role = data.get('role', 'user')
        if role not in ['user', 'admin']:
            return jsonify({'error': 'Invalid role. Must be "user" or "admin"'}), 400
        
        # Validate subscription
        subscription = data.get('subscription', 'free')
        if subscription not in ['free', 'basic', 'premium', 'enterprise']:
            return jsonify({'error': 'Invalid subscription. Must be "free", "basic", "premium", or "enterprise"'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            role=role,
            subscription=subscription,
            is_active=data.get('is_active', True)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create post usage record with subscription-based limit
        monthly_limit = data.get('monthly_limit', user.get_subscription_limits())
        post_usage = PostUsage(
            user_id=user.id,
            monthly_limit=monthly_limit
        )
        db.session.add(post_usage)
        db.session.commit()
        
        return jsonify({
            'user': user.to_dict(),
            'message': 'User created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@debug_admin_bp.route('/debug-users/<int:user_id>', methods=['PUT', 'OPTIONS'])
def update_debug_user(user_id):
    """Update a user without JWT (debug only)."""
    if request.method == 'OPTIONS':
        # Handle CORS preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'PUT,OPTIONS')
        return response
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'username' in data:
            # Check if username is already taken by another user
            existing_user = User.query.filter(
                User.username == data['username'],
                User.id != user_id
            ).first()
            if existing_user:
                return jsonify({'error': 'Username already exists'}), 409
            user.username = data['username']
        
        if 'email' in data:
            # Check if email is already taken by another user
            existing_user = User.query.filter(
                User.email == data['email'],
                User.id != user_id
            ).first()
            if existing_user:
                return jsonify({'error': 'Email already exists'}), 409
            user.email = data['email']
        
        if 'role' in data:
            if data['role'] not in ['user', 'admin']:
                return jsonify({'error': 'Invalid role. Must be "user" or "admin"'}), 400
            user.role = data['role']
        
        if 'subscription' in data:
            if data['subscription'] not in ['free', 'basic', 'premium', 'enterprise']:
                return jsonify({'error': 'Invalid subscription. Must be "free", "basic", "premium", or "enterprise"'}), 400
            user.subscription = data['subscription']
            
            # Update monthly limit based on new subscription if not explicitly provided
            if 'monthly_limit' not in data:
                post_usage = PostUsage.query.filter_by(user_id=user_id).first()
                if post_usage:
                    post_usage.set_monthly_limit(user.get_subscription_limits())
        
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        
        if 'password' in data:
            if len(data['password']) < 6:
                return jsonify({'error': 'Password must be at least 6 characters long'}), 400
            user.set_password(data['password'])
        
        # Update monthly limit if provided
        if 'monthly_limit' in data:
            post_usage = PostUsage.query.filter_by(user_id=user_id).first()
            if post_usage:
                post_usage.set_monthly_limit(data['monthly_limit'])
            else:
                # Create post usage record if it doesn't exist
                post_usage = PostUsage(
                    user_id=user_id,
                    monthly_limit=data['monthly_limit']
                )
                db.session.add(post_usage)
        
        db.session.commit()
        
        return jsonify({
            'user': user.to_dict(),
            'message': 'User updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@debug_admin_bp.route('/debug-users/<int:user_id>', methods=['DELETE', 'OPTIONS'])
def delete_debug_user(user_id):
    """Delete a user without JWT (debug only)."""
    if request.method == 'OPTIONS':
        # Handle CORS preflight request - let Flask-CORS handle headers
        return jsonify({'status': 'ok'}), 200
        
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deletion of the last admin
        if user.role == 'admin':
            admin_count = User.query.filter_by(role='admin').count()
            if admin_count <= 1:
                return jsonify({'error': 'Cannot delete the last admin user'}), 400
        
        # Delete user (cascade will handle related records)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@debug_admin_bp.route('/debug-users/<int:user_id>/subscription', methods=['PUT'])
def update_user_subscription(user_id):
    """Update user subscription and monthly limit."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate subscription
        if 'subscription' in data:
            if data['subscription'] not in ['free', 'basic', 'premium', 'enterprise']:
                return jsonify({'error': 'Invalid subscription. Must be "free", "basic", "premium", or "enterprise"'}), 400
            user.subscription = data['subscription']
        
        # Get or create post usage record
        post_usage = PostUsage.query.filter_by(user_id=user_id).first()
        if not post_usage:
            post_usage = PostUsage(user_id=user_id)
            db.session.add(post_usage)
        
        # Update monthly limit
        if 'monthly_limit' in data:
            post_usage.set_monthly_limit(data['monthly_limit'])
        elif 'subscription' in data:
            # Auto-set limit based on subscription
            post_usage.set_monthly_limit(user.get_subscription_limits())
        
        # Reset posts generated if requested
        if data.get('reset_usage', False):
            post_usage.posts_generated = 0
            post_usage.posts_posted = 0
        
        db.session.commit()
        
        return jsonify({
            'user': user.to_dict(),
            'message': 'Subscription updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@debug_admin_bp.route('/debug-users/<int:user_id>/usage', methods=['GET'])
def get_user_usage(user_id):
    """Get detailed usage information for a user."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        post_usage = PostUsage.query.filter_by(user_id=user_id).first()
        if not post_usage:
            # Create default post usage if it doesn't exist
            post_usage = PostUsage(
                user_id=user_id,
                monthly_limit=user.get_subscription_limits()
            )
            db.session.add(post_usage)
            db.session.commit()
        
        return jsonify({
            'user_id': user_id,
            'username': user.username,
            'subscription': user.subscription,
            'usage': post_usage.to_dict(),
            'subscription_limits': {
                'free': 10,
                'basic': 50,
                'premium': 200,
                'enterprise': 1000
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

