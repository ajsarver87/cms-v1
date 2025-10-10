from .database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime
import datetime as dt


## create the tables here, need to figure out starting data models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    username = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=dt.datetime.now(dt.UTC))
    updated_at = Column(
        DateTime,
        default=dt.datetime.now(dt.UTC),
        onupdate=dt.datetime.now(dt.UTC),
    )
    last_login = Column(DateTime, default=None, nullable=True)
