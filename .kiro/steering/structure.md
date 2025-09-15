# Project Structure

## Repository Organization

This is a monorepo with clear separation between backend, frontend, and reference implementations:

```
├── backend/                 # Django REST API + Channels
├── frontend/               # Next.js demo (OpenAI + Composio)
├── frontend_django/        # Next.js main UI (Django backend)
└── for_chat/              # Reference implementations and examples
```

## Backend Structure (Django)

```
backend/
├── djapp/                 # Django project root
│   ├── settings.py        # Main configuration
│   ├── urls.py           # Root URL routing
│   ├── asgi.py           # ASGI/WebSocket config
│   └── celery.py         # Background job config
├── authx/                # Supabase JWT authentication
├── agents/               # Agent management and services
│   ├── models.py         # Agent, AgentKnowledge models
│   ├── services/         # Business logic
│   │   ├── agent_service.py
│   │   ├── graph_factory.py    # LangGraph workflows
│   │   ├── knowledge.py        # Vector store operations
│   │   └── checkpointer.py     # State persistence
│   └── tasks/            # Celery background jobs
├── chat/                 # Real-time chat and sessions
│   ├── models.py         # Thread, Message, Run, GraphCheckpoint
│   └── views.py          # Streaming chat endpoints
├── toolkits/             # Composio toolkit discovery
├── connections/          # OAuth and custom integrations
├── inbox/                # Human-in-the-loop workflows
└── common/               # Shared utilities
```

## Frontend Structure (Next.js)

Both frontends follow Next.js 15 App Router conventions:

```
frontend_django/src/
├── app/                  # App Router pages
│   ├── (auth)/          # Auth-protected routes
│   ├── workspace/       # Main application
│   └── api/             # API routes (if any)
├── features/            # Feature-based organization
│   ├── agents/          # Agent management UI
│   ├── chat/            # Chat interface
│   ├── dashboard/       # Dashboard components
│   └── inbox/           # HITL interface
└── shared/              # Shared components and utilities
    ├── components/      # Reusable UI components
    ├── hooks/           # Custom React hooks
    ├── lib/             # Utilities and API clients
    └── ui/              # Base UI components (Radix)
```

## API Structure

### REST Endpoints
- `/admin/` - Django admin
- `/api/auth/` - Authentication (login, signup, me)
- `/api/agents/` - Agent CRUD and management
- `/api/chat/` - Chat sessions and streaming
- `/api/toolkits/` - Composio toolkit discovery
- `/api/connections/` - OAuth and integration management
- `/api/inbox/` - Human-in-the-loop actions

### Key Patterns
- **ViewSets**: Use DRF ViewSets for standard CRUD operations
- **Custom Actions**: Additional endpoints as ViewSet actions or function views
- **Streaming**: Real-time responses via `/api/chat/interactive/stream`
- **Background Jobs**: Celery tasks for long-running operations

## Data Models

### Core Entities
- **Agent**: User-owned agent configurations
- **AgentKnowledge**: Knowledge base summaries per agent
- **Thread/Message/Run**: Chat conversation persistence
- **GraphCheckpoint**: LangGraph state for pause/resume workflows
- **ConnectedIntegration**: OAuth connections to external services

## File Naming Conventions

### Backend (Python)
- Models: `models.py` (Django convention)
- Views: `views.py` for DRF ViewSets
- Services: `service_name_service.py` in `services/` directories
- Tasks: `jobs.py` for Celery tasks
- URLs: `urls.py` (Django convention)

### Frontend (TypeScript)
- Components: PascalCase `.tsx` files
- Pages: lowercase with hyphens (App Router convention)
- Hooks: `use-hook-name.ts`
- Utilities: `kebab-case.ts`
- Types: `types.ts` or inline with components

## Configuration Files

- **Backend**: `.env` in `backend/` directory
- **Frontend**: `.env.local` for Next.js applications
- **Cache**: `toolkits_cache.json`, `categories_cache.json` for performance
- **Dependencies**: `requirements.txt` (Python), `package.json` (Node.js)