from flask import Blueprint, request, jsonify, current_app
from src.models import db, User, Post, PostUsage
from src.services.openai_service import OpenAIService
import requests
from datetime import datetime
import threading
import uuid
import time

posts_async_bp = Blueprint('posts_async', __name__)

# In-memory storage for async job status (in production, use Redis or database)
job_status = {}

def generate_post_async(job_id, data, app):
    """Background function to generate post with image."""
    with app.app_context():  # Set up Flask application context
        try:
            job_status[job_id] = {'status': 'processing', 'progress': 'Initializing...'}
            
            # Get user
            user = User.query.filter_by(username='admin').first()
            if not user:
                user = User(username='temp_user', email='temp@example.com', role='user')
                db.session.add(user)
                db.session.commit()
            
            current_user_id = user.id
            
            # Check usage limits
            post_usage = PostUsage.query.filter_by(user_id=current_user_id).first()
            if not post_usage:
                post_usage = PostUsage(user_id=current_user_id)
                db.session.add(post_usage)
                db.session.commit()
            
            if not post_usage.can_generate_post():
                job_status[job_id] = {
                    'status': 'error',
                    'error': 'Monthly post limit reached'
                }
                return
            
            profile_url = data.get('profile_url')
            post_theme = data.get('post_theme')
            additional_details = data.get('additional_details', '')
            generate_image = data.get('generate_image', False)
            platform = data.get('platform', 'linkedin')
            
            # Initialize OpenAI service
            job_status[job_id] = {'status': 'processing', 'progress': 'Initializing OpenAI service...'}
            openai_service = OpenAIService()
            
            # Generate post content
            job_status[job_id] = {'status': 'processing', 'progress': 'Generating post content...'}
            post_content = openai_service.generate_social_media_post(
                profile_url=profile_url,
                post_theme=post_theme,
                additional_details=additional_details,
                platform=platform
            )
            
            generated_image_url = None
            if generate_image:
                job_status[job_id] = {'status': 'processing', 'progress': 'Creating image prompt...'}
                
                # Create image prompt based on generated content
                image_prompt = openai_service.create_image_prompt(
                    post_content=post_content,
                    platform=platform
                )
                
                # Get platform-specific image size
                image_size = openai_service.get_platform_image_size(platform)
                
                job_status[job_id] = {'status': 'processing', 'progress': 'Generating image with GPT-Image-1 (this may take up to 5 minutes)...'}
                
                # Generate image with extended timeout handling
                generated_image_url = openai_service.generate_image(
                    prompt=image_prompt,
                    size=image_size
                )
            
            # Save to database
            job_status[job_id] = {'status': 'processing', 'progress': 'Saving to database...'}
            
            new_post = Post(
                user_id=current_user_id,
                content=post_content,
                image_url=generated_image_url,
                platform=platform,
                profile_url=profile_url,
                post_theme=post_theme
            )
            
            db.session.add(new_post)
            post_usage.increment_usage()
            db.session.commit()
            
            # Success
            job_status[job_id] = {
                'status': 'completed',
                'result': {
                    'post': {
                        'id': new_post.id,
                        'content': post_content,
                        'image_url': generated_image_url,
                        'platform': platform,
                        'created_at': new_post.created_at.isoformat()
                    }
                }
            }
            
        except Exception as e:
            job_status[job_id] = {
                'status': 'error',
                'error': str(e)
            }

@posts_async_bp.route('/generate-async', methods=['POST'])
def generate_post_async_endpoint():
    """Start async post generation and return job ID."""
    try:
        data = request.get_json()
        
        profile_url = data.get('profile_url')
        post_theme = data.get('post_theme')
        
        if not profile_url or not post_theme:
            return jsonify({'error': 'Profile URL and post theme are required'}), 400
        
        platform = data.get('platform', 'linkedin')
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Invalid platform'}), 400
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Start background thread
        thread = threading.Thread(target=generate_post_async, args=(job_id, data, current_app._get_current_object()))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'job_id': job_id,
            'status': 'started',
            'message': 'Post generation started. Use the job_id to check status.'
        }), 202
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to start async generation',
            'details': str(e)
        }), 500

@posts_async_bp.route('/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get the status of an async job."""
    if job_id not in job_status:
        return jsonify({'error': 'Job not found'}), 404
    
    status = job_status[job_id]
    
    # Clean up completed/error jobs after 1 hour
    if status['status'] in ['completed', 'error']:
        # In production, implement proper cleanup
        pass
    
    return jsonify(status)

@posts_async_bp.route('/cleanup', methods=['POST'])
def cleanup_jobs():
    """Clean up old job statuses (admin endpoint)."""
    global job_status
    job_status = {}
    return jsonify({'message': 'Job status cleaned up'})

