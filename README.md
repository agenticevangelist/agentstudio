## Agent Studio

Build, run, and deploy tool-using AI agents with a Django backend and a modern Next.js frontend.

### Overview
- **Backend**: Django 4.2, Django REST Framework, Channels (WebSockets), Celery workers, Redis (optional), Postgres. Composio SDK integration for tool/connection management.
- **Frontend**: Next.js 15, React 19, Tailwind v4, Radix UI, React Query. Connects to the backend via REST and WebSockets.
- **Monorepo**: `backend/` (Django app) and `frontend_django/` (Next.js app) with a one‑click Render deployment (`render.yaml`).

### System architecture
```mermaid
flowchart LR
  subgraph Client
    FE[Next.js 15 UI<br/>React 19]
  end

  subgraph Django
    API[DRF REST API]
    WS[Channels ASGI]
    SVC[Agents/Connections/Toolkits Services]
  end

  subgraph Infra
    PG[(Postgres)]
    RDS[(Redis)]
    CEL[Celery Worker]
  end

  FE <--> API
  FE <--> WS

  API --> PG
  WS <--> RDS
  CEL <--> RDS
  API --> CEL
  SVC --- API
  SVC --- WS
```

### Repository layout
```
.
├── backend/                 # Django project and apps
│   ├── djapp/               # Django project (ASGI/WSGI, settings, Celery)
│   ├── agents/              # Agent domain, services, registry
│   ├── authx/               # Auth utilities, views, permissions
│   ├── chat/                # Realtime chat (Channels, consumers, views)
│   ├── connections/         # 3rd‑party connections via Composio
│   ├── toolkits/            # Toolkit models & services
│   ├── inbox/               # Inbound requests storage
│   ├── manage.py
│   └── requirements.txt
├── frontend_django/         # Next.js 15 app
│   ├── src/
│   ├── package.json
│   └── next.config.ts
├── render.yaml              # Render blueprint (backend, worker, frontend)
└── README.md
```

### Tech stack
- **Python/Django**: Django, DRF, Channels, Celery, WhiteNoise, `dj-database-url`
- **Queue/Realtime**: Redis (for Channels + Celery), optional in-memory fallback for local dev
- **DB**: Postgres (recommended). SQLite supported for local only
- **AI/Agents**: OpenAI SDK, LangChain, LangGraph (future), Composio SDKs
- **Frontend**: Next.js 15, React 19, Tailwind v4, Radix UI, TanStack Query

### Realtime chat flow
```mermaid
sequenceDiagram
  participant UI as Frontend (Next.js)
  participant WS as Channels (ASGI)
  participant SVC as Agent Services
  participant CEL as Celery Worker
  participant R as Redis
  participant DB as Postgres

  UI->>WS: Connect WebSocket
  UI->>WS: Send message
  WS->>SVC: Emit message event
  SVC->>DB: Persist message/run
  SVC->>CEL: Enqueue agent job
  CEL->>R: Pull job / progress
  CEL->>SVC: Tool calls / updates
  SVC-->>WS: Stream tokens/events
  WS-->>UI: Realtime updates
  CEL->>DB: Save final result
  WS-->>UI: Run finished
```

---

## Getting started (local)

### Prerequisites
- Python 3.11+
- Node 20+
- Postgres 14+ (local or hosted)
- Redis 6+ (for WebSockets/Celery; optional but recommended)

### 1) Configure environment
Create `backend/.env` with at least:
```bash
# Django
SECRET_KEY=change-me
DEBUG=true
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (prefer Postgres in dev)
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/agentstudio

# CSRF (for production frontends)
CSRF_TRUSTED_ORIGINS=http://localhost:3000

# Redis (enables Channels + Celery persistence)
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379
CELERY_RESULT_BACKEND=redis://localhost:6379

# AI / Integrations (optional)
OPENAI_API_KEY=
COMPOSIO_API_KEY=
```

If you do not provide `REDIS_URL`, Channels falls back to an in‑memory layer (OK for quick local testing; not for multi‑process).

Optional: start Redis and Postgres via Docker
```bash
docker run -d --name redis -p 6379:6379 redis:7
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=agentstudio -p 5432:5432 postgres:14
```

