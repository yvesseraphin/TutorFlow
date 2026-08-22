# TutorFlow Backend API

High-performance FastAPI asynchronous backend powered by Google Gemini AI SDK and Supabase PostgreSQL.

---

## 🛠️ Requirements & Prerequisites

- Python 3.10+
- Supabase account with PostgreSQL database
- Google Gemini API key (`gemini-2.5-flash`)

---

## 🚀 Setup & Execution Guide

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

### 3. Virtual Environment & Execution (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 📡 Router & Endpoint Summary

- **Health Check**: `GET /health` - Returns service and API configuration status.
- **Authentication**: `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`
- **Socratic Tutor**: `POST /api/v1/tutor/sessions`, `POST /api/v1/tutor/sessions/{id}/messages`, `POST /api/v1/tutor/attempts`
- **Cognitive Twin**: `GET /api/v1/twin/profile/{user_id}`
- **Reasoning Center**: `GET /api/v1/reasoning/trace/{session_id}`
- **Analytics**: `GET /api/v1/analytics/dashboard/{user_id}`
- **Curriculum**: `POST /api/v1/curriculum/generate`
- **Profile**: `GET /api/v1/profile`, `PUT /api/v1/profile`
