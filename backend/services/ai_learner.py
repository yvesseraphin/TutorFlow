import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from backend.services.supabase import admin_client

logger = logging.getLogger("tutorflow.ai_learner")

def is_valid_uuid(val: Any) -> bool:
    if not val or not isinstance(val, str):
        return False
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

# Comprehensive Knowledge Graph & Prerequisite Dependency Map
KNOWLEDGE_GRAPH: Dict[str, Dict[str, Any]] = {
    "Integers & Negative Numbers": {
        "id": "integers_negative_numbers",
        "aliases": ["integers", "negative numbers", "signed numbers", "integers and signed numbers", "Pre-Algebra: integer operations"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Pre-Algebra",
        "prerequisites": [],
        "core_concepts": ["Number Line", "Adding Negative Numbers", "Multiplying Signs", "Absolute Value", "Signed Number Subtraction"],
        "difficulty": 1,
    },
    "Order of Operations (PEMDAS)": {
        "id": "order_of_operations",
        "aliases": ["order of operations", "pemdas", "Pre-Algebra: order of operations"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Pre-Algebra",
        "prerequisites": ["Integers & Negative Numbers"],
        "core_concepts": ["Parentheses", "Exponents", "Multiplication & Division", "Addition & Subtraction", "Evaluating Nested Expressions"],
        "difficulty": 1,
    },
    "Fractions and Ratios": {
        "id": "fractions_and_ratios",
        "aliases": ["fractions", "ratios", "fractions and ratios", "Pre-Algebra: fractions and ratios"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Pre-Algebra",
        "prerequisites": ["Order of Operations (PEMDAS)"],
        "core_concepts": ["Simplifying Fractions", "Equivalent Fractions", "Common Denominators", "Ratio Proportions"],
        "difficulty": 1,
    },
    "Variables & Expressions": {
        "id": "variables_and_expressions",
        "aliases": ["variables", "expressions", "variables and expressions", "Algebra: variables and expressions"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Algebra",
        "prerequisites": ["Order of Operations (PEMDAS)"],
        "core_concepts": ["Variables", "Coefficients", "Constants", "Evaluating Expressions", "Algebraic Translation"],
        "difficulty": 2,
    },
    "Combining Like Terms": {
        "id": "combining_like_terms",
        "aliases": ["combining like terms", "like terms", "Algebra: combining like terms"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Algebra",
        "prerequisites": ["Variables & Expressions", "Integers & Negative Numbers"],
        "core_concepts": ["Like Terms vs Unlike Terms", "Simplifying Expressions", "Distributive Sign Handling"],
        "difficulty": 2,
    },
    "Distributive Property": {
        "id": "distributive_property",
        "aliases": ["distributive property", "Algebra: distributive property", "Algebra: negative signs"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Algebra",
        "prerequisites": ["Combining Like Terms", "Integers & Negative Numbers"],
        "core_concepts": ["Expanding Parentheses", "Distributing Negative Multipliers", "Simplifying Expanded Terms"],
        "difficulty": 2,
    },
    "Linear Equations (One-Step)": {
        "id": "linear_equations_one_step",
        "aliases": ["one-step equations", "linear equations one-step", "simple equations"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Algebra",
        "prerequisites": ["Variables & Expressions", "Integers & Negative Numbers"],
        "core_concepts": ["Inverse Operations", "Isolating the Variable", "Balancing Both Sides"],
        "difficulty": 2,
    },
    "Linear Equations (Two-Step & Multi-Step)": {
        "id": "linear_equations_two_step",
        "aliases": ["linear equations", "two-step equations", "multi-step equations", "Algebra: linear equations", "Linear Equations"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (One-Step)", "Combining Like Terms", "Distributive Property"],
        "core_concepts": ["Two-step equations", "Distributive property in equations", "Variables on both sides", "Transposition Sign Rules"],
        "difficulty": 3,
    },
    "Linear Inequalities": {
        "id": "linear_inequalities",
        "aliases": ["inequalities", "linear inequalities"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)"],
        "core_concepts": ["Inequality symbols", "Flipping inequality sign when multiplying/dividing by negative", "Number line graphing"],
        "difficulty": 3,
    },
    "Relations and Functions": {
        "id": "relations_and_functions",
        "aliases": ["functions", "relations", "Functions: identifying functions"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Functions",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)"],
        "core_concepts": ["Function Definition", "Domain and Range", "Vertical Line Test", "Function Notation f(x)"],
        "difficulty": 3,
    },
    "Function Tables & Graphing": {
        "id": "function_tables_graphing",
        "aliases": ["function tables", "graphing linear functions", "Functions: tables", "Functions: graphing lines"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Functions",
        "prerequisites": ["Relations and Functions"],
        "core_concepts": ["Input-Output Tables", "Slope-Intercept Form (y = mx + b)", "Plotting Coordinate Points"],
        "difficulty": 3,
    },
    "Simultaneous Equations": {
        "id": "simultaneous_equations",
        "aliases": ["simultaneous equations", "system of equations", "systems of linear equations"],
        "subject": "Mathematics",
        "grade": "10th Grade",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)"],
        "core_concepts": ["Elimination Method", "Substitution Method", "Graphical Intersection"],
        "difficulty": 4,
    },
    "Quadratic Equations": {
        "id": "quadratic_equations",
        "aliases": ["quadratics", "quadratic equations", "factoring quadratics"],
        "subject": "Mathematics",
        "grade": "10th Grade",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)", "Combining Like Terms"],
        "core_concepts": ["Factoring Quadratics", "Quadratic Formula", "Completing the Square", "Parabolas"],
        "difficulty": 4,
    },
    "Pythagorean Theorem": {
        "id": "pythagorean_theorem",
        "aliases": ["pythagoras", "pythagorean theorem", "Geometry: triangles"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Geometry",
        "prerequisites": ["Order of Operations (PEMDAS)"],
        "core_concepts": ["Right Triangles", "Hypotenuse Calculation", "Square Roots in Geometry"],
        "difficulty": 2,
    },
}


def find_topic_node(topic_name: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Flexibly finds a Knowledge Graph node by exact name, ID, alias, or substring match.
    """
    if not topic_name:
        return None
    normalized = topic_name.strip().casefold()

    # Exact name match
    for key, node in KNOWLEDGE_GRAPH.items():
        if key.casefold() == normalized or node.get("id", "").casefold() == normalized:
            node_copy = node.copy()
            node_copy["name"] = key
            return node_copy

    # Alias match
    for key, node in KNOWLEDGE_GRAPH.items():
        for alias in node.get("aliases", []):
            if alias.casefold() == normalized:
                node_copy = node.copy()
                node_copy["name"] = key
                return node_copy

    # Substring match
    for key, node in KNOWLEDGE_GRAPH.items():
        if normalized in key.casefold() or any(normalized in alias.casefold() for alias in node.get("aliases", [])):
            node_copy = node.copy()
            node_copy["name"] = key
            return node_copy

    return None


def get_student_learner_context(user_id: str, topic: Optional[str] = None, cognitive_mode: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches the comprehensive AI Learner Model for a student directly from the database:
    - User's actual profile attributes (name, grade e.g. '9th Grade', curriculum, teaching style, pace)
    - Real-time mastery records across all topics
    - Active unresolved diagnosed misconceptions from ai_mistake_logs
    - Long-term pedagogical memories from ai_learner_memories
    - Dynamically computed prerequisite gaps
    - Active cognitive energy state
    """
    profile = {}
    mastery_records = []
    mastery_map = {}
    unresolved_mistakes = []
    learner_memories = []

    if is_valid_uuid(user_id):
        try:
            client = admin_client()
            # 1. Fetch exact student profile from DB
            profile_res = client.table("profiles").select("*").eq("id", user_id).execute()
            profile = profile_res.data[0] if profile_res.data else {}

            # 2. Fetch actual student mastery records from DB
            mastery_res = client.table("student_learner_model").select("*").eq("user_id", user_id).execute()
            mastery_records = mastery_res.data or []
            mastery_map = {m["topic_id"]: m for m in mastery_records}

            # 3. Fetch active unresolved mistakes & diagnosed misconceptions
            mistakes_res = (
                client.table("ai_mistake_logs")
                .select("*")
                .eq("user_id", user_id)
                .eq("resolved", False)
                .order("created_at", desc=True)
                .limit(6)
                .execute()
            )
            unresolved_mistakes = mistakes_res.data or []

            # 4. Fetch persistent long-term teacher reflection memories
            memories_res = (
                client.table("ai_learner_memories")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(8)
                .execute()
            )
            learner_memories = memories_res.data or []
        except Exception as e:
            logger.warning(f"Error fetching learner context for user {user_id}: {e}")

    # 5. Dynamically calculate prerequisite gaps for the topic
    missing_prerequisites: List[str] = []
    matched_node = find_topic_node(topic)
    if matched_node:
        for prereq in matched_node.get("prerequisites", []):
            prereq_node = find_topic_node(prereq)
            prereq_key = prereq_node["name"] if prereq_node else prereq
            prereq_mastery = float(mastery_map.get(prereq_key, {}).get("mastery_score", 0.0))
            if prereq_mastery < 0.65:
                missing_prerequisites.append(prereq_key)

    # 6. Extract effective teaching strategies from past breakthrough memories
    effective_strategies = [
        m.get("summary")
        for m in learner_memories
        if m.get("memory_type") in ("strategy_effectiveness", "preference", "breakthrough")
    ]

    # 7. Extract actual student attributes from profile
    actual_name = profile.get("full_name") or "Learner"
    actual_grade = profile.get("grade") or (matched_node.get("grade", "9th Grade") if matched_node else "9th Grade")
    actual_curriculum = profile.get("curriculum") or "General"
    actual_teaching_style = profile.get("preferred_teaching_style") or "step_by_step"
    actual_pace = profile.get("learning_pace") or "normal"
    actual_voice = profile.get("voice_preference") or "Aoede"
    actual_lang = profile.get("language_preference") or "en"
    active_cognitive_mode = cognitive_mode or profile.get("cognitive_mode") or "normal"

    return {
        "profile": {
            "name": actual_name,
            "grade": actual_grade,
            "curriculum": actual_curriculum,
            "teaching_style": actual_teaching_style,
            "learning_pace": actual_pace,
            "voice_preference": actual_voice,
            "language": actual_lang,
            "cognitive_mode": active_cognitive_mode,
        },
        "topic": matched_node["name"] if matched_node else (topic or ""),
        "matched_node": matched_node,
        "mastery_records": mastery_records,
        "unresolved_mistakes": unresolved_mistakes,
        "learner_memories": learner_memories,
        "effective_strategies": effective_strategies,
        "missing_prerequisites": missing_prerequisites,
        "cognitive_mode": active_cognitive_mode,
    }


def record_mastery_attempt(user_id: str, topic_id: str, is_correct: bool, score_delta: float = 0.1) -> Dict[str, Any]:
    """
    Updates the student's mastery score and calculates SM-2 spaced repetition review date.
    """
    now = datetime.now(timezone.utc)
    node = find_topic_node(topic_id)
    canonical_topic = node["name"] if node else topic_id

    if not is_valid_uuid(user_id):
        return {"status": "guest_mode", "topic_id": canonical_topic}

    try:
        client = admin_client()
        existing = (
            client.table("student_learner_model")
            .select("*")
            .eq("user_id", user_id)
            .eq("topic_id", canonical_topic)
            .execute()
        )
        row = existing.data[0] if existing.data else None

        if row:
            attempts = row.get("attempts_count", 0) + 1
            corrects = row.get("correct_count", 0) + (1 if is_correct else 0)
            curr_mastery = float(row.get("mastery_score", 0.0))
            
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
            new_mastery = 0.25 if is_correct else 0.05
            next_review = now + timedelta(days=1)
            insert_payload = {
                "user_id": user_id,
                "topic_id": canonical_topic,
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
    except Exception as e:
        logger.warning(f"Error updating mastery attempt: {e}")
        return {"status": "error", "error": str(e)}


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
    if not is_valid_uuid(user_id):
        return

    node = find_topic_node(topic)
    canonical_topic = node["name"] if node else topic

    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "topic": canonical_topic,
        "problem_context": problem_context,
        "student_response": student_response,
        "correct_response": correct_response,
        "misconception_type": misconception_type,
        "root_cause": root_cause,
        "ai_intervention": ai_intervention,
        "resolved": False,
    }
    try:
        client = admin_client()
        client.table("ai_mistake_logs").insert(payload).execute()
    except Exception as e:
        logger.warning(f"Error logging mistake: {e}")


def save_learner_memory(
    user_id: str,
    memory_type: str,
    topic: str,
    summary: str,
    confidence: float = 0.9,
    session_id: Optional[str] = None,
) -> None:
    """Saves an AI teacher long-term memory snapshot for personalization."""
    if not is_valid_uuid(user_id):
        return

    node = find_topic_node(topic)
    canonical_topic = node["name"] if node else topic

    payload = {
        "user_id": user_id,
        "source_session_id": session_id,
        "memory_type": memory_type,
        "topic": canonical_topic,
        "summary": summary,
        "confidence_rating": confidence,
    }
    try:
        client = admin_client()
        client.table("ai_learner_memories").insert(payload).execute()
    except Exception as e:
        logger.warning(f"Error saving learner memory: {e}")
