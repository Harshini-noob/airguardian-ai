import random
from datetime import datetime

SOURCE_PROFILES = {
    "North Chennai": {
        "Industrial":    0.55,
        "Traffic":       0.25,
        "Construction":  0.12,
        "Dust/Natural":  0.08,
    },
    "South Chennai": {
        "Traffic":       0.45,
        "Construction":  0.28,
        "Industrial":    0.15,
        "Dust/Natural":  0.12,
    },
    "Central Chennai": {
        "Traffic":       0.60,
        "Industrial":    0.18,
        "Construction":  0.14,
        "Dust/Natural":  0.08,
    },
    "West Chennai": {
        "Traffic":       0.48,
        "Construction":  0.30,
        "Industrial":    0.12,
        "Dust/Natural":  0.10,
    },
    "IT Corridor": {
        "Traffic":       0.50,
        "Construction":  0.35,
        "Industrial":    0.08,
        "Dust/Natural":  0.07,
    },
}

ENFORCEMENT_ACTIONS = {
    "Industrial": [
        "Deploy inspectors to industrial stacks in {area}",
        "Check emission permits for factories in {area}",
        "Verify scrubber operation at manufacturing units in {area}",
    ],
    "Traffic": [
        "Implement odd-even vehicle restriction in {area}",
        "Deploy traffic police to reduce idling at signals in {area}",
        "Check PUC compliance for commercial vehicles in {area}",
    ],
    "Construction": [
        "Inspect construction sites for dust suppression in {area}",
        "Issue stop-work notice to non-compliant sites in {area}",
        "Verify water sprinkler usage at active construction in {area}",
    ],
    "Dust/Natural": [
        "Deploy water tankers for road spraying in {area}",
        "Increase sweeping frequency on main roads in {area}",
    ],
}


def get_attribution(area: str, aqi: float, hour: int = None) -> dict:
    """
    Returns pollution source breakdown for a given area and AQI.
    Adjusts weights based on time of day.
    """
    if hour is None:
        hour = datetime.now().hour

    base = SOURCE_PROFILES.get(area, SOURCE_PROFILES["Central Chennai"]).copy()

    # time-of-day adjustment
    if 7 <= hour <= 10 or 17 <= hour <= 20:
        # rush hour — boost traffic contribution
        base["Traffic"] = min(base["Traffic"] * 1.3, 0.75)
    elif 22 <= hour or hour <= 5:
        # night — boost industrial (factories run at night)
        if "Industrial" in base:
            base["Industrial"] = min(base["Industrial"] * 1.4, 0.80)

    # normalise to sum to 1.0
    total = sum(base.values())
    base  = {k: round(v / total, 3) for k, v in base.items()}

    # sort by contribution descending
    sorted_sources = sorted(base.items(), key=lambda x: x[1], reverse=True)
    primary_source = sorted_sources[0][0]

    # generate enforcement action
    actions = ENFORCEMENT_ACTIONS.get(primary_source, [])
    action  = random.choice(actions).format(area=area) if actions else ""

    # severity label
    if aqi <= 100:
        severity = "low"
    elif aqi <= 200:
        severity = "moderate"
    elif aqi <= 300:
        severity = "high"
    else:
        severity = "severe"

    return {
        "area":           area,
        "aqi":            aqi,
        "severity":       severity,
        "sources":        dict(sorted_sources),
        "primary_source": primary_source,
        "primary_pct":    round(sorted_sources[0][1] * 100),
        "enforcement":    action,
        "hour":           hour,
    }


def get_all_attributions(stations: list[dict]) -> list[dict]:
    """Takes station list from /api/stations and returns attribution for each"""
    results = []
    hour = datetime.now().hour
    for s in stations:
        attr = get_attribution(s["area"], s["aqi"], hour)
        results.append({
            "station_id":   s.get("id"),
            "name":         s["name"],
            "lat":          s["lat"],
            "lon":          s["lon"],
            "aqi":          s["aqi"],
            "category":     s["category"],
            **attr
        })
    return results