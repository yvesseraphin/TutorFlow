# 🎓 TutorFlow — AI-Powered Personal Socratic Tutor & Cognitive Classroom

> **Hackathon Submission & Solution Architecture Overview**  
> *Empowering every student with an adaptive, 1-on-1 AI cognitive tutor that diagnoses misconceptions in real-time, visualizes AI reasoning, generates personalized study materials, and tracks individual learning velocity.*

---

## 📌 Problem Statement

Traditional educational platforms follow a **static, one-size-fits-all approach**. Students face critical learning bottlenecks:
1. **Lack of Real-Time 1-on-1 Socratic Guidance**: Standard LMS tools give static answer keys without step-by-step reasoning or adaptive probing.
2. **Undetected Cognitive Misconceptions**: Misconceptions (e.g., algebraic sign flips, formula misapplications) compound over time because homework checkers only mark answers correct or incorrect without diagnosing *why*.
3. **Generic & Non-Personalized Materials**: Flashcards, practice quizzes, and lesson summaries do not adapt to individual learning styles (Visual vs. Analytical vs. Example-driven).
4. **Lack of Transparent AI Reasoning**: Standard AI chat tools act as black boxes, giving direct answers rather than guiding students through metacognitive reasoning steps.

---

## 🚀 The TutorFlow Solution

**TutorFlow** is a next-generation AI educational ecosystem combining **Socratic Tutoring Methodology**, **Google Gemini 2.5/3.0 Multi-modal Intelligence**, and **Cognitive Twin Analytics**.

### Key Innovations:
- 🧠 **Socratic AI Tutor**: Uses step-by-step questioning to guide students to answers instead of giving away solutions, building deep retention and problem-solving confidence.
- 🎯 **Real-Time Misconception Diagnosis**: Automatically parses student responses to detect pattern errors (e.g., sign errors, misapplied order of operations), updating their cognitive profile instantly.
- ⚡ **Dynamic Study Material Generator**: Instantly generates customized lesson notes, practice worksheets, interactive flashcards, and conceptual mindmaps tailored to the student's current mastery level.
- 📊 **Cognitive Twin Analytics**: Tracks student confidence over time, models forgetting curves, determines individual learning style blend, and identifies skill gaps.
- 🔍 **Transparent AI Reasoning Center**: Renders multi-step agentic reasoning trees so students and teachers can follow the AI tutor's logical thought process.

---

## 🛠️ Complete Tech Stack

| Layer | Technologies & Tools | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React (Vite)**, React Router v6 | Ultra-fast single-page application with modern component architecture |
| **UI & Styling** | Vanilla CSS (CSS Variables, Dark Glassmorphism), Lucide React Icons | Sleek, modern aesthetic with high performance and accessibility |
| **Interactive Canvas** | **Konva / React-Konva** | Real-time interactive digital whiteboard for math, diagrams, and problem solving |
| **Backend API** | **Python (FastAPI)**, Uvicorn, Pydantic v2 | High-throughput asynchronous RESTful backend API |
| **AI / LLM Orchestration** | **Google Gemini AI SDK** (`google-genai`), Gemini 2.5 Flash | Socratic dialog generation, diagnostic assessment, and study asset generation |
| **Database & Auth** | **Supabase** (PostgreSQL, Row Level Security, Auth Services) | Secure authentication, user management, and real-time schema storage |
| **Security** | Supabase Auth (JWT), Passwords, `pgcrypto`, CORS middleware | Enterprise-grade auth & data security |

---

## 🏗️ System Architecture & Workflow

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            React Frontend                               │
 │   (AI Classroom | Cognitive Twin Dashboard | Reasoning Center | Profile) │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │ REST API / JSON
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                           FastAPI Backend                               │
 │                                                                         │
 │  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────────────┐  │
 │  │ Auth & Profile  │   │  Tutor Engine   │   │  Cognitive Twin API   │  │
 │  └────────┬────────┘   └────────┬────────┘   └───────────┬───────────┘  │
 └───────────┼─────────────────────┼───────────────────────┼───────────────┘
             │                     │                       │
             ▼                     ▼                       ▼
 ┌──────────────────────┐  ┌────────────────┐  ┌──────────────────────────┐
 │    Supabase Auth     │  │ Google Gemini  │  │   Supabase PostgreSQL    │
 │ (Users & Profiles)   │  │   AI Engine    │  │ (Sessions, Analytics,    │
 └──────────────────────┘  └────────────────┘  │     Weaknesses, Mastery) │
                                               └──────────────────────────┘
```

---

## ✨ Key Features Breakdown

### 1. 🎓 Socratic AI Classroom & Interactive Whiteboard
- Live conversation turn-taking powered by Google Gemini.
- Diagnostic response analysis that catches misconceptions during conversation.
- Konva interactive canvas for drawing, solving equations, and visualizing concepts.

### 2. ⚡ Dynamic AI Study Asset Generator
- **Lesson Summaries**: Key takeaways tailored to student reading level.
- **Practice Worksheets**: Step-by-step problem sets with adaptive difficulty.
- **Flashcards & Mindmaps**: High-retention study cards and structured conceptual trees.

### 3. 📊 Cognitive Twin Dashboard
- **Learning Style Blend**: Quantifies visual, analytical, and example-driven traits.
- **Forgetting Curve Retention**: Predicts retention rates based on spaced repetition data.
- **Active Misconception Radar**: Highlights specific areas needing targeted practice.

### 4. 🧠 Agentic AI Reasoning Center
- Displays step-by-step prompt decomposition, hypothesis generation, and verification turns.
- Gives full transparency into how the AI tutor crafts its hints and diagnostic assessments.

---

## 🚀 How to Run the Project Locally

Follow this complete step-by-step guide to get TutorFlow running on your local machine.

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **Python**: v3.10 or higher ([Download](https://www.python.org/))
- **Git**: ([Download](https://git-scm.com/))
- A **Supabase** account (Free tier works perfectly: [https://supabase.com](https://supabase.com))
- A **Google Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/))

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/yvesseraphin/TutorFlow.git
cd TutorFlow
```

