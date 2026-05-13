# Synetiq API Contracts (Backend-first)

When using root `docker compose up`, the public entry is **nginx on port 8080** (same origin for browser and API). Open `http://localhost:8080` for the Next.js app; API routes are proxied under the same host (e.g. `/health`, `/api/v1/...`, `/auth/...`). Legacy MOM UI: `/legacy/mom`.

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

## Legacy AI Compatibility
- `GET /health`
- `POST /translate`
- `POST /generate-from-audio`
- `POST /generate-from-points`

## Phase 2–6 v1 APIs
- `POST /api/v1/communities`
- `GET /api/v1/communities`
- `POST /api/v1/groups`
- `GET /api/v1/groups/community/{community_id}`
- `POST /api/v1/meetings`
- `POST /api/v1/meetings/{meeting_id}/transition`
- `POST /api/v1/meetings/{meeting_id}/invite`
- `POST /api/v1/meetings/rsvp/{token}`
- `POST /api/v1/agenda`
- `GET /api/v1/agenda/{meeting_id}`
- `POST /api/v1/mom/{meeting_id}/generate`
- `POST /api/v1/mom/{mom_id}/publish`
- `POST /api/v1/action-items`
- `PATCH /api/v1/action-items/{action_item_id}/status`
- `GET /api/v1/analytics/organizer`
- `GET /api/v1/analytics/admin`
- `GET /api/v1/search?q=...`

## Websocket
- `GET /ws/meetings/{meeting_id}` for realtime meeting stream events.
