"""
Create an initial admin user for the system.

Usage:
    python scripts/create_admin.py
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


def create_admin_user(email: str, password: str, full_name: str = None):
    """Create an admin user."""
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return
        
        # Create admin user
        admin = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_active=True,
            role="admin"
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("=" * 60)
        print("✅ Admin user created successfully!")
        print("=" * 60)
        print(f"Email:     {admin.email}")
        print(f"Name:      {admin.full_name}")
        print(f"Role:      {admin.role}")
        print(f"Active:    {admin.is_active}")
        print(f"ID:        {admin.id}")
        print("=" * 60)
        print("\n🔐 You can now login with these credentials.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin user: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Create Admin User")
    print("=" * 60)
    
    email = input("Enter email: ").strip()
    password = input("Enter password: ").strip()
    full_name = input("Enter full name (optional): ").strip() or None
    
    if not email or not password:
        print("❌ Email and password are required!")
    else:
        create_admin_user(email, password, full_name)
