from src.models.user import db
from datetime import datetime, date

class PostUsage(db.Model):
    __tablename__ = 'post_usage'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    posts_generated = db.Column(db.Integer, default=0, nullable=False)
    posts_posted = db.Column(db.Integer, default=0, nullable=False)
    last_reset_date = db.Column(db.Date, default=date.today, nullable=False)
    monthly_limit = db.Column(db.Integer, default=3, nullable=False)  # Default limit for free users (reduced to 3)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<PostUsage User {self.user_id}: {self.posts_generated}/{self.monthly_limit}>'
    
    def to_dict(self):
        """Convert post usage to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'posts_generated': self.posts_generated,
            'posts_posted': self.posts_posted,
            'last_reset_date': self.last_reset_date.isoformat() if self.last_reset_date else None,
            'monthly_limit': self.monthly_limit,
            'remaining_posts': self.get_remaining_posts(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_remaining_posts(self):
        """Get the number of remaining posts for this month."""
        self.check_and_reset_monthly_usage()
        return max(0, self.monthly_limit - self.posts_generated)
    
    def can_generate_post(self):
        """Check if the user can generate another post."""
        return self.get_remaining_posts() > 0
    
    def can_generate_posts(self, count):
        """Check if the user can generate multiple posts."""
        return self.get_remaining_posts() >= count
    
    def increment_generated(self):
        """Increment the posts generated counter."""
        self.check_and_reset_monthly_usage()
        self.posts_generated += 1
        self.updated_at = datetime.utcnow()
    
    def increment_posted(self):
        """Increment the posts posted counter."""
        self.posts_posted += 1
        self.updated_at = datetime.utcnow()
    
    def check_and_reset_monthly_usage(self):
        """Reset usage counters if a new month has started."""
        today = date.today()
        if self.last_reset_date.month != today.month or self.last_reset_date.year != today.year:
            self.posts_generated = 0
            self.posts_posted = 0
            self.last_reset_date = today
            self.updated_at = datetime.utcnow()
    
    def set_monthly_limit(self, limit):
        """Set the monthly limit for the user."""
        self.monthly_limit = limit
        self.updated_at = datetime.utcnow()
    
    def update_limits_for_plan(self, plan):
        """Update monthly limits based on user's subscription plan."""
        plan_limits = {
            'free': 3,
            'basic': 50,
            'premium': 200,
            'enterprise': 1000
        }
        
        new_limit = plan_limits.get(plan, 3)  # Default to free plan limit
        self.set_monthly_limit(new_limit)

