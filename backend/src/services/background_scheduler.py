import threading
import time
import logging
from datetime import datetime, timedelta
from src.services.scheduler_service import SchedulerService

logger = logging.getLogger(__name__)

class BackgroundScheduler:
    """Background service for processing scheduled posts."""
    
    def __init__(self, check_interval=60):  # Check every 60 seconds
        self.check_interval = check_interval
        self.scheduler_service = SchedulerService()
        self.running = False
        self.thread = None
    
    def start(self):
        """Start the background scheduler."""
        if self.running:
            logger.warning("Background scheduler is already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.thread.start()
        logger.info(f"Background scheduler started with {self.check_interval}s interval")
    
    def stop(self):
        """Stop the background scheduler."""
        if not self.running:
            logger.warning("Background scheduler is not running")
            return
        
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Background scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop."""
        logger.info("Background scheduler loop started")
        
        while self.running:
            try:
                # Process scheduled posts
                results = self.scheduler_service.process_scheduled_posts()
                
                if results['total_processed'] > 0:
                    logger.info(f"Processed {results['total_processed']} scheduled posts: "
                               f"{results['successful']} successful, {results['failed']} failed")
                    
                    if results['errors']:
                        for error in results['errors']:
                            logger.error(f"Scheduler error: {error}")
                
                # Wait for next check
                time.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"Error in background scheduler: {e}")
                # Continue running even if there's an error
                time.sleep(self.check_interval)
        
        logger.info("Background scheduler loop ended")

# Global scheduler instance
_background_scheduler = None

def get_background_scheduler():
    """Get the global background scheduler instance."""
    global _background_scheduler
    if _background_scheduler is None:
        _background_scheduler = BackgroundScheduler()
    return _background_scheduler

def start_background_scheduler():
    """Start the global background scheduler."""
    scheduler = get_background_scheduler()
    scheduler.start()

def stop_background_scheduler():
    """Stop the global background scheduler."""
    scheduler = get_background_scheduler()
    scheduler.stop()

# Simple in-memory scheduler for Render.com (since we can't use cron jobs)
class SimpleScheduler:
    """Simple in-memory scheduler that checks for posts to publish."""
    
    def __init__(self):
        self.scheduler_service = SchedulerService()
        self.last_check = datetime.utcnow()
    
    def check_and_process(self):
        """Check for posts to publish and process them."""
        try:
            current_time = datetime.utcnow()
            
            # Only check every minute to avoid excessive processing
            if (current_time - self.last_check).total_seconds() < 60:
                return {'message': 'Too soon since last check'}
            
            self.last_check = current_time
            
            # Process scheduled posts
            results = self.scheduler_service.process_scheduled_posts()
            
            logger.info(f"Scheduler check at {current_time}: "
                       f"processed {results['total_processed']} posts, "
                       f"{results['successful']} successful, {results['failed']} failed")
            
            return results
            
        except Exception as e:
            logger.error(f"Error in simple scheduler check: {e}")
            return {'error': str(e)}

# Global simple scheduler instance
_simple_scheduler = None

def get_simple_scheduler():
    """Get the global simple scheduler instance."""
    global _simple_scheduler
    if _simple_scheduler is None:
        _simple_scheduler = SimpleScheduler()
    return _simple_scheduler

