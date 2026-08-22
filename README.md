# TutorFlow

Your AI Tutor. Your Learning Flow.

An intelligent, adaptive learning platform that combines cognitive science with AI to deliver personalized mathematics education.

## Features

- **AI-Powered Lessons** — Adaptive learning paths that adjust to your pace
- **Cognitive Twin** — A digital model that understands your strengths and learning gaps
- **Knowledge Graph** — Visual mapping of concept mastery and connections
- **Real-Time Progress** — Track streaks, mastery scores, and confidence metrics

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Python (FastAPI)
- **Styling**: Vanilla CSS with Plus Jakarta Sans & Outfit fonts

## Getting Started

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Required configuration

The API requires a Supabase project with Email/Password authentication enabled. Run `backend/supabase/schema.sql` in its SQL editor, then copy `backend/.env.example` to `backend/.env` and provide the Supabase and OpenAI keys. Copy `frontend/.env.example` to `frontend/.env` when the API is not running at the default local address.

The application no longer creates demo accounts or mock learning data when the backend is unavailable. Configure the services before signing in.

### Verification

```bash
cd frontend
npm run build

cd ../backend
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

## License

© 2026 TutorFlow AI. All rights reserved.
