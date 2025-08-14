import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class."""
    # Use JWT_SECRET_KEY as primary, fallback to SECRET_KEY, then default
    # This ensures consistency with the environment variables
    _jwt_secret = os.environ.get('JWT_SECRET_KEY')
    _secret_key = os.environ.get('SECRET_KEY')
    
    # Priority: JWT_SECRET_KEY > SECRET_KEY > default
    if _jwt_secret:
        SECRET_KEY = _jwt_secret
        JWT_SECRET_KEY = _jwt_secret
    elif _secret_key:
        SECRET_KEY = _secret_key
        JWT_SECRET_KEY = _secret_key
    else:
        SECRET_KEY = 'social-media-post-generator-secret-key-2025'
        JWT_SECRET_KEY = 'social-media-post-generator-secret-key-2025'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    # Social Media OAuth Configuration
    LINKEDIN_CLIENT_ID = os.environ.get('LINKEDIN_CLIENT_ID')
    LINKEDIN_CLIENT_SECRET = os.environ.get('LINKEDIN_CLIENT_SECRET')
    FACEBOOK_APP_ID = os.environ.get('FACEBOOK_APP_ID')
    FACEBOOK_APP_SECRET = os.environ.get('FACEBOOK_APP_SECRET')
    TWITTER_CLIENT_ID = os.environ.get('TWITTER_CLIENT_ID')
    TWITTER_CLIENT_SECRET = os.environ.get('TWITTER_CLIENT_SECRET')
    INSTAGRAM_CLIENT_ID = os.environ.get('INSTAGRAM_CLIENT_ID')
    INSTAGRAM_CLIENT_SECRET = os.environ.get('INSTAGRAM_CLIENT_SECRET')
    
    # CORS Configuration - Allow all frontend URLs
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,https://social-media-post-generator-frontend.onrender.com,https://mjrlibdb.manus.space,https://hcnsdkkl.manus.space,https://vmxwerbz.manus.space').split(',')
    
    # App Settings
    APP_NAME = os.environ.get('APP_NAME', 'Social Media Post Generator')
    APP_VERSION = os.environ.get('APP_VERSION', '1.0.0')
    
    @staticmethod
    def get_database_uri():
        """Get database URI with psycopg 3 compatibility."""
        database_url = os.environ.get('DATABASE_URL')
        if database_url and database_url.startswith('postgresql://'):
            # Replace postgresql:// with postgresql+psycopg:// for psycopg 3
            database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
        return database_url

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = Config.get_database_uri() or 'sqlite:///app.db'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    # Use external database if available, otherwise fallback to SQLite
    SQLALCHEMY_DATABASE_URI = Config.get_database_uri() or 'sqlite:///production.db'

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

