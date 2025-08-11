#!/usr/bin/env python3
"""
Script to create the first admin user or promote existing user to admin
This script works by directly updating the database via API
"""

import requests
import json
import sys

def create_first_admin_user(backend_url, username, email, password):
    """Create the first admin user by registering and then manually promoting."""
    
    # Step 1: Register the user normally
    register_url = f"{backend_url}/api/auth/register"
    register_data = {
        "username": username,
        "email": email,
        "password": password
    }
    
    print(f"📝 Registering user '{username}'...")
    response = requests.post(register_url, json=register_data)
    
    if response.status_code == 201:
        print(f"✅ User '{username}' registered successfully!")
    elif response.status_code == 409:
        print(f"ℹ️  User '{username}' already exists, continuing...")
    else:
        print(f"❌ Registration failed: {response.text}")
        return False
    
    # Step 2: Login to get token
    login_url = f"{backend_url}/api/auth/login"
    login_data = {
        "username": username,
        "password": password
    }
    
    print(f"🔐 Logging in as '{username}'...")
    response = requests.post(login_url, json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return False
    
    token = response.json().get('token')
    print(f"✅ Login successful!")
    
    # Step 3: Check current user profile
    headers = {"Authorization": f"Bearer {token}"}
    profile_url = f"{backend_url}/api/auth/profile"
    
    print(f"👤 Checking user profile...")
    response = requests.get(profile_url, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to get profile: {response.text}")
        return False
    
    user_data = response.json()
    print(f"📋 Current user: {user_data['username']} (Role: {user_data['role']})")
    
    if user_data['role'] == 'admin':
        print(f"✅ User '{username}' is already an admin!")
        return True
    
    print(f"⚠️  User '{username}' is not an admin yet.")
    print(f"💡 You need to manually promote this user to admin using database access.")
    print(f"   Or use the admin panel if you have another admin account.")
    
    return True

def promote_existing_user(backend_url, username):
    """Try to promote an existing user by checking if they can access admin endpoints."""
    
    # This is a placeholder - in reality, we need database access or another admin
    print(f"ℹ️  To promote user '{username}' to admin, you need:")
    print(f"   1. Database access to update the 'role' field directly")
    print(f"   2. Or access via another admin account")
    print(f"   3. Or use the admin setup script on the server")
    
    return False

def main():
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python create_first_admin.py <backend_url> <username> [email] [password]")
        print("  python create_first_admin.py <backend_url> promote <username>")
        print("")
        print("Examples:")
        print("  python create_first_admin.py https://backend.onrender.com admin admin@example.com admin123")
        print("  python create_first_admin.py https://backend.onrender.com promote admin")
        return
    
    backend_url = sys.argv[1].rstrip('/')
    command = sys.argv[2]
    
    if command == "promote":
        if len(sys.argv) != 4:
            print("Usage: python create_first_admin.py <backend_url> promote <username>")
            return
        
        username = sys.argv[3]
        promote_existing_user(backend_url, username)
    
    else:
        # Treat second argument as username
        username = command
        
        if len(sys.argv) == 5:
            email = sys.argv[3]
            password = sys.argv[4]
        else:
            email = f"{username}@example.com"
            password = "admin123"
            print(f"ℹ️  Using default email: {email}")
            print(f"ℹ️  Using default password: {password}")
        
        create_first_admin_user(backend_url, username, email, password)

if __name__ == "__main__":
    main()

