"""
Safe Debug Admin routes that work without subscription column
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import text, func, inspect
from sqlalchemy.exc import SQLAlchemyError
from src.database import db
from src.models.user import User
from src.models.post import Post
from src.models.social_account import SocialAccount
from src.models.post_usage import PostUsage
import bcrypt
from datetime import datetime

debug_admin_safe_bp = Blueprint('debug_admin_safe', __name__)

def check_column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    try:
        inspector = inspect(db.engine)
        columns = inspector.get_columns(table_name)
        return any(col['name'] == column_name for col in columns)
    except:
        return False

def get_user_safe(user_id=None):
    """Get user data safely without subscription column if it doesn't exist."""
    try:
        has_subscription = check_column_exists('users', 'subscription')
        
        if has_subscription:
            if user_id:
                return User.query.get(user_id)
            else:
                return User.query.all()
        else:
            # Query without subscription column
            if user_id:
                result = db.session.execute(text("""
                    SELECT id, username, email, password_hash, role, is_active, created_at, updated_at
                    FROM users WHERE id = :user_id
                """), {'user_id': user_id})
                row = result.fetchone()
                if row:
                    user = User()
                    user.id = row[0]
                    user.username = row[1]
                    user.email = row[2]
                    user.password_hash = row[3]
                    user.role = row[4]
                    user.is_active = row[5]
                    user.created_at = row[6]
                    user.updated_at = row[7]
                    return user
                return None
            else:
                result = db.session.execute(text("""
                    SELECT id, username, email, password_hash, role, is_active, created_at, updated_at
                    FROM users
                """))
                users = []
                for row in result:
                    user = User()
                    user.id = row[0]
                    user.username = row[1]
                    user.email = row[2]
                    user.password_hash = row[3]
                    user.role = row[4]
                    user.is_active = row[5]
                    user.created_at = row[6]
                    user.updated_at = row[7]
                    users.append(user)
                return users
    except Exception as e:
        print(f"Error in get_user_safe: {e}")
        return None if user_id else []

def user_to_dict_safe(user):
    """Convert user to dict safely."""
    has_subscription = check_column_exists('users', 'subscription')
    
    data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'subscription': getattr(user, 'subscription', 'free') if has_subscription else 'free',
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'updated_at': user.updated_at.isoformat() if user.updated_at else None
    }
    
    return data

