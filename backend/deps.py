from database import get_db
from fastapi import Depends, HTTPException
from models import User
from sqlalchemy.orm import Session


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Dev stub: always authenticate as Alice."""
    user = db.query(User).filter_by(email="alice@example.com").first()
    if not user:
        raise HTTPException(status_code=401, detail="Seed the database first (python seed.py)")
    return user
