# Synetiq — AI-Powered Meeting Intelligence Platform

> **One command to run.** `docker compose up --build`  
> App → `http://localhost:8080` · API Docs → `http://localhost:8080/docs` · Legacy MOM UI → `http://localhost:8080/legacy/mom`

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Development Guide](#development-guide)
- [Services & Ports](#services--ports)

---

## Overview

**Synetiq** is a full-stack, AI-driven meeting management platform that transforms raw meeting audio and notes into structured intelligence. It provides automatic transcription, AI-generated Minutes of Meeting (MOM), action item tracking, semantic search over meeting content, community and group management, and real-time analytics — all in a premium, modern web interface.

---

## Key Features

| Feature | Description |
|---|---|
| 🎙️ **AI Transcription** | Upload audio files and get auto-transcribed meeting content via OpenAI Whisper |
| 📝 **MOM Generation** | LLM-powered (Llama 3.2 via Ollama) Minutes of Meeting generation from transcripts |
| ✅ **Action Items** | Automatically extract and track action items with assignees and due dates |
| 🔍 **Semantic Search** | Search across all meeting content using vector embeddings (ChromaDB + nomic-embed-text) |
| 🏘️ **Communities & Groups** | Organize teams into communities and groups; manage membership and invite users |
| 📊 **Analytics Dashboard** | Meeting stats, trends, participation metrics, and community health overview |
| 📅 **Agenda Management** | Create structured agendas with topics, presenters, and time allocations |
| 🔴 **Live Capture** | Real-time audio capture and in-browser live meeting recording |
| 🔔 **Notifications** | In-app notification system for meeting updates and mentions |
| 🔐 **JWT Auth** | Secure authentication with access/refresh token management |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15 | React framework (App Router) |
| React | 18 | UI library |
| TypeScript | 5.6 | Type safety |
| TailwindCSS | 3.4 | Utility-first styling |
| Framer Motion | 11 | Animations & transitions |
| TanStack Query | 5 | Server state management |
| Zustand | 5 | Client state management |
| Socket.IO Client | 4.8 | Real-time WebSocket communication |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| SQLAlchemy + Alembic | ORM & database migrations |
| PostgreSQL 16 | Primary relational database |
| Redis 7 | Caching & task queue |
| ChromaDB | Vector store for semantic search |
| Celery | Background task processing |
| Whisper | Audio transcription |
| Ollama (Llama 3.2) | Local LLM for MOM generation |
| nomic-embed-text | Text embeddings |
| JWT (HS256) | Authentication tokens |

### Infrastructure
| Service | Purpose |
|---|---|
| Nginx | Reverse proxy routing frontend + API |
| Docker Compose | Multi-service orchestration |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Browser (port 8080)                │
└─────────────────────┬───────────────────────────────┘
                      │
              ┌───────▼────────┐
              │   Nginx Proxy  │
              └──┬─────────┬───┘
                 │         │
        ┌────────▼──┐  ┌───▼────────┐
        │  Next.js  │  │  FastAPI   │
        │ Frontend  │  │    API     │
        │ :3000     │  │  :5000     │
        └───────────┘  └───┬────┬───┘
                           │    │
              ┌────────────▼┐  ┌▼───────────┐
              │  PostgreSQL │  │   Redis    │
              │    :5432    │  │   :6379    │
              └─────────────┘  └────────────┘
                           │
              ┌────────────▼────────────┐
              │  ChromaDB (vector store)│
              │  Ollama (LLM :11434)    │
              └─────────────────────────┘
```

All traffic enters via **Nginx on port 8080**:
- `/api/*` → FastAPI backend (`:5000`)
- `/docs` → FastAPI Swagger UI
- `/*` → Next.js frontend (`:3000`)

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- At least **8 GB RAM** recommended (Ollama LLM models require significant memory)
- At least **10 GB disk space** (for Docker images and LLM model weights)

### 1. Clone the repository

```bash
git clone <repository-url>
cd Synetic
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work out of the box for local development)
```

### 3. Start everything

```bash
docker compose up --build
```

> ⏳ **First run takes 5–15 minutes** — Docker pulls images, installs dependencies, builds the frontend, and downloads the Llama 3.2 and nomic-embed-text models via Ollama.

### 4. Open the app

| URL | Description |
|---|---|
| http://localhost:8080 | Main application |
| http://localhost:8080/docs | FastAPI Swagger / interactive API docs |
| http://localhost:8080/legacy/mom | Legacy MOM Generator UI |

### 5. Stop the app

```bash
docker compose down
```

To also remove all data volumes (database, models, vectors):

```bash
docker compose down -v
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed. The defaults work for local Docker development.

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `Synetiq API` | Application name shown in API docs |
| `ENVIRONMENT` | `development` | Runtime environment |
| `DEBUG` | `false` | Enable debug logging |
| `HOST` | `0.0.0.0` | API bind host |
| `PORT` | `5000` | API bind port |
| `ALLOWED_ORIGINS` | `["http://localhost:8080"]` | CORS allowed origins |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/synetiq` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |
| `CHROMA_PATH` | `./.chroma` | ChromaDB persistence directory |
| `SECRET_KEY` | `change-me-in-production` | JWT signing secret — **change in production!** |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `WHISPER_MODEL_NAME` | `base` | Whisper model size (`tiny`, `base`, `small`, `medium`, `large`) |
| `OLLAMA_MODEL` | `llama3.2` | Ollama LLM model for MOM generation |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model for semantic search |
| `CELERY_EAGER` | `true` | Run Celery tasks synchronously (set `false` for async) |

---

## Default Credentials

A default admin user is automatically seeded on first startup:

| Field | Value |
|---|---|
| **Email** | `admin@synetiq.ai` |
| **Password** | `admin123` |

> ⚠️ Change these credentials before deploying to any non-local environment.

---

## Project Structure

```
Synetic/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py             # Application factory & startup
│   │   ├── api/
│   │   │   ├── router.py       # Root API router
│   │   │   └── routes/         # Route handlers
│   │   │       ├── auth.py       # Login, register, token refresh
│   │   │       ├── meetings.py   # CRUD + upload + processing
│   │   │       ├── communities.py# Community management
│   │   │       ├── groups.py     # Group management
│   │   │       ├── mom.py        # MOM generation endpoints
│   │   │       ├── analytics.py  # Dashboard statistics
│   │   │       ├── semantic_search.py # Vector search
│   │   │       ├── action_items.py    # Action item tracking
│   │   │       ├── agenda.py     # Agenda management
│   │   │       └── notifications.py   # Notifications
│   │   ├── ai/                 # AI service layer (Whisper, Ollama)
│   │   ├── auth/               # JWT auth logic
│   │   ├── communities/        # Community business logic
│   │   ├── core/               # Config, security, middleware, exceptions
│   │   ├── db/                 # Database session & base models
│   │   ├── meetings/           # Meeting processing pipeline
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── semantic_search/    # ChromaDB vector search
│   │   ├── services/           # Shared service utilities
│   │   ├── transcription/      # Audio transcription (Whisper)
│   │   ├── websocket/          # WebSocket routes (real-time)
│   │   └── workers/            # Celery background tasks
│   ├── alembic/                # Database migration scripts
│   └── tests/                  # Backend test suite
│
├── frontend/                   # Next.js 15 frontend
│   ├── app/
│   │   ├── (dashboard)/        # Authenticated dashboard layout
│   │   │   ├── page.tsx          # Dashboard home (analytics overview)
│   │   │   ├── meetings/         # Meeting list + detail
│   │   │   ├── communities/      # Communities + groups management
│   │   │   ├── generate/         # AI MOM generation page
│   │   │   ├── search/           # Semantic search UI
│   │   │   ├── live/             # Live audio capture
│   │   │   └── settings/         # User & system settings
│   │   └── login/              # Auth pages
│   ├── components/             # Reusable UI components
│   │   ├── shell/              # AppShell (header, sidebar, layout)
│   │   ├── meetings/           # Meeting-related components
│   │   ├── dashboard/          # Stats grid, charts
│   │   └── search/             # Semantic search components
│   ├── lib/                    # Auth helpers, API utilities
│   ├── services/               # API service layer
│   ├── stores/                 # Zustand client state
│   └── types/                  # TypeScript type definitions
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.api      # Backend Docker image
│   │   └── Dockerfile.frontend # Frontend Docker image
│   └── nginx/
│       └── default.conf        # Nginx reverse proxy config
│
├── docs/                       # Additional documentation
├── static/                     # Static file serving (legacy UI)
├── docker-compose.yml          # Service orchestration
├── .env.example                # Environment variable template
└── requirements.txt            # Python dependencies (root-level)
```

---

## API Reference

The full interactive API documentation is available at **http://localhost:8080/docs** (Swagger UI) when the app is running.

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate and get JWT tokens |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/api/v1/meetings` | List all meetings |
| `POST` | `/api/v1/meetings` | Create a new meeting |
| `GET` | `/api/v1/meetings/{id}` | Get meeting details + transcript |
| `POST` | `/api/v1/meetings/{id}/upload` | Upload audio for transcription |
| `POST` | `/api/v1/meetings/{id}/generate-mom` | Generate MOM via LLM |
| `GET` | `/api/v1/communities` | List communities |
| `POST` | `/api/v1/communities` | Create a community |
| `GET` | `/api/v1/groups` | List groups |
| `POST` | `/api/v1/groups` | Create a group |
| `POST` | `/api/v1/semantic-search` | Semantic search over meeting content |
| `GET` | `/api/v1/analytics/dashboard` | Dashboard statistics |
| `GET` | `/api/v1/action-items` | List all action items |
| `GET` | `/api/v1/notifications` | Get user notifications |
| `GET` | `/health` | Service health check |

---

## Development Guide

### Running frontend in dev mode (hot-reload)

```bash
cd frontend
npm install
npm run dev
# Frontend available at http://localhost:3000
```

### Running backend locally (without Docker)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set environment variables (or create .env)
cp .env.example .env
# Update DATABASE_URL and REDIS_URL to point to local services

# Run database migrations
cd backend
alembic upgrade head

# Start the API server
cd ..
python server.py
# API available at http://localhost:5000
```

### Running tests

```bash
cd backend
pytest
```

### Database migrations

```bash
# Create a new migration
cd backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## Services & Ports

| Service | Container Name | Internal Port | Exposed |
|---|---|---|---|
| Nginx (reverse proxy) | `synetiq-nginx` | 80 | **8080** |
| FastAPI Backend | `synetiq-api` | 5000 | Internal only |
| Next.js Frontend | `synetiq-frontend` | 3000 | Internal only |
| PostgreSQL | `synetiq-postgres` | 5432 | Internal only |
| Redis | `synetiq-redis` | 6379 | Internal only |
| Ollama (LLM) | `synetiq-ollama` | 11434 | Internal only |

> Only port **8080** is exposed to your host machine. All other services communicate internally through Docker's network.

---

## Troubleshooting

**First startup is slow / models not loading**  
Ollama downloads the `llama3.2` (~2 GB) and `nomic-embed-text` models on first run. This can take several minutes depending on your internet connection. Wait for `Models ready!` in the Docker logs before using AI features.

**Port 8080 already in use**  
Edit the `ports` section in `docker-compose.yml` and change `"8080:80"` to another port like `"9090:80"`.

**Database connection errors on startup**  
The API waits for PostgreSQL to pass its health check. If it still fails, run `docker compose restart api`.

**Out of memory errors**  
Llama 3.2 requires at least 4–6 GB RAM for the Ollama container. Ensure Docker Desktop has sufficient memory allocated in its settings.

---

*Built with ❤️ by the Synetiq team.*
