# TutorFlow — Comprehensive Project Architecture & Pitch Guide

> **An Adaptive, Multimodal AI Teacher That Learns How You Learn — and Adapts How It Teaches in Real Time.**

---

## 1. Executive Summary & Pitch Hook

### The 30-Second Elevator Pitch
Every student learns differently, yet digital education treats everyone the same. **TutorFlow** is not an answer bot or another textbook search engine—it is an **adaptive, multimodal AI private teacher**. Built on Google Gemini's native live bidirectional audio and vision streaming, TutorFlow talks with students in real time, synchronizes handwriting and diagrams on an interactive whiteboard, diagnoses the root causes of mistakes instead of giving binary scores, and continuously evolves a personalized cognitive learner model so future lessons become progressively more intuitive.

### The Educational Inspiration: Bloom’s 2 Sigma Problem
In 1984, educational psychologist Benjamin Bloom proved that the average student tutored one-on-one using mastery techniques performed **two standard deviations better** than students in a conventional classroom (the 98th percentile vs. the 50th percentile). 

For 40 years, scaling 1-on-1 human tutoring to every student on Earth was economically impossible. Large Language Models promised to solve this, but contemporary tools failed:
- **Chatbots are answer-dispensers**: They solve problems *for* the student rather than guiding them through productive metacognitive struggle.
- **Grading is purely binary**: Traditional platforms mark an answer as **Correct** or **Incorrect** without knowing *why* the student erred.
- **One-size-fits-all delivery**: Two students making the same mistake for entirely different reasons receive identical textbook explanations.
- **Amnesic interactions**: Standard AI sessions reset completely, forgetting which analogies sparked breakthroughs, what misconceptions persist, and what pace works best.

**TutorFlow bridges the 2-Sigma gap by combining real-time multimodal live interaction with an evolving long-term pedagogical memory.**

---

## 2. Core Feature Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     TUTORFLOW CORE CAPABILITIES                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  1. Live Multimodal Classroom     │ Gemini 2.5 Native Audio (24kHz output, 16kHz PCM stream)   │
│                                   │ Live synchronized teacher handwriting & KaTeX equations     │
│                                   │ Multi-page Konva digital canvas with graph dot overlays     │
│                                   │ Spatial non-overlapping engine with student stroke tracking │
├───────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│  2. AI Misconception Diagnosis    │ Step-by-step reasoning diagnosis (not binary pass/fail)     │
│                                   │ Root-cause error classification (Sign flip, Like-terms, etc)│
│                                   │ Automated mistake logging for targeted remediation          │
├───────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│  3. Adaptive Teaching Strategies  │ 6 fluid pedagogical modes (Visual Intuition, Analogy, etc.) │
│                                   │ Real-time cognitive energy and fatigue detection            │
│                                   │ Protégé Effect Mode: Student teaches AI peer "Alex"         │
├───────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│  4. Custom Class RAG Pipeline     │ Ingests PDFs, Word (.docx), TXT, and typed lecture notes    │
│                                   │ 768-dimensional Gemini vector embeddings in pgvector        │
│                                   │ Auto-synthesizes personalized multi-unit curriculum         │
├───────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│  5. In-Place Learning Resources   │ Embedded educational video lectures with concept summaries  │
│                                   │ Printable & downloadable PDF study guides with math proofs  │
│                                   │ Structured formula cheat-sheets and practice exercises      │
├───────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│  6. Spaced Repetition (SM-2)      │ SuperMemo SM-2 forgetting curve calculation (S_new = S×1.5) │
│                                   │ Automated review scheduling and retention optimization      │
│                                   │ Adaptive flashcard decks auto-generated from past errors    │
├───────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│  7. Knowledge Graph Recovery      │ Multi-grade dependency map across Algebra, Stats & Geometry │
│                                   │ Prerequisite deficit recovery (<65% mastery trigger)        │
│                                   │ AI Teacher post-session reflections and memory engine       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Feature Breakdown

### A. Real-Time Multimodal Live Classroom
- **Bidirectional Audio Streaming**: Direct duplex WebSockets connecting the browser's Web Audio API to Google Gemini's native live audio model (`gemini-2.5-flash-native-audio-latest`). Audio is captured at 16kHz PCM from the student's microphone and streamed in real time; the AI responds in 24kHz natural human speech.
- **Natural Conversational Pacing**:
  - The student's mic starts muted by default so the classroom initializes peacefully.
  - Natural address directive: The AI greets the student once and thereafter addresses them naturally as *"you"*, eliminating robotic repetition.
  - Disconnect deduplication: On transient network drops, the frontend automatically re-handshakes with `is_reconnect: true`. The AI seamlessly resumes without repeating greetings or stuttering.
