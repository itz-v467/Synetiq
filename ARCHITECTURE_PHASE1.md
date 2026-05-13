# Synetiq Architecture - Phase 1 Foundation

## What Was Preserved
- Whisper transcription pipeline for audio input.
- Gujarati/Hindi/English detection and translation to English for MOM generation.
- Ollama + Llama MOM generation workflow.
- Backward-compatible endpoints used by legacy UI:
  - `GET /health`
  - `POST /translate`
  - `POST /generate-from-audio`
  - `POST /generate-from-points`

## Weaknesses in Previous Implementation
- Single-file Flask server mixed routing, business logic, and infrastructure concerns.
- No database persistence, RBAC, or user/session model.
- No modular boundaries for domain growth (communities, groups, meetings, analytics).
- Minimal deployment/operations setup.

## Phase 1 Implementation Decisions
- Migrated runtime entrypoint to FastAPI while preserving API compatibility.
- Split backend into modular packages:
  - `api/routes`: transport layer
  - `services`: AI/translation business logic
  - `auth`: JWT and role guard dependencies
  - `models`, `schemas`, `db`: persistence and contracts
  - domain modules scaffolded for future vertical expansion
- Added SQLAlchemy 2.0 + PostgreSQL-ready session and base models.
- Added JWT auth endpoints and role update API for initial RBAC path.
- Added Docker + Compose baseline with API, Postgres, and Redis.

## Current Scope Status
- Phase 1 foundation: implemented.
- Existing multilingual AI MOM flows: operational and preserved.
- Phase 2+ (communities/groups/meeting lifecycle/realtime/intelligence): scaffolded architecture, pending feature implementation.

## Immediate Next Build Order
1. Implement community, group, and membership models + APIs.
2. Add meeting lifecycle states and transition rules.
3. Add agenda + RSVP + invitation notification workflow.
4. Add Celery workers and Redis-backed async jobs.
5. Add websocket live transcription streams.
6. Add semantic indexing/search with Chroma + embeddings.
