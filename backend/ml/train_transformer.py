import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import pickle
import json
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.station import Station, Reading
from ml.transformer_model import AQIForecastTransformer

SEQ_LEN          = 24
FORECAST_HORIZON = 24
BATCH_SIZE       = 32
EPOCHS           = 50
LEARNING_RATE    = 0.0005   # lower LR for Transformer stability
MODEL_DIR        = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)


class AQIDataset(Dataset):
    def __init__(self, sequences, targets):
        self.X = torch.FloatTensor(sequences)
        self.y = torch.FloatTensor(targets)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


def load_station_data(db, station_id: int) -> np.ndarray:
    readings = (
        db.query(Reading)
        .filter(Reading.station_id == station_id)
        .order_by(Reading.fetched_at.asc())
        .all()
    )
    return np.array([r.aqi for r in readings], dtype=np.float32)


def make_sequences(data: np.ndarray):
    X, y = [], []
    for i in range(len(data) - SEQ_LEN - FORECAST_HORIZON + 1):
        X.append(data[i : i + SEQ_LEN])
        y.append(data[i + SEQ_LEN : i + SEQ_LEN + FORECAST_HORIZON])
    return np.array(X), np.array(y)


def train_for_station(station: Station, aqi_data: np.ndarray):
    print(f"\n── Training Transformer: {station.name} ({len(aqi_data)} readings) ──")

    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(aqi_data.reshape(-1, 1)).flatten()

    X, y = make_sequences(scaled)
    if len(X) < 10:
        print(f"  Skipping — not enough data ({len(X)} sequences)")
        return None, None, None

    X = X.reshape(X.shape[0], X.shape[1], 1)

    split = int(len(X) * 0.8)
    train_ds = AQIDataset(X[:split], y[:split])
    val_ds   = AQIDataset(X[split:], y[split:])
    train_dl = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_dl   = DataLoader(val_ds,   batch_size=BATCH_SIZE)

    model     = AQIForecastTransformer()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    criterion = nn.MSELoss()

    best_val_loss = float('inf')
    best_state    = None

    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0
        for xb, yb in train_dl:
            optimizer.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # Transformer stability
            optimizer.step()
            train_loss += loss.item()

        model.eval()
        val_loss = 0
        with torch.no_grad():
            for xb, yb in val_dl:
                pred = model(xb)
                val_loss += criterion(pred, yb).item()
        val_loss /= len(val_dl)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state    = {k: v.clone() for k, v in model.state_dict().items()}

        if (epoch + 1) % 10 == 0:
            print(f"  Epoch {epoch+1}/{EPOCHS} — val_loss: {val_loss:.4f}")

    model.load_state_dict(best_state)

    model.eval()
    all_preds, all_true = [], []
    with torch.no_grad():
        for xb, yb in val_dl:
            pred = model(xb).numpy()
            all_preds.append(pred)
            all_true.append(yb.numpy())

    all_preds = scaler.inverse_transform(
        np.concatenate(all_preds).reshape(-1, 1)).flatten()
    all_true  = scaler.inverse_transform(
        np.concatenate(all_true).reshape(-1, 1)).flatten()
    rmse = np.sqrt(mean_squared_error(all_true, all_preds))
    print(f"  ✓ Transformer RMSE: {rmse:.2f} AQI units")

    return model, scaler, rmse


def train_all():
    db = SessionLocal()
    results = {}

    try:
        stations = db.query(Station).all()
        for station in stations:
            aqi_data = load_station_data(db, station.id)
            if len(aqi_data) < SEQ_LEN + FORECAST_HORIZON + 10:
                print(f"Skipping {station.name} — not enough data")
                continue

            model, scaler, rmse = train_for_station(station, aqi_data)
            if model is None:
                continue

            model_path  = os.path.join(MODEL_DIR, f"station_{station.id}_transformer.pt")
            scaler_path = os.path.join(MODEL_DIR, f"station_{station.id}_transformer_scaler.pkl")
            torch.save(model.state_dict(), model_path)
            with open(scaler_path, "wb") as f:
                pickle.dump(scaler, f)

            results[station.id] = {
                "station_name": station.name,
                "rmse":         round(rmse, 2),
                "data_points":  len(aqi_data),
                "trained_at":   datetime.now(timezone.utc).isoformat()
            }

    finally:
        db.close()

    summary_path = os.path.join(MODEL_DIR, "transformer_training_summary.json")
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n{'='*50}")
    print("Transformer training complete!")
    for sid, r in results.items():
        print(f"  {r['station_name']}: RMSE = {r['rmse']} AQI units")
    print(f"Models saved to: {MODEL_DIR}")

    return results


if __name__ == "__main__":
    train_all()