- **Animated Teacher Handwriting**:
  - AI math equations are typeset via KaTeX and rendered on the whiteboard with natural teacher ink styling (`AnimatedTeacherHandwriting`).
  - Supports LaTeX formulas, transformation arrows (`arrow_label`), final answer boxing, and pedagogical notes.
- **Interactive Multi-Page Whiteboard**:
  - High-performance HTML5 canvas powered by `react-konva`.
  - Zero-latency local drawing with pen, highlighter, eraser, text, and geometric shapes.
  - Visible dot-grid overlay (`#94a3b8` radial pattern) designed specifically for coordinate graphing; rendered on a decoupled CSS overlay so canvas snapshots sent to AI vision remain 100% clean.
- **Spatial Non-Overlapping Engine**:
  - The whiteboard transmits stroke counts and page telemetry to the backend.
  - The AI is equipped with tools:
    - `write_math_equation`: Writes steps sequentially.
    - `clear_ai_writing`: Erases previous AI notes when moving to a new concept.
    - `clear_student_whiteboard`: Cleans the student canvas when a fresh problem begins, preventing messy overlaps.

---

### B. AI Misconception Diagnosis vs. Binary Grading
Traditional software checks whether the student's final answer equals $X$. If wrong, it gives zero partial credit and shows a generic answer key.

TutorFlow treats every mistake as a **window into student thinking**:
1. **Intermediate Step Inspection**: The student can click **"Check My Board"** or upload scratch paper. The vision analyzer inspects the student's handwritten work line-by-line.
2. **Taxonomy of Misconceptions**: Categorizes mistakes into cognitive patterns:
   - *Sign Reversal on Transposition* ($2x + 4 = 10 \implies 2x = 10 + 4$)
   - *Like-Terms Fallacy* ($3x + 4 \implies 7x$)
   - *Precedence Inversion* (evaluating addition before multiplication in PEMDAS)
   - *Axis Scale Misinterpretation* (in data displays and coordinate graphs)
3. **Targeted Remediation**: The AI addresses the root cause of the misconception with a targeted analogy before allowing the student to retry.
4. **Persistent Mistake Logging**: Logged in `ai_mistake_logs` to feed the SuperMemo SM-2 spaced repetition queue.

---

### C. Dynamic Teaching Strategy Engine
TutorFlow adapts its instructional persona based on real-time student performance:
- **Visual Intuition**: Models algebraic equations as balanced scales ($2x + 4 = 10$ represented as balanced weights).
- **Concrete Analogy**: Uses tangible real-world metaphors (e.g. PEMDAS as universal traffic laws; variables as mystery shoe boxes).
- **Step-by-Step Decomposition**: Isolates multi-step problems into single cognitive tasks to reduce working memory load.
- **Socratic Discovery**: Asks guided questions, leading the student to formulate the rule themselves.
- **Protégé Effect (AI Peer Mode)**: The AI introduces *Alex*, a virtual peer who makes a common mistake. The student is asked to spot and explain Alex's error, cementing deep mastery through teaching.
- **Teach-Back Verification**: The student explains the solved problem in their own words before advancing.

---

### D. RAG Custom Class Ingestion Pipeline
Students can upload their own school materials to create customized interactive classes:
1. **Multi-Format Extraction**: Ingests PDFs, Word documents (`.docx`), plain text (`.txt`), or typed lecture notes.
2. **Chunking & Vector Embeddings**: Documents are chunked into semantically coherent passages and converted into 768-dimensional embeddings using Gemini vector models stored in Supabase `pgvector`.
3. **Course Synthesis**: Generates an academic course syllabus with units, learning outcomes, formulas, and recommended starting topics.
4. **Priority Ordering**: Custom classes are automatically pinned to the top of the student's classroom dashboard with distinct badges.
5. **Real-Time RAG Grounding**: During live voice lessons, relevant document chunks are retrieved (`top_k=4`) and injected into the AI teacher's prompt context, ensuring explanations match the student's actual textbook and teacher curriculum.

---

### E. In-Place Learning Resources & Media Hub
Replaces conventional jarring pop-up modals with an integrated, in-workspace reader:
- **Video Lectures**: Embedded responsive video player with topic-matched educational video, key concept takeaways, and timestamps.
- **PDF Documents & Guides**: Formatted multi-section study guides with letterheads, KaTeX mathematical proofs, step-by-step algorithms, common trap callouts, and direct **"Download / Print PDF"** buttons.
- **Formula Cheat-Sheets**: Instant-reference rule cards with key properties and standard procedures.

---

### F. Spaced Repetition (SuperMemo SM-2)
- **Algorithm**: Implements SuperMemo SM-2 memory retention:
  $$S_{next} = S \times \text{Ease Factor} \times 1.5$$
