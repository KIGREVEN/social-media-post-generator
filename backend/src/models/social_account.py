from src.models.user import db
from datetime import datetime

class SocialAccount(db.Model):
    __tablename__ = 'social_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    platform = db.Column(db.String(20), nullable=False)  # 'linkedin', 'facebook', 'twitter', 'instagram'
    account_id = db.Column(db.String(100), nullable=True)  # Platform-specific user ID
    account_name = db.Column(db.String(100), nullable=True)  # Display name from platform
    access_token = db.Column(db.Text, nullable=True)
    refresh_token = db.Column(db.Text, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Unique constraint to prevent duplicate platform connections per user
    __table_args__ = (db.UniqueConstraint('user_id', 'platform', name='unique_user_platform'),)
    
    def __repr__(self):
        return f'<SocialAccount {self.platform} for User {self.user_id}>'
    
    def to_dict(self, include_tokens=False):
        """Convert social account to dictionary."""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'platform': self.platform,
            'account_id': self.account_id,
            'account_name': self.account_name,
            'is_active': self.is_active,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_tokens:
            data['access_token'] = self.access_token
            data['refresh_token'] = self.refresh_token
            
        return data
    
    def is_token_expired(self):
        """Check if the access token is expired."""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def update_tokens(self, access_token, refresh_token=None, expires_at=None):
        """Update the OAuth tokens."""
        self.access_token = access_token
        if refresh_token:
            self.refresh_token = refresh_token
        if expires_at:
            self.expires_at = expires_at
        self.updated_at = datetime.utcnow()

