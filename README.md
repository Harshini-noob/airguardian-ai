# AeroSense — AI-Powered Urban Air Quality Intelligence

AeroSense is a full-stack air quality monitoring and advisory platform built for Chennai. It combines live sensor data from government monitoring networks, LSTM-based 24-hour forecasting, source attribution, and Groq-powered bilingual health advisories into a single cohesive platform.

## Screenshots

| Dashboard | Advisories | Compare | enforcement
|---|---|---|---|
| ![Dashboard](./screenshots/dashboard.png) | ![Advisories](./screenshots/advisory.png) | ![Compare](./screenshots/compare.png) | ![Enforcement](./screenshots/enforcement.png)
| Dark CARTO map with AQI station markers | Station advisory in English or Tamil | 2–5 station AQI trend overlay |

## Features

### Real-Time Monitoring
- Pulls live data from CPCB and TNPCB monitoring stations across Chennai via the OpenAQ API
- Auto-refreshes every 5 minutes in the browser
- AQI-coded circular markers on a CARTO dark map — marker radius scales with pollution severity
- Click any station to open the detail panel

### 24-Hour AI Forecast
- PyTorch LSTM model trained per station on historical readings
- Predicts AQI 1–24 hours ahead, with diurnal peak detection
- Displayed as an area chart with AQI threshold reference lines (Satisfactory / Moderate / Poor)
- Summary cards: current AQI, peak AQI + timing, rising/falling trend

### Source Attribution
- Breaks pollution at each station into four categories: Industrial, Traffic, Construction, Dust/Natural
- Shown as a stacked bar + percentage rows in the Attribution tab of the station panel
- Powers enforcement priority scoring

### Bilingual AI Advisory (English + Tamil)
- POST to Groq LLaMA 3.3 70B with a RAG context built from WHO 2021 guidelines, CPCB NAQI standards, and TNPCB data
- Response is structured: advisory text, risk level (low/moderate/high/severe), vulnerable groups list
- 30-minute in-memory cache per station+language pair — avoids re-generating for the same conditions
- Graceful fallback text if Groq is unavailable

### Station Comparison
- Select 2–5 stations from a checkbox grid (colour-coded 1–5)
- Fetches the last 24 hours of readings for each station
- Overlaid multi-line Recharts chart with per-station AQI colours
- Summary stat cards: average AQI and peak AQI per station

### Enforcement Intelligence
- All stations ranked by a priority score (AQI × source attribution confidence)
- Each entry shows the recommended action, dominant source, severity badge
- Source summary sidebar: which pollution category dominates across the city today
- Designed for inspection teams and municipal authorities

### AI Chat
- RAG chatbot in the main dashboard sidebar
- Grounded in WHO, CPCB, and TNPCB reference documents
- Responds in the language the user types (English or Tamil auto-detected)

## Technology Stack

### Backend

| Layer | Technology |
|---|---|
| Web framework | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15 via SQLAlchemy ORM |
| Cache | Redis 7 |
| Container orchestration | Docker + Docker Compose |
| ML forecasting | PyTorch (LSTM + Transformer models) |
| LLM inference | Groq API — LLaMA 3.3 70B |
| RAG / embeddings | ChromaDB + sentence-transformers (all-MiniLM-L6-v2) |
| Data source | OpenAQ REST API (CPCB + TNPCB Chennai stations) |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | react-router-dom v7 |
| Map | react-leaflet + Leaflet.js (CARTO dark tiles) |
| Charts | Recharts |
| HTTP | Axios |
| Fonts | Space Grotesk (headings) + Inter (body) |
| Styling | Inline CSS — no CSS frameworks |

## Project Structure

```
aerosense/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── routes/
│   │   │   ├── stations.py      # GET /api/stations
│   │   │   ├── forecast.py      # GET /api/forecast/{id}
│   │   │   ├── attribution.py   # GET /api/attribution/{id}
│   │   │   ├── enforcement.py   # GET /api/enforcement
│   │   │   ├── chat.py          # POST /api/chat
│   │   │   ├── advisory.py      # GET /api/advisory/{id}?lang=en|ta
│   │   │   └── compare.py       # GET /api/compare?ids=1,2,3
│   │   └── services/        # ML inference, RAG, data ingestion
│   ├── main.py              # FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml   # PostgreSQL + Redis
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React Router — all route declarations
│   │   ├── App.jsx              # Main map dashboard
│   │   ├── Landing.jsx          # Marketing / entry page
│   │   ├── Advisories.jsx       # Station advisory generator
│   │   ├── Compare.jsx          # Multi-station comparison
│   │   └── EnforcementDashboard.jsx  # Priority inspection queue
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── screenshots/
│   ├── dashboard.png
│   ├── advisories.png
│   └── compare.png
│
└── README.md
```

## API Reference

### `GET /api/stations`
Returns all active monitoring stations with live AQI.

