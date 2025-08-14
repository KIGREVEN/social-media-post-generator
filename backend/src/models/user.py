from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib
import secrets

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)  # 'admin' or 'user'
    subscription = db.Column(db.String(20), default='free', nullable=False)  # 'free', 'basic', 'premium', 'enterprise'
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    posts = db.relationship('Post', backref='user', lazy=True, cascade='all, delete-orphan')
    social_accounts = db.relationship('SocialAccount', backref='user', lazy=True, cascade='all, delete-orphan')
    post_usage = db.relationship('PostUsage', backref='user', lazy=True, uselist=False, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        """Hash and set the user's password using PBKDF2."""
        # Generate a random salt
        salt = secrets.token_hex(16)
        # Hash the password with PBKDF2
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        # Store salt + hash
        self.password_hash = salt + ':' + password_hash.hex()

    def check_password(self, password):
        """Check if the provided password matches the user's password."""
        try:
            # Check if it's a new hashlib format (contains ':')
            if ':' in self.password_hash:
                # New hashlib format
                salt, stored_hash = self.password_hash.split(':', 1)
                password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
                return password_hash.hex() == stored_hash
            else:
                # Legacy bcrypt format - try to validate with bcrypt
                try:
                    import bcrypt
                    password_bytes = password.encode('utf-8')
                    hash_bytes = self.password_hash.encode('utf-8')
                    return bcrypt.checkpw(password_bytes, hash_bytes)
                except ImportError:
                    # If bcrypt is not available, we can't validate legacy passwords
                    # This is a fallback - in production, bcrypt should be available
                    return False
        except (ValueError, AttributeError, Exception):
            return False

    def is_admin(self):
        """Check if the user has admin role."""
        return self.role == 'admin'

    def get_subscription(self):
        """Get subscription - returns actual subscription or 'free' as default."""
        return getattr(self, 'subscription', 'free')

    def set_subscription(self, subscription_type):
        """Set subscription type."""
        valid_subscriptions = ['free', 'basic', 'premium', 'enterprise']
        if subscription_type in valid_subscriptions:
            self.subscription = subscription_type
            return True
        return False

    def get_subscription_limits(self):
        """Get the post limits based on subscription type."""
        limits = {
            'free': 10,
            'basic': 50,
            'premium': 200,
            'enterprise': 1000
        }
        subscription = self.get_subscription()
        return limits.get(subscription, 10)

    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary."""
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'subscription': self.get_subscription(),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Add post usage information if available
        if self.post_usage:
            data['post_usage'] = self.post_usage.to_dict()
        
        if include_sensitive:
            data['password_hash'] = self.password_hash
            
        return data
