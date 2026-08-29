import json
import logging
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types

from backend.config import settings
from backend.services.ai_learner import (
    KNOWLEDGE_GRAPH,
    find_topic_node,
    log_student_mistake,
    record_mastery_attempt,
)
from backend.services.supabase import admin_client

logger = logging.getLogger("tutorflow.diagnostic_engine")


def generate_diagnostic_questions(subject: str = "Mathematics", target_topic: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Dynamically generates 3-5 diagnostic questions assessing foundational prerequisites and core skills
    using Gemini AI, with a curated fallback.
    """
    node = find_topic_node(target_topic)
    canonical_topic = node["name"] if node else (target_topic or "Linear Equations")
    prereqs = node.get("prerequisites", []) if node else ["Order of Operations (PEMDAS)", "Integers & Negative Numbers"]

    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            prompt = f"""You are TutorFlow's AI Diagnostic Assessment Engine.
Generate 4 adaptive multiple-choice diagnostic questions to evaluate student readiness for:
Subject: {subject}
Target Topic: {canonical_topic}
Prerequisites to test: {json.dumps(prereqs)}

REQUIREMENTS:
1. Question 1 & 2 should test prerequisite foundational skills (e.g. signed numbers, PEMDAS, combining like terms).
2. Question 3 & 4 should test core topic concepts (e.g. one-step / two-step equation solving).
3. For each question, provide:
   - question: Clear math question text
   - options: 4 distinct choices as a list of strings
   - correct_answer: The exact string of the correct choice
   - prerequisite_skill: Specific sub-skill tested (e.g. 'Signed Number Operations', 'Inverse Division')
   - topic_tested: The specific concept name
   - difficulty: int between 1 and 4
4. Return strict JSON matching the schema:
   {{"questions": [{{"question": "...", "options": ["...", "..."], "correct_answer": "...", "prerequisite_skill": "...", "topic_tested": "...", "difficulty": 1}}]}}
"""
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text)
            gen_questions = data.get("questions") or []
            if gen_questions and len(gen_questions) >= 3:
                return gen_questions
        except Exception as e:
            logger.warning(f"Gemini diagnostic generation fallback: {e}")

    # Curated fallback question bank
    default_questions_bank = {
        "Integers & Negative Numbers": {
            "question": "Calculate: -7 - (-12)",
            "options": ["-19", "-5", "5", "19"],
            "correct_answer": "5",
            "prerequisite_skill": "Signed Number Addition & Subtraction",
            "difficulty": 1,
            "topic_tested": "Integers & Negative Numbers",
        },
        "Order of Operations (PEMDAS)": {
            "question": "Evaluate: 4 + 3 × (8 - 2²)",
            "options": ["16", "28", "40", "12"],
            "correct_answer": "16",
            "prerequisite_skill": "Parentheses & Exponents Evaluation",
            "difficulty": 1,
            "topic_tested": "Order of Operations (PEMDAS)",
        },
        "Variables & Expressions": {
            "question": "If x = -3, evaluate: 2x² - 4x + 1",
            "options": ["31", "7", "-5", "19"],
            "correct_answer": "31",
            "prerequisite_skill": "Negative Variable Substitution",
            "difficulty": 2,
            "topic_tested": "Variables & Expressions",
        },
        "Combining Like Terms": {
            "question": "Simplify: 5(2x - 3) - 4(x + 2)",
            "options": ["6x - 23", "6x - 7", "6x - 1", "10x - 23"],
            "correct_answer": "6x - 23",
            "prerequisite_skill": "Distributive Property with Signs",
            "difficulty": 2,
            "topic_tested": "Combining Like Terms",
        },
        "Linear Equations (One-Step)": {
            "question": "Solve for y: -4y = 28",
            "options": ["-7", "7", "24", "-32"],
            "correct_answer": "-7",
            "prerequisite_skill": "Inverse Division Operations",
            "difficulty": 2,
            "topic_tested": "Linear Equations (One-Step)",
        },
        "Linear Equations (Two-Step & Multi-Step)": {
            "question": "Solve for x: 3(x - 2) = 2x + 9",
            "options": ["15", "11", "7", "3"],
            "correct_answer": "15",
            "prerequisite_skill": "Balancing Equations with Variables on Both Sides",
            "difficulty": 3,
            "topic_tested": "Linear Equations (Two-Step & Multi-Step)",
        },
    }

    topics_to_test = prereqs + [canonical_topic]
    questions = []
    for t in topics_to_test:
        matched = find_topic_node(t)
        key = matched["name"] if matched else t
        if key in default_questions_bank:
            questions.append(default_questions_bank[key].copy())

    if not questions:
        questions = list(default_questions_bank.values())[:4]

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
        try:
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
        except Exception as err:
            logger.warning(f"Error saving diagnostic question: {err}")

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
    try:
        client.table("diagnostic_assessments").update({
            "status": "completed",
            "overall_score": overall_score,
            "detected_gaps": detected_gaps,
            "missing_prerequisites": missing_prerequisites,
            "recommendations": recommendations,
            "evaluation_summary": summary_text,
        }).eq("id", assessment_id).execute()
    except Exception as err:
        logger.warning(f"Error updating diagnostic assessment: {err}")

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