---

### Step 2: Database Setup (Supabase)

1. Log into [Supabase Dashboard](https://supabase.com) and create a new project.
2. Navigate to **SQL Editor** in your Supabase project dashboard.
3. Open [`backend/supabase/schema.sql`](file:///c:/Users/MANZI%20SHIMWA%20Yves%20S/Documents/TutorFlow/backend/supabase/schema.sql) in this repository, copy its entire contents, paste it into the SQL Editor, and click **Run**.
   *This initializes the `profiles`, `tutor_sessions`, `session_messages`, `misconceptions`, `skill_mastery`, and `analytics_events` tables alongside Row Level Security (RLS) policies.*
4. Go to **Authentication > Providers** in Supabase and ensure **Email** is enabled.

---

### Step 3: Backend Setup & Run

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **On Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **On macOS/Linux:**
     ```bash
     python -m venv .venv
     source .venv/bin/activate
     ```

3. Install required dependencies:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration file inside `backend/`:
   Create a file named `.env` in `backend/` with the following variables:
   ```env
   PROJECT_NAME="TutorFlow API"
   FRONTEND_ORIGINS="http://localhost:5173"
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   GEMINI_API_KEY="your-gemini-api-key"
   GEMINI_MODEL="gemini-2.5-flash"
   ```
   *(Replace with your actual keys from Supabase Dashboard > Project Settings > API and Google AI Studio).*

5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will now be running at `http://localhost:8000`. You can test health at `http://localhost:8000/health` or view Swagger docs at `http://localhost:8000/docs`.

---

### Step 4: Frontend Setup & Run

1. Open a new terminal window/tab and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 📡 API Reference Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | API Health Check (reports Supabase & Gemini connectivity status) |
| `/api/v1/auth/signup` | `POST` | User registration via Supabase Auth |
| `/api/v1/auth/login` | `POST` | User authentication via Supabase Auth |
| `/api/v1/tutor/sessions` | `POST` | Initialize a new Socratic tutoring session |
| `/api/v1/tutor/sessions/{id}/messages` | `POST` | Send student message; generates Gemini response & updates weaknesses |
| `/api/v1/tutor/attempts` | `POST` | Submit problem attempt; updates skill mastery scores |
| `/api/v1/twin/profile/{user_id}` | `GET` | Fetch Cognitive Twin profile & learning style breakdown |
| `/api/v1/analytics/dashboard/{user_id}` | `GET` | Retrieve real-time progress analytics & learning velocity |
| `/api/v1/curriculum/generate` | `POST` | Dynamically generate personalized study plans & materials |
| `/api/v1/profile` | `GET / PUT` | Retrieve or update user profile and preferences |

---

## 🧪 Verification & Build Commands

```bash
# Backend Syntax & Compile Check
cd backend
python -m py_compile main.py

# Frontend Production Build Test
cd frontend
npm run build
```

---

## 🤝 Project Structure

```
TutorFlow/
├── backend/
│   ├── main.py              # FastAPI entry point & CORS configuration
│   ├── config.py            # Pydantic environment configuration settings
│   ├── requirements.txt     # Python backend dependencies
│   ├── curriculum.py        # Curriculum generation logic & rules
│   ├── routers/             # API Router modules
│   │   ├── analytics.py     # Real-time dashboard analytics router
│   │   ├── auth_supabase.py # Supabase auth integration router
│   │   ├── curriculum.py    # Adaptive curriculum router
│   │   ├── profile.py       # Profile management router
│   │   ├── reasoning.py     # Agentic reasoning center router
│   │   ├── tutor.py         # Socratic tutoring router
│   │   └── twin.py          # Cognitive twin profile router
│   ├── services/            # Service layer integrations
│   │   ├── ai.py            # Google Gemini AI SDK interface
│   │   ├── supabase.py      # Supabase database client interface
│   │   └── tutor.py         # Tutor session orchestration & prompts
│   └── supabase/
│       └── schema.sql       # PostgreSQL database schema & RLS policies
├── frontend/
│   ├── package.json         # Frontend dependencies & scripts
│   ├── index.html           # HTML5 entry template with typography
│   ├── vite.config.js       # Vite build configuration
│   └── src/
│       ├── main.jsx         # React DOM entry point
│       ├── App.jsx          # Router & Navigation root component
│       ├── components/      # UI components (Whiteboard, NotificationBanner, etc.)
│       ├── pages/           # Application views (AIClassroom, StudentDashboard, Profile, etc.)
│       └── lib/             # API client & Supabase helpers
├── README.md                # Comprehensive root documentation
└── .gitignore               # Ignored dependencies & secrets
```

---

## 📄 License & Hackathon Submission

Built with ❤️ for AI Hackathons 2026.  
© 2026 TutorFlow Team. All rights reserved.
