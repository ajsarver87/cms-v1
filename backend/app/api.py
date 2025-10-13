from fastapi import FastAPI, Depends
from typing import Annotated
from . import models
from .database import engine
from .routers import auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)

user_dependency = Annotated[dict, Depends(auth.get_current_user)]


@app.get("/")
async def read_root(user: user_dependency):
    return {"message": f"Hello {user['username']}"}
