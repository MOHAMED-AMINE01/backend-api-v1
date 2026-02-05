from typing import Optional
from entities.user import User
from sqlalchemy.orm import Session
from helpers.utils import verify_pwd

def create_user(session:Session,user:User):
    # Fix: correct filter syntax
    filtred_user=session.query(User).filter(User.email == user.email).one_or_none()
    if filtred_user != None :
        return False
    session.add(user)
    try :
        session.commit()
        session.refresh(user)
        return True
    except Exception as e:
        session.rollback()   
        return False
def get_all_users(session:Session):
    return session.query(User).all()

def authenticate(session:Session,user:User):
    # Fetch user by email only
    filtred_user:User=session.query(User).filter(User.email==user.email).one_or_none()
    
    # Use verify_pwd to check the hashed password
    if filtred_user:
        try:
            if verify_pwd(filtred_user.password, user.password):
                return filtred_user
        except Exception:
            # Handle potential verification errors (e.g., malformed hash)
            return False
            
    return False