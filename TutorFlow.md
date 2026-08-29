# TutorFlow

## An AI Teacher That Learns How You Learn — and Adapts How It Teaches in Real Time

---

### Project Summary

**TutorFlow** is an adaptive, multimodal AI teacher that personalizes not only **what** a student learns, but **how the student is taught**.

During a live lesson, TutorFlow observes student thinking in real time through voice, typed text, canvas drawings, and handwritten work. It diagnoses where reasoning breaks down, pinpoints underlying misconceptions, repairs missing prerequisites, renders synchronized whiteboard operations, and continuously updates an evolving cognitive learner model so future lessons become progressively more effective.

> **"TutorFlow does not simply learn what you know. It learns how to teach you."**

---

## Inspiration

The inspiration for TutorFlow originated from a fundamental principle in educational psychology known as **Bloom's 2 Sigma Problem**:
Students tutored one-on-one using mastery learning techniques perform two standard deviations better than students in conventional classrooms.

However, existing AI educational tools and chatbots fail to replicate effective one-on-one human tutoring:
1. **Chatbots act like search engines**: They answer questions directly, depriving students of the metacognitive struggle needed for deep retention.
2. **Grading is purely binary**: Standard homework checkers grade answers as **Correct** or **Incorrect** without diagnosing *why* a student arrived at that answer.
3. **One-size-fits-all explanations**: Two students who make the same mistake for completely different reasons (e.g. an arithmetic slip vs. a foundational sign-reversal misconception) receive identical textbook text dumps.
4. **Stateless interactions**: Conventional tools reset every session, forgetting which analogies worked, which prerequisites are missing, and how the student responds best.

We built TutorFlow to transform AI from an **answer generator** into an **adaptive private teacher** that observes thinking, adapts pedagogical strategies in real time, and retains long-term memory of how each student learns best.

---

## The Problem We Solve

In traditional digital education, a mistake is treated as a penalty. In effective human tutoring, **a mistake is pedagogical information**.

A wrong answer on $2x + 4 = 10 \implies x = 7$ could stem from:
- A sign-inversion misconception on transposition ($2x = 10 + 4$)
- An order-of-operations error (dividing by 2 before subtracting 4)
- A missing prerequisite in signed arithmetic
- A careless calculation slip

Traditional platforms treat all four identically. TutorFlow analyzes intermediate reasoning, pinpoints the root cause, and immediately adapts its teaching method.

---

## What TutorFlow Does & Key Features

### 1. Multimodal Real-Time Voice & Whiteboard Synchronization
- **Gemini Live API Integration**: Bidirectional, low-latency spoken audio streaming over WebSockets.
- **Real-Time Board Sync**: As the AI teacher speaks, it simultaneously writes LaTeX equations, draws diagrams, highlights terms, and animates algebraic balancing on the digital whiteboard.

### 2. AI Misconception Diagnosis vs. Binary Grading
- Rather than checking only final answers, TutorFlow analyzes step-by-step reasoning.
- Classifies misconceptions into structured categories (e.g., *Sign Reversal on Transposition*, *Combining Unlike Terms*, *Distributive Property Negation*).
- Logs diagnosed errors to `ai_mistake_logs` for targeted spaced repetition.

### 3. Dynamic Teaching Strategy Adaptation
The AI teacher fluidly shifts between 6 pedagogical modes based on student comprehension:
- **Visual Intuition**: Balance scale models and number line representations.
- **Concrete Analogy**: Real-world metaphors for abstract mathematical rules.
- **Step-by-Step Decomposition**: Isolating complex multi-step problems into single cognitive actions.
- **Socratic Guided Discovery**: Asking targeted leading questions so the student discovers rules independently.
- **Protégé Peer Teaching**: Having the student teach an AI peer.
- **Teach-Back Verification & Transfer Practice**: Confirming conceptual mastery with novel variations.

### 4. Multi-Agent Protégé Effect (AI Peer Student Mode)
- In educational research, the **Protégé Effect** demonstrates that students master concepts most deeply when teaching others.
- TutorFlow introduces a virtual AI peer student (*Alex*) who proposes a problem attempt with a subtle misconception.
- The human student explains and corrects Alex's work, while the primary AI Teacher moderates and verifies understanding.

### 5. Cognitive Energy & Burnout Adaptation
- Learning is state-dependent. TutorFlow tracks cognitive energy (`high_energy_socratic`, `normal_guided`, `fatigued_visual_microsteps`).
- When student hesitation or fatigue is detected, TutorFlow automatically reduces formula density, simplifies language, and switches to lightweight visual balance analogies.

### 6. Multimodal Student-Work Vision Analyzer
- Students can photograph handwritten scratch paper or draw directly on the canvas.
- TutorFlow parses intermediate steps, pinpoints the line where reasoning broke down, and returns tailored practice.

### 7. SuperMemo SM-2 Spaced Repetition Engine
- Dynamically models memory decay curves for every topic and skill.
- Computes retention stability ($S_{new} = S \times 1.5$) and automatically schedules review dates.
- Generates adaptive flashcards specifically targeting past diagnosed misconceptions.

### 8. Hierarchical Knowledge Graph & Prerequisite Gap Recovery
- Dependency graph covering 8th, 9th, and 10th-grade mathematics.
- If a student's mastery in a prerequisite drops below 65%, TutorFlow schedules a rapid 1-minute foundation review before teaching advanced concepts.

### 9. AI Teacher Reflection & Long-Term Memory
- At the end of each session, TutorFlow evaluates its own instructional strategy:
  * *Which analogies produced breakthrough moments?*
  * *Which explanations caused confusion?*
