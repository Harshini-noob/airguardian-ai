from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.station import Station, Reading
from app.services.attribution import get_attribution, get_all_attributions

router = APIRouter()

@router.get("/api/attribution")
def get_attribution_all(db: Session = Depends(get_db)):
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

    stations = [
        {
            "id":       s.id,
            "name":     s.name,
            "lat":      s.lat,
            "lon":      s.lon,
            "area":     s.area,
            "aqi":      r.aqi,
            "category": r.category,
        }
        for s, r in results
    ]

    return get_all_attributions(stations)


@router.get("/api/attribution/{station_id}")
def get_attribution_single(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    latest  = (
        db.query(Reading)
        .filter(Reading.station_id == station_id)
        .order_by(Reading.fetched_at.desc())
        .first()
    )
    if not station or not latest:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Station not found")

    return get_attribution(station.area, latest.aqi)