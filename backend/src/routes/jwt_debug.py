from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token
from src.models import db, User
import jwt
import os
from datetime import datetime

jwt_debug_bp = Blueprint('jwt_debug', __name__)

@jwt_debug_bp.route('/test-token', methods=['POST', 'OPTIONS'])
def test_jwt_token():
    """Debug endpoint to test JWT token validation."""
    if request.method == 'OPTIONS':
        # Handle CORS preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response
    
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'error': 'No Authorization header',
                'debug': 'Missing Authorization header in request'
            }), 400
        
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid Authorization format',
                'debug': f'Expected "Bearer <token>", got: {auth_header[:20]}...'
            }), 400
        
        token = auth_header.split(' ')[1]
        
        # Debug token info
        debug_info = {
            'token_length': len(token),
            'token_start': token[:20] + '...' if len(token) > 20 else token,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Try to decode token manually first
        try:
            # Get the secret key from config
            from src.config import Config
            secret_key = Config.JWT_SECRET_KEY or Config.SECRET_KEY
            
            # Decode without verification first to see payload
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            debug_info['unverified_payload'] = unverified_payload
            
            # Now try with verification
            verified_payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            debug_info['verified_payload'] = verified_payload
            debug_info['secret_key_used'] = secret_key[:10] + '...' if secret_key else 'None'
            
            # Check if user exists
            user_id = verified_payload.get('sub')
            if user_id:
                user = User.query.get(user_id)
                debug_info['user_exists'] = user is not None
                if user:
                    debug_info['user_info'] = {
                        'id': user.id,
                        'username': user.username,
                        'is_active': user.is_active
                    }
            
            return jsonify({
                'status': 'valid',
                'message': 'Token is valid',
                'debug': debug_info
            }), 200
            
        except jwt.ExpiredSignatureError:
            debug_info['error'] = 'Token has expired'
            return jsonify({
                'status': 'expired',
                'message': 'Token has expired',
                'debug': debug_info
            }), 401
            
        except jwt.InvalidTokenError as e:
            debug_info['error'] = str(e)
            return jsonify({
                'status': 'invalid',
                'message': f'Invalid token: {str(e)}',
                'debug': debug_info
            }), 422
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Unexpected error: {str(e)}',
            'debug': {
                'error_type': type(e).__name__,
                'error_details': str(e)
            }
        }), 500

@jwt_debug_bp.route('/config-info', methods=['GET'])
def get_config_info():
    """Get JWT configuration info for debugging."""
    try:
        from src.config import Config
        
        config_info = {
            'secret_key_set': bool(Config.SECRET_KEY),
            'jwt_secret_key_set': bool(Config.JWT_SECRET_KEY),
            'secret_keys_match': Config.SECRET_KEY == Config.JWT_SECRET_KEY,
            'secret_key_preview': Config.SECRET_KEY[:10] + '...' if Config.SECRET_KEY else 'None',
            'jwt_secret_key_preview': Config.JWT_SECRET_KEY[:10] + '...' if Config.JWT_SECRET_KEY else 'None',
            'environment_vars': {
                'SECRET_KEY': bool(os.environ.get('SECRET_KEY')),
                'JWT_SECRET_KEY': bool(os.environ.get('JWT_SECRET_KEY'))
            }
        }
        
        return jsonify({
            'status': 'ok',
            'config': config_info
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