- **Flashcard Generation**: Automatically turns past diagnosed misconceptions and formulas into active recall flashcards.
- **Retention Scheduling**: Calculates exact review dates based on mastery scores (0.0 to 1.0) to review concepts right before they fade from memory.

---

### G. Hierarchical Knowledge Graph & Prerequisite Recovery
- Structured curriculum graph mapping skills across Pre-Algebra, Algebra I, Geometry, and Statistics.
- **Safe Word-Boundary Topic Matching**: Strict regex word-boundary resolution prevents topic hijacking (e.g. ensures "Order of Operations" never mistakenly resolves to "Fractions & Ratios").
- **Automatic Gap Recovery**: If a student struggles with a topic whose prerequisite has $<65\%$ mastery, TutorFlow automatically inserts a 60-second micro-review of the prerequisite before returning to the main lesson.

---

## 4. Technical Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT (Vite + React 19)                            │
│  - Web Audio API (16kHz PCM In / 24kHz Out)  - Konva 2D Whiteboard Canvas              │
│  - KaTeX LaTeX Rendering Engine              - Reactive Audio Waveform Visualizers     │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                    Duplex WebSocket       │ HTTP REST API (Auth, Classes, RAG)
                    (/live-tutor)          │ (/api/v1/...)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI BACKEND (Python 3.12)                            │
│  - WebSocket Gateway & Reconnection Manager                                            │
│  - RAG Ingestion Pipeline (PyPDF2, python-docx, Chunker)                               │
│  - Diagnostic Engine & Misconception Classifier                                       │
│  - SM-2 Spaced Repetition Scheduler                                                    │
└────────────────────┬─────────────────────────────────────────────┬─────────────────────┘
                     │                                             │
      Live Duplex    │                                             │ PostgreSQL Queries
      gRPC / SSL     ▼                                             ▼ & pgvector Cosine
┌────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│          GOOGLE GEMINI APIs            │    │            SUPABASE DATABASE             │
│  - gemini-2.5-flash-native-audio-latest│    │  - profiles (User & Cognitive State)     │
│  - gemini-1.5-flash / 2.0-flash        │    │  - student_learner_model (Mastery & SM2) │
│  - text-embedding-004 (768-dim)        │    │  - ai_mistake_logs (Misconceptions)      │
│  - Function Declarations & Vision      │    │  - custom_classes & document_chunks      │
└────────────────────────────────────────┘    └──────────────────────────────────────────┘
```

---

## 5. Technology Stack & Dependencies

### Frontend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.0.0` | UI component tree, state management, hooks |
| **Vite** | `^8.2.1` | Build tooling, HMR, production bundling |
| **TailwindCSS** | `^3.4.1` | Modern utility styling & responsive layouts |
| **react-konva / Konva** | `^18.2.1` / `^9.3.6` | 2D HTML5 canvas whiteboard drawing engine |
| **KaTeX** | `^0.16.9` | Ultra-fast client-side mathematical typesetting |
| **Lucide React** | `^0.344.0` | Crisp, modern icon system |
| **Web Audio API** | Native Browser | Low-latency 16kHz PCM recording & 24kHz audio chunk streaming |

### Backend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Python** | `3.12` | Core backend runtime |
| **FastAPI** | `^0.115.0` | High-performance asynchronous REST & WebSocket framework |
| **Uvicorn** | `^0.32.0` | ASGI web server |
| **google-genai** | `^1.0.0` | Google Gemini SDK (`v1alpha` Live Client & Embeddings) |
| **supabase-py** | `^2.10.0` | Supabase client for PostgreSQL, Auth, and Storage |
| **PyPDF2 & python-docx**| `^3.0.0` / `^1.1.2` | Multi-format study material text extraction |
| **Pydantic** | `^2.10.0` | Data validation, type safety, and environment settings |

### Database & Cloud Services
| Technology | Purpose |
| :--- | :--- |
| **Supabase PostgreSQL 15** | Primary relational database |
| **pgvector** | Vector similarity search for RAG document chunk retrieval |
| **Supabase Auth** | JWT-based authentication, user profiles, and session security |
| **Google Gemini Live Audio** | Native low-latency spoken conversational intelligence |

---

## 6. Hackathon Pitch Deck & Video Demo Script

### Act 1: The Problem (0:00 - 0:30)
> *"Imagine a student struggling with an algebra problem: $2x + 4 = 10$. They subtract 4 and write $2x = 6$, but then they get stuck and write $x = 8$. Standard educational software slaps a red 'INCORRECT' banner across the screen and gives them a zero. Chatbots like ChatGPT just give them the answer, completely removing the learning struggle. Neither of them actually teach. Benjamin Bloom proved that 1-on-1 human tutoring produces results in the top 2% of learners, but human tutors cost $75 an hour. How can we make world-class 1-on-1 tutoring accessible to every student on Earth?"*

