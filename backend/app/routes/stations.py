from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.station import Station, Reading

router = APIRouter()

@router.get("/api/stations")
def get_stations(db: Session = Depends(get_db)):
    # get latest reading per station
    latest_ids = (
        db.query(func.max(Reading.id))
        .group_by(Reading.station_id)
        .all()
    )
    latest_ids = [row[0] for row in latest_ids]

    results = (
        db.query(Station, Reading)
        .join(Reading, Reading.station_id == Station.id)
        .filter(Reading.id.in_(latest_ids))
        .all()
    )

    return [
        {   "id":        s.id,
            "openaq_id": s.openaq_id,
            "name":      s.name,
            "lat":       s.lat,
            "lon":       s.lon,
            "area":      s.area,
            "pm25":      r.pm25,
            "aqi":       r.aqi,
            "category":  r.category,
            "fetched_at": r.fetched_at.isoformat(),
        }
        for s, r in results
    ]