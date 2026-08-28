import json
import logging
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types

from backend.config import settings
from backend.services.ai_learner import KNOWLEDGE_GRAPH, record_mastery_attempt, log_student_mistake
from backend.services.supabase import admin_client

logger = logging.getLogger("tutorflow.diagnostic_engine")


def generate_diagnostic_questions(subject: str = "Mathematics", target_topic: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Generates a set of 3-5 diagnostic questions assessing both foundational prerequisites and core topic skills.
    """
    if target_topic and target_topic in KNOWLEDGE_GRAPH:
        node = KNOWLEDGE_GRAPH[target_topic]
        prereqs = node.get("prerequisites", [])
        topics_to_test = prereqs + [target_topic]
    else:
        topics_to_test = list(KNOWLEDGE_GRAPH.keys())[:4]

    questions = []
    default_questions_bank = {
        "Integers & Negative Numbers": {
            "question": "What is -7 - (-12)?",
            "options": ["-19", "-5", "5", "19"],
            "correct_answer": "5",
            "prerequisite_skill": "Signed Number Addition & Subtraction",
            "difficulty": 1,
        },
        "Order of Operations (PEMDAS)": {
            "question": "Evaluate: 4 + 3 * (8 - 2^2)",
            "options": ["16", "28", "40", "12"],
            "correct_answer": "16",
            "prerequisite_skill": "Parentheses & Exponents Evaluation",
            "difficulty": 1,
        },
        "Variables & Expressions": {
            "question": "If x = -3, evaluate the algebraic expression: 2x^2 - 4x + 1",
            "options": ["31", "7", "-5", "19"],
            "correct_answer": "31",
            "prerequisite_skill": "Negative Variable Substitution",
            "difficulty": 2,
        },
        "Combining Like Terms": {
            "question": "Simplify: 5(2x - 3) - 4(x + 2)",
            "options": ["6x - 23", "6x - 7", "6x - 1", "10x - 23"],
            "correct_answer": "6x - 23",
            "prerequisite_skill": "Distributive Property with Signs",
            "difficulty": 2,
        },
        "Linear Equations (One-Step)": {
            "question": "Solve for y: -4y = 28",
            "options": ["-7", "7", "24", "-32"],
            "correct_answer": "-7",
            "prerequisite_skill": "Inverse Division Operations",
            "difficulty": 2,
        },
        "Linear Equations (Two-Step & Multi-Step)": {
            "question": "Solve for x: 3(x - 2) = 2x + 9",
            "options": ["15", "11", "7", "3"],
            "correct_answer": "15",
            "prerequisite_skill": "Balancing Equations with Variables on Both Sides",
            "difficulty": 3,
        },
    }

    for t in topics_to_test:
        if t in default_questions_bank:
            q = default_questions_bank[t].copy()
            q["topic_tested"] = t
            questions.append(q)

    return questions


def evaluate_diagnostic_assessment(user_id: str, assessment_id: str, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates all submitted answers in a diagnostic assessment, updates learner model mastery,
    identifies misconceptions and missing prerequisites, and saves records to Supabase.
    """
    client = admin_client()
    detected_gaps: List[str] = []
    missing_prerequisites: List[str] = []
    detailed_results: List[Dict[str, Any]] = []
    total_correct = 0

    for item in answers:
        question_text = item.get("question_text", "")
        topic_tested = item.get("topic_tested", "General Math")
        prereq_skill = item.get("prerequisite_skill", "")
        student_ans = str(item.get("student_answer", "")).strip()
        correct_ans = str(item.get("correct_answer", "")).strip()
        difficulty = item.get("difficulty", 1)

        is_correct = (student_ans.casefold() == correct_ans.casefold())
        if is_correct:
            total_correct += 1
            record_mastery_attempt(user_id, topic_tested, is_correct=True, score_delta=0.25)
        else:
            record_mastery_attempt(user_id, topic_tested, is_correct=False, score_delta=0.2)
            detected_gaps.append(topic_tested)
            if prereq_skill:
                missing_prerequisites.append(prereq_skill)
            
            # Log mistake diagnosis
            log_student_mistake(
                user_id=user_id,
                topic=topic_tested,
                problem_context=question_text,
                student_response=student_ans,
                correct_response=correct_ans,
                misconception_type="diagnostic_gap",
                root_cause=f"Struggled with {prereq_skill or topic_tested} during initial diagnostic.",
                ai_intervention=f"Recommend foundation review on {prereq_skill or topic_tested} prior to advanced topics."
            )

        # Save question row
        client.table("diagnostic_questions").insert({
            "assessment_id": assessment_id,
            "question_text": question_text,
            "topic_tested": topic_tested,
            "prerequisite_skill": prereq_skill,
            "difficulty": difficulty,
            "student_answer": student_ans,
            "is_correct": is_correct,
            "misconception_type": "conceptual" if not is_correct else None,
            "ai_analysis": "Mastered foundational step" if is_correct else f"Gap identified in {prereq_skill or topic_tested}",
        }).execute()

        detailed_results.append({
            "topic": topic_tested,
            "is_correct": is_correct,
            "student_answer": student_ans,
            "correct_answer": correct_ans,
        })

    overall_score = round(total_correct / max(1, len(answers)), 3)

    summary_text = (
        f"Diagnostic completed with {int(overall_score * 100)}% accuracy. "
        + (f"Knowledge gaps detected in: {', '.join(detected_gaps)}." if detected_gaps else "Strong foundational mastery across all tested concepts!")
    )

    recommendations = [
        {"topic": gap, "action": "Review foundational concepts", "priority": "high"}
        for gap in detected_gaps
    ]

    # Update assessment record
    client.table("diagnostic_assessments").update({
        "status": "completed",
        "overall_score": overall_score,
        "detected_gaps": detected_gaps,
        "missing_prerequisites": missing_prerequisites,
        "recommendations": recommendations,
        "evaluation_summary": summary_text,
    }).eq("id", assessment_id).execute()

    return {
        "assessment_id": assessment_id,
        "overall_score": overall_score,
        "total_correct": total_correct,
        "total_questions": len(answers),
        "detected_gaps": detected_gaps,
        "missing_prerequisites": missing_prerequisites,
        "recommendations": recommendations,
        "evaluation_summary": summary_text,
        "results": detailed_results,
    }
