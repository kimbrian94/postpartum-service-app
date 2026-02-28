import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password


def check_password(email: str, password: str):
    """Check if password matches for a user."""
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User with email {email} not found!")
            return
        
        if verify_password(password, user.hashed_password):
            print("✅ Password is correct!")
        else:
            print("❌ Password is incorrect!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    email = input("Enter email: ").strip()
    password = input("Enter password to verify: ").strip()
    
    check_password(email, password)