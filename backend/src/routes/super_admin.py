from flask import Blueprint, request, jsonify
from src.models import db, User
import os

super_admin_bp = Blueprint('super_admin', __name__)

@super_admin_bp.route('/promote-first-admin', methods=['POST'])
def promote_first_admin():
    """
    Special endpoint to promote the first admin user.
    This endpoint requires a special secret key and can only be used once.
    """
    try:
        data = request.get_json()
        username = data.get('username')
        secret_key = data.get('secret_key')
        
        # Check if secret key matches environment variable
        expected_secret = os.getenv('SUPER_ADMIN_SECRET', 'super_secret_admin_key_2024')
        
        if secret_key != expected_secret:
            return jsonify({'error': 'Invalid secret key'}), 403
        
        if not username:
            return jsonify({'error': 'Username is required'}), 400
        
        # Check if there are already admin users
        existing_admins = User.query.filter_by(role='admin').count()
        if existing_admins > 0:
            return jsonify({'error': 'Admin users already exist. Use normal admin promotion.'}), 409
        
        # Find the user
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Promote to admin
        user.role = 'admin'
        db.session.commit()
        
        return jsonify({
            'message': f'User {username} promoted to admin successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@super_admin_bp.route('/check-admin-status', methods=['GET'])
def check_admin_status():
    """Check if there are any admin users in the system."""
    try:
        admin_count = User.query.filter_by(role='admin').count()
        total_users = User.query.count()
        
        return jsonify({
            'admin_count': admin_count,
            'total_users': total_users,
            'has_admins': admin_count > 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

