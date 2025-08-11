#!/usr/bin/env python3
"""
Force database migration via direct API call
"""

import requests
import os
import time

def force_migration():
    """Force migration via API call."""
    backend_url = "https://social-media-post-generator-backend.onrender.com"
    
    print("🚀 Forcing database migration via API...")
    
    # Try multiple endpoints
    endpoints = [
        "/api/migration/run",
        "/api/migration/status",
        "/api/debug-admin-safe/migration-status"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"🔍 Trying endpoint: {endpoint}")
            
            if "run" in endpoint:
                # POST request for migration
                response = requests.post(
                    f"{backend_url}{endpoint}",
                    headers={
                        "Content-Type": "application/json",
                        "X-Migration-Key": "dev-migration-key"
                    },
                    timeout=30
                )
            else:
                # GET request for status
                response = requests.get(
                    f"{backend_url}{endpoint}",
                    headers={"Content-Type": "application/json"},
                    timeout=30
                )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Response: {data}")
                
                if "run" in endpoint and data.get('success'):
                    print("🎉 Migration completed successfully!")
                    return True
                elif "status" in endpoint:
                    print(f"📋 Migration status: {data}")
                    if not data.get('migration_needed', True):
                        print("✅ Migration not needed - already completed!")
                        return True
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed for {endpoint}: {e}")
        except Exception as e:
            print(f"❌ Unexpected error for {endpoint}: {e}")
    
    return False

def test_user_endpoints():
    """Test if user endpoints work after migration."""
    backend_url = "https://social-media-post-generator-backend.onrender.com"
    
    endpoints = [
        "/api/debug-admin/debug-users",
        "/api/debug-admin-safe/debug-users"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"🔍 Testing endpoint: {endpoint}")
            
            response = requests.get(
                f"{backend_url}{endpoint}",
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success: {len(data.get('users', []))} users found")
                return True
            else:
                print(f"❌ Error: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {e}")
    
    return False

def main():
    """Main function."""
    print("🚀 Starting forced database migration...")
    
    # Wait for backend to be ready
    print("⏳ Waiting for backend to be ready...")
    time.sleep(10)
    
    # Try to force migration
    migration_success = force_migration()
    
    if migration_success:
        print("✅ Migration completed successfully!")
        
        # Test endpoints
        print("🔍 Testing user endpoints...")
        time.sleep(5)
        
        if test_user_endpoints():
            print("🎉 All endpoints working correctly!")
        else:
            print("⚠️  Endpoints still not working - may need more time")
    else:
        print("❌ Migration failed or endpoints not available")
        print("💡 The backend may still be deploying...")

if __name__ == "__main__":
    main()

