# TutorFlow

## An Adaptive AI Teacher That Learns How You Learn — and Adapts How It Teaches in Real Time

TutorFlow is an adaptive, multimodal AI teacher that personalizes not only **what** a student learns, but **how the student is taught**. 

During a lesson, TutorFlow observes student thinking, diagnoses the underlying cause of mistakes, switches teaching strategies dynamically, repairs missing prerequisites, renders synchronized whiteboard operations, and continuously updates an evolving cognitive learner model so future lessons become progressively more effective.

---

## Core Problem in Digital Education

Education platforms often measure whether a student is **Correct** or **Incorrect** without understanding the reasoning process between the question and the answer.

Two students can make the exact same error for completely different reasons (e.g., a sign-inversion misconception vs. an arithmetic slip vs. a missing prerequisite). Traditional tools respond with generic explanations or binary grades.

**TutorFlow changes this paradigm: A student mistake is not an error; it is pedagogical information.**

---

## Architecture Overview

```
                          TUTORFLOW AI TEACHING ENGINE
                                       |
              +------------------------+------------------------+
              |                        |                        |
              v                        v                        v
        LEARNER MODEL           KNOWLEDGE GRAPH         CURRICULUM AI
        - Mastery Scores        - Prerequisite Chains   - Standards
        - SM-2 Stability        - Concept Dependencies  - Diagnostic Mapping
        - Misconception Logs    - Difficulty Tiers
              |                        |                        |
              +------------------------+------------------------+
                                       |
                                       v
                             DYNAMIC LESSON PLANNER
                                       |
                                       v
                            TEACHING STRATEGY ENGINE
             (Visual Intuition | Socratic | Protégé Peer | Decomposition)
                                       |
              +------------------------+------------------------+
              |                        |                        |
              v                        v                        v
        AI VOICE TEACHER         AI WHITEBOARD AGENT      AI DIALOGUE
        - Low-latency Audio      - Balance Scale Model   - Contextual Q&A
        - Spoken Explanations    - Sign Flip Animations  - Progressive Hints
              |                        |                        |
              +------------------------+------------------------+
                                       |
                                       v
                          MULTIMODAL STUDENT REASONING
                          (Voice | Canvas | Handwriting)
                                       |
              +------------------------+------------------------+
              |                        |                        |
              v                        v                        v
      REASONING BREAKDOWN     MISCONCEPTION DIAGNOSIS   COGNITIVE ENERGY
      - Intermediate Steps    - Root Cause Analysis     - Fatigue Detection
              |                        |                        |
              +------------------------+------------------------+
                                       |
                                       v
                         REAL-TIME TEACHING ADAPTATION
              +------------------------+------------------------+
              |                        |                        |
              v                        v                        v
         RE-EXPLAIN                PROTÉGÉ                PREREQUISITE
        VISUALLY                PEER CHALLENGE              RECOVERY
              |                        |                        |
              +------------------------+------------------------+
                                       |
                                       v
                             TEACH-BACK VERIFICATION
                                       |
                                       v
                           TRANSFER CHALLENGE CONFIRMATION
                                       |
                                       v
                             AI TEACHER REFLECTION
                             (ai_learner_memories)
                                       |
                                       v
                         UPDATED STUDENT LEARNER MODEL
```

---

## Complete Feature Matrix

### 1. Real-Time Multimodal Voice Teacher
- **Gemini Live Integration**: Bidirectional real-time audio interaction over WebSockets with low latency.
- **Context-Aware Spoken Explanations**: Understands interruptions, student questions, and spoken confusion within the context of the active problem.

### 2. Intelligent Whiteboard & Generative UI
- **Equation Rendering**: Real-time synchronized LaTeX equation writing (`write_math_equation`).
- **Interactive Balance Scale (`display_interactive_balance_scale`)**: Generative UI balance model illustrating algebraic equivalence.
- **Animated Transformations (`animate_step_transformation`)**: Color-coded term movements with sign-flip indicators.
- **Whiteboard Highlighting (`highlight_board`)**: Emphasizes operations and intermediate terms.

### 3. Real-Time Teaching Strategy Adaptation
- Dynamically shifts strategies based on student understanding:
  - **Visual Intuition**: Balance scale diagrams and number line models.
  - **Concrete Analogy**: Real-world metaphors for abstract math rules.
  - **Step-by-Step Decomposition**: Isolating complex multi-step operations.
  - **Socratic Guided Discovery**: Asking leading questions so students discover rules independently.
  - **Teach-Back Verification**: Prompting students to explain concepts in their own words.
  - **Transfer Practice**: Presenting novel variations to verify genuine comprehension.

