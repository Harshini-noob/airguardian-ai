from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.station import Station, Reading

router = APIRouter()


@router.get("/api/compare")
def compare_stations(
    ids: str = Query(..., description="Comma-separated station IDs, e.g. 1,2,3"),
    db: Session = Depends(get_db),
):
    try:
        station_ids = [int(i.strip()) for i in ids.split(",") if i.strip().isdigit()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid station IDs")

    if not station_ids:
        raise HTTPException(status_code=400, detail="No valid station IDs provided")

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    result = []

    for sid in station_ids[:5]:  # max 5 stations
        station = db.query(Station).filter(Station.id == sid).first()
        if not station:
            continue

        readings = (
            db.query(Reading)
            .filter(Reading.station_id == sid, Reading.fetched_at >= cutoff)
            .order_by(Reading.fetched_at.asc())
            .all()
        )

        result.append({
            "station_id":   station.id,
            "station_name": (
                station.name
                .replace(", Chennai - CPCB", "")
                .replace(", Chennai - TNPCB", "")
            ),
            "area":         station.area,
            "readings": [
                {
                    "hour":     r.fetched_at.strftime("%H:%M"),
                    "aqi":      round(r.aqi),
                    "category": r.category,
                }
                for r in readings
            ],
            "avg_aqi": (
                round(sum(r.aqi for r in readings) / len(readings))
                if readings else 0
            ),
            "peak_aqi": max((round(r.aqi) for r in readings), default=0),
        })

    return result
