from src.models.user import db
from datetime import datetime

class Post(db.Model):
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.Text, nullable=True)
    content = db.Column(db.Text, nullable=False)
    profile_url = db.Column(db.Text, nullable=True)
    post_theme = db.Column(db.Text, nullable=True)
    additional_details = db.Column(db.Text, nullable=True)
    generated_image_url = db.Column(db.Text, nullable=True)
    platform = db.Column(db.String(20), nullable=True)  # 'linkedin', 'facebook', 'twitter', 'instagram'
    
    # Status and scheduling fields
    status = db.Column(db.String(20), default='ungeplant', nullable=False)  # 'ungeplant', 'geplant', 'veröffentlicht'
    scheduled_at = db.Column(db.DateTime, nullable=True)  # When the post is scheduled to be published
    is_posted = db.Column(db.Boolean, default=False, nullable=False)
    posted_at = db.Column(db.DateTime, nullable=True)
    
    # Grouping field for multi-platform posts
    post_group_id = db.Column(db.String(50), nullable=True)  # UUID to group related posts
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Post {self.id}: {self.title or "Untitled"}>'
    
    def to_dict(self):
        """Convert post to dictionary with safe fallbacks for new fields."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'profile_url': self.profile_url,
            'post_theme': self.post_theme,
            'additional_details': self.additional_details,
            'generated_image_url': self.generated_image_url,
            'platform': self.platform,
            'status': getattr(self, 'status', 'ungeplant'),  # Safe fallback
            'scheduled_at': getattr(self, 'scheduled_at', None).isoformat() if getattr(self, 'scheduled_at', None) else None,
            'is_posted': self.is_posted,
            'posted_at': self.posted_at.isoformat() if self.posted_at else None,
            'post_group_id': getattr(self, 'post_group_id', None),  # Safe fallback
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': getattr(self, 'updated_at', None).isoformat() if getattr(self, 'updated_at', None) else None
        }
    
    def mark_as_posted(self, platform=None):
        """Mark the post as posted with safe field access."""
        self.is_posted = True
        self.posted_at = datetime.utcnow()
        if hasattr(self, 'status'):
            self.status = 'veröffentlicht'
        if platform:
            self.platform = platform
    
    def schedule_post(self, scheduled_datetime):
        """Schedule the post for future publication with safe field access."""
        if hasattr(self, 'scheduled_at'):
            self.scheduled_at = scheduled_datetime
        if hasattr(self, 'status'):
            self.status = 'geplant'
    
    def unschedule_post(self):
        """Remove scheduling from the post with safe field access."""
        if hasattr(self, 'scheduled_at'):
            self.scheduled_at = None
        if hasattr(self, 'status'):
            self.status = 'ungeplant'

