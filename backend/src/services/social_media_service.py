import requests
import json
from flask import current_app, url_for
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from src.models import db, SocialAccount
import urllib.parse

class SocialMediaService:
    """Service for social media OAuth integration and posting."""
    
    def __init__(self):
        self.linkedin_client_id = current_app.config.get('LINKEDIN_CLIENT_ID')
        self.linkedin_client_secret = current_app.config.get('LINKEDIN_CLIENT_SECRET')
        self.facebook_app_id = current_app.config.get('FACEBOOK_APP_ID')
        self.facebook_app_secret = current_app.config.get('FACEBOOK_APP_SECRET')
        self.twitter_client_id = current_app.config.get('TWITTER_CLIENT_ID')
        self.twitter_client_secret = current_app.config.get('TWITTER_CLIENT_SECRET')
        self.instagram_client_id = current_app.config.get('INSTAGRAM_CLIENT_ID')
        self.instagram_client_secret = current_app.config.get('INSTAGRAM_CLIENT_SECRET')
    
    def get_oauth_url(self, platform: str, user_id: int, redirect_uri: str) -> str:
        """
        Generate OAuth authorization URL for the specified platform.
        
        Args:
            platform: Social media platform (linkedin, facebook, twitter, instagram)
            user_id: User ID for state parameter
            redirect_uri: Callback URL
            
        Returns:
            OAuth authorization URL
        """
        state = f"{user_id}_{platform}"
        
        if platform == 'linkedin':
            return self._get_linkedin_oauth_url(state, redirect_uri)
        elif platform == 'facebook':
            return self._get_facebook_oauth_url(state, redirect_uri)
        elif platform == 'twitter':
            return self._get_twitter_oauth_url(state, redirect_uri)
        elif platform == 'instagram':
            return self._get_instagram_oauth_url(state, redirect_uri)
        else:
            raise ValueError(f"Unsupported platform: {platform}")
    
    def handle_oauth_callback(self, platform: str, code: str, state: str, redirect_uri: str) -> Dict[str, Any]:
        """
        Handle OAuth callback and exchange code for access token.
        
        Args:
            platform: Social media platform
            code: Authorization code from OAuth provider
            state: State parameter containing user_id and platform
            redirect_uri: Callback URL
            
        Returns:
            Dictionary containing user info and token data
        """
        try:
            user_id, platform_check = state.split('_', 1)
            user_id = int(user_id)
            
            if platform_check != platform:
                raise ValueError("Platform mismatch in state parameter")
            
            if platform == 'linkedin':
                return self._handle_linkedin_callback(code, redirect_uri, user_id)
            elif platform == 'facebook':
                return self._handle_facebook_callback(code, redirect_uri, user_id)
            elif platform == 'twitter':
                return self._handle_twitter_callback(code, redirect_uri, user_id)
            elif platform == 'instagram':
                return self._handle_instagram_callback(code, redirect_uri, user_id)
            else:
                raise ValueError(f"Unsupported platform: {platform}")
                
        except Exception as e:
            raise Exception(f"OAuth callback error: {str(e)}")
    
    def post_to_platform(self, platform: str, user_id: int, content: str, image_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Post content to the specified social media platform.
        
        Args:
            platform: Social media platform
            user_id: User ID
            content: Post content
            image_url: Optional image URL
            
        Returns:
            Post result information
        """
        # Get user's social account
        social_account = SocialAccount.query.filter_by(
            user_id=user_id, platform=platform, is_active=True
        ).first()
        
        if not social_account:
            raise ValueError(f"No active {platform} account found for user")
        
        # Check if token is expired and refresh if needed
        if social_account.is_token_expired():
            self._refresh_token(social_account)
        
        if platform == 'linkedin':
            return self._post_to_linkedin(social_account, content, image_url)
        elif platform == 'facebook':
            return self._post_to_facebook(social_account, content, image_url)
        elif platform == 'twitter':
            return self._post_to_twitter(social_account, content, image_url)
        elif platform == 'instagram':
            return self._post_to_instagram(social_account, content, image_url)
        else:
            raise ValueError(f"Unsupported platform: {platform}")
    
    # LinkedIn OAuth methods
    def _get_linkedin_oauth_url(self, state: str, redirect_uri: str) -> str:
        """Generate LinkedIn OAuth URL."""
        params = {
            'response_type': 'code',
            'client_id': self.linkedin_client_id,
            'redirect_uri': redirect_uri,
            'state': state,
            'scope': 'r_liteprofile r_emailaddress w_member_social'
        }
        
        base_url = 'https://www.linkedin.com/oauth/v2/authorization'
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    def _handle_linkedin_callback(self, code: str, redirect_uri: str, user_id: int) -> Dict[str, Any]:
        """Handle LinkedIn OAuth callback."""
        # Exchange code for access token
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': self.linkedin_client_id,
            'client_secret': self.linkedin_client_secret
        }
        
        token_response = requests.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            data=token_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        if token_response.status_code != 200:
            raise Exception(f"LinkedIn token exchange failed: {token_response.text}")
        
        token_info = token_response.json()
        access_token = token_info['access_token']
        expires_in = token_info.get('expires_in', 5184000)  # Default 60 days
        
        # Get user profile information
        profile_response = requests.get(
            'https://api.linkedin.com/v2/people/~:(id,firstName,lastName)',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if profile_response.status_code != 200:
            raise Exception(f"LinkedIn profile fetch failed: {profile_response.text}")
        
        profile_data = profile_response.json()
        
        # Save or update social account
        social_account = SocialAccount.query.filter_by(
            user_id=user_id, platform='linkedin'
        ).first()
        
        if not social_account:
            social_account = SocialAccount(user_id=user_id, platform='linkedin')
        
        social_account.account_id = profile_data['id']
        social_account.account_name = f"{profile_data['firstName']['localized']['en_US']} {profile_data['lastName']['localized']['en_US']}"
        social_account.access_token = access_token
        social_account.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        social_account.is_active = True
        
        db.session.add(social_account)
        db.session.commit()
        
        return {
            'platform': 'linkedin',
            'account_name': social_account.account_name,
            'account_id': social_account.account_id
        }
    
    # Facebook OAuth methods
    def _get_facebook_oauth_url(self, state: str, redirect_uri: str) -> str:
        """Generate Facebook OAuth URL."""
        params = {
            'client_id': self.facebook_app_id,
            'redirect_uri': redirect_uri,
            'state': state,
            'scope': 'pages_manage_posts,pages_read_engagement,public_profile'
        }
        
        base_url = 'https://www.facebook.com/v18.0/dialog/oauth'
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    def _handle_facebook_callback(self, code: str, redirect_uri: str, user_id: int) -> Dict[str, Any]:
        """Handle Facebook OAuth callback."""
        # Exchange code for access token
        token_params = {
            'client_id': self.facebook_app_id,
            'client_secret': self.facebook_app_secret,
            'redirect_uri': redirect_uri,
            'code': code
        }
        
        token_response = requests.get(
            'https://graph.facebook.com/v18.0/oauth/access_token',
            params=token_params
        )
        
        if token_response.status_code != 200:
            raise Exception(f"Facebook token exchange failed: {token_response.text}")
        
        token_info = token_response.json()
        access_token = token_info['access_token']
        
        # Get user profile
        profile_response = requests.get(
            'https://graph.facebook.com/v18.0/me',
            params={'access_token': access_token, 'fields': 'id,name'}
        )
        
        if profile_response.status_code != 200:
            raise Exception(f"Facebook profile fetch failed: {profile_response.text}")
        
        profile_data = profile_response.json()
        
        # Save or update social account
        social_account = SocialAccount.query.filter_by(
            user_id=user_id, platform='facebook'
        ).first()
        
        if not social_account:
            social_account = SocialAccount(user_id=user_id, platform='facebook')
        
        social_account.account_id = profile_data['id']
        social_account.account_name = profile_data['name']
        social_account.access_token = access_token
        social_account.is_active = True
        
        db.session.add(social_account)
        db.session.commit()
        
        return {
            'platform': 'facebook',
            'account_name': social_account.account_name,
            'account_id': social_account.account_id
        }
    
    # Twitter OAuth methods (simplified - Twitter OAuth 2.0 is more complex)
    def _get_twitter_oauth_url(self, state: str, redirect_uri: str) -> str:
        """Generate Twitter OAuth URL."""
        # Note: Twitter OAuth 2.0 requires PKCE, this is a simplified version
        params = {
            'response_type': 'code',
            'client_id': self.twitter_client_id,
            'redirect_uri': redirect_uri,
            'state': state,
            'scope': 'tweet.read tweet.write users.read',
            'code_challenge': 'challenge',  # In production, use proper PKCE
            'code_challenge_method': 'plain'
        }
        
        base_url = 'https://twitter.com/i/oauth2/authorize'
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    def _handle_twitter_callback(self, code: str, redirect_uri: str, user_id: int) -> Dict[str, Any]:
        """Handle Twitter OAuth callback."""
        # This is a simplified implementation
        # In production, implement proper Twitter OAuth 2.0 with PKCE
        
        # For now, create a placeholder social account
        social_account = SocialAccount.query.filter_by(
            user_id=user_id, platform='twitter'
        ).first()
        
        if not social_account:
            social_account = SocialAccount(user_id=user_id, platform='twitter')
        
        social_account.account_id = 'twitter_placeholder'
        social_account.account_name = 'Twitter Account'
        social_account.access_token = 'placeholder_token'
        social_account.is_active = True
        
        db.session.add(social_account)
        db.session.commit()
        
        return {
            'platform': 'twitter',
            'account_name': social_account.account_name,
            'account_id': social_account.account_id
        }
    
    # Instagram OAuth methods
    def _get_instagram_oauth_url(self, state: str, redirect_uri: str) -> str:
        """Generate Instagram OAuth URL."""
        params = {
            'client_id': self.instagram_client_id,
            'redirect_uri': redirect_uri,
            'state': state,
            'scope': 'user_profile,user_media',
            'response_type': 'code'
        }
        
        base_url = 'https://api.instagram.com/oauth/authorize'
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    def _handle_instagram_callback(self, code: str, redirect_uri: str, user_id: int) -> Dict[str, Any]:
        """Handle Instagram OAuth callback."""
        # Exchange code for access token
        token_data = {
            'client_id': self.instagram_client_id,
            'client_secret': self.instagram_client_secret,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
            'code': code
        }
        
        token_response = requests.post(
            'https://api.instagram.com/oauth/access_token',
            data=token_data
        )
        
        if token_response.status_code != 200:
            raise Exception(f"Instagram token exchange failed: {token_response.text}")
        
        token_info = token_response.json()
        access_token = token_info['access_token']
        
        # Save or update social account
        social_account = SocialAccount.query.filter_by(
            user_id=user_id, platform='instagram'
        ).first()
        
        if not social_account:
            social_account = SocialAccount(user_id=user_id, platform='instagram')
        
        social_account.account_id = token_info.get('user_id', 'instagram_user')
        social_account.account_name = 'Instagram Account'
        social_account.access_token = access_token
        social_account.is_active = True
        
        db.session.add(social_account)
        db.session.commit()
        
        return {
            'platform': 'instagram',
            'account_name': social_account.account_name,
            'account_id': social_account.account_id
        }
    
    # Posting methods
    def _post_to_linkedin(self, social_account: SocialAccount, content: str, image_url: Optional[str] = None) -> Dict[str, Any]:
        """Post content to LinkedIn."""
        # LinkedIn posting implementation
        # This is a simplified version - full implementation requires more complex API calls
        
        post_data = {
            'author': f'urn:li:person:{social_account.account_id}',
            'lifecycleState': 'PUBLISHED',
            'specificContent': {
                'com.linkedin.ugc.ShareContent': {
                    'shareCommentary': {
                        'text': content
                    },
                    'shareMediaCategory': 'NONE'
                }
            },
            'visibility': {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        }
        
        headers = {
            'Authorization': f'Bearer {social_account.access_token}',
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        }
        
        # For now, return a mock response
        return {
            'success': True,
            'platform': 'linkedin',
            'post_id': 'mock_linkedin_post_id',
            'message': 'Post would be published to LinkedIn'
        }
    
    def _post_to_facebook(self, social_account: SocialAccount, content: str, image_url: Optional[str] = None) -> Dict[str, Any]:
        """Post content to Facebook."""
        # Facebook posting implementation
        return {
            'success': True,
            'platform': 'facebook',
            'post_id': 'mock_facebook_post_id',
            'message': 'Post would be published to Facebook'
        }
    
    def _post_to_twitter(self, social_account: SocialAccount, content: str, image_url: Optional[str] = None) -> Dict[str, Any]:
        """Post content to Twitter."""
        # Twitter posting implementation
        return {
            'success': True,
            'platform': 'twitter',
            'post_id': 'mock_twitter_post_id',
            'message': 'Post would be published to Twitter'
        }
    
    def _post_to_instagram(self, social_account: SocialAccount, content: str, image_url: Optional[str] = None) -> Dict[str, Any]:
        """Post content to Instagram."""
        # Instagram posting implementation
        return {
            'success': True,
            'platform': 'instagram',
            'post_id': 'mock_instagram_post_id',
            'message': 'Post would be published to Instagram'
        }
    
    def _refresh_token(self, social_account: SocialAccount):
        """Refresh expired access token."""
        # Implementation depends on the platform
        # For now, just mark as inactive if expired
        if social_account.is_token_expired():
            social_account.is_active = False
            db.session.commit()

