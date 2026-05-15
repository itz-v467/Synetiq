# MOM Generator — AI-Powered Minutes of Meeting

> **Update (2026):** The stack now ships as a **Meeting Intelligence Platform**: FastAPI backend (`backend/app`), React + TypeScript + Tailwind frontend (`frontend`), PostgreSQL persistence, JWT auth, background jobs + WebSockets, semantic search, and PDF/DOCX export. Quickstart API: `python server.py` → http://localhost:8000/docs · SPA dev: `cd frontend && npm run dev`. See `docs/DEPLOYMENT.md` for Docker and production notes. Legacy single-file UI (`mom_generator.html`) and routes (`/generate-from-audio`, `/generate-from-points`) remain compatible.

> **Purpose of this document:** This README is designed to be self-contained. Any developer, team member, or AI assistant receiving only this file should have 100% of the context required to understand, run, extend, or debug the project — no additional explanation needed.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What It Does (User-Facing)](#2-what-it-does-user-facing)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [AI Pipeline](#5-ai-pipeline)
6. [Project Structure](#6-project-structure)
7. [API Reference](#7-api-reference)
8. [Frontend Reference](#8-frontend-reference)
9. [Running the Project](#9-running-the-project)
10. [Configuration & Environment](#10-configuration--environment)
11. [Known Issues & Fixes Applied](#11-known-issues--fixes-applied)
12. [Troubleshooting](#12-troubleshooting)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. Project Overview

**MOM Generator** is a fully offline, AI-powered web application that converts meeting audio recordings or typed discussion points into structured, professional **Minutes of Meeting (MOM)** documents.

It is designed for Indian organisations where meetings are commonly conducted in **English, Gujarati (ગુજરાતી), or Hindi (हिंदी)** — or a mix of all three. The app handles multilingual input natively by auto-detecting the language and translating to English before generating the MOM, ensuring high accuracy from the LLM.

**Key design principles:**
- 🔒 **100% offline / private** — no audio or text ever leaves the machine
- 🆓 **Zero API cost** — uses local Whisper for STT and local Ollama for LLM
- 🌐 **Multilingual** — English, Gujarati, Hindi, or mixed-language input
- ⚡ **Simple to run** — single `python server.py` command, open one HTML file

---

## 2. What It Does (User-Facing)

The app has **two input modes**, accessible via tabs in the UI:

### Mode 1 — Audio Recording
1. User uploads a meeting audio file (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`)
2. Whisper (local STT model) transcribes the audio
3. The transcript language is auto-detected
4. If Gujarati or Hindi is detected, it is translated to English
5. Llama 3.2 (via Ollama) generates a structured MOM from the English text
6. The UI shows: original transcript, translated transcript (if applicable), and the final MOM

### Mode 2 — Key Points Only
1. User types bullet-point discussion notes (in any supported language)
2. Each point is individually language-detected and translated to English if needed
3. Llama 3.2 generates a structured MOM from the translated points
4. The UI shows original and translated points, plus the final MOM

### MOM Output Structure
Every generated MOM follows this exact template (enforced via system prompt):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
             MINUTES OF MEETING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEETING INFORMATION
───────────────────
Title        : [inferred or provided]
Date         : [provided or TBD]
Time         : [provided or TBD]
Venue        : [provided or TBD]
Attendees    : [all names mentioned]
Prepared by  : AI Secretary

AGENDA
──────
1. [topic 1]
2. [topic 2]

DISCUSSION SUMMARY
──────────────────
[Topic Name]
2-3 professional sentences per topic.

KEY DECISIONS
─────────────
• [Decision 1]
• [Decision 2]

ACTION ITEMS
────────────
No. | Task                | Responsible | Deadline
 1  | [task description]  | [person]    | [date/TBD]

NEXT STEPS
──────────
[2-3 sentences about what happens next]

CLOSING
───────
Next Meeting : [if mentioned, else TBD]
```

---

## 3. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Web Framework** | Flask | 3.x | HTTP server, REST API, static file serving |
| **CORS** | Flask-CORS | 4.0.0 | Allow browser ↔ local server requests |
| **Speech-to-Text** | OpenAI Whisper | 20250625 | Local audio transcription (no API key) |
| **LLM** | Llama 3.2:1b | via Ollama | MOM text generation (runs locally) |
| **LLM Runtime** | Ollama | 0.6.2 | Local LLM serving layer |
| **Translation** | deep-translator | 1.11.4 | Gujarati/Hindi → English via Google Translate |
| **Language Detection** | langdetect | 1.0.9 | Identify input language code (`gu`, `hi`, `en`, …) |
| **ML Runtime** | PyTorch | 2.x | Whisper inference backend |
| **Frontend** | Vanilla HTML/CSS/JS | — | Single-file UI, no build step required |
| **Fonts** | Google Fonts (Syne, DM Mono) | — | UI typography |
| **Config** | python-dotenv | 1.0.0 | Environment variable management |

### Why these choices?
- **Flask over FastAPI**: Simpler setup for a single-file server; no async complexity needed for this use case.
- **Whisper `base` model**: Good balance of speed and accuracy; runs on CPU without a GPU.
- **Llama 3.2:1b**: Smallest viable Llama model (1.3 GB); fast on CPU, sufficient for structured MOM generation.
- **deep-translator over googletrans**: `googletrans` has known instability issues; `deep-translator` is a stable wrapper around the same Google Translate service.
- **Single HTML file frontend**: Zero build tooling, zero framework overhead — opens directly in browser or served by Flask.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Client                   │
│           mom_generator.html (Vanilla JS)            │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP (localhost:5000)
                    │
┌───────────────────▼─────────────────────────────────┐
│              Flask Server  (server.py)               │
│                                                      │
│  GET  /              → serves mom_generator.html     │
│  GET  /health        → system status JSON            │
│  POST /translate     → translate text endpoint       │
│  POST /generate-from-audio   → audio → MOM           │
│  POST /generate-from-points  → points → MOM          │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │   Whisper    │  │deep-translator│  │   Ollama  │  │
│  │  (local STT) │  │  (translate) │  │ (local LLM│  │
│  └──────────────┘  └──────────────┘  └─────┬─────┘  │
└──────────────────────────────────────────────────────┘
                                              │
                                    ┌─────────▼──────────┐
                                    │  Ollama Daemon      │
                                    │  localhost:11434    │
                                    │  Model: llama3.2:1b │
                                    └────────────────────┘
```

**Communication flow:**
1. Browser sends HTTP requests to `localhost:5000`
2. Flask routes handle requests, invoke AI services
3. Whisper runs in-process (loaded at startup, ~139 MB model download on first run)
4. Ollama runs as a separate daemon process on port `11434`
5. Flask calls Ollama via the `ollama` Python SDK
6. Results are returned as JSON to the browser

---

## 5. AI Pipeline

### Full Audio → MOM Pipeline

```
[User uploads audio file]
         │
         ▼
[Flask saves to temp file]
         │
         ▼
[Whisper transcribes → raw text]
         │
         ▼
[clean_transcript() removes filler words]
  (removes: "um", "uh", "you know", "basically",
   "literally", "i mean", "like so", "right so",
   "kind of", "sort of")
         │
         ▼
[langdetect.detect() → language code]
  en → skip translation
  gu → translate with deep-translator
  hi → translate with deep-translator
  other → pass through unchanged
         │
         ▼
[GoogleTranslator(source=lang, target='en').translate()]
  (Only runs if language is 'gu' or 'hi')
         │
         ▼
[ollama.chat(model='llama3.2:1b', messages=[
    {role: system, content: MOM_SYSTEM_PROMPT},
    {role: user, content: "Meeting Details:\n...\n\nCreate MOM from:\n[english_text]"}
])]
         │
         ▼
[response.message.content → MOM string]
         │
         ▼
[JSON response to browser]
```

### Key Points → MOM Pipeline

```
[User enters N key points]
         │
         ▼ (for each point individually)
[translate_to_english(point)]
  → detect language → translate if needed
         │
         ▼
[Combine: "1. point_en\n2. point_en\n..."]
         │
         ▼
[ollama.chat() → MOM string]
         │
         ▼
[JSON response with original_points + translated_points + mom]
```

### MOM System Prompt
The LLM is given a strict system prompt that forces it to output the structured MOM format exactly. The prompt defines the persona ("senior professional meeting secretary with 15 years of experience"), mandates every section, and instructs the model to never skip sections and to expand all points into full professional sentences.

---

## 6. Project Structure

```
MOM_Generator/
│
├── server.py                  # Main Flask application + all API endpoints
│                              # Loads Whisper at startup; calls Ollama on demand
│
├── mom_generator.html         # Original standalone HTML frontend
│                              # (opens directly in browser via file://)
│
├── static/
│   └── mom_generator.html     # Copy of the above, served by Flask at GET /
│                              # Auto-generated by server.py at startup
│
├── requirements.txt           # Python package dependencies
├── .env.example               # Example environment variable file
│
├── Audio/                     # (empty) Placeholder for sample audio files
│
├── backend/                   # Scaffold for future FastAPI migration (unused)
├── frontend/                  # Scaffold for future React migration (unused)
│
├── README.md                  # This file
├── QUICKSTART.md              # 4-step quick-start guide
├── CHANGES.md                 # Feature changelog (multilingual update)
├── IMPLEMENTATION_PLAN.md     # Architecture plan for full Community Platform
├── MASTER_PROMPT_CommunityMeetingPlatform.md   # AI master prompt doc
├── PRD_CommunityMeetingPlatform.md             # Full product requirements doc
└── docker-compose.yml         # Docker config (for future full-stack version)
```

> **Note:** `backend/` and `frontend/` directories and `docker-compose.yml` are scaffolding for a planned full-stack upgrade to FastAPI + React. They are **not used** by the current running application (`server.py` + `mom_generator.html`).

---

## 7. API Reference

All endpoints are on `http://localhost:5000`. The server uses Flask-CORS so the browser can call from any origin (including `file://`).

---

### `GET /`
Serves the `mom_generator.html` frontend file.

**Response:** HTML page

---

### `GET /health`
Health check — returns status of Whisper and Ollama.

**Response:**
```json
{
  "status": "ok",
  "whisper": "ready",
  "ollama": "running"
}
```
If Ollama is not reachable:
```json
{
  "status": "ok",
  "whisper": "ready",
  "ollama": "offline — run: ollama serve"
}
```

---

### `POST /translate`
Translate a text string to English. Detects language automatically if `source_lang` is omitted.

**Request body (JSON):**
```json
{
  "text": "ગુજરાતી ટેક્સ્ટ અહીં",
  "source_lang": "gu"
}
```
`source_lang` is optional. Supported values: `"gu"` (Gujarati), `"hi"` (Hindi), or omit for auto-detect.

**Response (translated):**
```json
{
  "original": "ગુજરાતી ટેક્સ્ટ અહીં",
  "translated": "Gujarati text here",
  "language": "gu",
  "translated_from": true
}
```

**Response (no translation needed):**
```json
{
  "original": "Hello, this is English",
  "translated": "Hello, this is English",
  "language": "en",
  "translated_from": false
}
```

---

### `POST /generate-from-audio`
Transcribes an uploaded audio file and generates a MOM.

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | ✅ | Audio file (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`) |
| `meetingInfo` | String | ❌ | Optional context: meeting title, date, attendees, agenda |

**Response (English audio):**
```json
{
  "success": true,
  "transcript": "We discussed the Q1 budget...",
  "transcript_language": "en",
  "translated_transcript": null,
  "was_translated": false,
  "mom": "MINUTES OF MEETING\n━━━━━━━━━━━━━━━━━..."
}
```

**Response (Gujarati audio):**
```json
{
  "success": true,
  "transcript": "આજે આપણે Q1 બજેટ વિશે ચર્ચા કરી...",
  "transcript_language": "gu",
  "translated_transcript": "Today we discussed the Q1 budget...",
  "was_translated": true,
  "mom": "MINUTES OF MEETING\n━━━━━━━━━━━━━━━━━..."
}
```

**Error response:**
```json
{ "error": "Error description here" }
```

---

### `POST /generate-from-points`
Accepts bullet-point discussion notes and generates a MOM.

**Request body (JSON):**
```json
{
  "points": [
    "Discussed Q1 budget of ₹50 lakh",
    "આ ક્વાર્ટરમાં 3 નવા ક્લાઈન્ટ સાઇન કર્યા",
    "Marketing team to run social media campaign"
  ],
  "meetingInfo": "Title: Q1 Review\nDate: 2025-05-12\nAttendees: Raj, Priya, Vikram"
}
```

**Response:**
```json
{
  "success": true,
  "original_points": ["Discussed Q1 budget...", "આ ક્વાર્ટર..."],
  "translated_points": ["Discussed Q1 budget...", "This quarter 3 new clients were signed"],
  "was_translated": true,
  "mom": "MINUTES OF MEETING\n━━━━━━━━━━━━━━━━━..."
}
```
If no translation was needed, `translated_points` is `null`.

---

## 8. Frontend Reference

**File:** `mom_generator.html` (served at `GET /` or opened directly)

**Technology:** Pure HTML5, CSS3, Vanilla JavaScript — no framework, no build step.

**Fonts:** Syne (headings, 400–800 weight) + DM Mono (body text, monospace)

**Color Palette (CSS variables):**
| Variable | Value | Usage |
|----------|-------|-------|
| `--bg` | `#ffffff` | Page background |
| `--surface` | `#f8f9fb` | Card/panel background |
| `--surface2` | `#f0f3f8` | Secondary surfaces |
| `--border` | `#d0dce8` | Borders and grid lines |
| `--accent` | `#1E40AF` | Primary accent (dark blue) |
| `--accent2` | `#3B82F6` | Secondary accent (mid blue) |
| `--accent3` | `#60A5FA` | Tertiary accent (light blue) |
| `--text` | `#1f2937` | Body text |
| `--muted` | `#6b7280` | Secondary/muted text |
| `--danger` | `#f87171` | Error/warning states |

**UI Sections:**

1. **Header** — App title ("Minutes of Meeting Generator"), subtitle explaining multilingual support
2. **Server Status Bar** — Pulsing dot indicator (🟡 checking → 🔵 online / 🔴 offline), auto-checks `GET /health` on load and every 30 seconds
3. **Instruction Banner** — Collapsible setup instructions for first-time users
4. **Tab Switcher** — Two tabs: "🎙 Audio Recording" and "📝 Key Points Only"
5. **Audio Tab:**
   - Drag-and-drop / file browser upload zone
   - Progress stepper: Upload → Transcribe → Generate → Done
   - Optional meeting details form (Title, Date, Venue, Attendees, Agenda textarea)
   - Transcript display with bilingual view (original + English translation)
   - Language detection badge (🇮🇳 Gujarati / 🇮🇳 Hindi / 🇬🇧 English)
   - MOM output panel with copy-to-clipboard button
6. **Key Points Tab:**
   - Dynamic textarea list (add/remove rows)
   - Optional meeting details form (same as Audio tab)
   - MOM output panel with copy-to-clipboard button

**JavaScript functions:**
| Function | Purpose |
|----------|---------|
| `checkServerStatus()` | Polls `GET /health`, updates status dot |
| `generateFromAudio()` | Submits audio form to `POST /generate-from-audio` |
| `generateFromPoints()` | Submits points form to `POST /generate-from-points` |
| `displayTranscript(data)` | Renders original + translated transcript in UI |
| `displayMOM(text)` | Renders MOM string in output panel |
| `copyMOM()` | Copies MOM text to clipboard |
| `addPoint()` / `removePoint()` | Dynamic row management in Key Points tab |

**Backend URL constant (in HTML JS):**
```js
const API_BASE = 'http://localhost:5000';
```
Change this if the server runs on a different host/port.

---

## 9. Running the Project

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| Python 3.9+ | Python 3.13 confirmed working |
| Ollama installed | Download from [ollama.ai](https://ollama.ai) |
| Llama 3.2 model pulled | Run `ollama pull llama3.2:1b` |
| FFmpeg (optional) | Required only for `.mp4`, `.mkv`, `.webm` audio extraction. Windows: place in `C:\ffmpeg\bin` |

### Step 1 — Install Python packages

```bash
# Important on Windows/Anaconda — prevents OpenMP conflict crash:
set KMP_DUPLICATE_LIB_OK=TRUE   # CMD
# OR
$env:KMP_DUPLICATE_LIB_OK="TRUE"  # PowerShell

pip install -r requirements.txt
```

> If `openai-whisper` fails with `ModuleNotFoundError: No module named 'pkg_resources'`, first run `pip install setuptools` then retry.

### Step 2 — Pull Llama model (first time only)

```bash
ollama pull llama3.2:1b
```

Check available models:
```bash
ollama list
```

### Step 3 — Start Ollama daemon

Ollama must be running **before** starting `server.py`. In a separate terminal:

```bash
ollama serve
```

Wait until you see: `Listening on 127.0.0.1:11434`

> On Windows, you can also start it as a background process:
> ```powershell
> Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
> ```

### Step 4 — Start the Flask server

```powershell
# PowerShell (Windows)
$env:KMP_DUPLICATE_LIB_OK="TRUE"; python server.py
```

```bash
# Bash / CMD
KMP_DUPLICATE_LIB_OK=TRUE python server.py
```

You should see:
```
⏳ Loading Whisper model...
✅ Whisper ready!
⏳ Loading Translator...
✅ Translator ready!
⏳ Checking Ollama...
✅ Ollama is running!

====================================================
  MOM Generator — Powered by Ollama + Llama
  100% Free · 100% Offline · No API Key
  URL: http://localhost:5000
====================================================
```

> **First run:** Whisper downloads the `base` model (~139 MB) automatically. This only happens once; subsequent starts are instant.

### Step 5 — Open the app

Open your browser and go to: **http://localhost:5000**

You should see a **blue dot** with "All Systems Ready ✓ — Whisper + Ollama + Llama running."

---

## 10. Configuration & Environment

### `.env` / `.env.example`

The project supports a `.env` file in the project root (loaded via `python-dotenv`). Currently no variables are required for default operation, but the file is scaffolded for future use.

### Changing the LLM model

In `server.py`, find the `generate_mom()` function and change the `model` parameter:

```python
response = ollama.chat(
    model="llama3.2:1b",   # ← change to any pulled Ollama model
    ...
)
```

Larger models (e.g., `llama3.2:3b`, `llama3.1:8b`) produce higher-quality MOMs at the cost of slower generation. Pull first with `ollama pull <model-name>`.

### Changing the Whisper model size

In `server.py` at startup:

```python
whisper_model = whisper.load_model("base")
# Options: tiny | base | small | medium | large
# Larger = more accurate, slower, more RAM
```

### Changing the server port

At the bottom of `server.py`:

```python
app.run(host='0.0.0.0', port=5000, debug=False)
#                         ^^^^^ change this
```

---

## 11. Known Issues & Fixes Applied

These issues were encountered and resolved during development. They are documented here so a future developer does not hit them again.

### Issue 1 — `KMP_DUPLICATE_LIB_OK` crash on Windows/Anaconda

**Symptom:**
```
OMP: Error #15: Initializing libiomp5md.dll, but found libiomp5md.dll already initialized.
```
**Root cause:** Anaconda ships its own OpenMP DLL; PyTorch ships another. They conflict on Windows.

**Fix:** Set the environment variable before launching Python:
```powershell
$env:KMP_DUPLICATE_LIB_OK="TRUE"
```

---

### Issue 2 — `ollama==0.1.48` does not exist

**Symptom:**
```
ERROR: No matching distribution found for ollama==0.1.48
```
**Root cause:** `requirements.txt` was written with a non-existent version pinned.

**Fix:** Install without a version pin: `pip install ollama`  
**Current installed version:** `0.6.2`

---

### Issue 3 — `ollama.chat()` returns a Pydantic object, not a dict

**Symptom:** `TypeError: 'ChatResponse' object is not subscriptable` when accessing `response['message']['content']`

**Root cause:** Ollama Python SDK v0.4+ returns Pydantic model objects, not plain dicts.

**Fix applied in `server.py`:**
```python
# Old (broken with ollama >= 0.4.x):
return response['message']['content']

# New (works with all versions):
if hasattr(response, 'message'):
    return response.message.content
return response['message']['content']
```

---

### Issue 4 — `openai-whisper==20231117` fails to build on Python 3.13

**Symptom:**
```
ModuleNotFoundError: No module named 'pkg_resources'
Getting requirements to build wheel did not run successfully.
```
**Root cause:** The pinned old version of openai-whisper uses an old `setup.py` that relies on `pkg_resources`, removed from Python 3.13 stdlib.

**Fix:** Install without version pin to get the latest wheel: `pip install openai-whisper`  
**Current installed version:** `20250625`

---

### Issue 5 — `GET /` returns 404 (Flask doesn't serve HTML by default)

**Symptom:** Navigating to `http://localhost:5000` shows a 404 page.

**Root cause:** Flask doesn't know about `mom_generator.html` unless explicitly told.

**Fix applied in `server.py`:** Added a startup routine that copies `mom_generator.html` to `./static/` and a Flask route:
```python
@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('mom_generator.html')
```

---

## 12. Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| Blue dot not showing (stays yellow) | Ollama not running | Run `ollama serve` in a separate terminal |
| `❌ Ollama not found!` in server logs | Ollama daemon stopped | Restart with `ollama serve` |
| Server crashes immediately on start | OpenMP DLL conflict | Set `$env:KMP_DUPLICATE_LIB_OK="TRUE"` |
| Audio file gives "No module named whisper" | Whisper not installed | `pip install openai-whisper` |
| Audio transcription fails / no output | FFmpeg not found | Install FFmpeg, place in `C:\ffmpeg\bin` |
| Gujarati text not translating | `deep-translator` not installed | `pip install deep-translator==1.11.4` |
| `ModuleNotFoundError: No module named 'langdetect'` | Package missing | `pip install langdetect==1.0.9` |
| MOM output is very short or poor quality | Small model (1b) | Switch to `llama3.2:3b` or larger (`ollama pull`) |
| `ollama.chat()` TypeError | Stale code with old SDK | Ensure response is accessed as `.message.content` not `['message']['content']` |
| Port 5000 already in use | Another process on port 5000 | Kill it: `netstat -ano \| findstr :5000` then `taskkill /PID <pid> /F` |

---

## 13. Future Roadmap

The `IMPLEMENTATION_PLAN.md` describes a full-scale upgrade to a **Community Meeting Management Platform**. Key planned features:

### Near-term (quality of life)
- [ ] Export MOM as `.docx` (Word) or `.pdf`
- [ ] Copy-to-clipboard improvement (rich text format)
- [ ] Dark mode toggle in UI
- [ ] More Indian languages: Marathi, Telugu, Tamil, Kannada

### Medium-term (feature expansion)
- [ ] Real-time live transcription (WebSocket audio streaming to Whisper)
- [ ] Speaker diarization (who said what)
- [ ] Meeting scheduling and invitations
- [ ] Action item tracker (Kanban board)
- [ ] Email MOM to attendees automatically

### Long-term (platform upgrade)
- [ ] Migrate backend to **FastAPI** + **Celery** for async processing
- [ ] Migrate frontend to **React 18** + **TypeScript** + **Vite**
- [ ] Add **PostgreSQL** for meeting history and user management
- [ ] Add **ChromaDB** for semantic search over past MOMs
- [ ] JWT-based authentication with roles (Admin / Organiser / Participant)
- [ ] Docker Compose deployment (`docker-compose.yml` is already scaffolded)

---

## License

Free for personal and organisational use.

---

*Last updated: May 2026 | Status: ✅ Running and tested on Windows (Python 3.13, Ollama 0.6.2, Llama 3.2:1b)*
