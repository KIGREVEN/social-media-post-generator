#!/usr/bin/env python3
"""
Script to promote a user to admin via the production API
"""

import requests
import json
import sys

def promote_user_to_admin(backend_url, admin_username, admin_password, target_username):
    """Promote a user to admin via API calls."""
    
    # Step 1: Login as admin (if we have admin credentials)
    login_url = f"{backend_url}/api/auth/login"
    login_data = {
        "username": admin_username,
        "password": admin_password
    }
    
    print(f"🔐 Attempting to login as admin...")
    response = requests.post(login_url, json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.text}")
        return False
    
    token = response.json().get('token')
    if not token:
        print("❌ No token received from login")
        return False
    
    print(f"✅ Admin login successful!")
    
    # Step 2: Get all users to find the target user
    headers = {"Authorization": f"Bearer {token}"}
    users_url = f"{backend_url}/api/admin/users"
    
    print(f"📋 Fetching all users...")
    response = requests.get(users_url, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch users: {response.text}")
        return False
    
    users_data = response.json()
    users = users_data.get('users', [])
    
    # Find the target user
    target_user = None
    for user in users:
        if user['username'] == target_username:
            target_user = user
            break
    
    if not target_user:
        print(f"❌ User '{target_username}' not found!")
        return False
    
    print(f"👤 Found user: {target_user['username']} (ID: {target_user['id']}, Role: {target_user['role']})")
    
    if target_user['role'] == 'admin':
        print(f"ℹ️  User '{target_username}' is already an admin!")
        return True
    
    # Step 3: Update user role to admin
    user_id = target_user['id']
    update_url = f"{backend_url}/api/admin/users/{user_id}"
    update_data = {"role": "admin"}
    
    print(f"👑 Promoting user to admin...")
    response = requests.put(update_url, json=update_data, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to promote user: {response.text}")
        return False
    
    print(f"✅ User '{target_username}' successfully promoted to admin!")
    return True

def main():
    if len(sys.argv) != 5:
        print("Usage: python promote_admin.py <backend_url> <admin_username> <admin_password> <target_username>")
        print("Example: python promote_admin.py https://backend.onrender.com existing_admin admin_password user_to_promote")
        return
    
    backend_url = sys.argv[1].rstrip('/')
    admin_username = sys.argv[2]
    admin_password = sys.argv[3]
    target_username = sys.argv[4]
    
    success = promote_user_to_admin(backend_url, admin_username, admin_password, target_username)
    
    if success:
        print(f"\n🎉 SUCCESS: User '{target_username}' is now an admin!")
    else:
        print(f"\n💥 FAILED: Could not promote user '{target_username}' to admin.")

if __name__ == "__main__":
    main()

