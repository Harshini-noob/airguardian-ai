from fastapi import APIRouter
from app.services.openaq_service import get_stations

router = APIRouter()

@router.get("/stations")
def stations():
    return get_stations()