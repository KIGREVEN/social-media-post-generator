import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request, redirect, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from src.config import config
from src.models import db, User, Post, SocialAccount, PostUsage

def create_app(config_name=None):
    """Application factory pattern."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
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
    
    # Register blueprints
    from src.routes.auth import auth_bp
    from src.routes.posts import posts_bp
    from src.routes.social import social_bp
    from src.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(social_bp, url_prefix='/api/social')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'Social Media Post Generator API is running'}), 200
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
