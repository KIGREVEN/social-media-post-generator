import sys
import os
import logging
from datetime import datetime

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Ensure all print statements are flushed immediately
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

print(f"=== APPLICATION STARTUP ===")
print(f"Timestamp: {datetime.utcnow()}")
print(f"Python version: {sys.version}")

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request, redirect, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from src.config import config
from src.models import db, User, Post, SocialAccount, PostUsage, ScheduledPost

def run_database_migration():
    """Run database migration on startup using SQLAlchemy."""
    try:
        print("🔄 Running database migration on startup...")
        
        # Import here to avoid circular imports
        from sqlalchemy import inspect, text
        
        # Check if subscription column exists
        inspector = inspect(db.engine)
        
        if 'users' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('users')]
            if 'subscription' not in columns:
                print("🔄 Adding subscription column to users table...")
                try:
                    with db.engine.connect() as conn:
                        conn.execute(text("""
                            ALTER TABLE users 
                            ADD COLUMN subscription VARCHAR(20) DEFAULT 'free' NOT NULL
                        """))
                        conn.commit()
                    print("✅ Added subscription column successfully")
                    
                    # Update existing users
                    with db.engine.connect() as conn:
                        result = conn.execute(text("""
                            UPDATE users 
                            SET subscription = 'free' 
                            WHERE subscription IS NULL OR subscription = ''
                        """))
                        conn.commit()
                        print(f"✅ Updated {result.rowcount} users with default subscription")
                        
                except Exception as e:
                    print(f"⚠️  Could not add subscription column: {e}")
                    print("   This is normal if the column already exists")
            else:
                print("✅ Subscription column already exists")
        else:
            print("⚠️  Users table will be created on first user registration")
        
        # Check and update posts table column types
        if 'posts' in inspector.get_table_names():
            print("🔄 Checking posts table column types...")
            try:
                with db.engine.connect() as conn:
                    # Convert title from VARCHAR(200) to TEXT
                    conn.execute(text("""
                        ALTER TABLE posts 
                        ALTER COLUMN title TYPE TEXT
                    """))
                    
                    # Convert post_theme from VARCHAR(200) to TEXT  
                    conn.execute(text("""
                        ALTER TABLE posts 
                        ALTER COLUMN post_theme TYPE TEXT
                    """))
                    
                    conn.commit()
                    print("✅ Updated posts table column types to TEXT")
                    
            except Exception as e:
                print(f"⚠️  Could not update posts table columns: {e}")
                print("   This is normal if columns are already TEXT type")
        else:
            print("⚠️  Posts table will be created on first post creation")
        
        # Ensure all tables are created
        print("🔄 Creating any missing database tables...")
        try:
            db.create_all()
            print("✅ All database tables created/verified")
        except Exception as e:
            print(f"⚠️  Error creating tables: {e}")
        
        print("✅ Database migration completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error running database migration: {e}")
        return False

