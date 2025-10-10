from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..models import User
from passlib.context import CryptContext
from ..database import SessionLocal
from typing import Annotated
from sqlalchemy.orm import Session
from starlette import status


router = APIRouter()
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class createUserRequest(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str
    is_admin: bool = False
    is_superuser: bool = False


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


# Register a New User
@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register_user(db: db_dependency, create_user_request: createUserRequest):
    create_user_model = User(
        email=create_user_request.email,
        username=create_user_request.username,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        hashed_password=bcrypt_context.hash(create_user_request.password),
        is_admin=create_user_request.is_admin,
        is_superuser=create_user_request.is_superuser,
    )

    db.add(create_user_model)
    db.commit()

    return create_user_model


# Login a User

# Logout a User

# Refresh Token

# Forgot Password

# Reset Password

# Verify Email

# Provider Login (OAuth2)

# Provider Callback (OAuth2)
