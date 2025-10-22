from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from pydantic import BaseModel
from ..models import User
from pwdlib import PasswordHash
from ..database import SessionLocal
from typing import Annotated
from sqlalchemy.orm import Session
from starlette import status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, datetime, timezone
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
SPECIAL_CHARACTERS = os.getenv("SPECIAL_CHARACTERS", "!@#$%^&*")


# Validate Critical configuration Values
if not SECRET_KEY:
    raise RuntimeError("Missing required environment variable: SECRET_KEY")

if ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
    raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer")

password_hash = PasswordHash.recommended()
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/token")


class createUserRequest(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str
    is_admin: bool = False
    is_superuser: bool = False


class LoginResponse(BaseModel):
    message: str


class RefreshResponse(BaseModel):
    message: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password):
    return password_hash.hash(password)


def validate_password_strength(password: str) -> bool:
    """Validate the strength of the password.
    A strong password should be at least 8 characters long and include
    at least one uppercase letter, one lowercase letter, one digit, and one special character.
    """
    if len(password) < 8:
        return False
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in SPECIAL_CHARACTERS for c in password)
    return has_upper and has_lower and has_digit and has_special


def authenticate_user(username: str, password: str, db: db_dependency):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(username: str, userid: int, expires_delta: timedelta):
    encode = {"sub": username, "id": userid}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({"exp": expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(username: str, userid: int, expires_delta: timedelta):
    encode = {"sub": username, "id": userid}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({"exp": expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authentication Token",
            )
        return {"username": username, "id": user_id}
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authentication Token",
        )


# Register a New User
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(db: db_dependency, create_user_request: createUserRequest):
    if not validate_password_strength(create_user_request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character.",
        )

    create_user_model = User(
        email=create_user_request.email,
        username=create_user_request.username,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        hashed_password=get_password_hash(create_user_request.password),
        is_admin=create_user_request.is_admin,
        is_superuser=create_user_request.is_superuser,
    )

    db.add(create_user_model)
    db.commit()

    return {"username": create_user_model.username}


# Login a User
@router.post("/token", response_model=LoginResponse)
async def login_for_access_token(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: db_dependency,
):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = create_access_token(
        user.username, user.id, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(
        user.username, user.id, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="strict",
        secure=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=f"Bearer {refresh_token}",
        httponly=True,
        samesite="strict",
        secure=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth/refresh",
    )

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Login successful"}


# Logout a User
@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout_user(response: Response):
    response.delete_cookie(
        key="access_token", httponly=True, samesite="strict", secure=True
    )
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="strict",
        secure=True,
        path="/auth/refresh",
    )
    return {"message": "Logout successful"}


# Refresh Token
@router.post("/refresh", response_model=RefreshResponse)
async def refresh_access_token(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(username, user_id, access_token_expires)
        response.set_cookie(
            key="access_token",
            value=f"Bearer {new_access_token}",
            httponly=True,
            samesite="strict",
            secure=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )
        return {"message": "Access token refreshed successfully"}

    except jwt.ExpiredSignatureError:
        response.delete_cookie(
            key="refresh_token",
            httponly=True,
            samesite="strict",
            secure=True,
            path="/auth/refresh",
        )
        response.delete_cookie(
            key="access_token", httponly=True, samesite="strict", secure=True, path="/"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired, please log in again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        response.delete_cookie(
            key="refresh_token",
            httponly=True,
            samesite="strict",
            secure=True,
            path="/auth/refresh",
        )
        response.delete_cookie(
            key="access_token", httponly=True, samesite="strict", secure=True, path="/"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Forgot Password

# Reset Password

# Verify Email

# Provider Login (OAuth2)
# Provider Callback (OAuth2)
