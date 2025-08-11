from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt
from sqlalchemy import text, inspect

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)  # 'admin' or 'user'
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
        """Hash and set the user's password."""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

    def check_password(self, password):
        """Check if the provided password matches the user's password."""
        password_bytes = password.encode('utf-8')
        hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)

    def is_admin(self):
        """Check if the user has admin role."""
        return self.role == 'admin'

    def get_subscription(self):
        """Get subscription safely - returns 'free' if column doesn't exist."""
        try:
            # Check if subscription column exists
            inspector = inspect(db.engine)
            columns = inspector.get_columns('users')
            has_subscription = any(col['name'] == 'subscription' for col in columns)
            
            if has_subscription:
                return getattr(self, 'subscription', 'free')
            else:
                return 'free'
        except:
            return 'free'

    def set_subscription(self, subscription):
        """Set subscription safely - only if column exists."""
        try:
            # Check if subscription column exists
            inspector = inspect(db.engine)
            columns = inspector.get_columns('users')
            has_subscription = any(col['name'] == 'subscription' for col in columns)
            
            if has_subscription:
                setattr(self, 'subscription', subscription)
                return True
            else:
                return False
        except:
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

    @classmethod
    def query_safe(cls):
        """Safe query that excludes subscription column if it doesn't exist."""
        try:
            # Check if subscription column exists
            inspector = inspect(db.engine)
            columns = inspector.get_columns('users')
            has_subscription = any(col['name'] == 'subscription' for col in columns)
            
            if has_subscription:
                return cls.query
            else:
                # Query without subscription column
                return db.session.query(
                    cls.id,
                    cls.username,
                    cls.email,
                    cls.password_hash,
                    cls.role,
                    cls.is_active,
                    cls.created_at,
                    cls.updated_at
                )
        except:
            # Fallback to regular query
            return cls.query

