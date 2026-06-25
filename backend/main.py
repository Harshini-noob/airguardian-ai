from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.routes.stations import router
from app.database import SessionLocal
from app.services.openaq_service import (
    fetch_all_chennai_stations,
    save_readings_to_db
)
from app.routes.forecast import router as forecast_router

app = FastAPI(title="Vayu - Air Quality API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(forecast_router)    

scheduler = AsyncIOScheduler()

async def poll_and_save():
    readings = await fetch_all_chennai_stations()
    db = SessionLocal()
    try:
        save_readings_to_db(db, readings)
    finally:
        db.close()

@app.on_event("startup")
async def startup():
    await poll_and_save()
    scheduler.add_job(poll_and_save, "interval", minutes=15)
    scheduler.start()

@app.get("/")
def root():
    return {"status": "Vayu API running"}