@debug_admin_safe_bp.route('/api/debug-admin-safe/debug-stats', methods=['GET'])
def debug_stats_safe():
    """Get system statistics safely."""
    try:
        # Get user stats safely
        users = get_user_safe()
        total_users = len(users)
        active_users = sum(1 for user in users if user.is_active)
        admin_users = sum(1 for user in users if user.role == 'admin')
        
        # Get subscription breakdown safely
        has_subscription = check_column_exists('users', 'subscription')
        subscription_breakdown = {'free': 0, 'basic': 0, 'premium': 0, 'enterprise': 0}
        
        if has_subscription:
            for user in users:
                subscription = getattr(user, 'subscription', 'free')
                if subscription in subscription_breakdown:
                    subscription_breakdown[subscription] += 1
                else:
                    subscription_breakdown['free'] += 1
        else:
            subscription_breakdown['free'] = total_users
        
        # Get post stats
        total_posts = Post.query.count()
        posted_posts = Post.query.filter_by(status='posted').count()
        draft_posts = Post.query.filter_by(status='draft').count()
        
        # Get social account stats
        total_social_accounts = SocialAccount.query.count()
        active_social_accounts = SocialAccount.query.filter_by(is_active=True).count()
        
        # Platform breakdown
        platform_stats = {}
        platforms = ['facebook', 'instagram', 'twitter', 'linkedin']
        for platform in platforms:
            platform_stats[platform] = SocialAccount.query.filter_by(platform=platform).count()
        
        return jsonify({
            'users': {
                'total': total_users,
                'active': active_users,
                'admins': admin_users,
                'by_subscription': subscription_breakdown
            },
            'posts': {
                'total': total_posts,
                'posted': posted_posts,
                'draft': draft_posts
            },
            'social_accounts': {
                'total': total_social_accounts,
                'active': active_social_accounts,
                'by_platform': platform_stats
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_admin_safe_bp.route('/api/debug-admin-safe/debug-users', methods=['GET'])
def debug_users_safe():
    """Get all users safely."""
    try:
        users = get_user_safe()
        users_data = [user_to_dict_safe(user) for user in users]
        
        return jsonify({
            'users': users_data,
            'total': len(users_data)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_admin_safe_bp.route('/api/debug-admin-safe/debug-users', methods=['POST'])
def debug_create_user_safe():
    """Create a new user safely."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        existing_user = db.session.execute(text("""
            SELECT id FROM users WHERE username = :username OR email = :email
        """), {'username': data['username'], 'email': data['email']}).fetchone()
        
        if existing_user:
            return jsonify({'error': 'User with this username or email already exists'}), 400
        
        # Hash password
        password_bytes = data['password'].encode('utf-8')
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        # Check if subscription column exists
        has_subscription = check_column_exists('users', 'subscription')
        
        if has_subscription:
            # Insert with subscription column
            result = db.session.execute(text("""
                INSERT INTO users (username, email, password_hash, role, subscription, is_active, created_at, updated_at)
                VALUES (:username, :email, :password_hash, :role, :subscription, :is_active, :created_at, :updated_at)
                RETURNING id
            """), {
                'username': data['username'],
                'email': data['email'],
                'password_hash': password_hash,
                'role': data.get('role', 'user'),
                'subscription': data.get('subscription', 'free'),
                'is_active': data.get('is_active', True),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
        else:
            # Insert without subscription column
            result = db.session.execute(text("""
                INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at)
                VALUES (:username, :email, :password_hash, :role, :is_active, :created_at, :updated_at)
                RETURNING id
            """), {
                'username': data['username'],
                'email': data['email'],
                'password_hash': password_hash,
                'role': data.get('role', 'user'),
                'is_active': data.get('is_active', True),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
        
        user_id = result.fetchone()[0]
        db.session.commit()
        
        # Get the created user
        user = get_user_safe(user_id)
        
        return jsonify({
            'message': 'User created successfully',
            'user': user_to_dict_safe(user)
        }), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@debug_admin_safe_bp.route('/api/debug-admin-safe/debug-users/<int:user_id>', methods=['PUT'])
def debug_update_user_safe(user_id):
    """Update a user safely."""
    try:
        data = request.get_json()
        
        # Check if user exists
        user = get_user_safe(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if subscription column exists
        has_subscription = check_column_exists('users', 'subscription')
        
        # Build update query
        update_fields = []
        update_values = {'user_id': user_id, 'updated_at': datetime.utcnow()}
        
        if 'username' in data:
            update_fields.append('username = :username')
            update_values['username'] = data['username']
        
        if 'email' in data:
            update_fields.append('email = :email')
            update_values['email'] = data['email']
        
        if 'role' in data:
            update_fields.append('role = :role')
            update_values['role'] = data['role']
        
        if 'subscription' in data and has_subscription:
            update_fields.append('subscription = :subscription')
            update_values['subscription'] = data['subscription']
        
        if 'is_active' in data:
            update_fields.append('is_active = :is_active')
            update_values['is_active'] = data['is_active']
        
        if 'password' in data:
            password_bytes = data['password'].encode('utf-8')
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
            update_fields.append('password_hash = :password_hash')
            update_values['password_hash'] = password_hash
        
        update_fields.append('updated_at = :updated_at')
        
        if update_fields:
            query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = :user_id"
            db.session.execute(text(query), update_values)
            db.session.commit()
        
        # Get updated user
        updated_user = get_user_safe(user_id)
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user_to_dict_safe(updated_user)
        })
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@debug_admin_safe_bp.route('/api/debug-admin-safe/debug-users/<int:user_id>', methods=['DELETE'])
def debug_delete_user_safe(user_id):
    """Delete a user safely."""
    try:
        # Check if user exists
        user = get_user_safe(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete user
        db.session.execute(text("DELETE FROM users WHERE id = :user_id"), {'user_id': user_id})
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'})
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@debug_admin_safe_bp.route('/api/debug-admin-safe/debug-posts', methods=['GET'])
def debug_posts_safe():
    """Get all posts safely."""
    try:
        posts = Post.query.all()
        posts_data = []
        
        for post in posts:
            # Get user safely
            user = get_user_safe(post.user_id)
            
            post_data = {
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'status': post.status,
                'user_id': post.user_id,
                'username': user.username if user else 'Unknown',
                'created_at': post.created_at.isoformat() if post.created_at else None,
                'updated_at': post.updated_at.isoformat() if post.updated_at else None
            }
            posts_data.append(post_data)
        
        return jsonify({
            'posts': posts_data,
            'total': len(posts_data)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_admin_safe_bp.route('/api/debug-admin-safe/migration-status', methods=['GET'])
def migration_status_safe():
    """Check if subscription column exists."""
    try:
        has_subscription = check_column_exists('users', 'subscription')
        
        return jsonify({
            'subscription_column_exists': has_subscription,
            'migration_needed': not has_subscription,
            'database_type': str(db.engine.url).split('://')[0]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

