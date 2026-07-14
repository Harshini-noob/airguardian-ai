# AeroSense 🌫️

**AI-Powered Urban Air Quality Intelligence Platform**

AeroSense fuses real-time CAAQMS station data with AI to deliver live AQI maps, 72-hour forecasts, pollution source attribution, enforcement dashboards, and bilingual citizen advisories for Indian cities (starting with Chennai).

---

## Project Structure

```
aerosense/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── routes/           # API route handlers
│   │   │   ├── stations.py       # Ward/station data
│   │   │   ├── forecast.py       # 72-hour AQI forecasting
│   │   │   ├── attribution.py    # AI source attribution
│   │   │   ├── chatbot.py        # RAG AI chat
│   │   │   └── enforcement.py    # Enforcement intelligence
│   │   ├── services/
│   │   │   ├── openaq_service.py     # OpenAQ data fetcher
│   │   │   ├── attribution.py        # Attribution logic
│   │   │   ├── rag_chatbot.py        # Groq LLM + RAG
│   │   │   └── seed_historical.py    # DB seeding
│   │   ├── models/
│   │   │   └── station.py        # SQLAlchemy ORM models
│   │   └── database.py           # DB connection
│   ├── ml/                   # ML models
│   │   ├── lstm_model.py
│   │   ├── transformer_model.py
│   │   ├── train.py
│   │   └── saved_models/
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt
│   └── docker-compose.yml    # PostgreSQL + Redis
│
└── frontend/                 # React + Vite frontend
    ├── src/
    │   ├── main.jsx          # Router (Landing / Dashboard / Enforcement)
    │   ├── Landing.jsx       # Landing page
    │   ├── App.jsx           # Main AQI map dashboard
    │   └── EnforcementDashboard.jsx
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node.js |
| Docker Desktop | latest | https://docker.com/products/docker-desktop |

---

## Environment Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd aerosense
```

### 2. Create backend `.env` file

Create a file at `backend/.env` with the following content:

```env
# Database (matches docker-compose defaults — change if you use your own Postgres)
DATABASE_URL=postgresql://vayu:vayu123@localhost:5432/vayu

# Redis
REDIS_URL=redis://localhost:6379

# Groq AI API key — get one free at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Optional: OpenAQ API key for live data — https://openaq.org
OPENAQ_API_KEY=your_openaq_api_key_here
```

> **Get a free Groq key** → https://console.groq.com → Create API Key. The app will fall back to mock data if the key is missing.

---

## Running the Backend

### Step 1 — Start PostgreSQL & Redis via Docker

```bash
cd backend
docker-compose up -d
```

This starts:
- **PostgreSQL** on port `5432` (database: `vayu`, user: `vayu`, password: `vayu123`)
- **Redis** on port `6379`

Verify they're running:
```bash
docker ps
```

### Step 2 — Create and activate a Python virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Run database migrations / seed data

```bash
# The app auto-creates tables on first startup via SQLAlchemy.
# To seed historical AQI data for Chennai wards, run:
python -m app.services.seed_historical
```

### Step 5 — Start the FastAPI server

```bash
uvicorn main:app --reload --port 8000
```

The API will be live at: **http://localhost:8000**

Interactive API docs (Swagger UI): **http://localhost:8000/docs**

---

## Running the Frontend

Open a **new terminal** (keep the backend running).

### Step 1 — Install dependencies

```bash
cd frontend
npm install
```

### Step 2 — Start the Vite dev server

```bash
npm run dev
```

The app will open at: **http://localhost:5173**

> The frontend expects the backend at `http://localhost:8000`. If you change the backend port, update the `API` constant at the top of `src/App.jsx`.

---

## Running Both in VS Code (Recommended)

VS Code lets you run both servers side-by-side using its integrated terminal.

### Option A — Split terminals manually

1. Open VS Code in the project root
2. Open the terminal panel (`Ctrl+` `` ` ``)
3. Click the **+** icon to open a second terminal
4. In **terminal 1** → run the backend:
   ```bash
   cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
   ```
5. In **terminal 2** → run the frontend:
   ```bash
   cd frontend && npm run dev
   ```

### Option B — VS Code Tasks (auto-launch both)

Create `.vscode/tasks.json` in the project root:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "source venv/bin/activate && uvicorn main:app --reload --port 8000",
      "options": { "cwd": "${workspaceFolder}/backend" },
      "group": "build",
      "presentation": { "panel": "dedicated", "reveal": "always" }
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm run dev",
      "options": { "cwd": "${workspaceFolder}/frontend" },
      "group": "build",
      "presentation": { "panel": "dedicated", "reveal": "always" }
    },
    {
      "label": "AeroSense: Start All",
      "dependsOn": ["Start Backend", "Start Frontend"],
      "group": { "kind": "build", "isDefault": true }
    }
  ]
}
```

Then press `Ctrl+Shift+B` to launch both servers at once.

---

## Available Pages

| URL | Page |
|-----|------|
| `http://localhost:5173/` | Landing page |
| `http://localhost:5173/dashboard` | Live AQI map + ward detail |
| `http://localhost:5173/enforcement` | Enforcement intelligence dashboard |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stations` | List all monitoring stations/wards |
| GET | `/stations/{id}/readings` | Recent AQI readings for a ward |
| GET | `/forecast/{station_id}` | 72-hour AQI forecast |
| GET | `/attribution/{station_id}` | AI pollution source attribution |
| GET | `/enforcement` | Prioritized enforcement actions |
| POST | `/chat` | RAG AI chatbot (body: `{"message": "..."}`) |

Full interactive docs at **http://localhost:8000/docs**

---

## Tech Stack

### Backend
- **FastAPI** — async Python web framework
- **SQLAlchemy** — ORM + PostgreSQL
- **Groq API** (LLaMA 3.3 70B) — source attribution, AI chat
- **APScheduler** — background data refresh jobs
- **ChromaDB** — vector store for RAG chatbot
- **Redis** — response caching
- **Docker** — local PostgreSQL + Redis

### Frontend
- **React 19** + **Vite**
- **React Leaflet** — interactive AQI map
- **Recharts** — AQI trend charts + forecasts
- **Axios** — API calls
- **React Router v7** — client-side routing

---

## Stopping Everything

```bash
# Stop the Vite dev server
Ctrl+C   (in the frontend terminal)

# Stop the FastAPI server
Ctrl+C   (in the backend terminal)

# Stop Docker containers (PostgreSQL + Redis)
cd backend
docker-compose down

# To also delete the database volume (fresh start)
docker-compose down -v
```

---

## Common Issues

**`connection refused` on port 5432**
→ Docker Desktop isn't running, or `docker-compose up -d` wasn't run first.

**`ModuleNotFoundError` on backend startup**
→ Make sure your virtual environment is activated (`source venv/bin/activate`) before running `pip install` and `uvicorn`.

**Map shows but no ward markers**
→ The backend may not have seeded data. Run `python -m app.services.seed_historical` from the `backend/` directory.

**CORS error in browser console**
→ The backend CORS middleware allows all origins by default. If you changed the frontend port, no changes needed on the backend side.

**`GROQ_API_KEY` missing warnings**
→ AI features (attribution, chat) will return fallback/mock responses. Add the key to `backend/.env` for full AI functionality.
