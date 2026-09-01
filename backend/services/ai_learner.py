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

# Comprehensive Knowledge Graph & Prerequisite Dependency Map across All Subjects
KNOWLEDGE_GRAPH: Dict[str, Dict[str, Any]] = {
    # ── Pre-Algebra ──
    "Integers & Negative Numbers": {
        "id": "integers_negative_numbers",
        "aliases": ["integers", "negative numbers", "signed numbers", "integers and signed numbers", "Pre-Algebra: integer operations", "Integers", "Integer Operations"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Pre-Algebra",
        "prerequisites": [],
        "core_concepts": ["Number Line", "Adding Negative Numbers", "Multiplying Signs", "Absolute Value", "Signed Number Subtraction"],
        "difficulty": 1,
    },
    "Order of Operations (PEMDAS)": {
        "id": "order_of_operations",
        "aliases": ["order of operations", "pemdas", "Pre-Algebra: order of operations", "Order of Operations"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Pre-Algebra",
        "prerequisites": ["Integers & Negative Numbers"],
        "core_concepts": ["Parentheses", "Exponents", "Multiplication & Division", "Addition & Subtraction", "Evaluating Nested Expressions"],
        "difficulty": 1,
    },
    "Fractions and Ratios": {
        "id": "fractions_and_ratios",
        "aliases": ["fractions", "ratios", "fractions and ratios", "Pre-Algebra: fractions and ratios", "Fractions & Ratios"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Pre-Algebra",
        "prerequisites": ["Order of Operations (PEMDAS)"],
        "core_concepts": ["Simplifying Fractions", "Equivalent Fractions", "Common Denominators", "Ratio Proportions"],
        "difficulty": 1,
    },

    # ── Algebra ──
    "Variables & Expressions": {
        "id": "variables_and_expressions",
        "aliases": ["variables", "expressions", "variables and expressions", "Algebra: variables and expressions", "Variables & Expressions", "Variables and Expressions"],
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
        "prerequisites": ["Variables & Expressions"],
        "core_concepts": ["Like Terms vs Unlike Terms", "Simplifying Expressions", "Distributive Sign Handling"],
        "difficulty": 2,
    },
    "Linear Equations (One-Step)": {
        "id": "linear_equations_one_step",
        "aliases": ["one-step equations", "linear equations one-step", "simple equations", "Linear Equations (One-Step)", "one step equations"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Algebra",
        "prerequisites": ["Variables & Expressions"],
        "core_concepts": ["Inverse Operations", "Isolating the Variable", "Balancing Both Sides"],
        "difficulty": 2,
    },
    "Distributive Property": {
        "id": "distributive_property",
        "aliases": ["distributive property", "Algebra: distributive property", "Algebra: negative signs", "Distributive Property"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Algebra",
        "prerequisites": ["Combining Like Terms"],
        "core_concepts": ["Expanding Parentheses", "Distributing Negative Multipliers", "Simplifying Expanded Terms"],
        "difficulty": 2,
    },
    "Linear Equations (Two-Step & Multi-Step)": {
        "id": "linear_equations_two_step",
        "aliases": ["linear equations", "two-step equations", "multi-step equations", "Algebra: linear equations", "Linear Equations", "Linear Equations (Two-Step & Multi-Step)", "two step equations", "multi step equations"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (One-Step)", "Combining Like Terms"],
        "core_concepts": ["Two-step equations", "Distributive property in equations", "Variables on both sides", "Transposition Sign Rules"],
        "difficulty": 3,
    },
    "Linear Inequalities": {
        "id": "linear_inequalities",
        "aliases": ["inequalities", "linear inequalities", "Algebra: linear inequalities", "Linear Inequalities"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)"],
        "core_concepts": ["Inequality symbols", "Flipping inequality sign when multiplying/dividing by negative", "Number line graphing"],
        "difficulty": 3,
    },
    "Simultaneous Equations": {
        "id": "simultaneous_equations",
        "aliases": ["simultaneous equations", "system of equations", "systems of linear equations", "Algebra: simultaneous equations", "Systems of Equations"],
        "subject": "Mathematics",
        "grade": "10th Grade",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)"],
        "core_concepts": ["Elimination Method", "Substitution Method", "Graphical Intersection"],
        "difficulty": 4,
    },
    "Quadratic Equations": {
        "id": "quadratic_equations",
        "aliases": ["quadratics", "quadratic equations", "factoring quadratics", "Algebra: quadratic equations", "Quadratic Equations"],
        "subject": "Mathematics",
        "grade": "10th Grade",
        "category": "Algebra",
        "prerequisites": ["Linear Equations (Two-Step & Multi-Step)"],
        "core_concepts": ["Factoring Quadratics", "Quadratic Formula", "Completing the Square", "Parabolas"],
        "difficulty": 4,
    },

    # ── Functions ──
    "Relations and Functions": {
        "id": "relations_and_functions",
        "aliases": ["functions", "relations", "Functions: identifying functions", "Relations and Functions", "Relations & Functions"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Functions",
        "prerequisites": ["Variables & Expressions"],
        "core_concepts": ["Function Definition", "Domain and Range", "Vertical Line Test", "Function Notation f(x)"],
        "difficulty": 3,
    },
    "Function Tables": {
        "id": "function_tables",
        "aliases": ["function tables", "Functions: tables", "Function Tables", "input output tables", "evaluating function tables"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Functions",
        "prerequisites": ["Relations and Functions"],
        "core_concepts": ["Input-Output Tables", "Function Rules", "Completing Tables", "Pattern of Change"],
        "difficulty": 3,
    },
    "Graphing Linear Functions": {
        "id": "graphing_linear_functions",
        "aliases": ["graphing linear functions", "Functions: graphing lines", "Graphing Linear Functions", "slope intercept form", "graphing lines", "Function Tables & Graphing"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Functions",
        "prerequisites": ["Function Tables"],
        "core_concepts": ["Slope-Intercept Form (y = mx + b)", "Plotting Ordered Pairs", "Slope (m) and Intercept (b)", "Line Graphing"],
        "difficulty": 3,
    },

    # ── Geometry ──
    "Angles": {
        "id": "angles",
        "aliases": ["angles", "Geometry: angle relationships", "Angles", "Angle Relationships", "complementary angles", "supplementary angles", "angle measurement"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Geometry",
        "prerequisites": [],
        "core_concepts": ["Classifying Angles (Acute, Right, Obtuse)", "Complementary Angles (Sum 90°)", "Supplementary Angles (Sum 180°)", "Vertical Angles"],
        "difficulty": 2,
    },
    "Triangles": {
        "id": "triangles",
        "aliases": ["triangles", "Geometry: triangles", "Triangles", "triangle theorems", "triangle angle sum", "Classifying Triangles"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Geometry",
        "prerequisites": ["Angles"],
        "core_concepts": ["Triangle Angle-Sum Theorem (180°)", "Classifying Triangles (Isosceles, Equilateral, Scalene)", "Finding Missing Interior Angles", "Exterior Angle Theorem"],
        "difficulty": 2,
    },
    "Pythagorean Theorem": {
        "id": "pythagorean_theorem",
        "aliases": ["pythagoras", "pythagorean theorem", "Pythagorean Theorem", "Right Triangles", "hypotenuse calculation", "a^2 + b^2 = c^2"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Geometry",
        "prerequisites": ["Triangles"],
        "core_concepts": ["Right Triangles", "Hypotenuse Calculation (c = √(a² + b²))", "Missing Leg Calculation", "Square Roots in Geometry"],
        "difficulty": 2,
    },
    "Area and Volume": {
        "id": "area_and_volume",
        "aliases": ["area and volume", "Geometry: area and volume", "Area and Volume", "Area & Volume", "perimeter", "volume of prisms", "surface area"],
        "subject": "Mathematics",
        "grade": "9th Grade",
        "category": "Geometry",
        "prerequisites": ["Triangles"],
        "core_concepts": ["Area of Triangles and Quadrilaterals", "Volume of Rectangular and Triangular Prisms", "Correct Square and Cubic Units", "Perimeter Calculations"],
        "difficulty": 2,
    },

    # ── Statistics ──
    "Reading Data Displays": {
        "id": "reading_data_displays",
        "aliases": ["reading data displays", "Statistics: data displays", "Reading Data Displays", "data displays", "bar graphs", "line graphs", "circle graphs", "histogram"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Statistics",
        "prerequisites": [],
        "core_concepts": ["Reading Bar, Line, and Circle Graphs", "Comparing Quantities in Data Displays", "Interpreting Axes and Legends", "Identifying Misleading Graph Scales"],
        "difficulty": 1,
    },
    "Measures of Center": {
        "id": "measures_of_center",
        "aliases": ["measures of center", "Statistics: mean median mode", "Measures of Center", "mean median mode", "mean", "median", "mode", "Measures of Central Tendency", "outliers"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Statistics",
        "prerequisites": ["Reading Data Displays"],
        "core_concepts": ["Calculating Mean (Average)", "Finding Median (Middle Value)", "Identifying Mode", "Choosing Best Measure of Center", "Effect of Outliers"],
        "difficulty": 2,
    },
    "Probability": {
        "id": "probability",
        "aliases": ["probability", "Statistics: probability", "Probability", "simple events", "theoretical probability", "experimental probability", "chance and likelihood"],
        "subject": "Mathematics",
        "grade": "8th Grade",
        "category": "Statistics",
        "prerequisites": ["Fractions and Ratios"],
        "core_concepts": ["Expressing Probability (Fractions, Decimals, Percentages)", "Calculating Theoretical Probability (Favorable / Total Outcomes)", "Simple and Complementary Events", "Experimental vs Theoretical Probability"],
        "difficulty": 2,
    },
}


def find_topic_node(topic_name: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Flexibly finds a Knowledge Graph node with strict precedence:
    1. Exact Knowledge Graph key match
    2. Exact Alias match
    3. Primary subject mapping (e.g., 'Geometry' -> 'Angles', 'Statistics' -> 'Reading Data Displays')
    4. Exact node ID match
    5. Clean prefix alias match (e.g. 'Geometry: triangles' -> 'triangles')
    6. Safe substring match (length >= 4 only)
    """
    if not topic_name:
        return None
    normalized = topic_name.strip().casefold()

    # 1. Exact name match on KNOWLEDGE_GRAPH keys
    for key, node in KNOWLEDGE_GRAPH.items():
        if key.casefold() == normalized:
            node_copy = node.copy()
            node_copy["name"] = key
            return node_copy

    # 2. Exact alias match
    for key, node in KNOWLEDGE_GRAPH.items():
        for alias in node.get("aliases", []):
            if alias.casefold() == normalized:
                node_copy = node.copy()
                node_copy["name"] = key
                return node_copy

    # 3. Primary Subject-level category fallback
    SUBJECT_PRIMARY_MAP = {
        "algebra": "Variables & Expressions",
        "pre-algebra": "Order of Operations (PEMDAS)",
        "pre algebra": "Order of Operations (PEMDAS)",
        "functions": "Relations and Functions",
        "geometry": "Angles",
        "statistics": "Reading Data Displays",
    }
    if normalized in SUBJECT_PRIMARY_MAP:
        primary_key = SUBJECT_PRIMARY_MAP[normalized]
        if primary_key in KNOWLEDGE_GRAPH:
            node_copy = KNOWLEDGE_GRAPH[primary_key].copy()
            node_copy["name"] = primary_key
            return node_copy

    # 4. Exact ID match
    for key, node in KNOWLEDGE_GRAPH.items():
        if node.get("id", "").casefold() == normalized:
            node_copy = node.copy()
            node_copy["name"] = key
            return node_copy

    # 5. Clean prefix alias match (e.g. 'Geometry: angle relationships' -> 'angle relationships')
    for key, node in KNOWLEDGE_GRAPH.items():
        for alias in node.get("aliases", []):
            cleaned = alias.casefold()
            for prefix in ("pre-algebra: ", "algebra: ", "functions: ", "geometry: ", "statistics: "):
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):]
            if normalized == cleaned:
                node_copy = node.copy()
                node_copy["name"] = key
                return node_copy

    # 6. Safe substring match ONLY if meaningful query length >= 4
    if len(normalized) >= 4:
        for key, node in KNOWLEDGE_GRAPH.items():
            if normalized in key.casefold() or key.casefold() in normalized:
                node_copy = node.copy()
                node_copy["name"] = key
                return node_copy

        for key, node in KNOWLEDGE_GRAPH.items():
            for alias in node.get("aliases", []):
                cleaned = alias.casefold()
                for prefix in ("pre-algebra: ", "algebra: ", "functions: ", "geometry: ", "statistics: "):
                    if cleaned.startswith(prefix):
                        cleaned = cleaned[len(prefix):]
                if (len(cleaned) >= 4 and normalized in cleaned) or (len(normalized) >= 4 and cleaned in normalized):
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


def record_mastery_attempt(
    user_id: str,
    topic_id: str,
    is_correct: bool,
    score_delta: float = 0.1,
    is_completion: bool = False,
) -> Dict[str, Any]:
    """
    Updates the student's mastery score and calculates SM-2 spaced repetition review date.
    When is_completion=True (the student successfully concluded a full 4-step lesson),
    the topic is promoted directly to mastered (mastery >= 0.90).
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
            
            if is_completion:
                new_mastery = max(0.92, min(1.0, curr_mastery + score_delta))
            else:
                new_mastery = min(1.0, max(0.0, curr_mastery + (score_delta if is_correct else -score_delta * 0.7)))
            
            stability = float(row.get("retention_stability", 1.0))
            if is_correct or is_completion:
                stability = stability * 1.5
                days_to_add = max(2, int(stability * 3))
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
            new_mastery = 0.92 if is_completion else (0.35 if is_correct else 0.05)
            status = "mastered" if new_mastery >= 0.85 else "in_progress"
            next_review = now + timedelta(days=3 if is_completion else 1)
            insert_payload = {
                "user_id": user_id,
                "topic_id": canonical_topic,
                "mastery_score": round(new_mastery, 3),
                "attempts_count": 1,
                "correct_count": 1 if is_correct else 0,
                "retention_stability": 1.5 if is_completion else 1.0,
                "status": status,
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
