from fastapi import FastAPI, Depends
from typing import Annotated
from . import models
from .database import engine
from .routers import auth

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)

user_dependency = Annotated[dict, Depends(auth.get_current_user)]


@app.get("/")
async def read_root(user: user_dependency):
    return {"message": f"Hello {user['username']}"}
