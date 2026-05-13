# Synetiq Backend Architecture

## Domain Modules
- `auth`: JWT + RBAC dependencies.
- `communities`, `groups`: hierarchy and membership governance.
- `meetings`, `agenda`, `mom`: lifecycle and meeting intelligence.
- `action_items`, `notifications`: accountability and communication.
- `semantic_search`, `analytics`: institutional memory and insights.
- `websocket`: realtime meeting collaboration channel.
- `workers`: Celery-based background jobs.

## Lifecycles
- Meeting status: `DRAFT -> PUBLISHED -> LIVE -> ENDED -> ARCHIVED`.
- Action item status: `OPEN -> IN_PROGRESS -> DONE | DEFERRED`.

## AI Pipeline
1. Whisper transcription.
2. langdetect.
3. Gujarati/Hindi translation to English.
4. Llama MOM generation.
5. Llama MOM quality pass.
6. Embedding/indexing in Chroma.
