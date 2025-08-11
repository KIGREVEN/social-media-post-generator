"""
Simple subscription update route
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import text
from src.models import db
from datetime import datetime

subscription_update_bp = Blueprint('subscription_update', __name__)

@subscription_update_bp.route('/test', methods=['GET'])
def test_route():
    """Test route to verify blueprint is working."""
    return jsonify({'message': 'Subscription update blueprint is working!'}), 200

@subscription_update_bp.route('/users/<int:user_id>/subscription', methods=['PUT'])
def update_user_subscription(user_id):
    """Update user subscription."""
    try:
        data = request.get_json()
        
        if not data or 'subscription' not in data:
            return jsonify({'error': 'Subscription field is required'}), 400
        
        subscription = data['subscription']
        
        # Validate subscription type
        valid_subscriptions = ['free', 'basic', 'premium', 'enterprise']
        if subscription not in valid_subscriptions:
            return jsonify({'error': f'Invalid subscription type. Must be one of: {valid_subscriptions}'}), 400
        
        # Check if user exists
        user_check = db.session.execute(text("SELECT id FROM users WHERE id = :user_id"), {'user_id': user_id}).fetchone()
        if not user_check:
            return jsonify({'error': 'User not found'}), 404
        
        # Update subscription
        db.session.execute(text("""
            UPDATE users 
            SET subscription = :subscription, updated_at = :updated_at 
            WHERE id = :user_id
        """), {
            'subscription': subscription,
            'updated_at': datetime.utcnow(),
            'user_id': user_id
        })
        
        db.session.commit()
        
        # Get updated user data
        user_data = db.session.execute(text("""
            SELECT id, username, email, role, subscription, is_active, created_at, updated_at
            FROM users WHERE id = :user_id
        """), {'user_id': user_id}).fetchone()
        
        if user_data:
            user_dict = {
                'id': user_data[0],
                'username': user_data[1],
                'email': user_data[2],
                'role': user_data[3],
                'subscription': user_data[4],
                'is_active': user_data[5],
                'created_at': user_data[6].isoformat() if user_data[6] else None,
                'updated_at': user_data[7].isoformat() if user_data[7] else None
            }
            
            return jsonify({
                'message': 'Subscription updated successfully',
                'user': user_dict
            }), 200
        else:
            return jsonify({'error': 'Failed to retrieve updated user data'}), 500
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@subscription_update_bp.route('/users', methods=['GET'])
def get_all_users():
    """Get all users with subscription info."""
    try:
        users_data = db.session.execute(text("""
            SELECT id, username, email, role, subscription, is_active, created_at, updated_at
            FROM users
        """)).fetchall()
        
        users = []
        for user_data in users_data:
            user_dict = {
                'id': user_data[0],
                'username': user_data[1],
                'email': user_data[2],
                'role': user_data[3],
                'subscription': user_data[4],
                'is_active': user_data[5],
                'created_at': user_data[6].isoformat() if user_data[6] else None,
                'updated_at': user_data[7].isoformat() if user_data[7] else None
            }
            users.append(user_dict)
        
        return jsonify({
            'users': users,
            'total': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

