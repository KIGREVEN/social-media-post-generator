from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import pytz
from src.services.scheduler_service import SchedulerService
from src.services.background_scheduler import get_simple_scheduler
from src.models import db, Post
import logging

logger = logging.getLogger(__name__)

scheduler_bp = Blueprint('scheduler', __name__)
scheduler_service = SchedulerService()

@scheduler_bp.route('/schedule', methods=['POST'])
@jwt_required()
def schedule_post():
    """Schedule a post for future publishing."""
    try:
        # Get the real current user from JWT token (convert string to int)
        user_id = int(get_jwt_identity())
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['content', 'platform', 'scheduled_date', 'scheduled_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse scheduled datetime
        try:
            scheduled_date = data['scheduled_date']  # Expected format: 'YYYY-MM-DD'
            scheduled_time = data['scheduled_time']  # Expected format: 'HH:MM'
            timezone = data.get('timezone', 'UTC')
            
            # Combine date and time
            datetime_str = f"{scheduled_date} {scheduled_time}"
            scheduled_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
            
            # Validate that the scheduled time is in the future
            current_time = datetime.utcnow()
            if timezone != 'UTC':
                user_tz = pytz.timezone(timezone)
                current_time = pytz.UTC.localize(current_time).astimezone(user_tz).replace(tzinfo=None)
            
            if scheduled_datetime <= current_time:
                return jsonify({'error': 'Scheduled time must be in the future'}), 400
                
        except ValueError as e:
            return jsonify({'error': f'Invalid date/time format: {str(e)}'}), 400
        except pytz.exceptions.UnknownTimeZoneError:
            return jsonify({'error': 'Invalid timezone'}), 400
        
        # Prepare post content
        post_content = {
            'title': data.get('title', ''),
            'content': data['content'],
            'image_url': data.get('image_url', '')
        }
        
        # Schedule the post
        scheduled_post = scheduler_service.schedule_post(
            user_id=user_id,
            post_content=post_content,
            platform=data['platform'],
            scheduled_time=scheduled_datetime,
            timezone=timezone,
            post_id=data.get('post_id')
        )
        
        if scheduled_post:
            return jsonify({
                'message': 'Post scheduled successfully',
                'scheduled_post': scheduled_post.to_dict()
            }), 201
        else:
            return jsonify({'error': 'Failed to schedule post'}), 500
            
    except Exception as e:
        logger.error(f"Error scheduling post: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@scheduler_bp.route('/scheduled', methods=['GET'])
@jwt_required()
def get_scheduled_posts():
    """Get all scheduled posts for the user."""
    try:
        # Get the real current user from JWT token (convert string to int)
        user_id = int(get_jwt_identity())
        
        # Automatically check for posts to publish when user views scheduled posts
        simple_scheduler = get_simple_scheduler()
        simple_scheduler.check_and_process()
        
        status = request.args.get('status')  # Optional status filter
        
        scheduled_posts = scheduler_service.get_scheduled_posts(user_id, status)
        
        return jsonify({
            'scheduled_posts': [post.to_dict() for post in scheduled_posts]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting scheduled posts: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@scheduler_bp.route('/scheduled/<int:post_id>', methods=['DELETE'])
def cancel_scheduled_post(post_id):
    """Cancel a scheduled post."""
    try:
        # Get user ID (in a real app, this would come from JWT token)
        user_id = request.args.get('user_id', 1, type=int)
        
        success = scheduler_service.cancel_scheduled_post(post_id, user_id)
        
        if success:
            return jsonify({'message': 'Scheduled post cancelled successfully'}), 200
        else:
            return jsonify({'error': 'Failed to cancel scheduled post or post not found'}), 404
            
    except Exception as e:
        logger.error(f"Error cancelling scheduled post: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@scheduler_bp.route('/scheduled/<int:post_id>/reschedule', methods=['PUT'])
def reschedule_post(post_id):
    """Reschedule a post to a new time."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['scheduled_date', 'scheduled_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get user ID (in a real app, this would come from JWT token)
        user_id = data.get('user_id', 1)
        
        # Parse new scheduled datetime
        try:
            scheduled_date = data['scheduled_date']  # Expected format: 'YYYY-MM-DD'
            scheduled_time = data['scheduled_time']  # Expected format: 'HH:MM'
            timezone = data.get('timezone', 'UTC')
            
            # Combine date and time
            datetime_str = f"{scheduled_date} {scheduled_time}"
            new_scheduled_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
            
            # Validate that the new scheduled time is in the future
            current_time = datetime.utcnow()
            if timezone != 'UTC':
                user_tz = pytz.timezone(timezone)
                current_time = pytz.UTC.localize(current_time).astimezone(user_tz).replace(tzinfo=None)
            
            if new_scheduled_datetime <= current_time:
                return jsonify({'error': 'New scheduled time must be in the future'}), 400
                
        except ValueError as e:
            return jsonify({'error': f'Invalid date/time format: {str(e)}'}), 400
        except pytz.exceptions.UnknownTimeZoneError:
            return jsonify({'error': 'Invalid timezone'}), 400
        
        # Reschedule the post
        success = scheduler_service.reschedule_post(
            post_id, user_id, new_scheduled_datetime, timezone
        )
        
        if success:
            return jsonify({'message': 'Post rescheduled successfully'}), 200
        else:
            return jsonify({'error': 'Failed to reschedule post or post not found'}), 404
            
    except Exception as e:
        logger.error(f"Error rescheduling post: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@scheduler_bp.route('/process', methods=['POST'])
def process_scheduled_posts():
    """Manually trigger processing of scheduled posts (for testing)."""
    try:
        # Use simple scheduler for automatic processing
        simple_scheduler = get_simple_scheduler()
        results = simple_scheduler.check_and_process()
        
        return jsonify({
            'message': 'Scheduled posts processed',
            'results': results
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing scheduled posts: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@scheduler_bp.route('/schedule-existing', methods=['POST'])
def schedule_existing_post():
    """Schedule an existing post for future publishing."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['post_id', 'platform', 'scheduled_date', 'scheduled_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get the existing post
        post = Post.query.get(data['post_id'])
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Get user ID (in a real app, this would come from JWT token)
        user_id = data.get('user_id', post.user_id)
        
        # Parse scheduled datetime
        try:
            scheduled_date = data['scheduled_date']  # Expected format: 'YYYY-MM-DD'
            scheduled_time = data['scheduled_time']  # Expected format: 'HH:MM'
            timezone = data.get('timezone', 'UTC')
            
            # Combine date and time
            datetime_str = f"{scheduled_date} {scheduled_time}"
            scheduled_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
            
            # Validate that the scheduled time is in the future
            current_time = datetime.utcnow()
            if timezone != 'UTC':
                user_tz = pytz.timezone(timezone)
                current_time = pytz.UTC.localize(current_time).astimezone(user_tz).replace(tzinfo=None)
            
            if scheduled_datetime <= current_time:
                return jsonify({'error': 'Scheduled time must be in the future'}), 400
                
        except ValueError as e:
            return jsonify({'error': f'Invalid date/time format: {str(e)}'}), 400
        except pytz.exceptions.UnknownTimeZoneError:
            return jsonify({'error': 'Invalid timezone'}), 400
        
        # Prepare post content from existing post
        post_content = {
            'title': post.title,
            'content': post.content,
            'image_url': post.generated_image_url
        }
        
        # Schedule the post
        scheduled_post = scheduler_service.schedule_post(
            user_id=user_id,
            post_content=post_content,
            platform=data['platform'],
            scheduled_time=scheduled_datetime,
            timezone=timezone,
            post_id=post.id
        )
        
        if scheduled_post:
            return jsonify({
                'message': 'Existing post scheduled successfully',
                'scheduled_post': scheduled_post.to_dict()
            }), 201
        else:
            return jsonify({'error': 'Failed to schedule existing post'}), 500
            
    except Exception as e:
        logger.error(f"Error scheduling existing post: {e}")
        return jsonify({'error': 'Internal server error'}), 500



@scheduler_bp.route('/auto-check', methods=['GET'])
def auto_check_scheduled_posts():
    """Automatically check and process scheduled posts (called periodically)."""
    try:
        # Use simple scheduler for automatic processing
        simple_scheduler = get_simple_scheduler()
        results = simple_scheduler.check_and_process()
        
        return jsonify({
            'message': 'Auto-check completed',
            'results': results
        }), 200
        
    except Exception as e:
        logger.error(f"Error in auto-check: {e}")
        return jsonify({'error': 'Internal server error'}), 500

