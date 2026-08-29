# TutorFlow Backend API

High-performance FastAPI asynchronous backend powered by Google Gemini Live API and Supabase PostgreSQL.

---

## Requirements & Prerequisites

- Python 3.10+
- Supabase account with PostgreSQL database
- Google Gemini API key

---

## Setup & Execution Guide

### 1. Database Initialization
Run `supabase/schema.sql` in your Supabase project's **SQL Editor**.

### 2. Environment Configuration
Create `.env` in `backend/`:
```env
PROJECT_NAME="TutorFlow API"
FRONTEND_ORIGINS="http://localhost:5173"
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

### 3. Execution (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8080
```

---

## Key Routers & Endpoints

- **Live Multimodal Tutor WebSocket**: `WS /api/v1/live-tutor`
- **Adaptive Tutor Services**: `GET /api/v1/tutor/materials`, `POST /api/v1/tutor/evaluate-work`, `POST /api/v1/tutor/teach-back/evaluate`, `POST /api/v1/tutor/peer-student/simulate`, `POST /api/v1/tutor/peer-student/evaluate`, `POST /api/v1/tutor/cognitive/adapt`, `GET /api/v1/tutor/lesson-plan`, `POST /api/v1/tutor/session/end`
- **Diagnostic Engine**: `POST /api/v1/diagnostics/generate`, `POST /api/v1/diagnostics/submit`
- **Flashcards & Spaced Repetition**: `GET /api/v1/flashcards/due`, `POST /api/v1/flashcards/review`, `POST /api/v1/flashcards/generate`
- **Authentication**: `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`
- **Profiles**: `GET /api/v1/profile`, `PUT /api/v1/profile`
- **Health Check**: `GET /health`