```json
[
  {
    "id": 1,
    "openaq_id": "IN-CPCB-001",
    "name": "Manali, Chennai - CPCB",
    "area": "Manali",
    "lat": 13.1674,
    "lon": 80.2641,
    "pm25": 87.4,
    "aqi": 178,
    "category": "Moderate",
    "fetched_at": "2026-07-15T10:30:00Z"
  }
]
```

### `GET /api/forecast/{station_id}`
Returns 24-hour AQI forecast from the LSTM model.

```json
{
  "forecast": [
    { "hour": 1, "aqi": 182, "category": "Moderate" }
  ]
}
```

### `GET /api/attribution/{station_id}`
Returns source attribution breakdown for the station.

```json
{
  "sources": {
    "Industrial": 0.52,
    "Traffic": 0.28,
    "Construction": 0.12,
    "Dust/Natural": 0.08
  },
  "primary_source": "Industrial",
  "primary_pct": 52,
  "enforcement": "Inspect industrial units in Manali industrial estate.",
  "severity": "high"
}
```

### `GET /api/advisory/{station_id}?lang=en|ta`
Generates (or returns cached) AI health advisory for the station.

```json
{
  "station_name": "Manali",
  "aqi": 178,
  "risk_level": "moderate",
  "advisory": "Air quality at Manali is Moderate today...",
  "vulnerable_groups": ["Children", "Elderly", "Asthma patients"],
  "lang": "en"
}
```

### `GET /api/compare?ids=1,2,3`
Returns the last 24 hours of readings for up to 5 stations.

```json
[
  {
    "station_id": 1,
    "station_name": "Manali",
    "avg_aqi": 164,
    "peak_aqi": 212,
    "readings": [
      { "hour": "2026-07-15T01:00", "aqi": 152 }
    ]
  }
]
```

### `GET /api/enforcement`
Returns all stations ranked by enforcement priority.

```json
{
  "total_stations": 12,
  "critical_count": 4,
  "priorities": [
    {
      "station_id": 1,
      "name": "Manali, Chennai - CPCB",
      "area": "Manali",
      "aqi": 218,
      "category": "Poor",
      "priority_score": 87,
      "severity": "high",
      "sources": { "Industrial": 0.52, "Traffic": 0.28, "Construction": 0.12, "Dust/Natural": 0.08 },
      "primary_source": "Industrial",
      "primary_pct": 52,
      "enforcement": "Inspect industrial units in Manali industrial estate."
    }
  ]
}
```

### `POST /api/chat`
RAG chatbot endpoint.

```json
// Request
{ "message": "Is it safe to jog today at Velachery?", "history": [] }

// Response
{ "reply": "...", "sources_used": ["WHO 2021", "CPCB NAQI"] }
```

## Setup (VS Code / Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker Desktop (for PostgreSQL + Redis)
- A Groq API key — free at [console.groq.com](https://console.groq.com)

### 1 — Clone and configure environment

```bash
git clone <your-repo-url>
cd aerosense
```

Create `backend/.env`:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://vayu:vayu123@localhost:5432/vayu
REDIS_URL=redis://localhost:6379
```

### 2 — Start database and cache

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL on port `5432` and Redis on port `6379`.

### 3 — Install and run the backend

```bash
# Still in backend/
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API is now live at `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

### 4 — Install and run the frontend

```bash
# New terminal
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — overview, live ticker, entry buttons |
| `/dashboard` | Main map with station markers, forecast, attribution, AI chat |
| `/advisories` | Generate AI health advisory per station in English or Tamil |
| `/compare` | Compare up to 5 stations on a single 24-hour trend chart |
| `/enforcement` | Priority inspection queue for authorities |

## AQI Scale (India CPCB)

| AQI Range | Category | Colour |
|---|---|---|
| 0–50 | Good | Green |
| 51–100 | Satisfactory | Lime |
| 101–200 | Moderate | Amber |
| 201–300 | Poor | Red |
| 301–400 | Very Poor | Purple |
| 401+ | Severe | Dark Red |

## Data Sources

| Source | Use |
|---|---|
| OpenAQ API | Live PM2.5 and AQI for Chennai CPCB + TNPCB stations |
| WHO Air Quality Guidelines 2021 | RAG knowledge base for advisory generation |
| CPCB NAQI Standards | AQI scale, category thresholds |
| TNPCB Chennai historical data | Station-specific model training |
| Groq — LLaMA 3.3 70B Versatile | LLM inference for advisory + chat |

## Deployment Notes

- The frontend is a static Vite SPA — deploy to Vercel, Netlify, or any static host.
- The backend is a standard ASGI app — deploy to Railway, Render, or a VPS with Gunicorn + Nginx.
- All API calls use `http://localhost:8000` by default. Set `VITE_API_BASE=https://your-api.domain.com` and replace the API constant in frontend files for production.
- Groq's free tier supports ~14,400 LLaMA 3.3 70B requests/day — sufficient for advisory generation + chat at city scale.

