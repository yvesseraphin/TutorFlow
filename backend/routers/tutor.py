import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.config import settings
from backend.curriculum import lesson_for_learner
from backend.services.supabase import admin_client, current_user
from backend.services.tutor import detect_weakness, respond

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])


class SessionCreate(BaseModel):
    topic: str = Field(min_length=2, max_length=160)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)
    image_data: str | None = None


class AttemptCreate(BaseModel):
    skill: str = Field(min_length=2, max_length=120)
    answer: str = Field(min_length=1, max_length=4000)
    expected_answer: str = Field(min_length=1, max_length=4000)


def learner_context(user_id: str) -> dict:
    client = admin_client()
    mastery = (
        client.table("skill_mastery")
        .select("skill,mastery,attempts,correct_attempts")
        .eq("user_id", user_id)
        .execute()
        .data
        or []
    )
    weaknesses = (
        client.table("weaknesses")
        .select("skill,kind,confidence,occurrences")
        .eq("user_id", user_id)
        .eq("resolved", False)
        .execute()
        .data
        or []
    )
    return {"mastery": mastery, "weaknesses": weaknesses}


def _save_confidence_snapshot(client, user_id: str, context: dict, label: str = "") -> None:
    """Persist a confidence snapshot derived from current skill mastery."""
    mastery_rows = context.get("mastery", [])
    if not mastery_rows:
        return
    avg_mastery = sum(float(r["mastery"]) for r in mastery_rows) / len(mastery_rows)
    client.table("confidence_snapshots").insert(
        {"user_id": user_id, "score": round(avg_mastery, 3), "label": label}
    ).execute()


@router.post("/sessions")
def create_session(payload: SessionCreate, user: dict = Depends(current_user)):
    result = (
        admin_client()
        .table("tutoring_sessions")
        .insert({"user_id": user["id"], "topic": payload.topic, "status": "active"})
        .execute()
    )
    return {
        **result.data[0],
        "lesson_plan": lesson_for_learner(
            payload.topic, learner_context(user["id"])["mastery"]
        ),
    }


@router.get("/sessions")
def list_sessions(user: dict = Depends(current_user)) -> list[dict]:
    """Return all sessions for the current user, newest first."""
    return (
        admin_client()
        .table("tutoring_sessions")
        .select("id,topic,status,created_at,ended_at")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )


@router.get("/sessions/{session_id}")
def get_session(session_id: uuid.UUID, user: dict = Depends(current_user)):
    client = admin_client()
    session = (
        client.table("tutoring_sessions")
        .select("*")
        .eq("id", str(session_id))
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
        .data
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = (
        client.table("lesson_messages")
        .select("role,content,created_at")
        .eq("session_id", str(session_id))
        .order("created_at")
        .execute()
        .data
        or []
    )
    context = learner_context(user["id"])
    return {
        **session,
        "messages": messages,
        "learner_context": context,
        "lesson_plan": lesson_for_learner(session["topic"], context["mastery"]),
    }


@router.patch("/sessions/{session_id}/complete")
def complete_session(session_id: uuid.UUID, user: dict = Depends(current_user)):
    client = admin_client()
    result = (
        client.table("tutoring_sessions")
        .update(
            {
                "status": "completed",
                "ended_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", str(session_id))
        .eq("user_id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    # Save a confidence snapshot when a session is completed
    ctx = learner_context(user["id"])
    _save_confidence_snapshot(
        client,
        user["id"],
        ctx,
        label=f"After session on {result.data[0].get('topic', '')}",
    )
    return result.data[0]


@router.post("/sessions/{session_id}/messages")
def message(
    session_id: uuid.UUID, payload: MessageCreate, user: dict = Depends(current_user)
):
    client = admin_client()
    session = (
        client.table("tutoring_sessions")
        .select("topic")
        .eq("id", str(session_id))
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
        .data
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    history = (
        client.table("lesson_messages")
        .select("role,content")
        .eq("session_id", str(session_id))
        .order("created_at", desc=True)
        .limit(6)
        .execute()
        .data
        or []
    )
    history.reverse()

    client.table("lesson_messages").insert(
        {
            "session_id": str(session_id),
            "user_id": user["id"],
            "role": "user",
            "content": payload.content,
        }
    ).execute()

    weakness, confidence = detect_weakness(payload.content)
    if weakness:
        existing = (
            client.table("weaknesses")
            .select("occurrences,confidence")
            .eq("user_id", user["id"])
            .eq("skill", session["topic"])
            .eq("kind", weakness)
            .maybe_single()
            .execute()
            .data
        )
        client.table("weaknesses").upsert(
            {
                "user_id": user["id"],
                "skill": session["topic"],
                "kind": weakness,
                "confidence": (
                    max(confidence, float(existing["confidence"])) if existing else confidence
                ),
                "occurrences": (existing["occurrences"] + 1) if existing else 1,
            },
            on_conflict="user_id,skill,kind",
        ).execute()

    try:
        context = learner_context(user["id"])
        answer = respond(
            session["topic"],
            context,
            history,
            payload.content,
            lesson_for_learner(session["topic"], context["mastery"]),
            image_data=payload.image_data,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    saved = (
        client.table("lesson_messages")
        .insert(
            {
                "session_id": str(session_id),
                "user_id": user["id"],
                "role": "assistant",
                "content": answer,
            }
        )
        .execute()
        .data[0]
    )

    updated_context = learner_context(user["id"])
    return {
        "message": saved,
        "detected_weakness": weakness,
        "confidence": confidence,
        "learner_context": updated_context,
    }


@router.post("/attempts")
def record_attempt(payload: AttemptCreate, user: dict = Depends(current_user)):
    correct = (
        payload.answer.strip().casefold() == payload.expected_answer.strip().casefold()
    )
    client = admin_client()
    existing = (
        client.table("skill_mastery")
        .select("attempts,correct_attempts")
        .eq("user_id", user["id"])
        .eq("skill", payload.skill)
        .maybe_single()
        .execute()
        .data
        or {"attempts": 0, "correct_attempts": 0}
    )
    attempts = existing["attempts"] + 1
    correct_attempts = existing["correct_attempts"] + int(correct)
    mastery = round(correct_attempts / attempts, 3)

    client.table("skill_mastery").upsert(
        {
            "user_id": user["id"],
            "skill": payload.skill,
            "attempts": attempts,
            "correct_attempts": correct_attempts,
            "mastery": mastery,
        },
        on_conflict="user_id,skill",
    ).execute()

    if not correct:
        client.table("weaknesses").upsert(
            {
                "user_id": user["id"],
                "skill": payload.skill,
                "kind": "incorrect_answer",
                "confidence": 0.9,
                "occurrences": 1,
            },
            on_conflict="user_id,skill,kind",
        ).execute()

    ctx = learner_context(user["id"])
    return {"correct": correct, "mastery": mastery, "context": ctx}


class MaterialGenerate(BaseModel):
    topic: str = Field(default="Algebra", max_length=160)
    category: str = Field(default="Resources", max_length=60)


@router.get("/materials")
def list_materials(
    category: str | None = None,
    topic: str | None = None,
    user: dict = Depends(current_user),
) -> list[dict]:
    client = admin_client()
    query = client.table("learning_materials").select("*").eq("user_id", user["id"])
    if category:
        query = query.eq("category", category)
    if topic:
        query = query.eq("topic", topic)

    data = query.order("created_at", desc=True).execute().data or []

    if not data:
        cat = category or "Resources"
        top = topic or "Algebra"
        sample = _create_initial_material(client, user["id"], top, cat)
        return [sample] if sample else []

    return data


@router.post("/materials/generate")
def generate_material(payload: MaterialGenerate, user: dict = Depends(current_user)):
    client = admin_client()
    topic = payload.topic
    category = payload.category

    generated_title = f"{topic} - AI {category}"
    generated_desc = f"AI-generated {category.lower()} for {topic} covering key concepts and practice problems."
    generated_content = ""

    if settings.gemini_api_key:
        try:
            from google import genai
            from google.genai import types
            ai_client = genai.Client(api_key=settings.gemini_api_key)
            prompt = (
                f"Create comprehensive educational learning materials for students studying '{topic}'. "
                f"Material category: '{category}'. "
                f"Include clear explanations, key formulas, step-by-step examples, and practice questions."
            )
            res = ai_client.models.generate_content(
                model=settings.gemini_model,
                contents=[prompt],
                config=types.GenerateContentConfig(max_output_tokens=1000),
            )
            if res.text:
                generated_content = res.text
        except Exception:
            pass

    if not generated_content:
        generated_content = _build_default_material_text(topic, category)

    record = {
        "user_id": user["id"],
        "category": category,
        "topic": topic,
        "title": generated_title,
        "description": generated_desc,
        "content_type": "markdown",
        "content_body": generated_content,
        "metadata": {"generated_by": "TutorFlow AI Engine"},
    }

    result = client.table("learning_materials").insert(record).execute()
    return result.data[0]


def _create_initial_material(client, user_id: str, topic: str, category: str) -> dict | None:
    text = _build_default_material_text(topic, category)
    record = {
        "user_id": user_id,
        "category": category,
        "topic": topic,
        "title": f"{topic} - {category} Study Guide",
        "description": f"Comprehensive {category.lower()} for {topic} with step-by-step guidance.",
        "content_type": "markdown",
        "content_body": text,
        "metadata": {"is_default": True},
    }
    result = client.table("learning_materials").insert(record).execute()
    return result.data[0] if result.data else None


def _build_default_material_text(topic: str, category: str) -> str:
    if category == "Lesson Notes":
        return f"# {topic} - Core Lesson Notes\n\n## 1. Overview\nUnderstanding the fundamental principles of {topic}.\n\n## 2. Key Concepts\n- Concept A: Core definitions & rules.\n- Concept B: Step-by-step solution method.\n- Concept C: Real-world application.\n\n## 3. Worked Example\nGiven the problem, apply balanced operations to solve for the target variable step by step."
    elif category == "Homework":
        return f"# {topic} - Practice & Homework\n\n## Instructions\nSolve the following problems and check your reasoning.\n\n1. Evaluate the expressions for x = 3.\n2. Simplify the given algebraic statement.\n3. Solve the multi-step equation and verify your answer by substitution."
    elif category == "Mindmap":
        return f"# {topic} - Mind Map\n\n- **{topic}**\n  - Fundamentals\n    - Variables & Coefficients\n    - Constant Terms\n  - Operations\n    - Combining Like Terms\n    - Distributive Property\n  - Verification\n    - Substitution Method\n    - Graphing Check"
    else:
        return f"# {topic} - Comprehensive Study Guide\n\nWelcome to your personalized study guide for {topic}.\n\n- **Objective**: Build deep conceptual understanding and procedural fluency.\n- **Tip**: Remember to perform identical operations on both sides when isolating variables."

