from deps import get_current_user
from fastapi import APIRouter, Depends
from models import User

router = APIRouter(prefix="/pantry", tags=["pantry"])
