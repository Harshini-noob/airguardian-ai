import httpx
import logging
import os
import asyncio
import json
import random
from datetime import datetime
from dotenv import load_dotenv
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.station import Station, Reading

load_dotenv()

logger = logging.getLogger(__name__)

API_KEY = os.getenv("OPENAQ_API_KEY")
HEADERS = {"X-API-Key": API_KEY}
OPENAQ_BASE = "https://api.openaq.org/v3"

CHENNAI_STATIONS_MOCK = [
    {"openaq_id": 1001, "name": "Manali Industrial Area",
     "lat": 13.3411, "lon": 80.2674, "area": "North Chennai"},
    {"openaq_id": 1002, "name": "Alandur",
     "lat": 13.0012, "lon": 80.2036, "area": "South Chennai"},
    {"openaq_id": 1003, "name": "Velachery",
     "lat": 12.9815, "lon": 80.2180, "area": "South Chennai"},
    {"openaq_id": 1004, "name": "Kodungaiyur",
     "lat": 13.1336, "lon": 80.2534, "area": "North Chennai"},
    {"openaq_id": 1005, "name": "Perungudi",
     "lat": 12.9674, "lon": 80.2376, "area": "South Chennai"},
    {"openaq_id": 1006, "name": "T.Nagar",
     "lat": 13.0418, "lon": 80.2341, "area": "Central Chennai"},
    {"openaq_id": 1007, "name": "Anna Nagar",
     "lat": 13.0891, "lon": 80.2098, "area": "West Chennai"},
    {"openaq_id": 1008, "name": "Sholinganallur",
     "lat": 12.9010, "lon": 80.2279, "area": "IT Corridor"},
]


def pm25_to_aqi(pm25: float) -> float:
    breakpoints = [
        (0,   30,   0,   50),
        (30,  60,   51,  100),
        (60,  90,   101, 200),
        (90,  120,  201, 300),
        (120, 250,  301, 400),
        (250, 500,  401, 500),
    ]
    for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
        if bp_lo <= pm25 <= bp_hi:
            return round(
                ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (pm25 - bp_lo) + aqi_lo,
                1
            )
    return 500.0


def aqi_category(aqi: float) -> str:
    if aqi <= 50:  return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"


def get_realistic_pm25(area: str) -> float:
    base_ranges = {
        "North Chennai":   (45, 120),
        "South Chennai":   (25, 75),
        "Central Chennai": (30, 90),
        "West Chennai":    (20, 60),
        "IT Corridor":     (15, 50),
    }
    lo, hi = base_ranges.get(area, (20, 80))
    hour = datetime.now().hour
    if 7 <= hour <= 10 or 17 <= hour <= 20:
        lo += 15
        hi += 25
    return round(random.uniform(lo, hi), 1)


async def fetch_all_chennai_stations() -> list[dict]:
    results = []
    for station in CHENNAI_STATIONS_MOCK:
        pm25 = get_realistic_pm25(station["area"])
        aqi  = pm25_to_aqi(pm25)
        results.append({
            "openaq_id":  station["openaq_id"],
            "name":       station["name"],
            "lat":        station["lat"],
            "lon":        station["lon"],
            "area":       station["area"],
            "pm25":       pm25,
            "aqi":        aqi,
            "category":   aqi_category(aqi),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        })
    return results


def save_readings_to_db(db: Session, readings: list[dict]):
    for r in readings:
        # upsert station — insert if not exists
        station = db.query(Station).filter_by(openaq_id=r["openaq_id"]).first()
        if not station:
            station = Station(
                openaq_id = r["openaq_id"],
                name      = r["name"],
                lat       = r["lat"],
                lon       = r["lon"],
                area      = r["area"],
            )
            db.add(station)
            db.flush()  # get station.id without full commit

        # always insert a new reading
        reading = Reading(
            station_id = station.id,
            pm25       = r["pm25"],
            aqi        = r["aqi"],
            category   = r["category"],
            fetched_at = datetime.fromisoformat(r["fetched_at"]),
        )
        db.add(reading)

    db.commit()
    logger.info(f"Saved {len(readings)} readings to DB")

if __name__ == "__main__":
    data = asyncio.run(fetch_all_chennai_stations())
    print(json.dumps(data, indent=2))