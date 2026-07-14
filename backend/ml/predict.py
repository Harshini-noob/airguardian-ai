import os
import pickle
import numpy as np
import torch
from datetime import datetime, timezone, timedelta
from ml.lstm_model import AQIForecastLSTM
from app.services.openaq_service import aqi_category

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

def load_model_and_scaler(station_id: int):
    model_path  = os.path.join(MODEL_DIR, f"station_{station_id}_model.pt")
    scaler_path = os.path.join(MODEL_DIR, f"station_{station_id}_scaler.pkl")

    if not os.path.exists(model_path):
        return None, None

    model = AQIForecastLSTM()
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()

    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)

    return model, scaler


def forecast_station(station_id: int, recent_aqi: list[float]) -> list[dict]:
    """
    Takes last 24 AQI readings, returns 24 hour forecast.
    recent_aqi: list of 24 floats in chronological order
    """
    model, scaler = load_model_and_scaler(station_id)
    if model is None:
        return []

    # scale input
    arr    = np.array(recent_aqi, dtype=np.float32).reshape(-1, 1)
    scaled = scaler.transform(arr).flatten()

    # prepare tensor
    x = torch.FloatTensor(scaled).unsqueeze(0).unsqueeze(-1)  # (1, 24, 1)

    with torch.no_grad():
        pred_scaled = model(x).numpy().flatten()  # (24,)

    # inverse scale
    pred_aqi = scaler.inverse_transform(
        pred_scaled.reshape(-1, 1)
    ).flatten()

    # clip to valid AQI range
    pred_aqi = np.clip(pred_aqi, 0, 500)

    # build response with timestamps
    now = datetime.now(timezone.utc)
    forecast = []
    for i, aqi_val in enumerate(pred_aqi):
        aqi_rounded = round(float(aqi_val), 1)
        forecast.append({
            "hour":      i + 1,
            "timestamp": (now + timedelta(hours=i+1)).isoformat(),
            "aqi":       aqi_rounded,
            "category":  aqi_category(aqi_rounded),
        })

    return forecast