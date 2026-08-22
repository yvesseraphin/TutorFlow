# TutorFlow API

## Setup

1. In Supabase, create a project and enable Email/Password sign-in.
2. Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor.
3. Copy `.env.example` to `.env` and fill every value. Keep `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` on the server only.
4. Create an isolated virtual environment, install, and start:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Using `.venv` avoids conflicts with packages installed for other Python projects.

`GET /health` reports whether Supabase and Gemini are configured without exposing secrets.

## API

- `POST /api/v1/auth/signup` and `POST /api/v1/auth/login` use Supabase Auth.
- `POST /api/v1/tutor/sessions` creates a persisted lesson.
- `POST /api/v1/tutor/sessions/{id}/messages` saves the chat turn, teaches with Gemini, and returns active weaknesses.
- `POST /api/v1/tutor/attempts` persists answer accuracy and updates skill mastery.
