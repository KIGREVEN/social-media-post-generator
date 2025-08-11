#!/usr/bin/env python3
"""
Database Migration Script for Social Media Post Generator
Adds subscription field to users table
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError

# Ensure psycopg2-binary is available for PostgreSQL connections
try:
    import psycopg2
except ImportError:
    try:
        import psycopg
        # psycopg3 compatibility
        import psycopg as psycopg2
    except ImportError:
        print("❌ Neither psycopg2 nor psycopg is available. Installing psycopg2-binary...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2

def get_database_url():
    """Get database URL from environment variables."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        # Fallback to local SQLite for development
        database_url = 'sqlite:///social_media_generator.db'
    
    # Handle PostgreSQL URL format for SQLAlchemy 2.0+
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    return database_url

def check_table_exists(engine, table_name):
    """Check if a table exists."""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        return table_name in tables
    except Exception as e:
        print(f"Error checking table existence: {e}")
        return False

def check_column_exists(engine, table_name, column_name):
    """Check if a column exists in a table."""
    try:
        if not check_table_exists(engine, table_name):
            print(f"Table {table_name} does not exist")
            return False
            
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        return any(col['name'] == column_name for col in columns)
    except Exception as e:
        print(f"Error checking column existence: {e}")
        return False

def add_subscription_column(engine):
    """Add subscription column to users table."""
    try:
        # Check if users table exists
        if not check_table_exists(engine, 'users'):
            print("⚠️  Users table does not exist yet - will be created by Flask app")
            return True
        
        # Check if subscription column already exists
        if check_column_exists(engine, 'users', 'subscription'):
            print("✅ Subscription column already exists in users table")
            return True
        
        print("🔄 Adding subscription column to users table...")
        
        # Add subscription column with default value 'free'
        with engine.connect() as conn:
            # For PostgreSQL
            if 'postgresql' in str(engine.url):
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN subscription VARCHAR(20) DEFAULT 'free' NOT NULL
                """))
                conn.commit()
                print("✅ Added subscription column (PostgreSQL)")
            
            # For SQLite
            else:
                # SQLite doesn't support ALTER TABLE ADD COLUMN with DEFAULT and NOT NULL
                # We need to recreate the table
                conn.execute(text("""
                    CREATE TABLE users_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username VARCHAR(80) UNIQUE NOT NULL,
                        email VARCHAR(120) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        role VARCHAR(20) DEFAULT 'user' NOT NULL,
                        subscription VARCHAR(20) DEFAULT 'free' NOT NULL,
                        is_active BOOLEAN DEFAULT 1 NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                # Copy data from old table
                conn.execute(text("""
                    INSERT INTO users_new (id, username, email, password_hash, role, is_active, created_at, updated_at)
                    SELECT id, username, email, password_hash, role, is_active, created_at, updated_at
                    FROM users
                """))
                
                # Drop old table and rename new one
                conn.execute(text("DROP TABLE users"))
                conn.execute(text("ALTER TABLE users_new RENAME TO users"))
                conn.commit()
                print("✅ Added subscription column (SQLite)")
        
        return True
        
    except SQLAlchemyError as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def update_existing_users(engine):
    """Update existing users to have default subscription."""
    try:
        # Check if users table exists
        if not check_table_exists(engine, 'users'):
            print("⚠️  Users table does not exist - skipping user updates")
            return True
        
        print("🔄 Updating existing users with default subscription...")
        
        with engine.connect() as conn:
            # Update users without subscription to 'free'
            result = conn.execute(text("""
                UPDATE users 
                SET subscription = 'free' 
                WHERE subscription IS NULL OR subscription = ''
            """))
            conn.commit()
            
            updated_count = result.rowcount
            print(f"✅ Updated {updated_count} users with default subscription")
        
        return True
        
    except SQLAlchemyError as e:
        print(f"❌ Database error updating users: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error updating users: {e}")
        return False

def verify_migration(engine):
    """Verify that the migration was successful."""
    try:
        # Check if users table exists
        if not check_table_exists(engine, 'users'):
            print("⚠️  Users table does not exist - migration will run after table creation")
            return True
        
        print("🔍 Verifying migration...")
        
        with engine.connect() as conn:
            # Check if subscription column exists and has data
            result = conn.execute(text("""
                SELECT COUNT(*) as total_users,
                       COUNT(CASE WHEN subscription = 'free' THEN 1 END) as free_users,
                       COUNT(CASE WHEN subscription IS NOT NULL THEN 1 END) as users_with_subscription
                FROM users
            """))
            
            row = result.fetchone()
            total_users = row[0]
            free_users = row[1]
            users_with_subscription = row[2]
            
            print(f"📊 Migration verification:")
            print(f"   Total users: {total_users}")
            print(f"   Users with subscription: {users_with_subscription}")
            print(f"   Free subscription users: {free_users}")
            
            if total_users == 0:
                print("✅ No users yet - migration ready for when users are created")
                return True
            elif users_with_subscription == total_users:
                print("✅ Migration successful - all users have subscription field")
                return True
            else:
                print("❌ Migration incomplete - some users missing subscription")
                return False
        
    except SQLAlchemyError as e:
        print(f"❌ Database error during verification: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error during verification: {e}")
        return False

def main():
    """Main migration function."""
    print("🚀 Starting database migration for subscription field...")
    
    # Get database URL
    database_url = get_database_url()
    print(f"📍 Database URL: {database_url.split('@')[0]}@***")
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        
        # Run migration steps
        success = True
        
        # Step 1: Add subscription column
        if not add_subscription_column(engine):
            success = False
        
        # Step 2: Update existing users
        if success and not update_existing_users(engine):
            success = False
        
        # Step 3: Verify migration
        if success and not verify_migration(engine):
            success = False
        
        if success:
            print("🎉 Database migration completed successfully!")
            return 0
        else:
            print("💥 Database migration failed!")
            return 1
            
    except SQLAlchemyError as e:
        print(f"❌ Database connection error: {e}")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())

