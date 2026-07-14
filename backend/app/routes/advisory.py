import os
import json
import time
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.station import Station, Reading

router = APIRouter()

# In-memory cache: key -> {data, ts}
_cache: dict = {}
CACHE_TTL = 1800  # 30 minutes


def _groq_advisory(station_name: str, area: str, aqi: float, pm25: float, lang: str) -> dict:
    try:
        from groq import Groq
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    except Exception:
        raise RuntimeError("Groq client unavailable")

    clean_name = station_name.replace(", Chennai - CPCB", "").replace(", Chennai - TNPCB", "")
    lang_label = "Tamil" if lang == "ta" else "English"

    prompt = (
        f"Generate a public health advisory in {lang_label} for residents near "
        f"{clean_name} ({area}), Chennai.\n\n"
        f"Current AQI: {round(aqi)} | PM2.5: {pm25:.1f} µg/m³\n\n"
        "Write 2-3 sentences that: (1) state the air quality level simply, "
        "(2) give practical advice for residents, (3) name the most vulnerable groups.\n\n"
        + ("Write ONLY in Tamil script. Do not include any English.\n\n" if lang == "ta" else "Write in clear, simple English.\n\n")
        + 'Return ONLY valid JSON: {"advisory": "...", "risk_level": "low|moderate|high|severe", '
        '"vulnerable_groups": ["..."]}'
    )

    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": f"You generate health advisories in {lang_label}. Return only valid JSON."},
            {"role": "user",   "content": prompt},
        ],
        max_tokens=350,
        temperature=0.4,
    )
    return json.loads(resp.choices[0].message.content.strip())


def _risk_level(aqi: float) -> str:
    if aqi <= 100: return "low"
    if aqi <= 200: return "moderate"
    if aqi <= 300: return "high"
    return "severe"


@router.get("/api/advisory/{station_id}")
def get_advisory(
    station_id: int,
    lang: str = Query("en", regex="^(en|ta)$"),
    db: Session = Depends(get_db),
):
    cache_key = f"{station_id}_{lang}"
    cached = _cache.get(cache_key)
    if cached and time.time() - cached["ts"] < CACHE_TTL:
        return cached["data"]

    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    latest = (
        db.query(Reading)
        .filter(Reading.station_id == station_id)
        .order_by(Reading.fetched_at.desc())
        .first()
    )
    aqi  = latest.aqi  if latest else 100.0
    pm25 = latest.pm25 if latest else 50.0
    clean = station.name.replace(", Chennai - CPCB", "").replace(", Chennai - TNPCB", "")

    try:
        parsed = _groq_advisory(station.name, station.area, aqi, pm25, lang)
        result = {
            "station_id":       station_id,
            "station_name":     clean,
            "language":         lang,
            "aqi":              round(aqi),
            "advisory":         parsed.get("advisory", ""),
            "risk_level":       parsed.get("risk_level", _risk_level(aqi)),
            "vulnerable_groups": parsed.get("vulnerable_groups", ["elderly", "children"]),
        }
    except Exception:
        if lang == "ta":
            text = (
                f"இந்த பகுதியில் தற்போது காற்று மாசு அளவு AQI {round(aqi)} ஆக உள்ளது. "
                "முதியோர்களும் குழந்தைகளும் வெளியில் செல்வதை தவிர்க்கவும். "
                "அவசியமெனில் N95 முகமூடி அணியவும்."
            )
        else:
            text = (
                f"Air quality near {clean} is currently at AQI {round(aqi)}. "
                "Sensitive groups including the elderly, children, and those with respiratory conditions "
                "should limit outdoor activity. Wear a mask if going outside."
            )
        result = {
            "station_id":       station_id,
            "station_name":     clean,
            "language":         lang,
            "aqi":              round(aqi),
            "advisory":         text,
            "risk_level":       _risk_level(aqi),
            "vulnerable_groups": ["elderly", "children", "outdoor workers", "asthma patients"],
        }

    _cache[cache_key] = {"data": result, "ts": time.time()}
    return result
