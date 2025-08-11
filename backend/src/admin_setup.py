#!/usr/bin/env python3
"""
Admin Setup Script for Social Media Post Generator

This script allows you to:
1. Create an admin user
2. Promote existing users to admin
3. List all users and their roles
"""

import sys
import os

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from main import app
from models import db, User
from werkzeug.security import generate_password_hash

def create_admin_user(username, email, password):
    """Create a new admin user."""
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"❌ User with username '{username}' or email '{email}' already exists!")
            return False
        
        # Create new admin user
        admin_user = User(
            username=username,
            email=email,
            role='admin'  # Set role to admin
        )
        admin_user.set_password(password)
        
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"✅ Admin user '{username}' created successfully!")
        return True

def promote_user_to_admin(username):
    """Promote an existing user to admin."""
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        
        if not user:
            print(f"❌ User '{username}' not found!")
            return False
        
        if user.role == 'admin':
            print(f"ℹ️  User '{username}' is already an admin!")
            return True
        
        user.role = 'admin'
        db.session.commit()
        
        print(f"✅ User '{username}' promoted to admin!")
        return True

def list_users():
    """List all users and their roles."""
    with app.app_context():
        users = User.query.all()
        
        if not users:
            print("No users found.")
            return
        
        print("\n📋 All Users:")
        print("-" * 50)
        for user in users:
            role_emoji = "👑" if user.role == 'admin' else "👤"
            print(f"{role_emoji} {user.username} ({user.email}) - {user.role}")
        print("-" * 50)

def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python admin_setup.py create <username> <email> <password>")
        print("  python admin_setup.py promote <username>")
        print("  python admin_setup.py list")
        return
    
    command = sys.argv[1]
    
    if command == "create":
        if len(sys.argv) != 5:
            print("Usage: python admin_setup.py create <username> <email> <password>")
            return
        
        username = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        
        create_admin_user(username, email, password)
    
    elif command == "promote":
        if len(sys.argv) != 3:
            print("Usage: python admin_setup.py promote <username>")
            return
        
        username = sys.argv[2]
        promote_user_to_admin(username)
    
    elif command == "list":
        list_users()
    
    else:
        print(f"Unknown command: {command}")
        print("Available commands: create, promote, list")

if __name__ == "__main__":
    main()

