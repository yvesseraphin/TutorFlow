# TutorFlow

**Your AI Tutor. Your Learning Flow. Teach. Understand. Improve.**

An intelligent, adaptive mathematics learning platform combining cognitive science with Gemini AI to deliver personalized one-to-one tutoring, real-time misconception diagnosis, dynamic study material generation, and Cognitive Twin analytics.

---

## 🌟 Key Features

- **Personalized AI Classroom & Whiteboard** — Interactive live lessons with Socratic tutoring guidance, Konva interactive whiteboard, and real-time chat.
- **Dynamic AI Study Material Generation** — Instantly generate personalized study guides, lesson notes, practice worksheets, mindmaps, and flashcards powered by Gemini AI.
- **Real-Time Misconception Diagnosis** — Automated pattern recognition detects algebraic and sign errors, updating individual weakness profiles.
- **Cognitive Twin Analytics** — Time-series confidence snapshots, learning style blend analysis (Visual, Analytical, Example-driven), forgetting curve retention tracking, and skill mastery progress.
- **Full Supabase Integration** — Secure authentication (Email/Password & Google OAuth), Row Level Security (RLS) policies, and structured PostgreSQL database schemas.
- **Unified Notification System** — Top full-width status and notification banner across all authentication and profile workflows.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide Icons, Konva Whiteboard, Vanilla CSS with Google Fonts (Outfit & Plus Jakarta Sans).
- **Backend**: Python, FastAPI, Pydantic v2, Supabase Python SDK, Google GenAI SDK (Gemini 2.5 / 3.7 Flash).
- **Database & Auth**: Supabase (PostgreSQL with RLS, auth schema, pgcrypto).

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)

1. Create a project at [Supabase](https://supabase.com).
2. Go to **Dashboard > SQL Editor** and execute the contents of `backend/supabase/schema.sql`.
3. Enable **Email/Password** authentication in **Authentication > Providers**.

### 2. Backend Setup

```bash
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your credentials
cp .env.example .env
```

Set the following in `backend/.env`:
```env
PROJECT_NAME="TutorFlow API"
FRONTEND_ORIGINS="http://localhost:5173"
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🧪 Build & Verification

```bash
# Verify Frontend Production Build
cd frontend
npm run build

# Verify Backend Syntax & Startup
cd backend
python -m py_compile main.py
```

---

## 📄 License

© 2026 TutorFlow AI. All rights reserved.
