import json
import logging
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types

from backend.config import settings
from backend.services.ai_learner import find_topic_node, get_student_learner_context

logger = logging.getLogger("tutorflow.lesson_planner")


def generate_personalized_lesson_plan(
    user_id: str,
    topic: str,
    subject: str = "Mathematics",
    cognitive_mode: str = "normal",
) -> Dict[str, Any]:
    """
    Dynamically generates a personalized teaching plan for the student on a topic.
    Takes into account missing prerequisites, past mistakes, learner pace, preferred style,
    and cognitive energy / burnout mode (High Energy vs Low Energy / Fatigue).
    """
    context = get_student_learner_context(user_id=user_id, topic=topic, cognitive_mode=cognitive_mode)
    profile = context["profile"]
    matched_node = context.get("matched_node")
    canonical_topic = matched_node["name"] if matched_node else topic
    missing_prereqs = context.get("missing_prerequisites", [])
    past_mistakes = context.get("unresolved_mistakes", [])
    memories = context.get("learner_memories", [])
    effective_strategies = context.get("effective_strategies", [])

    is_fatigued = cognitive_mode in ("fatigued_low_energy", "low_energy", "tired")

    if not settings.gemini_api_key:
        return _fallback_lesson_plan(canonical_topic, profile, missing_prereqs, is_fatigued)

    client = genai.Client(api_key=settings.gemini_api_key)

    energy_instruction = (
        "STUDENT IS EXPERIENCING COGNITIVE FATIGUE / LOW ENERGY: "
        "Keep language very simple, prioritize visual balance analogies, reduce formula jargon, "
        "and break concepts into tiny, bite-sized micro-steps with minimal cognitive load."
        if is_fatigued
        else "STUDENT IS IN HIGH/NORMAL FOCUS MODE: Use rigorous Socratic inquiry, multi-step problem solving, and deep transfer challenges."
    )

    prompt = f"""You are the Master Lesson Planner for TutorFlow, an elite AI adaptive private teacher.
Create a highly personalized, dynamic step-by-step lesson plan for this student.

STUDENT PROFILE:
- Name: {profile.get('name')}
- Grade: {profile.get('grade')}
- Preferred Teaching Style: {profile.get('teaching_style')}
- Learning Pace: {profile.get('learning_pace')}
- Cognitive Energy Mode: {cognitive_mode}

COGNITIVE ENERGY INSTRUCTION:
{energy_instruction}

LEARNER MODEL & GAPS:
- Target Topic: {canonical_topic}
- Subject: {subject}
- Missing Prerequisites Detected: {json.dumps(missing_prereqs)}
- Unresolved Past Misconceptions: {[m.get('misconception_type') + ': ' + m.get('root_cause', '') for m in past_mistakes]}
- Teacher Memory Insights & Proven Strategies: {effective_strategies[:3] or [mem.get('summary') for mem in memories[:3]]}

REQUIREMENTS:
1. If missing prerequisites exist, the first step MUST be a rapid foundation review before teaching the main topic.
2. Structure 5 distinct pedagogical steps following TutorFlow's adaptive intelligence loop:
   - Step 1: Foundation Review / Intuitive Visual Balance Hook
   - Step 2: Core Concept Breakdown (with interactive balance scale & sign rules)
   - Step 3: Worked Example & Animated Step-by-Step Demonstration
   - Step 4: Multi-Agent Protégé Challenge: Student teaches AI Peer 'Alex' who makes a common misconception
   - Step 5: Transfer Challenge & Verified Mastery
3. For each step, include:
   - step_number: int
   - title: Short step title
   - objective: Specific cognitive goal
   - teaching_strategy: Strategy name (e.g. 'Visual Intuition', 'Concrete Analogy', 'Step-by-Step Decomposition', 'Protégé Peer Teaching', 'Teach-Back Verification')
   - teacher_speech_prompt: Spoken prompt for the AI teacher
   - whiteboard_actions: List of visual actions (equations, highlights, balance scales)
   - check_question: Active question to ask the student
   - expected_answer: Expected correct student response
   - misconception_traps: Common errors to watch out for
4. Return strict JSON matching the schema.
"""

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        plan_data = json.loads(response.text)
        steps = plan_data.get("steps") or []
        if not steps:
            return _fallback_lesson_plan(canonical_topic, profile, missing_prereqs, is_fatigued)

        return {
            "topic": canonical_topic,
            "subject": subject,
            "cognitive_mode": cognitive_mode,
            "teaching_strategy": "Concrete Analogy (Low Cognitive Load)" if is_fatigued else profile.get("teaching_style", "step_by_step"),
            "missing_prerequisites_addressed": missing_prereqs,
            "steps": steps,
            "estimated_duration_min": 10 if is_fatigued else 15,
        }
    except Exception as e:
        logger.error(f"Error generating lesson plan via Gemini: {e}")
        return _fallback_lesson_plan(canonical_topic, profile, missing_prereqs, is_fatigued)


