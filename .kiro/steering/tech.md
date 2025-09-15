# Technology Stack

## Backend (Django)

- **Framework**: Django 4.2 with Django REST Framework
- **Python**: 3.11+
- **Database**: PostgreSQL (production) / SQLite (development)
- **Cache/Message Broker**: Redis
- **Real-time**: Django Channels with WebSocket support
- **Background Jobs**: Celery
- **Authentication**: Supabase JWT with custom middleware
- **AI/ML**: OpenAI API, LangChain, LangGraph
- **Vector Store**: Supabase (for knowledge management)
- **Integrations**: Composio SDK for third-party app connections

## Frontend

Two Next.js 15 applications:
- **frontend/**: Standalone demo with OpenAI + Composio API routes
- **frontend_django/**: Main UI connected to Django backend

### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **React**: 19.1.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query
- **Authentication**: Supabase client-side
- **Real-time**: Socket.io client

## Development Tools

- **Package Manager**: pnpm (frontend), pip (backend)
- **Code Quality**: ESLint, TypeScript strict mode
- **Environment**: dotenv for configuration
- **Database Migrations**: Django migrations

## Common Commands

### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # or use direnv
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Celery Worker
```bash
cd backend
celery -A djapp.celery.app worker --loglevel=INFO
```

### Frontend Development
```bash
cd frontend_django  # or frontend
pnpm install
pnpm dev  # runs on localhost:3000
```

### Database Operations
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Cache Management
```bash
# Refresh toolkit cache
python backend/scripts/fetch_toolkits.py
```

## Environment Variables

### Backend (.env in backend/)
- `DEBUG=true` (development only)
- `DATABASE_URL` (PostgreSQL connection string)
- `REDIS_URL` (Redis connection for Channels/Celery)
- `SUPABASE_PROJECT_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`, `COMPOSIO_API_KEY`
- `LOG_LEVEL=INFO`

### Frontend (.env.local)
- `NEXT_PUBLIC_DJANGO_API_BASE=http://localhost:8000`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`, `COMPOSIO_API_KEY` (server-side only)