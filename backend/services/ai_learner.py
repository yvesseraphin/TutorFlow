import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from backend.services.supabase import admin_client

logger = logging.getLogger("tutorflow.ai_learner")

# Knowledge Graph & Prerequisite Map
KNOWLEDGE_GRAPH: Dict[str, Dict[str, Any]] = {
    "Integers & Negative Numbers": {
        "id": "integers_negative_numbers",
        "subject": "Mathematics",
        "grade": "Senior 1",
        "category": "Pre-Algebra",
        "prerequisites": [],
        "core_concepts": ["Number Line", "Adding Negative Numbers", "Multiplying Signs", "Absolute Value"],
        "difficulty": 1,
    },
    "Order of Operations (PEMDAS)": {
        "id": "order_of_operations",
        "subject": "Mathematics",
        "grade": "Senior 1",
        "category": "Pre-Algebra",
        "prerequisites": ["Integers & Negative Numbers"],
        "core_concepts": ["Parentheses", "Exponents", "Multiplication & Division", "Addition & Subtraction"],
        "difficulty": 1,
    },
    "Variables & Expressions": {
        "id": "variables_and_expressions",
        "subject": "Mathematics",
        "grade": "Senior 1",
        "category": "Algebra",
        "prerequisites": ["Order of Operations (PEMDAS)"],
        "core_concepts": ["Variables", "Coefficients", "Constants", "Evaluating Expressions"],
        "difficulty": 2,
    },
    "Combining Like Terms": {
        "id": "combining_like_terms",
        "subject": "Mathematics",
        "grade": "Senior 1",
        "category": "Algebra",
        "prerequisites": ["Variables & Expressions", "Integers & Negative Numbers"],
        "core_concepts": ["Like Terms vs Unlike Terms", "Simplifying Expressions", "Distributive Sign Handling"],
        "difficulty": 2,
    },
    "Linear Equations (One-Step)": {
        "id": "linear_equations_one_step",
        "subject": "Mathematics",
        "grade": "Senior 2",
        "category": "Algebra",
        "prerequisites": ["Variables & Expressions", "Integers & Negative Numbers"],
        "core_concepts": ["Inverse Operations", "Isolating the Variable", "Balancing Both Sides"],
        "difficulty": 2,
    },
    "Linear Equations (Two-Step & Multi-Step)": {
        "id": "linear_equations_two_step",
        "subject": "Mathematics",
        "grade": "Senior 2",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (One-Step)", "Combining Like Terms"],
        "core_concepts": ["Two-step equations", "Distributive property in equations", "Variables on both sides"],
        "difficulty": 3,
    },
    "Linear Inequalities": {
        "id": "linear_inequalities",
        "subject": "Mathematics",
        "grade": "Senior 2",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)"],
        "core_concepts": ["Inequality symbols", "Flipping inequality sign when multiplying/dividing by negative", "Number line graphing"],
        "difficulty": 3,
    },
    "Simultaneous Equations": {
        "id": "simultaneous_equations",
        "subject": "Mathematics",
        "grade": "Senior 3",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)"],
        "core_concepts": ["Elimination Method", "Substitution Method", "Graphical Intersection"],
        "difficulty": 4,
    },
    "Quadratic Equations": {
        "id": "quadratic_equations",
        "subject": "Mathematics",
        "grade": "Senior 3",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)", "Combining Like Terms"],
        "core_concepts": ["Factoring Quadratics", "Quadratic Formula", "Completing the Square", "Parabolas"],
        "difficulty": 4,
    },
    "Pythagorean Theorem": {
        "id": "pythagorean_theorem",
        "subject": "Mathematics",
        "grade": "Senior 2",
        "category": "Geometry",
        "prerequisites": ["Order of Operations (PEMDAS)"],
        "core_concepts": ["Right Triangles", "Hypotenuse Calculation", "Square Roots in Geometry"],
        "difficulty": 2,
    },
}


