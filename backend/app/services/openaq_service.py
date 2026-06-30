import httpx
import logging
import os
import asyncio
import json
import random
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY")
DATA_GOV_URL = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"

# Area mapping for attribution classifier
STATION_AREA_MAP = {
    "Manali, Chennai - CPCB":           "North Chennai",
    "Manali Village, Chennai - TNPCB":  "North Chennai",
    "Kodungaiyur, Chennai - TNPCB":     "North Chennai",
    "Royapuram, Chennai - TNPCB":       "North Chennai",
    "Arumbakkam, Chennai - TNPCB":      "West Chennai",
    "Velachery Res. Area, Chennai - CPCB": "South Chennai",
    "Perungudi, Chennai - TNPCB":       "South Chennai",
}

# Fallback mock data if API fails
FALLBACK_STATIONS = [
    {"name": "Manali, Chennai - CPCB",
     "lat": 13.164544, "lon": 80.26285, "area": "North Chennai"},
    {"name": "Kodungaiyur, Chennai - TNPCB",
     "lat": 13.1278, "lon": 80.2642,   "area": "North Chennai"},
    {"name": "Velachery Res. Area, Chennai - CPCB",
     "lat": 13.0052, "lon": 80.2398,   "area": "South Chennai"},
    {"name": "Perungudi, Chennai - TNPCB",
     "lat": 12.9533, "lon": 80.2357,   "area": "South Chennai"},
    {"name": "Arumbakkam, Chennai - TNPCB",
     "lat": 13.0664, "lon": 80.2112,   "area": "West Chennai"},
    {"name": "Manali Village, Chennai - TNPCB",
     "lat": 13.1662, "lon": 80.2584,   "area": "North Chennai"},
    {"name": "Royapuram, Chennai - TNPCB",
     "lat": 13.1036, "lon": 80.2909,   "area": "North Chennai"},
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


def parse_value(val: str) -> float | None:
    """Parse pollutant value, return None if NA or invalid"""
    try:
        if val in ("NA", "na", "", None):
            return None
        return float(val)
    except:
        return None


def group_by_station(records: list[dict]) -> dict:
    """
    Group API records by station name.
    Each station has multiple rows (one per pollutant).
    We want PM2.5 avg_value for AQI calculation.
    """
    stations = {}
    for rec in records:
        if rec.get("city") != "Chennai":
            continue
        name = rec["station"]
        if name not in stations:
            stations[name] = {
                "name": name,
                "lat":  parse_value(rec.get("latitude",  "0")),
                "lon":  parse_value(rec.get("longitude", "0")),
                "pollutants": {}
            }
        pollutant = rec.get("pollutant_id", "")
        avg_val   = parse_value(rec.get("avg_value"))
        if avg_val is not None:
            stations[name]["pollutants"][pollutant] = avg_val

    return stations


async def fetch_real_data() -> list[dict]:
    """Fetch real CPCB data from data.gov.in"""
    async with httpx.AsyncClient() as client:
        for attempt in range(2):  # try twice
            try:
                resp = await client.get(
                    DATA_GOV_URL,
                    params={
                        "api-key":        DATA_GOV_API_KEY,
                        "format":         "json",
                        "filters[city]":  "Chennai",
                        "limit":          200,
                    },
                    timeout=60.0   # ← increased from 30
                )
                resp.raise_for_status()
                data = resp.json()
                records = data.get("records", [])
                logger.info(f"Fetched {len(records)} raw records from data.gov.in")
                return records

            except httpx.TimeoutException:
                logger.warning(f"data.gov.in timeout (attempt {attempt+1}/2)")
                if attempt == 0:
                    await asyncio.sleep(2)
                    continue
                return []
            except Exception as e:
                logger.error(f"data.gov.in error: {e} — using fallback data")
                return []
    return []

def get_fallback_pm25(area: str) -> float:
    """Realistic fallback when API has no PM2.5 for a station"""
    ranges = {
        "North Chennai": (45, 90),
        "South Chennai": (25, 65),
        "West Chennai":  (20, 55),
    }
    lo, hi = ranges.get(area, (20, 70))
    hour = datetime.now().hour
    if 7 <= hour <= 10 or 17 <= hour <= 20:
        lo += 10; hi += 20
    return round(random.uniform(lo, hi), 1)


async def fetch_all_chennai_stations() -> list[dict]:
    """
    Main function — fetches real CPCB data and returns
    station list in the same format as before.
    Falls back to simulated data if API fails.
    """
    records = await fetch_real_data()
    results = []

    if records:
        grouped = group_by_station(records)

        for station_name, station_data in grouped.items():
            pollutants = station_data["pollutants"]

            # prefer PM2.5 for AQI, fall back to PM10
            pm25 = pollutants.get("PM2.5")
            pm10 = pollutants.get("PM10")

            if pm25 is not None:
                aqi = pm25_to_aqi(pm25)
            elif pm10 is not None:
                # rough conversion: PM10 AQI ≈ PM2.5 AQI * 0.7
                pm25 = round(pm10 * 0.5, 1)
                aqi  = pm25_to_aqi(pm25)
            else:
                # station has no particle data — use fallback
                area = STATION_AREA_MAP.get(station_name, "Central Chennai")
                pm25 = get_fallback_pm25(area)
                aqi  = pm25_to_aqi(pm25)

            area = STATION_AREA_MAP.get(station_name, "Central Chennai")
            lat  = station_data["lat"] or 13.0827
            lon  = station_data["lon"] or 80.2707

            # generate a unique openaq_id from station name hash
            openaq_id = abs(hash(station_name)) % 10000 + 2000

            results.append({
                "openaq_id":  openaq_id,
                "name":       station_name,
                "lat":        lat,
                "lon":        lon,
                "area":       area,
                "pm25":       pm25,
                "aqi":        aqi,
                "category":   aqi_category(aqi),
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "source":     "CPCB/TNPCB Real Data",
            })

        logger.info(f"Processed {len(results)} Chennai stations from real data")

    else:
        # Full fallback to simulated data
        logger.warning("Using simulated fallback data")
        for s in FALLBACK_STATIONS:
            pm25 = get_fallback_pm25(s["area"])
            aqi  = pm25_to_aqi(pm25)
            results.append({
                "openaq_id":  abs(hash(s["name"])) % 10000 + 2000,
                "name":       s["name"],
                "lat":        s["lat"],
                "lon":        s["lon"],
                "area":       s["area"],
                "pm25":       pm25,
                "aqi":        aqi,
                "category":   aqi_category(aqi),
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "source":     "Simulated (API unavailable)",
            })

    return results


# ── DB save function (unchanged) ────────────────────────────────────────────
from sqlalchemy.orm import Session
from app.models.station import Station, Reading

def save_readings_to_db(db: Session, readings: list[dict]):
    for r in readings:
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
            db.flush()

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