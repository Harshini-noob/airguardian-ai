from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.routes.stations import router
from app.routes.forecast import router as forecast_router
from app.routes.attribution import router as attribution_router
from app.routes.chatbot import router as chatbot_router
from app.database import SessionLocal
from app.services.openaq_service import (
    fetch_all_chennai_stations,
    save_readings_to_db
)
from app.routes.enforcement import router as enforcement_router
from app.routes.advisory import router as advisory_router
from app.routes.compare import router as compare_router

app = FastAPI(title="AeroSense — Air Quality API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(forecast_router)
app.include_router(attribution_router)
app.include_router(chatbot_router)
app.include_router(enforcement_router)
app.include_router(advisory_router)
app.include_router(compare_router)

scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def startup():
    async def refresh():
        db = SessionLocal()
        try:
            stations = await fetch_all_chennai_stations()
            save_readings_to_db(db, stations)
        finally:
            db.close()

    scheduler.add_job(refresh, "interval", minutes=15, id="refresh_stations")
    scheduler.start()


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