### 4. AI Misconception Diagnosis vs. Binary Grading
- Evaluates intermediate reasoning steps rather than final answers alone.
- Classifies root causes (e.g., sign reversal on transposition, unlike terms combination, distributive errors).
- Automatically records diagnoses to `ai_mistake_logs` for targeted review.

### 5. Multi-Agent Protégé Effect (AI Peer Student Mode)
- Introduces virtual AI peer student (*Alex*) who proposes attempts with subtle misconceptions.
- The human student teaches and corrects Alex, cementing mastery through the Protégé Effect.
- The primary AI Teacher evaluates the explanation and awards mastery points.

### 6. Cognitive Energy & Burnout Adaptation
- Supports multiple cognitive modes (`high_energy_socratic`, `normal_guided`, `fatigued_visual_microsteps`).
- When fatigue or repeated struggle is detected, the teacher slows down, simplifies language, and switches to bite-sized visual micro-steps.

### 7. Student-Work Vision & Handwritten Reasoning Analysis
- Processes photos of handwritten work and digital canvas drawings.
- Parses intermediate steps, locates reasoning breaks, and generates remedial practice.

### 8. SuperMemo SM-2 Spaced Repetition Engine
- Dynamically updates topic retention stability and mastery scores.
- Computes review dates to prevent forgetting.
- Powers adaptive flashcard generation targeting individual student error patterns.

### 9. Knowledge Graph & Prerequisite Gap Recovery
- Structured dependency graph covering 8th, 9th, and 10th-grade mathematics.
- Detects missing prerequisite knowledge and automatically schedules rapid foundation recovery before advancing.

### 10. AI Teacher Reflection & Long-Term Memory
- After breakthroughs or session completions, the AI teacher evaluates its own instructional strategy and records persistent memories in `ai_learner_memories`.

---

## Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Backend Framework** | **Python (FastAPI)**, Uvicorn, Pydantic v2 | Asynchronous REST and WebSocket API |
| **AI / Real-Time Live** | **Google Gemini Live API** (`google-genai`), Gemini Flash | Bidirectional audio streaming, vision reasoning, and tool calling |
| **Database & Auth** | **Supabase** (PostgreSQL, Row Level Security, Auth) | Relational persistence, profile management, and mistake logging |
| **Frontend Framework** | **React (Vite)**, React Router v6 | Single-page client application |
| **Interactive Canvas** | **Konva / React-Konva** | Real-time digital whiteboard and annotation surface |
| **Spaced Repetition** | **SuperMemo SM-2 Algorithm** | Mathematical retention curve modeling and review scheduling |

---

## Database Architecture (Supabase PostgreSQL)

- `profiles`: Student persona, grade level, curriculum, teaching style, learning pace, and cognitive energy mode.
- `student_learner_model`: Topic-level mastery scores, attempts, correct counts, and SM-2 retention stability.
- `ai_mistake_logs`: Diagnosed misconceptions, problem context, student response, root cause, and remedial interventions.
- `ai_learner_memories`: Long-term AI teacher reflections on strategy effectiveness and breakthroughs.
- `tutoring_sessions`: Session duration, understanding state, teaching strategy, and AI-generated summaries.
- `revision_flashcards`: Active-recall flashcards with SM-2 interval days, ease factors, and due dates.
- `diagnostic_assessments` & `diagnostic_questions`: Pre-lesson readiness evaluations and gap isolation.
- `whiteboard_actions`: Synchronized visual actions, coordinates, and math formulas.

---

## Getting Started Locally

### Prerequisites
- **Node.js**: v18+
- **Python**: v3.10+
- **Supabase Account**: ([supabase.com](https://supabase.com))
- **Google Gemini API Key**: ([aistudio.google.com](https://aistudio.google.com))

### 1. Clone the Repository
```bash
git clone https://github.com/yvesseraphin/TutorFlow.git
cd TutorFlow
```

### 2. Database Setup
1. In your Supabase project, navigate to the **SQL Editor**.
2. Run `backend/supabase/schema.sql` to initialize all tables, indexes, and RLS policies.

### 3. Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Create `.env` inside `backend/`:
```env
PROJECT_NAME="TutorFlow API"
FRONTEND_ORIGINS="http://localhost:5173"
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

Start the backend server:
```bash
uvicorn backend.main:app --reload --port 8080
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

Create `.env` inside `frontend/`:
```env
VITE_API_BASE_URL="http://localhost:8080/api/v1"
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

Start the frontend development server:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Verification & Testing
Run backend logic and knowledge graph unit tests:
```bash
python -m backend.test_logic
```
Build frontend client bundle:
```bash
cd frontend
npm run build
```
