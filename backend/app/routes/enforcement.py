from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.station import Station, Reading
from app.services.attribution import get_all_attributions, get_enforcement_priorities

router = APIRouter()

@router.get("/api/enforcement")
def get_enforcement_dashboard(db: Session = Depends(get_db)):
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

    attribution_data = get_all_attributions(stations)
    priorities        = get_enforcement_priorities(attribution_data)

    return {
        "total_stations":      len(priorities),
        "critical_count":      len([p for p in priorities if p["severity"] in ("high", "severe")]),
        "priorities":          priorities,
        "generated_at":        __import__('datetime').datetime.now(
                                    __import__('datetime').timezone.utc
                                ).isoformat()
    }