# AeroSense

AI-powered urban air quality intelligence platform for Indian cities — fuses CAAQMS station data with Groq LLaMA AI to attribute pollution sources, forecast AQI 72 hours ahead, and generate prioritized enforcement + citizen health advisories.

## Run & Operate

- `pnpm --filter @workspace/aerosense run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `GROQ_API_KEY` — Groq API key for AI features (attribution, advisories, chat)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS v4 + shadcn/ui + react-leaflet + recharts + framer-motion
- API: Express 5 (Node.js)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- AI: Groq API (llama-3.3-70b-versatile) — source attribution, bilingual advisories, RAG chat
- API codegen: Orval (from OpenAPI spec)
- Maps: react-leaflet + CARTO dark tiles + OpenStreetMap

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema (wards, aqi_readings, enforcement_actions, advisories)
- `artifacts/api-server/src/routes/` — Express route handlers (wards, attribution, forecast, enforcement, advisories, compare, chat)
- `artifacts/api-server/src/lib/groq.ts` — Groq API client wrapper
- `artifacts/api-server/src/lib/aqi.ts` — AQI category logic + moving-average forecast
- `artifacts/aerosense/src/pages/` — Dashboard, Enforcement, Advisories, Compare, Chat
- `artifacts/aerosense/src/components/dashboard/` — Map, StatBar, WardPanel components
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)

## Architecture decisions

- **OpenAPI-first**: All API contracts live in `lib/api-spec/openapi.yaml`. Codegen produces both Zod validators (server) and React Query hooks (frontend).
- **Advisory endpoints split by lang**: `GET /wards/:id/advisory/en` and `/ta` instead of a query param to avoid Orval TS2308 collisions (both path+query params → same `*Params` type name in two files).
- **In-memory caches**: Attribution (1hr TTL) and advisory (30min TTL) cached in-process to minimize Groq API calls.
- **Simple forecasting**: Moving average + diurnal factor (no ML model) — reliable for demo, easily swapped for Prophet/LSTM later.
- **Dark mode default**: `class="dark"` applied to `<html>` by default; deep navy `#0F172A` as primary background.

## Product

AeroSense surfaces six key views:
1. **Dashboard** — Leaflet map of Chennai wards, color-coded by AQI severity. Click a ward to open a slide-over with source attribution (pie chart + AI confidence) and 72h forecast (area chart with confidence band).
2. **Enforcement** — Prioritized table of enforcement actions across all wards, sortable by priority score, expandable rows showing evidence.
3. **Advisories** — Ward picker + English/Tamil language toggle. Groq-generated health advisory with risk level and vulnerable group icons.
4. **Compare** — Multi-select up to 5 wards, overlaid Recharts line charts of AQI trends.
5. **Ask AeroSense** — RAG chat powered by Groq + live DB context. Floating chat button on every page.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After OpenAPI spec changes, always run codegen: `pnpm --filter @workspace/api-spec run codegen`
- After `lib/*` schema changes, run `pnpm run typecheck:libs` before artifact typechecks
- Orval collision rule: never give a component body schema the same name as `<OperationIdPascal>Body`. Use entity-shaped names (`WardInput`, not `CreateWardBody`).
- Same collision applies to operations with BOTH path params AND query params — Orval generates `*Params` in both api.ts and types/. Fix: use path-only params OR query-only params for any one operation.
- Leaflet maps require an explicit pixel height — `h-full` alone won't work without a concrete ancestor height. Use `absolute inset-0` inside a positioned parent.
- Do not run `pnpm dev` at workspace root — individual workflows inject PORT and BASE_PATH.