### 2) Backend: install, migrate, run
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver 0.0.0.0:8000
```

In another terminal, start the Celery worker (recommended):
```bash
cd backend
source .venv/bin/activate
celery -A djapp worker --loglevel=info -c 1 --pool=solo --prefetch-multiplier=1 --max-tasks-per-child=50 --without-gossip --without-mingle --without-heartbeat
```

### 3) Frontend: install and run
```bash
cd frontend_django
npm install --legacy-peer-deps
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

Open the app at `http://localhost:3000`.

---

## Environment variables

### Backend (`backend/.env`)
- `SECRET_KEY`: Django secret key
- `DEBUG`: `true|false`
- `ALLOWED_HOSTS`: comma‑separated allowed hosts
- `CSRF_TRUSTED_ORIGINS`: comma‑separated origins
- `DATABASE_URL`: e.g. `postgresql://user:pass@host:5432/db`
- `REDIS_URL`: `redis://host:6379` (enables Channels + Celery)
- `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`: usually same as `REDIS_URL`
- `OPENAI_API_KEY`: for OpenAI features
- `COMPOSIO_API_KEY`: for Composio integrations
- `ALLOW_DEV_JWT_NO_VERIFY`: dev aid; do not enable in production

### Frontend
- `NEXT_PUBLIC_API_BASE_URL`: Backend base URL (e.g. `http://localhost:8000` or your deployed backend URL)

---

## Development notes
- DRF auth classes enabled: session and token auth
- Channels is wired via `djapp.asgi` and uses Redis if `REDIS_URL` is set; otherwise in‑memory
- Static files are served via WhiteNoise in production builds
- Logging is configured; set `LOG_LEVEL` to control verbosity

### Useful frontend scripts
```bash
npm run dev      # start Next.js with Turbopack
npm run build    # production build
npm run start    # start production server
npm run lint     # run ESLint
```

### Common Django commands
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
python manage.py test
```

---

## Deployment (Render)
This repository includes a `render.yaml` blueprint with three services:
- Web (Python): Django backend
- Worker (Python): Celery worker
- Web (Node): Next.js frontend

Steps:
1. Push this repo to GitHub
2. In Render, create a Blueprint from the repository. Render will read `render.yaml`
3. Set the required environment variables in each service (marked `sync: false` in the blueprint):
   - Backend/Worker: `DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY`, `COMPOSIO_API_KEY`, etc.
   - Frontend: `NEXT_PUBLIC_API_BASE_URL` pointing to your backend web service URL
4. Deploy. Render runs migrations automatically for the backend per `render.yaml`

### Deployment topology
```mermaid
graph TB
  subgraph Render
    BE[Web Service: Django]
    WK[Worker: Celery]
    FE[Web Service: Next.js]
    RD[(Managed Redis)]
    PG[(Managed Postgres)]
  end

  FE -->|HTTP/WS| BE
  BE --> PG
  BE <--> RD
  WK <--> RD
```

---

## Feature highlights
- Agent registry and services under `backend/agents/services`
- Realtime chat via `channels` in `backend/chat`
- Connections & tool orchestration via Composio (`backend/connections`)
- First‑class support for Celery background jobs (`backend/agents/tasks`, `backend/chat/tasks`)

### Data model (high-level)
```mermaid
erDiagram
  USER ||--o{ TOKEN : owns
  USER ||--o{ RUN : creates
  RUN ||--|{ MESSAGE : has
  RUN ||--o{ JOB : triggers
  JOB ||--o{ EVENT : emits
```

---

## Troubleshooting
- WebSockets not connecting locally: ensure `REDIS_URL` is set and Redis is running, or use single‑process dev server.
- 403/CSRF on POST from frontend: add your frontend origin to `CSRF_TRUSTED_ORIGINS` and host to `ALLOWED_HOSTS`.
- Static files missing in production: run `collectstatic` and ensure WhiteNoise is enabled (it is by default).
- Database connection errors on Render: set `DATABASE_URL` on both backend and worker services.

---

## License
This project is provided under your repository's license. If none is specified, all rights reserved.