### Act 2: The Solution — TutorFlow (0:30 - 1:00)
> *"Meet TutorFlow: an adaptive, multimodal AI teacher that doesn't just know what you know—it learns how to teach you. Powered by Gemini's native live audio and vision streaming, TutorFlow speaks with students in real time with human-like warmth. As it talks, it writes equations and draws intuitive diagrams on a synchronized digital whiteboard. When the student makes a mistake, TutorFlow doesn't penalize them—it diagnoses the root cause. Was it a sign reversal? An order of operations slip? A missing prerequisite? TutorFlow adapts its pedagogical strategy in real time, switching between visual scale analogies, step-by-step breakdowns, or even having the student teach an AI peer named Alex."*

### Act 3: Live Demo Walkthrough (1:00 - 1:45)
1. **Custom Class Creation**: *"Watch how a student drops their messy class notes or a PDF into TutorFlow. In seconds, TutorFlow's RAG pipeline chunks the document, generates vector embeddings, and builds a personalized multi-unit curriculum."*
2. **Live Classroom Experience**: *"We click into our lesson. Notice how our classroom starts with our mic muted. We turn on our live mic. The AI introduces the core intuition with a compelling story hook and animates the first step on the whiteboard without overlapping our canvas."*
3. **Interactive Inspection**: *"We write our calculation on the board and click 'Check My Board'. TutorFlow's vision analyzer inspects our handwriting in real time, catches our mistake, highlights the error, and guides us with a Socratic question."*
4. **Lifelong Learner Model**: *"When the lesson finishes, TutorFlow updates our cognitive learner model, logs our diagnosed mistakes, and schedules SuperMemo SM-2 spaced repetition flashcards for long-term retention."*

### Act 4: The Vision & Impact (1:45 - 2:00)
> *"TutorFlow transforms AI from a homework shortcut into a lifelong private teacher that adapts to your brain. By democratizing Bloom's 2-Sigma 1-on-1 tutoring, we ensure that every student, regardless of background or income, has a patient, charismatic, world-class teacher in their corner. Thank you."*

---

## 7. Competitive Differentiation

| Feature | TutorFlow | ChatGPT / Claude | Khanmigo | Standard LMS (Canvas/Chegg) |
| :--- | :---: | :---: | :---: | :---: |
| **Native 24kHz Spoken Live Audio** | **Yes** (Bidirectional WebSockets) | Mobile App Only (No Board) | Text Only | Text Only |
| **Synchronized Live Whiteboard** | **Yes** (Handwriting & Diagrams) | No | No | Static Canvas |
| **Misconception Diagnosis** | **Yes** (Taxonomy Root Cause) | Generic Text | Partial | Binary Pass/Fail |
| **Dynamic Strategy Adaptation** | **Yes** (6 Pedagogical Modes) | Static Prompt | Static Guide | None |
| **Multi-Agent Protégé Effect** | **Yes** (AI Peer Alex) | No | No | No |
| **RAG Document-to-Class Ingestion**| **Yes** (PDF/DOCX Embeddings) | File Attachment | Pre-set Catalog | Static Syllabus |
| **SM-2 Spaced Repetition Engine** | **Yes** (Evolving Learner Model)| No (Session Resets) | Linear Mastery | No |
| **Spatial Non-Overlap Intelligence** | **Yes** (Canvas Telemetry) | No | No | No |

---

## 8. Setup & Local Development Quickstart

### Prerequisites
- Node.js 18+ & npm
- Python 3.11 or 3.12
- Active Supabase project with database schema applied
- Google Gemini API Key with access to `gemini-2.5-flash-native-audio-latest`

### Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# Configure your environment variables in backend/.env:
# GEMINI_API_KEY=your_gemini_key
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

uvicorn main:app --reload --port 8080
```

### Frontend Setup
```bash
cd frontend
npm install

# Verify your frontend environment in frontend/.env:
# VITE_API_BASE_URL=http://localhost:8080/api/v1

npm run dev
# Open http://localhost:5173
```

---

## 9. Future Roadmap
1. **Multilingual Real-Time Voice Localization**: Expanding native voice streaming into Spanish, French, Mandarin, and Arabic with localized cultural analogies.
2. **Interactive STEM Simulations**: Integrating interactive PhET physics simulations and geometric geometry engines directly onto the whiteboard canvas.
3. **Small-Group Socratic Seminars**: Allowing 2-3 human students to join a collaborative live classroom moderated by the AI teacher.
4. **B2B School District Analytics Portal**: Providing teachers and school districts with longitudinal diagnostics detailing which foundational misconceptions are most prevalent across classes.