def _fallback_lesson_plan(topic: str, profile: dict, missing_prereqs: list, is_fatigued: bool = False) -> dict:
    steps = []
    if missing_prereqs:
        steps.append({
            "step_number": 1,
            "title": f"Quick Foundation Review: {missing_prereqs[0]}",
            "objective": "Review essential prerequisite foundation",
            "teaching_strategy": "Concrete Analogy",
            "teacher_speech_prompt": f"Before we dive into {topic}, let's take a quick 1-minute look at {missing_prereqs[0]} so everything makes total sense.",
            "whiteboard_actions": [{"type": "write_math", "latex": f"\\text{{Foundation Review: }} {missing_prereqs[0]}"}],
            "check_question": "What is the primary rule for signed number operations?",
            "expected_answer": "Opposite signs subtract, same signs add.",
            "misconception_traps": ["Sign reversal on transposition"],
        })

    steps.extend([
        {
            "step_number": len(steps) + 1,
            "title": "Interactive Balance Scale Hook",
            "objective": f"Understand the core principle of {topic}",
            "teaching_strategy": "Visual Intuition",
            "teacher_speech_prompt": f"Think of {topic} like a balance scale: whatever we do to the left side, we do to the right side to keep it perfectly level.",
            "whiteboard_actions": [
                {"type": "interactive_balance_scale", "left": "2x + 4", "right": "10", "balanced": True},
                {"type": "write_math", "latex": "2x + 4 = 10"}
            ],
            "check_question": "Why do we perform the same operation on both sides?",
            "expected_answer": "To keep the equation balanced.",
            "misconception_traps": ["Operating on one side only"],
        },
        {
            "step_number": len(steps) + 2,
            "title": "Animated Step-by-Step Demonstration",
            "objective": "Observe systematic variable isolation with sign tracking",
            "teaching_strategy": "Step-by-Step Decomposition",
            "teacher_speech_prompt": "Watch how we isolate x by subtracting 4 from both sides, then dividing by 2.",
            "whiteboard_actions": [
                {"type": "animate_step_transformation", "from": "2x + 4 = 10", "to": "2x = 6", "operation": "Subtract 4 from both sides"},
                {"type": "animate_step_transformation", "from": "2x = 6", "to": "x = 3", "operation": "Divide by 2"}
            ],
            "check_question": "What is the inverse operation of +4?",
            "expected_answer": "-4",
            "misconception_traps": ["Dividing before subtracting"],
        },
        {
            "step_number": len(steps) + 3,
            "title": "Protégé Challenge: Teach Alex (AI Peer)",
            "objective": "Identify and correct a peer student's common misconception",
            "teaching_strategy": "Protégé Peer Teaching",
            "teacher_speech_prompt": "Our AI peer student Alex tried solving '3x + 6 = 21' and wrote '3x = 27' by adding 6 instead of subtracting. Can you explain to Alex what went wrong?",
            "whiteboard_actions": [
                {"type": "peer_student_dialogue", "peer": "Alex", "attempt": "3x + 6 = 21 \\implies 3x = 27"},
                {"type": "highlight", "label": "Alex added 6 instead of subtracting 6"}
            ],
            "check_question": "What mistake did Alex make?",
            "expected_answer": "Alex added 6 instead of subtracting 6 from 21.",
            "misconception_traps": ["Failing to recognize sign inversion"],
        },
        {
            "step_number": len(steps) + 4,
            "title": "Transfer Challenge & Verified Mastery",
            "objective": "Solve a varied problem format to confirm mastery",
            "teaching_strategy": "Transfer Practice",
            "teacher_speech_prompt": "Now solve this transfer challenge: 14 = 4 - 2y. Take your time!",
            "whiteboard_actions": [{"type": "write_math", "latex": "14 = 4 - 2y"}],
            "check_question": "What is y?",
            "expected_answer": "y = -5",
            "misconception_traps": ["Dropping the negative sign in front of 2y"],
        }
    ])

    return {
        "topic": topic,
        "subject": "Mathematics",
        "cognitive_mode": "fatigued_low_energy" if is_fatigued else "normal",
        "teaching_strategy": "Concrete Analogy" if is_fatigued else profile.get("teaching_style", "step_by_step"),
        "missing_prerequisites_addressed": missing_prereqs,
        "steps": steps,
        "estimated_duration_min": 10 if is_fatigued else 15,
    }
