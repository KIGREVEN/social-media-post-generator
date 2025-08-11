"""
Migration API endpoints for database schema updates
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError
from src.models import db
import os

migration_bp = Blueprint('migration', __name__)

def check_table_exists(table_name):
    """Check if a table exists."""
    try:
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        return table_name in tables
    except Exception as e:
        return False

def check_column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    try:
        if not check_table_exists(table_name):
            return False
            
        inspector = inspect(db.engine)
        columns = inspector.get_columns(table_name)
        return any(col['name'] == column_name for col in columns)
    except Exception as e:
        return False

@migration_bp.route('/api/migration/status', methods=['GET'])
def migration_status():
    """Check migration status."""
    try:
        status = {
            'users_table_exists': check_table_exists('users'),
            'subscription_column_exists': check_column_exists('users', 'subscription'),
            'database_type': str(db.engine.url).split('://')[0],
            'migration_needed': False
        }
        
        # Check if migration is needed
        if status['users_table_exists'] and not status['subscription_column_exists']:
            status['migration_needed'] = True
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@migration_bp.route('/api/migration/run', methods=['POST'])
def run_migration():
    """Run database migration for subscription field."""
    try:
        # Security check - only allow in development or with special key
        migration_key = request.headers.get('X-Migration-Key')
        expected_key = os.getenv('MIGRATION_KEY', 'dev-migration-key')
        
        if migration_key != expected_key:
            return jsonify({'error': 'Invalid migration key'}), 403
        
        results = []
        
        # Check if users table exists
        if not check_table_exists('users'):
            results.append("⚠️  Users table does not exist yet - will be created by Flask app")
            return jsonify({
                'success': True,
                'message': 'Migration not needed - users table will be created with subscription field',
                'results': results
            })
        
        # Check if subscription column already exists
        if check_column_exists('users', 'subscription'):
            results.append("✅ Subscription column already exists in users table")
            return jsonify({
                'success': True,
                'message': 'Migration already completed',
                'results': results
            })
        
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

