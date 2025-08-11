"""
Safe Debug Admin routes that work without subscription column
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import text, func, inspect
from sqlalchemy.exc import SQLAlchemyError
from src.models import db, User, Post, SocialAccount, PostUsage
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


@debug_admin_safe_bp.route('/api/debug-admin-safe/run-migration', methods=['POST'])
def run_migration_safe():
    """Run database migration to add subscription column."""
    try:
        # Check if subscription column already exists
        has_subscription = check_column_exists('users', 'subscription')
        
        if has_subscription:
            return jsonify({
                'success': True,
                'message': 'Migration already completed - subscription column exists',
                'subscription_column_exists': True
            })
        
        results = []
        results.append("🔄 Adding subscription column to users table...")
        
        # Add subscription column with default value 'free'
        if 'postgresql' in str(db.engine.url):
            # PostgreSQL
            db.session.execute(text("""
                ALTER TABLE users 
                ADD COLUMN subscription VARCHAR(20) DEFAULT 'free' NOT NULL
            """))
            db.session.commit()
            results.append("✅ Added subscription column (PostgreSQL)")
        else:
            # SQLite - need to recreate table
            db.session.execute(text("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(80) UNIQUE NOT NULL,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user' NOT NULL,
                    subscription VARCHAR(20) DEFAULT 'free' NOT NULL,
                    is_active BOOLEAN DEFAULT 1 NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Copy data from old table
            db.session.execute(text("""
                INSERT INTO users_new (id, username, email, password_hash, role, is_active, created_at, updated_at)
                SELECT id, username, email, password_hash, role, is_active, created_at, updated_at
                FROM users
            """))
            
            # Drop old table and rename new one
            db.session.execute(text("DROP TABLE users"))
            db.session.execute(text("ALTER TABLE users_new RENAME TO users"))
            db.session.commit()
            results.append("✅ Added subscription column (SQLite)")
        
        # Update existing users to have default subscription
        results.append("🔄 Updating existing users with default subscription...")
        
        result = db.session.execute(text("""
            UPDATE users 
            SET subscription = 'free' 
            WHERE subscription IS NULL OR subscription = ''
        """))
        db.session.commit()
        
        updated_count = result.rowcount
        results.append(f"✅ Updated {updated_count} users with default subscription")
        
        # Verify migration
        results.append("🔍 Verifying migration...")
        
        result = db.session.execute(text("""
            SELECT COUNT(*) as total_users,
                   COUNT(CASE WHEN subscription = 'free' THEN 1 END) as free_users,
                   COUNT(CASE WHEN subscription IS NOT NULL THEN 1 END) as users_with_subscription
            FROM users
        """))
        
        row = result.fetchone()
        total_users = row[0]
        free_users = row[1]
        users_with_subscription = row[2]
        
        results.append(f"📊 Migration verification:")
        results.append(f"   Total users: {total_users}")
        results.append(f"   Users with subscription: {users_with_subscription}")
        results.append(f"   Free subscription users: {free_users}")
        
        if total_users == 0:
            results.append("✅ No users yet - migration ready for when users are created")
        elif users_with_subscription == total_users:
            results.append("✅ Migration successful - all users have subscription field")
        else:
            results.append("❌ Migration incomplete - some users missing subscription")
            return jsonify({
                'success': False,
                'message': 'Migration verification failed',
                'results': results
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Database migration completed successfully!',
            'subscription_column_exists': True,
            'results': results
        })
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}',
            'results': results if 'results' in locals() else []
        }), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'results': results if 'results' in locals() else []
        }), 500



@debug_admin_safe_bp.route('/health', methods=['GET'])
def health_check():
    """Safe health check endpoint with OpenAI configuration status."""
    try:
        from flask import current_app
        from src.models import User
        
        user_count = User.query.count()
        
        # Check OpenAI API key configuration
        openai_configured = bool(current_app.config.get('OPENAI_API_KEY'))
        openai_key_preview = None
        if openai_configured:
            key = current_app.config.get('OPENAI_API_KEY')
            if key and len(key) > 10:
                openai_key_preview = f"{key[:10]}...{key[-4:]}"
        
        return jsonify({
            'message': 'Backend is healthy',
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'user_count': user_count,
            'openai_configured': openai_configured,
            'openai_key_preview': openai_key_preview
        }), 200
    except Exception as e:
        return jsonify({
            'message': 'Backend health check failed',
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@debug_admin_safe_bp.route('/openai-test', methods=['GET'])
def test_openai_config():
    """Test OpenAI configuration and API connectivity."""
    try:
        from flask import current_app
        from openai import OpenAI
        
        # Check if API key is configured
        api_key = current_app.config.get('OPENAI_API_KEY')
        if not api_key:
            return jsonify({
                'configured': False,
                'error': 'OpenAI API key not configured',
                'message': 'Please set OPENAI_API_KEY environment variable'
            }), 400
        
        # Test API connectivity with a simple request
        try:
            client = OpenAI(api_key=api_key)
            
            # Make a simple API call to test connectivity
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            
            return jsonify({
                'configured': True,
                'api_accessible': True,
                'key_preview': f"{api_key[:10]}...{api_key[-4:]}",
                'test_response': response.choices[0].message.content.strip(),
                'message': 'OpenAI API is working correctly'
            }), 200
            
        except Exception as api_error:
            return jsonify({
                'configured': True,
                'api_accessible': False,
                'key_preview': f"{api_key[:10]}...{api_key[-4:]}",
                'error': str(api_error),
                'message': 'OpenAI API key configured but API call failed'
            }), 400
            
    except Exception as e:
        return jsonify({
            'configured': False,
            'error': str(e),
            'message': 'Error testing OpenAI configuration'
        }), 500

