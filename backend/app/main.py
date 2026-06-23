from fastapi import FastAPI
from app.routes.stations import router

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AirGuardian Backend Running"}

app.include_router(router,prefix="/api")