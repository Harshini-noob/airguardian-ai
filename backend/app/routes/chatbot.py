from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database import get_db
from app.models.station import Station, Reading
from app.services.attribution import get_all_attributions
from app.services.rag_chatbot import chat

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

@router.post("/api/chat")
def chatbot(request: ChatRequest, db: Session = Depends(get_db)):
    # get latest station data
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

    stations_data = [
        {
            "name":     s.name,
            "area":     s.area,
            "aqi":      r.aqi,
            "category": r.category,
            "lat":      s.lat,      # ← add
            "lon":      s.lon,
        }
        for s, r in results
    ]

    attribution_data = get_all_attributions(stations_data)

    result = chat(
        user_message         = request.message,
        stations_data        = stations_data,
        attribution_data     = attribution_data,
        conversation_history = request.history,
    )

    return result