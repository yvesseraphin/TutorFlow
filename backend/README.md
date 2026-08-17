# TutorFlow API

## Setup

1. In Supabase, create a project and enable Email/Password sign-in.
2. Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor.
3. Copy `.env.example` to `.env` and fill every value. Keep `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` on the server only.
4. Install and start:

```powershell
cd backend
python -m pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

`GET /health` reports whether Supabase and OpenAI are configured without exposing secrets.

## API

- `POST /api/v1/auth/signup` and `POST /api/v1/auth/login` use Supabase Auth.
- `POST /api/v1/tutor/sessions` creates a persisted lesson.
- `POST /api/v1/tutor/sessions/{id}/messages` saves the chat turn, teaches with OpenAI, and returns active weaknesses.
- `POST /api/v1/tutor/attempts` persists answer accuracy and updates skill mastery.
- `POST /api/v1/tutor/realtime/connect` accepts a browser WebRTC SDP offer and returns the OpenAI SDP answer. Send a Supabase access token in `Authorization: Bearer <token>`.

The Realtime endpoint is a server-side WebRTC proxy: the OpenAI API key never reaches the browser. The browser should post its SDP offer to this endpoint and use the returned SDP answer to finish its peer connection.