def create_app(config_name=None):
    """Application factory pattern."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Stelle sicher, dass JWT das gleiche Secret wie die App verwendet
    app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 422
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is required'}), 401
    
    # Configure CORS with comprehensive settings
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         supports_credentials=True,
         send_wildcard=False,
         vary_header=True)
    
    # Handle HTTPS redirects properly for CORS
    @app.before_request
    def force_https():
        if not request.is_secure and app.config.get('FLASK_ENV') == 'production':
            # Don't redirect OPTIONS requests (CORS preflight)
            if request.method == 'OPTIONS':
                return
            return redirect(request.url.replace('http://', 'https://'), code=301)
    
    # Configure LinkedIn API Keys
    app.config['LINKEDIN_CLIENT_ID'] = '86ulp9wjdtcpzv'
    app.config['LINKEDIN_CLIENT_SECRET'] = 'WPL_AP1.aV4gE6gZ5TAXvM2L.TOcuAw=='
    
    # Register blueprints
    from src.routes.auth import auth_bp
    from src.routes.posts import posts_bp
    from src.routes.posts_debug import posts_debug_bp
    from src.routes.posts_async import posts_async_bp
    from src.routes.posts_library import posts_library_bp
    from src.routes.social import social_bp
    from src.routes.social_accounts_api import social_accounts_api_bp
    from src.routes.admin import admin_bp
    from src.routes.super_admin import super_admin_bp
    from src.routes.debug_admin import debug_admin_bp
    from src.routes.debug_admin_safe import debug_admin_safe_bp
    from src.routes.migration import migration_bp
    from src.routes.subscription_api import subscription_api_bp
    from src.routes.planner import planner_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(posts_debug_bp, url_prefix='/api/posts-debug')
    app.register_blueprint(posts_async_bp, url_prefix='/api/async')
    app.register_blueprint(posts_library_bp, url_prefix='/api/library')
    app.register_blueprint(social_bp, url_prefix='/api/social')
    app.register_blueprint(social_accounts_api_bp, url_prefix='/api/social-accounts')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(super_admin_bp, url_prefix='/api/super-admin')
    app.register_blueprint(debug_admin_bp, url_prefix='/api/debug-admin')
    app.register_blueprint(debug_admin_safe_bp, url_prefix='/api/debug-admin-safe')
    app.register_blueprint(migration_bp, url_prefix='/api/migration')
    app.register_blueprint(subscription_api_bp, url_prefix='/api/subscription')
    app.register_blueprint(planner_bp, url_prefix='/api/planner')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'Social Media Post Generator API is running'}), 200
    
    # Simple scheduler endpoints with lazy loading
    @app.route('/api/scheduler/scheduled', methods=['GET', 'OPTIONS'])
    def get_scheduled_posts():
        """Get scheduled posts with lazy service loading."""
        if request.method == 'OPTIONS':
            # Handle CORS preflight request
            response = jsonify({'status': 'ok'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
            return response
            
        try:
            from src.services.scheduler_service import SchedulerService
            from src.services.background_scheduler import get_simple_scheduler
            
            # Auto-check for posts to publish
            simple_scheduler = get_simple_scheduler()
            simple_scheduler.check_and_process()
            
            # Get scheduled posts
            scheduler_service = SchedulerService()
            user_id = request.args.get('user_id', 1, type=int)
            status = request.args.get('status')
            
            scheduled_posts = scheduler_service.get_scheduled_posts(user_id, status)
            
            return jsonify({
                'scheduled_posts': [post.to_dict() for post in scheduled_posts]
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Error getting scheduled posts: {str(e)}'}), 500
    
    @app.route('/api/scheduler/schedule', methods=['POST', 'OPTIONS'])
    def schedule_post():
        """Schedule a post with lazy service loading."""
        if request.method == 'OPTIONS':
            # Handle CORS preflight request
            response = jsonify({'status': 'ok'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
            return response
        try:
            from src.services.scheduler_service import SchedulerService
            from datetime import datetime
            import pytz
            
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['content', 'platform', 'scheduled_date', 'scheduled_time']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
            
            # Parse scheduled datetime
            try:
                scheduled_date = data['scheduled_date']
                scheduled_time = data['scheduled_time']
                timezone = data.get('timezone', 'UTC')
                
                datetime_str = f"{scheduled_date} {scheduled_time}"
                scheduled_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
                
                # Validate future time
                current_time = datetime.utcnow()
                if timezone != 'UTC':
                    user_tz = pytz.timezone(timezone)
                    current_time = pytz.UTC.localize(current_time).astimezone(user_tz).replace(tzinfo=None)
                
                if scheduled_datetime <= current_time:
                    return jsonify({'error': 'Scheduled time must be in the future'}), 400
                    
            except ValueError as e:
                return jsonify({'error': f'Invalid date/time format: {str(e)}'}), 400
            except pytz.exceptions.UnknownTimeZoneError:
                return jsonify({'error': 'Invalid timezone'}), 400
            
            # Schedule the post
            scheduler_service = SchedulerService()
            user_id = data.get('user_id', 1)
            
            post_content = {
                'title': data.get('title', ''),
                'content': data['content'],
                'image_url': data.get('image_url', '')
            }
            
            scheduled_post = scheduler_service.schedule_post(
                user_id=user_id,
                post_content=post_content,
                platform=data['platform'],
                scheduled_time=scheduled_datetime,
                timezone=timezone,
                post_id=data.get('post_id')
            )
            
            if scheduled_post:
                return jsonify({
                    'message': 'Post scheduled successfully',
                    'scheduled_post': scheduled_post.to_dict()
                }), 201
            else:
                return jsonify({'error': 'Failed to schedule post'}), 500
                
        except Exception as e:
            return jsonify({'error': f'Error scheduling post: {str(e)}'}), 500

    @app.route('/api/scheduler/schedule-existing', methods=['POST', 'OPTIONS'])
    def schedule_existing_post():
        """Schedule an existing post with lazy service loading."""
        if request.method == 'OPTIONS':
            # Handle CORS preflight request
            response = jsonify({'status': 'ok'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
            return response
            
        try:
            from src.services.scheduler_service import SchedulerService
            from src.models import Post
            from datetime import datetime
            import pytz
            
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['post_id', 'platform', 'scheduled_date', 'scheduled_time']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
            
            # Get the existing post
            post = Post.query.get(data['post_id'])
            if not post:
                return jsonify({'error': 'Post not found'}), 404
            
            # Parse scheduled datetime
            try:
                scheduled_date = data['scheduled_date']
                scheduled_time = data['scheduled_time']
                timezone = data.get('timezone', 'UTC')
                
                datetime_str = f"{scheduled_date} {scheduled_time}"
                scheduled_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
                
                # Validate future time
                current_time = datetime.utcnow()
                if timezone != 'UTC':
                    user_tz = pytz.timezone(timezone)
                    current_time = pytz.UTC.localize(current_time).astimezone(user_tz).replace(tzinfo=None)
                
                if scheduled_datetime <= current_time:
                    return jsonify({'error': 'Scheduled time must be in the future'}), 400
                    
            except ValueError as e:
                return jsonify({'error': f'Invalid date/time format: {str(e)}'}), 400
            except pytz.exceptions.UnknownTimeZoneError:
                return jsonify({'error': 'Invalid timezone'}), 400
            
            # Schedule the existing post
            scheduler_service = SchedulerService()
            user_id = data.get('user_id', 1)
            
            # Use existing post content
            post_content = {
                'title': post.title or '',
                'content': post.content,
                'image_url': post.generated_image_url or ''
            }
            
            scheduled_post = scheduler_service.schedule_post(
                user_id=user_id,
                post_content=post_content,
                platform=data['platform'],
                scheduled_time=scheduled_datetime,
                timezone=timezone,
                post_id=post.id
            )
            
            if scheduled_post:
                return jsonify({
                    'message': 'Post scheduled successfully',
                    'scheduled_post': scheduled_post.to_dict()
                }), 201
            else:
                return jsonify({'error': 'Failed to schedule post'}), 500
                
        except Exception as e:
            return jsonify({'error': f'Error scheduling existing post: {str(e)}'}), 500

    @app.route('/api/scheduler/scheduled/<int:post_id>', methods=['DELETE', 'OPTIONS'])
    def cancel_scheduled_post(post_id):
        """Cancel a scheduled post with lazy service loading."""
        if request.method == 'OPTIONS':
            # Handle CORS preflight request
            response = jsonify({'status': 'ok'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
            return response
            
        try:
            from src.services.scheduler_service import SchedulerService
            
            user_id = request.args.get('user_id', 1, type=int)
            
            # Cancel the scheduled post
            scheduler_service = SchedulerService()
            success = scheduler_service.cancel_scheduled_post(post_id, user_id)
            
            if success:
                return jsonify({
                    'message': 'Scheduled post cancelled successfully'
                }), 200
            else:
                return jsonify({'error': 'Failed to cancel scheduled post or post not found'}), 404
                
        except Exception as e:
            return jsonify({'error': f'Error cancelling scheduled post: {str(e)}'}), 500
    
    # Run database migration on first request
    migration_done = False
    
    @app.before_request
    def run_migration_once():
        nonlocal migration_done
        if not migration_done:
            with app.app_context():
                run_database_migration()
                migration_done = True
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

