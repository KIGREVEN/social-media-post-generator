#!/usr/bin/env python3
"""
Simple script to promote a user to admin using the super admin endpoint
"""

import requests
import json

def promote_user_to_admin(backend_url, username):
    """Promote a user to admin using the super admin endpoint."""
    
    # Check admin status first
    status_url = f"{backend_url}/api/super-admin/check-admin-status"
    
    print(f"🔍 Checking admin status...")
    response = requests.get(status_url)
    
    if response.status_code == 200:
        status_data = response.json()
        print(f"📊 Admin count: {status_data['admin_count']}")
        print(f"📊 Total users: {status_data['total_users']}")
        
        if status_data['has_admins']:
            print(f"⚠️  Admin users already exist. Use normal admin promotion instead.")
            return False
    else:
        print(f"❌ Failed to check admin status: {response.text}")
        return False
    
    # Promote user to admin
    promote_url = f"{backend_url}/api/super-admin/promote-first-admin"
    promote_data = {
        "username": username,
        "secret_key": "super_secret_admin_key_2024"  # Default secret key
    }
    
    print(f"👑 Promoting user '{username}' to admin...")
    response = requests.post(promote_url, json=promote_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ SUCCESS: {result['message']}")
        print(f"👤 User details: {result['user']['username']} (Role: {result['user']['role']})")
        return True
    else:
        print(f"❌ FAILED: {response.text}")
        return False

def main():
    backend_url = "https://social-media-post-generator-backend.onrender.com"
    username = "admin"  # The user you want to promote
    
    print(f"🚀 Promoting user '{username}' to admin on {backend_url}")
    print(f"=" * 60)
    
    success = promote_user_to_admin(backend_url, username)
    
    if success:
        print(f"\n🎉 SUCCESS: User '{username}' is now an admin!")
        print(f"💡 You can now login as '{username}' and access admin features.")
    else:
        print(f"\n💥 FAILED: Could not promote user '{username}' to admin.")
        print(f"💡 Make sure the user exists and no other admins are present.")

if __name__ == "__main__":
    main()

