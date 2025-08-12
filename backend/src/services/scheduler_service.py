from datetime import datetime, timedelta
import pytz
import logging

logger = logging.getLogger(__name__)

class SchedulerService:
    """Service for managing scheduled posts."""
    
    def __init__(self):
        # Import here to avoid circular imports and app context issues
        from src.services.social_media_service import SocialMediaService
        self.social_media_service = SocialMediaService()
    
    def schedule_post(self, user_id, post_content, platform, scheduled_time, timezone='UTC', post_id=None):
        """
        Schedule a post for future publishing.
        
        Args:
            user_id: ID of the user scheduling the post
            post_content: Dictionary containing post content (title, content, image_url)
            platform: Platform to publish to ('linkedin', 'facebook', etc.)
            scheduled_time: When to publish (datetime object)
            timezone: User's timezone (default: UTC)
            post_id: Optional reference to existing post
        
        Returns:
            ScheduledPost object or None if failed
        """
        try:
            # Import here to avoid app context issues
            from src.models import db, ScheduledPost
            
            # Convert scheduled time to UTC if needed
            if timezone != 'UTC':
                user_tz = pytz.timezone(timezone)
                if scheduled_time.tzinfo is None:
                    scheduled_time = user_tz.localize(scheduled_time)
                scheduled_time = scheduled_time.astimezone(pytz.UTC).replace(tzinfo=None)
            
            # Create scheduled post
            scheduled_post = ScheduledPost(
                user_id=user_id,
                post_id=post_id,
                title=post_content.get('title', ''),
                content=post_content.get('content', ''),
                generated_image_url=post_content.get('image_url', ''),
                platform=platform,
                scheduled_time=scheduled_time,
                timezone=timezone,
                status='scheduled'
            )
            
            db.session.add(scheduled_post)
            db.session.commit()
            
            logger.info(f"Post scheduled successfully: ID {scheduled_post.id} for {platform} at {scheduled_time}")
            return scheduled_post
            
        except Exception as e:
            logger.error(f"Error scheduling post: {e}")
            db.session.rollback()
            return None
    
    def get_scheduled_posts(self, user_id, status=None):
        """
        Get scheduled posts for a user.
        
        Args:
            user_id: ID of the user
            status: Optional status filter ('scheduled', 'published', 'failed', 'cancelled')
        
        Returns:
            List of ScheduledPost objects
        """
        try:
            # Import here to avoid app context issues
            from src.models import ScheduledPost
            
            query = ScheduledPost.query.filter_by(user_id=user_id)
            
            if status:
                query = query.filter_by(status=status)
            
            return query.order_by(ScheduledPost.scheduled_time.desc()).all()
            
        except Exception as e:
            logger.error(f"Error getting scheduled posts: {e}")
            return []
    
    def get_posts_ready_to_publish(self):
        """
        Get all posts that are ready to be published.
        
        Returns:
            List of ScheduledPost objects ready for publishing
        """
        try:
            # Import here to avoid app context issues
            from src.models import ScheduledPost
            
            current_time = datetime.utcnow()
            return ScheduledPost.query.filter(
                ScheduledPost.status == 'scheduled',
                ScheduledPost.scheduled_time <= current_time
            ).all()
            
        except Exception as e:
            logger.error(f"Error getting posts ready to publish: {e}")
            return []
    
    def publish_scheduled_post(self, scheduled_post):
        """
        Publish a scheduled post.
        
        Args:
            scheduled_post: ScheduledPost object to publish
        
        Returns:
            Boolean indicating success
        """
        try:
            # Import here to avoid app context issues
            from src.models import db
            
            logger.info(f"Publishing scheduled post {scheduled_post.id} to {scheduled_post.platform}")
            
            # Prepare post data for publishing
            post_data = {
                'content': scheduled_post.content,
                'image_url': scheduled_post.generated_image_url
            }
            
            # Publish to the specified platform
            if scheduled_post.platform == 'linkedin':
                success = self.social_media_service.publish_to_linkedin(
                    user_id=scheduled_post.user_id,
                    content=scheduled_post.content,
                    image_url=scheduled_post.generated_image_url
                )
            else:
                logger.error(f"Unsupported platform: {scheduled_post.platform}")
                scheduled_post.mark_as_failed(f"Unsupported platform: {scheduled_post.platform}")
                db.session.commit()
                return False
            
            if success:
                scheduled_post.mark_as_published()
                logger.info(f"Successfully published scheduled post {scheduled_post.id}")
            else:
                scheduled_post.mark_as_failed("Publishing failed - check social media service logs")
                logger.error(f"Failed to publish scheduled post {scheduled_post.id}")
            
            db.session.commit()
            return success
            
        except Exception as e:
            logger.error(f"Error publishing scheduled post {scheduled_post.id}: {e}")
            scheduled_post.mark_as_failed(str(e))
            db.session.commit()
            return False
    
    def cancel_scheduled_post(self, scheduled_post_id, user_id):
        """
        Cancel a scheduled post.
        
        Args:
            scheduled_post_id: ID of the scheduled post to cancel
            user_id: ID of the user (for security)
        
        Returns:
            Boolean indicating success
        """
        try:
            # Import here to avoid app context issues
            from src.models import db, ScheduledPost
            
            scheduled_post = ScheduledPost.query.filter_by(
                id=scheduled_post_id,
                user_id=user_id,
                status='scheduled'
            ).first()
            
            if not scheduled_post:
                logger.warning(f"Scheduled post {scheduled_post_id} not found or not cancellable")
                return False
            
            scheduled_post.mark_as_cancelled()
            db.session.commit()
            
            logger.info(f"Cancelled scheduled post {scheduled_post_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling scheduled post {scheduled_post_id}: {e}")
            db.session.rollback()
            return False
    
    def reschedule_post(self, scheduled_post_id, user_id, new_scheduled_time, timezone='UTC'):
        """
        Reschedule a post to a new time.
        
        Args:
            scheduled_post_id: ID of the scheduled post to reschedule
            user_id: ID of the user (for security)
            new_scheduled_time: New datetime to schedule for
            timezone: User's timezone
        
        Returns:
            Boolean indicating success
        """
        try:
            # Import here to avoid app context issues
            from src.models import db, ScheduledPost
            
            scheduled_post = ScheduledPost.query.filter_by(
                id=scheduled_post_id,
                user_id=user_id,
                status='scheduled'
            ).first()
            
            if not scheduled_post:
                logger.warning(f"Scheduled post {scheduled_post_id} not found or not reschedulable")
                return False
            
            # Convert new time to UTC if needed
            if timezone != 'UTC':
                user_tz = pytz.timezone(timezone)
                if new_scheduled_time.tzinfo is None:
                    new_scheduled_time = user_tz.localize(new_scheduled_time)
                new_scheduled_time = new_scheduled_time.astimezone(pytz.UTC).replace(tzinfo=None)
            
            scheduled_post.scheduled_time = new_scheduled_time
            scheduled_post.timezone = timezone
            scheduled_post.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            logger.info(f"Rescheduled post {scheduled_post_id} to {new_scheduled_time}")
            return True
            
        except Exception as e:
            logger.error(f"Error rescheduling post {scheduled_post_id}: {e}")
            db.session.rollback()
            return False
    
    def process_scheduled_posts(self):
        """
        Process all posts that are ready to be published.
        This method should be called periodically by a background job.
        
        Returns:
            Dictionary with processing results
        """
        try:
            posts_to_publish = self.get_posts_ready_to_publish()
            
            results = {
                'total_processed': len(posts_to_publish),
                'successful': 0,
                'failed': 0,
                'errors': []
            }
            
            for post in posts_to_publish:
                try:
                    if self.publish_scheduled_post(post):
                        results['successful'] += 1
                    else:
                        results['failed'] += 1
                        results['errors'].append(f"Failed to publish post {post.id}")
                        
                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append(f"Error processing post {post.id}: {str(e)}")
                    logger.error(f"Error processing scheduled post {post.id}: {e}")
            
            logger.info(f"Processed {results['total_processed']} scheduled posts: "
                       f"{results['successful']} successful, {results['failed']} failed")
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing scheduled posts: {e}")
            return {
                'total_processed': 0,
                'successful': 0,
                'failed': 0,
                'errors': [str(e)]
            }

