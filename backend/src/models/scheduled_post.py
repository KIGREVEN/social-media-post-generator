from src.models.user import db
from datetime import datetime

class ScheduledPost(db.Model):
    __tablename__ = 'scheduled_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=True)  # Reference to generated post
    
    # Post content (can be stored here or referenced from posts table)
    title = db.Column(db.Text, nullable=True)
    content = db.Column(db.Text, nullable=False)
    generated_image_url = db.Column(db.Text, nullable=True)
    
    # Scheduling information
    platform = db.Column(db.String(20), nullable=False)  # 'linkedin', 'facebook', 'twitter', 'instagram'
    scheduled_time = db.Column(db.DateTime, nullable=False)  # When to publish
    timezone = db.Column(db.String(50), default='UTC', nullable=False)  # User's timezone
    
    # Status tracking
    status = db.Column(db.String(20), default='scheduled', nullable=False)  # 'scheduled', 'published', 'failed', 'cancelled'
    published_at = db.Column(db.DateTime, nullable=True)  # When it was actually published
    error_message = db.Column(db.Text, nullable=True)  # Error details if publishing failed
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<ScheduledPost {self.id}: {self.platform} at {self.scheduled_time}>'
    
    def to_dict(self):
        """Convert scheduled post to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'post_id': self.post_id,
            'title': self.title,
            'content': self.content,
            'generated_image_url': self.generated_image_url,
            'platform': self.platform,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'timezone': self.timezone,
            'status': self.status,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def mark_as_published(self):
        """Mark the scheduled post as successfully published."""
        self.status = 'published'
        self.published_at = datetime.utcnow()
        self.error_message = None
    
    def mark_as_failed(self, error_message):
        """Mark the scheduled post as failed with error message."""
        self.status = 'failed'
        self.error_message = error_message
    
    def mark_as_cancelled(self):
        """Mark the scheduled post as cancelled."""
        self.status = 'cancelled'
    
    def is_ready_to_publish(self):
        """Check if the post is ready to be published."""
        return (
            self.status == 'scheduled' and 
            self.scheduled_time <= datetime.utcnow()
        )

