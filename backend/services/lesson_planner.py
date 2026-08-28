import json
import logging
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types

from backend.config import settings
from backend.services.ai_learner import get_student_learner_context

logger = logging.getLogger("tutorflow.lesson_planner")


def generate_personalized_lesson_plan(user_id: str, topic: str, subject: str = "Mathematics") -> Dict[str, Any]:
    """
    Dynamically generates a personalized teaching plan for the student on a topic.
    Takes into account missing prerequisites, past mistakes, learner pace, and preferred style.
    """
    context = get_student_learner_context(user_id=user_id, topic=topic)
    profile = context["profile"]
    missing_prereqs = context.get("missing_prerequisites", [])
    past_mistakes = context.get("unresolved_mistakes", [])
    memories = context.get("learner_memories", [])

    if not settings.gemini_api_key:
        # Fallback plan if offline/no key
        return _fallback_lesson_plan(topic, profile, missing_prereqs)

    client = genai.Client(api_key=settings.gemini_api_key)

    prompt = f"""You are the Master Lesson Planner for TutorFlow, an elite AI private teacher.
Create a highly personalized, dynamic step-by-step lesson plan for this student.

STUDENT PROFILE:
- Name: {profile.get('name')}
- Grade: {profile.get('grade')}
- Preferred Teaching Style: {profile.get('teaching_style')}
- Learning Pace: {profile.get('learning_pace')}

LEARNER MODEL & GAPS:
- Target Topic: {topic}
- Subject: {subject}
- Missing Prerequisites: {json.dumps(missing_prereqs)}
- Unresolved Past Mistakes: {[m.get('misconception_type') + ': ' + m.get('root_cause', '') for m in past_mistakes]}
- Teacher Memory Insights: {[mem.get('summary') for mem in memories]}

REQUIREMENTS:
1. If missing prerequisites exist, the first 1-2 steps MUST be a rapid foundation review (e.g. review negative signs before quadratic equations).
2. For each step, define:
   - title: Short step title
   - objective: What the student will grasp
   - teacher_speech_prompt: What the teacher will say/explain aloud
   - whiteboard_actions: List of visual actions (equations to write, diagrams to draw, parts to highlight)
   - check_question: An active understanding question to ask the student before moving on
   - expected_answer: Expected correct student response
   - misconception_traps: Common errors to watch out for
3. Return strict JSON matching the schema.
"""

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        plan_data = json.loads(response.text)
        return {
            "topic": topic,
            "subject": subject,
            "teaching_strategy": profile.get("teaching_style", "step_by_step"),
            "missing_prerequisites_addressed": missing_prereqs,
            "steps": plan_data.get("steps", []),
            "estimated_duration_min": plan_data.get("estimated_duration_min", 15),
        }
    except Exception as e:
        logger.error(f"Error generating lesson plan via Gemini: {e}")
        return _fallback_lesson_plan(topic, profile, missing_prereqs)


def _fallback_lesson_plan(topic: str, profile: dict, missing_prereqs: list) -> dict:
    steps = []
    if missing_prereqs:
        steps.append({
            "step_number": 1,
            "title": f"Foundation Review: {missing_prereqs[0]}",
            "objective": "Review essential prerequisite concepts",
            "teacher_speech_prompt": f"Before we dive into {topic}, let's quickly review {missing_prereqs[0]} to make sure our foundations are rock solid!",
            "whiteboard_actions": [{"type": "write_math", "latex": f"\\text{{Review: }} {missing_prereqs[0]}"}],
            "check_question": "Are you ready to test this quick concept?",
            "expected_answer": "Yes",
        })
    steps.extend([
        {
            "step_number": len(steps) + 1,
            "title": "Core Concept Introduction",
            "objective": f"Understand the fundamental principle of {topic}",
            "teacher_speech_prompt": f"Let's explore {topic}. We will break down the rules step-by-step so you can master them easily.",
            "whiteboard_actions": [{"type": "write_math", "latex": f"\\mathbf{{{topic}}}"}],
            "check_question": "What is the primary variable we are working with?",
            "expected_answer": "x",
        },
        {
            "step_number": len(steps) + 2,
            "title": "Worked Example & Whiteboard Demonstration",
            "objective": "Observe step-by-step problem breakdown",
            "teacher_speech_prompt": "Watch how we apply the inverse operation on both sides of the equation.",
            "whiteboard_actions": [
                {"type": "write_math", "latex": "2x + 4 = 10"},
                {"type": "highlight", "label": "Subtract 4 from both sides"},
                {"type": "write_math", "latex": "2x = 6 \\implies x = 3"}
            ],
            "check_question": "What did we subtract from both sides?",
            "expected_answer": "4",
        },
        {
            "step_number": len(steps) + 3,
            "title": "Guided Practice & Mastery Check",
            "objective": "Solve an independent problem with teacher feedback",
            "teacher_speech_prompt": "Now your turn! Solve for x: 3x - 5 = 10.",
            "whiteboard_actions": [{"type": "write_math", "latex": "3x - 5 = 10"}],
            "check_question": "What is x?",
            "expected_answer": "x = 5",
        }
    ])
    return {
        "topic": topic,
        "subject": "Mathematics",
        "teaching_strategy": profile.get("teaching_style", "step_by_step"),
        "missing_prerequisites_addressed": missing_prereqs,
        "steps": steps,
        "estimated_duration_min": 15,
    }
