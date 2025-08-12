import os
import sys
import os
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request, redirect, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from src.config import config
from src.models import db, User, Post, SocialAccount, PostUsage

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
                    return False
            else:
                print("✅ Subscription column already exists")
        else:
            print("⚠️  Users table will be created on first user registration")
        
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
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
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
    
    # Create database tables
    with app.app_context():
        db.create_all()
        # Run database migration for subscription field
        print("🚀 Starting database migration on app startup...")
        migration_success = run_database_migration()
        if migration_success:
            print("✅ Database migration completed successfully on startup")
        else:
            print("❌ Database migration failed on startup")
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'Social Media Post Generator API is running'}), 200
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