- Saves persistent teacher reflections in `ai_learner_memories` to personalize future sessions.

---

## System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 REACT CLIENT                                      |
|    - Live Voice Stream (Web Audio PCM)          - Interactive Whiteboard (Konva)  |
|    - Generative Balance Scale UI                - Dynamic Lesson Timeline         |
|    - Handwriting Vision Uploader                - Spaced Repetition Flashcards    |
+------------------------------------------+----------------------------------------+
                                           | WebSocket / REST API
                                           v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                    |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |  Live Tutor WS     |  | Adaptive Router      |  | AI Learner Service        |  |
|  |  (Bi-directional   |  | (/materials,         |  | (Knowledge Graph,         |  |
|  |   Gemini Live)     |  |  /evaluate-work,     |  |  SM-2 Retention Engine,   |  |
|  |                    |  |  /peer-student)      |  |  Prerequisite Mapping)    |  |
|  +---------+----------+  +----------+-----------+  +-------------+-------------+  |
+------------|------------------------|----------------------------|----------------+
             |                        |                            |
             v                        v                            v
+------------------------+ +----------------------+ +-------------------------------+
|    GOOGLE GEMINI AI    | |  SUPABASE POSTGRES   | |     SUPERMEMO SM-2 ENGINE     |
| - Gemini Live Audio    | | - profiles           | | - Retention Stability Multiplier|
| - Multimodal Vision    | | - student_learner    | | - Forgetting Curve Forecast   |
| - Tool Calling Engine  | | - ai_mistake_logs    | | - Dynamic Review Scheduler    |
| - Lesson Planner       | | - ai_memories        | |                               |
+------------------------+ +----------------------+ +-------------------------------+
```

---

## Tech Stack & Tools

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React 18, Vite, React Router v6** | High-performance single-page application |
| **Styling & UI** | **Vanilla CSS (CSS Variables, Dark Glassmorphism)** | Clean, accessible design system |
| **Canvas & Board** | **Konva / React-Konva** | Interactive digital whiteboard and coordinate plotting |
| **Backend** | **Python 3.10+, FastAPI, Uvicorn, Pydantic v2** | High-throughput asynchronous REST and WebSocket API |
| **AI Orchestration** | **Google Gemini Live API (`google-genai`)** | Real-time bidirectional voice, vision analysis, and tool calls |
| **Database & Auth** | **Supabase (PostgreSQL, Row Level Security, Auth)** | Secure relational data persistence and user management |
| **Retention Engine** | **SuperMemo SM-2 Mathematical Algorithm** | Spaced repetition intervals and memory decay tracking |

---

## Challenges We Faced & How We Overcame Them

1. **Sub-Second Real-Time Voice & Whiteboard Synchronization**:
   - *Challenge*: Synchronizing spoken explanations from Gemini Live with visual actions on the whiteboard without audio stuttering or tool execution lag.
   - *Solution*: Designed an asynchronous event-driven pipeline where tool declarations (`write_math_equation`, `highlight_board`, `display_interactive_balance_scale`) dispatch lightweight structured payloads over WebSockets while background audio streams concurrently.

2. **Differentiating Surface Slips from Deep Misconceptions**:
   - *Challenge*: Preventing the AI from misinterpreting a simple calculation error as a major conceptual breakdown.
   - *Solution*: Developed a two-stage evaluation prompt that isolates intermediate line-by-line algebraic transformations, cross-referencing errors against known misconception archetypes in the Knowledge Graph.

3. **Managing Cognitive Fatigue Without Disrupting Flow**:
   - *Challenge*: Detecting when a student is overwhelmed without requiring tedious manual surveys.
   - *Solution*: Built real-time cognitive mode adaptivity (`adapt_cognitive_load`) that dynamically scales explanation complexity, terminology density, and step sizes.

4. **Preventing Stateless AI Forgetting**:
   - *Challenge*: Standard LLM sessions lose context when the user leaves the page.
   - *Solution*: Implemented persistent database tables (`ai_mistake_logs`, `student_learner_model`, `ai_learner_memories`) that ground every new session in the student's complete historical learning trajectory.

---

## Accomplishments We're Proud Of

- **True Bidirectional Multimodal Live Tutoring**: Delivering a natural, low-latency voice teacher that simultaneously writes and draws on a synchronized digital whiteboard.
- **The Protégé Effect in AI**: Building a multi-agent mode where the student teaches an AI peer, turning passive learners into active teachers.
- **Closed Intelligence Loop**: TutorFlow not only teaches the student, but evaluates its own instructional choices at the end of every session, permanently recording what pedagogical strategies work best for each individual learner.

---

## What We Learned

- **Socratic Inquiry Over Direct Solutions**: Guiding students with progressive hints results in significantly higher concept retention than giving direct answers.
- **Visual Balance Models Accelerate Algebraic Comprehension**: Visualizing equations as physical balance scales eliminates sign-inversion errors faster than abstract symbolic rules.
- **Long-Term Memory is the Key to Trust**: Students feel genuinely supported when their AI tutor remembers their past struggles and celebrates their specific breakthroughs.

---

## What's Next for TutorFlow

- **Cross-Subject Knowledge Graph Expansion**: Extending hierarchical prerequisite trees into Physics, Chemistry, and Advanced Calculus.
- **Spatial / AR Whiteboard**: Bringing the interactive balance scale and 3D geometry models into Augmented Reality.
- **Collaborative Study Pods**: Allowing student study groups to solve multi-step challenges together with real-time AI coaching and moderation.

---

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Supabase Account
- Google Gemini API Key

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # On Windows
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`.