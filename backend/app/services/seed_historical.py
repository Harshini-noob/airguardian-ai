import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

import random
import math
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.station import Station, Reading
from app.services.openaq_service import pm25_to_aqi, aqi_category

# 30 days back from now
DAYS = 30
READINGS_PER_DAY = 24  # one per hour

STATION_PROFILES = {
    "Manali Industrial Area":  {"base": 85,  "variance": 30},
    "Alandur":                 {"base": 55,  "variance": 20},
    "Velachery":               {"base": 60,  "variance": 22},
    "Kodungaiyur":             {"base": 90,  "variance": 35},
    "Perungudi":               {"base": 50,  "variance": 18},
    "T.Nagar":                 {"base": 65,  "variance": 25},
    "Anna Nagar":              {"base": 45,  "variance": 15},
    "Sholinganallur":          {"base": 35,  "variance": 12},
}

def get_pm25_for_hour(base: float, variance: float, hour: int, day_of_week: int) -> float:
    """
    Simulate realistic PM2.5 patterns:
    - Rush hour peaks at 8am and 6pm
    - Weekdays worse than weekends
    - Random noise on top
    """
    # time of day pattern — sinusoidal with two peaks
    morning_peak = math.exp(-0.5 * ((hour - 8) / 2) ** 2)   # peak at 8am
    evening_peak = math.exp(-0.5 * ((hour - 18) / 2) ** 2)  # peak at 6pm
    time_factor  = 1 + 0.4 * (morning_peak + evening_peak)

    # weekday vs weekend
    weekend_factor = 0.8 if day_of_week >= 5 else 1.0

    # random noise
    noise = random.gauss(0, variance * 0.3)

    pm25 = base * time_factor * weekend_factor + noise
    return round(max(5.0, pm25), 1)  # never below 5


def seed():
    db = SessionLocal()
    try:
        stations = db.query(Station).all()
        if not stations:
            print("No stations found! Run the server first to populate stations.")
            return

        now = datetime.now(timezone.utc)
        total_inserted = 0

        for station in stations:
            profile = STATION_PROFILES.get(station.name, {"base": 60, "variance": 20})
            base     = profile["base"]
            variance = profile["variance"]

            readings_to_insert = []
            for day_offset in range(DAYS, 0, -1):
                for hour in range(READINGS_PER_DAY):
                    timestamp = now - timedelta(days=day_offset) + timedelta(hours=hour)
                    day_of_week = timestamp.weekday()

                    pm25 = get_pm25_for_hour(base, variance, hour, day_of_week)
                    aqi  = pm25_to_aqi(pm25)

                    readings_to_insert.append(Reading(
                        station_id = station.id,
                        pm25       = pm25,
                        aqi        = aqi,
                        category   = aqi_category(aqi),
                        fetched_at = timestamp,
                    ))

            db.bulk_save_objects(readings_to_insert)
            db.commit()
            total_inserted += len(readings_to_insert)
            print(f"✓ {station.name}: {len(readings_to_insert)} readings inserted")

        print(f"\nTotal inserted: {total_inserted} readings")
        print(f"Per station: {DAYS * READINGS_PER_DAY} readings (30 days × 24 hours)")

    finally:
        db.close()


if __name__ == "__main__":
    seed()