def get_student_learner_context(user_id: str, topic: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches the comprehensive AI Learner Model for a student:
    - Profile preferences (teaching style, pace, language)
    - Topic mastery records
    - Active / unresolved misconceptions and mistakes
    - Persistent long-term teacher memories
    - Missing prerequisites for the requested topic
    """
    client = admin_client()

    # 1. Profile
    profile_res = client.table("profiles").select("*").eq("id", user_id).execute()
    profile = profile_res.data[0] if profile_res.data else {}

    # 2. Mastery
    mastery_res = client.table("student_learner_model").select("*").eq("user_id", user_id).execute()
    mastery_records = mastery_res.data or []
    mastery_map = {m["topic_id"]: m for m in mastery_records}

    # 3. Unresolved Mistakes
    mistakes_res = (
        client.table("ai_mistake_logs")
        .select("*")
        .eq("user_id", user_id)
        .eq("resolved", False)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    unresolved_mistakes = mistakes_res.data or []

    # 4. Long-term Memories
    memories_res = (
        client.table("ai_learner_memories")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(6)
        .execute()
    )
    learner_memories = memories_res.data or []

    # 5. Prerequisite gap detection if topic is provided
    missing_prerequisites: List[str] = []
    if topic and topic in KNOWLEDGE_GRAPH:
        node = KNOWLEDGE_GRAPH[topic]
        for prereq in node.get("prerequisites", []):
            prereq_mastery = mastery_map.get(prereq, {}).get("mastery_score", 0.0)
            if prereq_mastery < 0.65:
                missing_prerequisites.append(prereq)

    return {
        "profile": {
            "name": profile.get("full_name", "Student"),
            "grade": profile.get("grade", "Senior 2"),
            "curriculum": profile.get("curriculum", "General / National"),
            "teaching_style": profile.get("preferred_teaching_style", "step_by_step"),
            "learning_pace": profile.get("learning_pace", "normal"),
            "language": profile.get("language_preference", "en"),
        },
        "topic": topic,
        "mastery_records": mastery_records,
        "unresolved_mistakes": unresolved_mistakes,
        "learner_memories": learner_memories,
        "missing_prerequisites": missing_prerequisites,
    }


def record_mastery_attempt(user_id: str, topic_id: str, is_correct: bool, score_delta: float = 0.1) -> Dict[str, Any]:
    """
    Updates the student's mastery score and calculates SM-2 spaced repetition review date.
    """
    client = admin_client()
    now = datetime.now(timezone.utc)

    existing = (
        client.table("student_learner_model")
        .select("*")
        .eq("user_id", user_id)
        .eq("topic_id", topic_id)
        .execute()
    )
    row = existing.data[0] if existing.data else None

    if row:
        attempts = row["attempts_count"] + 1
        corrects = row["correct_count"] + (1 if is_correct else 0)
        curr_mastery = float(row["mastery_score"])
        
        # Calculate new mastery with retention weight
        new_mastery = min(1.0, max(0.0, curr_mastery + (score_delta if is_correct else -score_delta * 0.7)))
        
        # SM-2 calculation
        stability = float(row.get("retention_stability", 1.0))
        if is_correct:
            stability = stability * 1.5
            days_to_add = max(1, int(stability * 2))
        else:
            stability = max(1.0, stability * 0.7)
            days_to_add = 1

        next_review = now + timedelta(days=days_to_add)
        status = "mastered" if new_mastery >= 0.85 else ("needs_reinforcement" if not is_correct else "in_progress")

        update_payload = {
            "mastery_score": round(new_mastery, 3),
            "attempts_count": attempts,
            "correct_count": corrects,
            "retention_stability": round(stability, 3),
            "status": status,
            "last_practiced_at": now.isoformat(),
            "next_review_due_at": next_review.isoformat(),
            "updated_at": now.isoformat(),
        }
        res = (
            client.table("student_learner_model")
            .update(update_payload)
            .eq("id", row["id"])
            .execute()
        )
        return res.data[0] if res.data else update_payload
    else:
        new_mastery = 0.2 if is_correct else 0.05
        next_review = now + timedelta(days=1)
        insert_payload = {
            "user_id": user_id,
            "topic_id": topic_id,
            "mastery_score": new_mastery,
            "attempts_count": 1,
            "correct_count": 1 if is_correct else 0,
            "retention_stability": 1.0,
            "status": "in_progress",
            "last_practiced_at": now.isoformat(),
            "next_review_due_at": next_review.isoformat(),
        }
        res = client.table("student_learner_model").insert(insert_payload).execute()
        return res.data[0] if res.data else insert_payload


def log_student_mistake(
    user_id: str,
    topic: str,
    problem_context: str,
    student_response: str,
    correct_response: str,
    misconception_type: str,
    root_cause: str,
    ai_intervention: str,
    session_id: Optional[str] = None,
) -> None:
    """Logs a diagnosed misconception into the ai_mistake_logs table."""
    client = admin_client()
    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "topic": topic,
        "problem_context": problem_context,
        "student_response": student_response,
        "correct_response": correct_response,
        "misconception_type": misconception_type,
        "root_cause": root_cause,
        "ai_intervention": ai_intervention,
        "resolved": False,
    }
    client.table("ai_mistake_logs").insert(payload).execute()


def save_learner_memory(
    user_id: str,
    memory_type: str,
    topic: str,
    summary: str,
    confidence: float = 0.9,
    session_id: Optional[str] = None,
) -> None:
    """Saves an AI teacher long-term memory snapshot for personalization."""
    client = admin_client()
    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "memory_type": memory_type,
        "topic": topic,
        "summary": summary,
        "confidence_rating": confidence,
    }
    client.table("ai_learner_memories").insert(payload).execute()
