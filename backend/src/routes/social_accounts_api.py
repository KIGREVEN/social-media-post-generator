from flask import Blueprint, request, jsonify
from src.models import db, User, SocialAccount, Post
from datetime import datetime

social_accounts_api_bp = Blueprint('social_accounts_api', __name__)

@social_accounts_api_bp.route('/accounts', methods=['GET'])
def get_user_social_accounts():
    """Get all social media accounts for the current user."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        # Get all social accounts for the user
        social_accounts = SocialAccount.query.filter_by(user_id=current_user_id).all()
        
        # Prepare response data
        accounts_data = []
        for account in social_accounts:
            account_data = {
                'id': account.id,
                'platform': account.platform,
                'account_name': account.account_name,
                'account_id': account.account_id,
                'is_active': account.is_active,
                'is_connected': account.is_active and not account.is_token_expired(),
                'expires_at': account.expires_at.isoformat() if account.expires_at else None,
                'created_at': account.created_at.isoformat(),
                'updated_at': account.updated_at.isoformat()
            }
            accounts_data.append(account_data)
        
        # Get platform statistics
        platform_stats = {}
        for platform in ['linkedin', 'facebook', 'twitter', 'instagram']:
            account = next((acc for acc in social_accounts if acc.platform == platform), None)
            platform_stats[platform] = {
                'connected': account is not None and account.is_active,
                'account_name': account.account_name if account else None,
                'expires_soon': account.is_token_expired() if account else False
            }
        
        return jsonify({
            'accounts': accounts_data,
            'platform_stats': platform_stats,
            'total_connected': len([acc for acc in social_accounts if acc.is_active])
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_accounts_api_bp.route('/connect/<platform>', methods=['POST'])
def connect_social_account(platform):
    """Initiate OAuth flow for connecting a social media account."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Unsupported platform'}), 400
        
        # Check if user already has this platform connected
        existing_account = SocialAccount.query.filter_by(
            user_id=current_user_id, platform=platform, is_active=True
        ).first()
        
        if existing_account:
            return jsonify({
                'error': f'{platform.title()} account already connected',
                'account': existing_account.to_dict()
            }), 409
        
        # For LinkedIn, use real OAuth flow
        if platform == 'linkedin':
            from src.services.social_media_service import SocialMediaService
            from flask import url_for
            
            try:
                social_service = SocialMediaService()
                
                # Build redirect URI for LinkedIn with HTTPS
                redirect_uri = url_for('social.oauth_callback', platform=platform, _external=True, _scheme='https')
                
                # Generate real OAuth URL
                oauth_url = social_service.get_oauth_url(platform, current_user_id, redirect_uri)
                
                return jsonify({
                    'oauth_url': oauth_url,
                    'platform': platform,
                    'message': f'Redirect to {platform.title()} for authorization',
                    'redirect': True
                }), 200
                
            except Exception as e:
                return jsonify({'error': f'Failed to generate OAuth URL: {str(e)}'}), 500
        
        # For other platforms, use demo data (as before)
        demo_data = {
            'facebook': {
                'account_id': 'demo_facebook_456',
                'account_name': 'Demo Facebook User'
            },
            'twitter': {
                'account_id': 'demo_twitter_789',
                'account_name': 'Demo Twitter User'
            },
            'instagram': {
                'account_id': 'demo_instagram_101',
                'account_name': 'Demo Instagram User'
            }
        }
        
        new_account = SocialAccount(
            user_id=current_user_id,
            platform=platform,
            account_id=demo_data[platform]['account_id'],
            account_name=demo_data[platform]['account_name'],
            access_token='demo_access_token',
            refresh_token='demo_refresh_token',
            expires_at=datetime.utcnow().replace(year=datetime.utcnow().year + 1),  # 1 year from now
            is_active=True
        )
        
        db.session.add(new_account)
        db.session.commit()
        
        return jsonify({
            'message': f'{platform.title()} account connected successfully',
            'account': new_account.to_dict(),
            'redirect': False
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_accounts_api_bp.route('/disconnect/<platform>', methods=['DELETE'])
def disconnect_social_account(platform):
    """Disconnect a social media account."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Unsupported platform'}), 400
        
        social_account = SocialAccount.query.filter_by(
            user_id=current_user_id, platform=platform, is_active=True
        ).first()
        
        if not social_account:
            return jsonify({'error': f'No active {platform.title()} account found'}), 404
        
        # Deactivate the account
        social_account.is_active = False
        social_account.access_token = None
        social_account.refresh_token = None
        social_account.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'{platform.title()} account disconnected successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_accounts_api_bp.route('/publish', methods=['POST'])
def publish_to_social_media():
    """Publish a post to connected social media platforms."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        data = request.get_json()
        post_id = data.get('post_id')
        platforms = data.get('platforms', [])
        
        if not post_id:
            return jsonify({'error': 'Post ID is required'}), 400
        
        if not platforms:
            return jsonify({'error': 'At least one platform must be selected'}), 400
        
        # Get the post
        post = Post.query.filter_by(id=post_id, user_id=current_user_id).first()
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Check connected accounts for selected platforms
        results = []
        for platform in platforms:
            if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
                results.append({
                    'platform': platform,
                    'success': False,
                    'error': 'Unsupported platform'
                })
                continue
            
            social_account = SocialAccount.query.filter_by(
                user_id=current_user_id, platform=platform, is_active=True
            ).first()
            
            if not social_account:
                results.append({
                    'platform': platform,
                    'success': False,
                    'error': f'No active {platform.title()} account found'
                })
                continue
            
            # Simulate publishing (in production, use actual API calls)
            try:
                # Mark post as published for this platform
                post.is_posted = True
                post.posted_at = datetime.utcnow()
                post.platform = platform  # Update to last published platform
                
                results.append({
                    'platform': platform,
                    'success': True,
                    'message': f'Successfully published to {platform.title()}',
                    'post_id': f'demo_{platform}_post_id'
                })
                
            except Exception as e:
                results.append({
                    'platform': platform,
                    'success': False,
                    'error': str(e)
                })
        
        db.session.commit()
        
        # Calculate success rate
        successful_posts = len([r for r in results if r['success']])
        total_platforms = len(platforms)
        
        return jsonify({
            'message': f'Published to {successful_posts}/{total_platforms} platforms',
            'results': results,
            'post_id': post_id,
            'success_rate': f'{successful_posts}/{total_platforms}'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_accounts_api_bp.route('/platforms', methods=['GET'])
def get_supported_platforms():
    """Get list of supported social media platforms with their features."""
    try:
        platforms = [
            {
                'id': 'linkedin',
                'name': 'LinkedIn',
                'description': 'Professional networking platform',
                'icon': '💼',
                'features': ['text_posts', 'image_posts', 'professional_content'],
                'max_characters': 3000,
                'supports_images': True,
                'supports_videos': True
            },
            {
                'id': 'facebook',
                'name': 'Facebook',
                'description': 'Social networking platform',
                'icon': '📘',
                'features': ['text_posts', 'image_posts', 'page_management'],
                'max_characters': 63206,
                'supports_images': True,
                'supports_videos': True
            },
            {
                'id': 'twitter',
                'name': 'Twitter/X',
                'description': 'Microblogging platform',
                'icon': '🐦',
                'features': ['text_posts', 'image_posts', 'character_limit'],
                'max_characters': 280,
                'supports_images': True,
                'supports_videos': True
            },
            {
                'id': 'instagram',
                'name': 'Instagram',
                'description': 'Photo and video sharing platform',
                'icon': '📸',
                'features': ['image_posts', 'video_posts', 'stories'],
                'max_characters': 2200,
                'supports_images': True,
                'supports_videos': True
            }
        ]
        
        return jsonify({
            'platforms': platforms,
            'total': len(platforms)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_accounts_api_bp.route('/stats', methods=['GET'])
def get_social_media_stats():
    """Get social media statistics for the user."""
    try:
        # Verwende einen Standard-User für alle Requests (vereinfacht)
        user = User.query.filter_by(username='admin').first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = user.id
        
        # Get connected accounts
        connected_accounts = SocialAccount.query.filter_by(
            user_id=current_user_id, is_active=True
        ).count()
        
        # Get published posts by platform
        published_posts = {}
        for platform in ['linkedin', 'facebook', 'twitter', 'instagram']:
            count = Post.query.filter_by(
                user_id=current_user_id, platform=platform, is_posted=True
            ).count()
            published_posts[platform] = count
        
        # Get total published posts
        total_published = Post.query.filter_by(
            user_id=current_user_id, is_posted=True
        ).count()
        
        # Get recent activity (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_posts = Post.query.filter(
            Post.user_id == current_user_id,
            Post.is_posted == True,
            Post.posted_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'connected_accounts': connected_accounts,
            'total_platforms': 4,
            'published_posts': published_posts,
            'total_published': total_published,
            'recent_posts': recent_posts,
            'connection_rate': f'{connected_accounts}/4'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

