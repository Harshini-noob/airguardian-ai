from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.station import Station, Reading
from ml.predict import forecast_station

router = APIRouter()

@router.get("/api/forecast/{station_id}")
def get_forecast(station_id: int, db: Session = Depends(get_db)):
    # verify station exists
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    # get last 24 readings for this station
    recent = (
        db.query(Reading)
        .filter(Reading.station_id == station_id)
        .order_by(Reading.fetched_at.desc())
        .limit(24)
        .all()
    )

    if len(recent) < 24:
        raise HTTPException(
            status_code=400,
            detail=f"Need 24 readings, only have {len(recent)}"
        )

    # reverse to chronological order
    recent_aqi = [r.aqi for r in reversed(recent)]

    forecast = forecast_station(station_id, recent_aqi)

    return {
        "station_id":   station_id,
        "station_name": station.name,
        "area":         station.area,
        "forecast":     forecast,
        "generated_at": __import__('datetime').datetime.now(
                            __import__('datetime').timezone.utc
                        ).isoformat()
    }


@router.get("/api/forecast")
def get_all_forecasts(db: Session = Depends(get_db)):
    """Returns 24hr forecast summary for all stations — used by frontend map"""
    stations = db.query(Station).all()
    results  = []

    for station in stations:
        recent = (
            db.query(Reading)
            .filter(Reading.station_id == station.id)
            .order_by(Reading.fetched_at.desc())
            .limit(24)
            .all()
        )
        if len(recent) < 24:
            continue

        recent_aqi = [r.aqi for r in reversed(recent)]
        forecast   = forecast_station(station.id, recent_aqi)

        if forecast:
            # just return next 6 hours for map overview
            results.append({
                "station_id":   station.id,
                "station_name": station.name,
                "lat":          station.lat,
                "lon":          station.lon,
                "area":         station.area,
                "next_6hrs":    forecast[:6],
                "peak_aqi_24hr": max(f["aqi"] for f in forecast),
                "peak_category": max(forecast, key=lambda x: x["aqi"])["category"],
            })

    return results