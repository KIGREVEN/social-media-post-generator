from flask import Blueprint, request, jsonify, url_for, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models import db, User, SocialAccount
from src.services.social_media_service import SocialMediaService

social_bp = Blueprint('social', __name__)

@social_bp.route('/accounts', methods=['GET'])
@jwt_required()
def get_connected_accounts():
    """Get user's connected social media accounts."""
    try:
        current_user_id = int(get_jwt_identity())
        
        social_accounts = SocialAccount.query.filter_by(
            user_id=current_user_id, is_active=True
        ).all()
        
        accounts_data = []
        for account in social_accounts:
            account_data = account.to_dict()
            # Don't include sensitive token information
            accounts_data.append(account_data)
        
        return jsonify({
            'accounts': accounts_data,
            'total': len(accounts_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/connect/<platform>', methods=['GET'])
@jwt_required()
def connect_account(platform):
    """Initiate OAuth flow for connecting a social media account."""
    try:
        current_user_id = int(get_jwt_identity())
        
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
        
        # Generate OAuth URL
        try:
            social_service = SocialMediaService()
            
            # Build redirect URI
            redirect_uri = url_for('social.oauth_callback', platform=platform, _external=True, _scheme='https')
            
            oauth_url = social_service.get_oauth_url(platform, current_user_id, redirect_uri)
            
            return jsonify({
                'oauth_url': oauth_url,
                'platform': platform,
                'message': f'Redirect to {platform.title()} for authorization'
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to generate OAuth URL: {str(e)}'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/callback/<platform>', methods=['GET'])
def oauth_callback(platform):
    """Handle OAuth callback from social media platforms."""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        if error:
            return jsonify({
                'error': f'OAuth authorization failed: {error}',
                'platform': platform
            }), 400
        
        if not code:
            return jsonify({'error': 'Authorization code not provided'}), 400
        
        if not state:
            return jsonify({'error': 'State parameter not provided'}), 400
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Unsupported platform'}), 400
        
        try:
            social_service = SocialMediaService()
            
            # Build redirect URI
            redirect_uri = url_for('social.oauth_callback', platform=platform, _external=True, _scheme='https')
            
            # Handle OAuth callback
            result = social_service.handle_oauth_callback(platform, code, state, redirect_uri)
            
            # Redirect to frontend with success message
            frontend_url = f"https://social-media-post-generator-frontend.onrender.com/social-accounts?success=true&platform={platform}&account={result['account_name']}"
            return redirect(frontend_url)
            
        except Exception as e:
            # Redirect to frontend with error message
            frontend_url = f"https://social-media-post-generator-frontend.onrender.com/social-accounts?error=true&message={str(e)}&platform={platform}"
            return redirect(frontend_url)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/disconnect/<platform>', methods=['DELETE'])
@jwt_required()
def disconnect_account(platform):
    """Disconnect a social media account."""
    try:
        current_user_id = int(get_jwt_identity())
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Unsupported platform'}), 400
        
        social_account = SocialAccount.query.filter_by(
            user_id=current_user_id, platform=platform, is_active=True
        ).first()
        
        if not social_account:
            return jsonify({'error': f'No active {platform.title()} account found'}), 404
        
        # Deactivate the account instead of deleting (for audit purposes)
        social_account.is_active = False
        social_account.access_token = None
        social_account.refresh_token = None
        
        db.session.commit()
        
        return jsonify({
            'message': f'{platform.title()} account disconnected successfully',
            'platform': platform
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_bp.route('/publish', methods=['POST'])
@jwt_required()
def publish_to_platform():
    """Publish content to a specific social media platform."""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        platform = data.get('platform')
        content = data.get('content')
        image_url = data.get('image_url')
        
        if not platform or not content:
            return jsonify({'error': 'Platform and content are required'}), 400
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Unsupported platform'}), 400
        
        # Check if user has connected account for this platform
        social_account = SocialAccount.query.filter_by(
            user_id=current_user_id, platform=platform, is_active=True
        ).first()
        
        if not social_account:
            return jsonify({
                'error': f'No active {platform.title()} account found. Please connect your account first.'
            }), 404
        
        try:
            social_service = SocialMediaService()
            
            # Publish to platform
            result = social_service.post_to_platform(platform, current_user_id, content, image_url)
            
            return jsonify({
                'success': True,
                'message': f'Content published to {platform.title()} successfully',
                'result': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to publish to {platform}: {str(e)}'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/platforms', methods=['GET'])
def get_supported_platforms():
    """Get list of supported social media platforms."""
    try:
        platforms = [
            {
                'id': 'linkedin',
                'name': 'LinkedIn',
                'description': 'Professional networking platform',
                'features': ['text_posts', 'image_posts', 'professional_content']
            },
            {
                'id': 'facebook',
                'name': 'Facebook',
                'description': 'Social networking platform',
                'features': ['text_posts', 'image_posts', 'page_management']
            },
            {
                'id': 'twitter',
                'name': 'Twitter/X',
                'description': 'Microblogging platform',
                'features': ['text_posts', 'image_posts', 'character_limit']
            },
            {
                'id': 'instagram',
                'name': 'Instagram',
                'description': 'Photo and video sharing platform',
                'features': ['image_posts', 'video_posts', 'stories']
            }
        ]
        
        return jsonify({
            'platforms': platforms,
            'total': len(platforms)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/account/<platform>/status', methods=['GET'])
@jwt_required()
def get_account_status(platform):
    """Get connection status for a specific platform."""
    try:
        current_user_id = int(get_jwt_identity())
        
        if platform not in ['linkedin', 'facebook', 'twitter', 'instagram']:
            return jsonify({'error': 'Unsupported platform'}), 400
        
        social_account = SocialAccount.query.filter_by(
            user_id=current_user_id, platform=platform
        ).first()
        
        if not social_account:
            return jsonify({
                'platform': platform,
                'connected': False,
                'status': 'not_connected'
            }), 200
        
        status = 'connected' if social_account.is_active else 'disconnected'
        if social_account.is_active and social_account.is_token_expired():
            status = 'token_expired'
        
        return jsonify({
            'platform': platform,
            'connected': social_account.is_active,
            'status': status,
            'account_name': social_account.account_name,
            'connected_at': social_account.created_at.isoformat() if social_account.created_at else None,
            'expires_at': social_account.expires_at.isoformat() if social_account.expires_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

