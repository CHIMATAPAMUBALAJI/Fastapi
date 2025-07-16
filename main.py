from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from wellcome.database import engine
from wellcome.routers import employees
from wellcome import models

app = FastAPI()


origins = [
    "http://localhost:3001",   
    "http://127.0.0.1:3001"   
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



models.Base.metadata.create_all(bind=engine)


app.include_router(employees.router)


@app.get("/")
def root():
    return {"message": "FastAPI backend for ELEVEN is running"}
