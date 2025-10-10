from fastapi import FastAPI
from . import models
from .database import engine
from .routers import auth

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)


@app.get("/")
async def read_root():
    return {"message": "Hello World"}
