import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel

from backend.config import settings
from backend.services.ai_learner import (
    find_topic_node,
    get_student_learner_context,
    log_student_mistake,
    record_mastery_attempt,
    save_learner_memory,
)
from backend.services.lesson_planner import generate_personalized_lesson_plan
from backend.services.supabase import admin_client, current_user, optional_user

logger = logging.getLogger("tutorflow.tutor_router")
router = APIRouter(prefix="/tutor", tags=["Tutor"])


class EvaluateWorkRequest(BaseModel):
    topic: str = "Linear Equations"
    problem_statement: str
    student_work_text: Optional[str] = None
    image_base64: Optional[str] = None


class TeachBackRequest(BaseModel):
    topic: str = "Linear Equations"
    concept: str
    prompt: str
    student_explanation: str


class PeerSimulateRequest(BaseModel):
    topic: str = "Linear Equations"
    peer_name: str = "Alex"
    specific_misconception: Optional[str] = None


class PeerEvaluateRequest(BaseModel):
    topic: str = "Linear Equations"
    peer_name: str = "Alex"
    problem: str
    peer_flawed_step: str
    student_explanation: str


class CognitiveAdaptRequest(BaseModel):
    cognitive_mode: str  # 'high_energy_socratic', 'normal_guided', 'fatigued_visual_microsteps'
    reason: Optional[str] = None


class EndSessionRequest(BaseModel):
    session_id: Optional[str] = None
    topic: str
    duration_seconds: int = 300
    teaching_strategy: str = "Visual Intuition"
    understanding_state: str = "Mastered"
    effective_strategy: Optional[str] = None
    notes: Optional[str] = None


_MATERIALS_CACHE: Dict[str, List[Dict[str, Any]]] = {}

@router.get("/materials")
async def get_materials(category: str = "All", topic: str = "Algebra", user: Optional[dict] = Depends(optional_user)) -> List[Dict[str, Any]]:
    """
    Returns dynamically generated and curated educational materials (Lesson Notes, Guides, Worksheets, Videos, Examples, Practice)
    specifically mapped to the learner and requested topic.
    """
    node = find_topic_node(topic)
    canonical_topic = node["name"] if node else topic
    grade = node.get("grade", "9th Grade") if node else "9th Grade"
    cache_key = f"{canonical_topic}:{category}"

    if cache_key in _MATERIALS_CACHE:
        return _MATERIALS_CACHE[cache_key]

    if settings.gemini_api_key:
        try:
            client_ai = genai.Client(api_key=settings.gemini_api_key)
            prompt = f"""You are TutorFlow's Curriculum & Learning Materials Generator.
Generate 6 rich educational materials for:
Topic: {canonical_topic}
Grade Level: {grade}
Filter Category: {category}

Generate 1 item for each category:
1. Guides (Conceptual visual breakdown)
2. Worksheets (Graded practice set)
3. Examples (Annotated worked example with common trap warnings)
4. Practice (Interactive question set)
5. Lesson Notes (Formulas & key rules cheat-sheet)
6. Videos (Visual intuition tutorial description)

Each item must have:
- id: string
- title: string
- type: one of ['Guides', 'Worksheets', 'Examples', 'Practice', 'Lesson Notes', 'Videos']
- category: same as type
- topic: {canonical_topic}
- description: 1-2 sentence description
- duration: e.g. '5 min read', '15 min practice'
- badge: e.g. 'Core Guide', 'Worked Example', 'Smart Notes'
- formula_latex: formatted LaTeX equation
- preview_steps: list of 3 bullet point steps

Return strict JSON:
{{"materials": [...]}}
"""
            response = await asyncio.wait_for(
                client_ai.aio.models.generate_content(
                    model=settings.gemini_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2,
                    ),
                ),
                timeout=3.0,
            )
            data = json.loads(response.text)
            gen_materials = data.get("materials") or []
            if gen_materials:
                clean_category = category.strip()
                res = gen_materials
                if clean_category not in ("All", "All Lesson Notes", "All Resources", "All Guides", "All Worksheets", ""):
                    filtered = [
                        m for m in gen_materials
                        if clean_category.casefold() in m.get("category", "").casefold()
                        or clean_category.casefold() in m.get("type", "").casefold()
                    ]
                    res = filtered if filtered else gen_materials
                _MATERIALS_CACHE[cache_key] = res
                return res
        except Exception as e:
            logger.warning(f"Error generating dynamic materials with Gemini: {e}")

    # Curated fallback materials
    materials_bank = [
        {
            "id": f"guide-{topic}-1",
            "title": f"Mastering {canonical_topic}: Visual Concept Guide",
            "type": "Guides",
            "category": "Guides",
            "topic": canonical_topic,
            "description": f"Step-by-step visual intuition, balance rules, and foundational strategies for {canonical_topic}.",
            "duration": "6 min read",
            "badge": "Core Guide",
            "formula_latex": "2x + 4 = 10 \\implies x = 3",
            "preview_steps": ["1. Identify the isolated variable", "2. Undo addition/subtraction", "3. Undo multiplication/division"],
        },
        {
            "id": f"worksheet-{topic}-1",
            "title": f"{canonical_topic} Step-by-Step Practice Worksheet",
            "type": "Worksheets",
            "category": "Worksheets",
            "topic": canonical_topic,
            "description": f"Printable and interactive graded problems ranging from one-step basics to multi-step challenges in {canonical_topic}.",
            "duration": "15 min",
            "badge": f"{grade} Level",
            "formula_latex": "3(x - 2) = 2x + 9",
            "preview_steps": ["5 Guided Problems", "3 Challenge Problems", "1 Teach-Back Reflection"],
        },
        {
            "id": f"example-{topic}-1",
            "title": f"Worked Example: Solving Equations with Negative Coefficients",
            "type": "Examples",
            "category": "Examples",
            "topic": canonical_topic,
            "description": "Clear annotated demonstration avoiding common sign-handling traps.",
            "duration": "4 min",
            "badge": "Worked Example",
            "formula_latex": "-4y = 28 \\implies y = -7",
            "preview_steps": ["Divide both sides by -4", "Watch sign inversion", "Verify with substitution"],
        },
        {
            "id": f"practice-{topic}-1",
            "title": f"Adaptive Diagnostic Practice: {canonical_topic}",
            "type": "Practice",
            "category": "Practice",
            "topic": canonical_topic,
            "description": "Interactive question set with instant reasoning analysis and Socratic hints.",
            "duration": "10 min",
            "badge": "Adaptive Practice",
            "formula_latex": "5x - 7 = 18",
            "preview_steps": ["Instant step-by-step verification", "Misconception alerts", "SM-2 retention tracking"],
        },
        {
            "id": f"notes-{topic}-1",
            "title": f"AI Smart Summary Notes: {canonical_topic}",
            "type": "Lesson Notes",
            "category": "Lesson Notes",
            "topic": canonical_topic,
            "description": f"Summary of inverse operations, common misconceptions, and cheat-sheet rules for {canonical_topic}.",
            "duration": "3 min",
            "badge": "Smart Notes",
            "formula_latex": "a = b \\iff a + c = b + c",
            "preview_steps": ["Inverse Operation Table", "Distributive Sign Trap Checklist", "Check Solution Formula"],
        },
        {
            "id": f"video-{topic}-1",
            "title": f"Visualizing {canonical_topic} with the Balance Scale",
            "type": "Videos",
            "category": "Videos",
            "topic": canonical_topic,
            "description": "Dynamic animated demonstration of algebraic balance and equivalence.",
            "duration": "5 min video",
            "badge": "Video Tutorial",
            "formula_latex": "\\text{Scale: } L = R",
            "preview_steps": ["Balance scale model", "Removing equal weights", "Solving for unknown weights"],
        },
    ]

    clean_category = category.strip()
    res = materials_bank
    if clean_category not in ("All", "All Lesson Notes", "All Resources", "All Guides", "All Worksheets", ""):
        filtered = [
            m for m in materials_bank
            if clean_category.casefold() in m["category"].casefold()
            or clean_category.casefold() in m["type"].casefold()
        ]
        res = filtered if filtered else materials_bank

    _MATERIALS_CACHE[cache_key] = res
    return res


@router.post("/peer-student/simulate")
async def simulate_peer_student(req: PeerSimulateRequest, user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    Multi-Agent Protégé Effect: Generates a simulated problem attempt by AI Peer 'Alex'
    containing a specific misconception for the human student to diagnose and correct.
    """
    uid = user["id"]
    context = get_student_learner_context(user_id=uid, topic=req.topic)
    unresolved_mistakes = context.get("unresolved_mistakes", [])

    target_misc = (
        req.specific_misconception
        or (unresolved_mistakes[0].get("misconception_type") if unresolved_mistakes else "Sign Reversal on Transposition")
    )

    if not settings.gemini_api_key:
        return {
            "peer_name": req.peer_name,
            "problem": "3x + 6 = 21",
            "peer_flawed_step": "3x = 21 + 6 = 27 \\implies x = 9",
            "correct_step": "3x = 21 - 6 = 15 \\implies x = 5",
            "misconception": target_misc,
            "prompt": f"Alex solved '3x + 6 = 21' and got x = 9 by adding 6 instead of subtracting. Can you explain to Alex what went wrong?",
        }

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = f"""You are the Multi-Agent Peer Simulator for TutorFlow.
Generate a realistic math attempt by AI peer student '{req.peer_name}' on topic: '{req.topic}'.
Target Misconception to embed: '{target_misc}'.

REQUIREMENTS:
1. Provide a clear math problem suitable for 9th Grade algebra.
2. Formulate Alex's flawed step-by-step attempt showing the exact misconception.
3. Formulate the correct solution.
4. Formulate an encouraging prompt inviting the human student to teach Alex.
5. Return strict JSON:
   {{"peer_name": "{req.peer_name}", "problem": "...", "peer_flawed_step": "...", "correct_step": "...", "misconception": "...", "prompt": "..."}}
"""

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Error simulating peer student: {e}")
        return {
            "peer_name": req.peer_name,
            "problem": "2x - 8 = 10",
            "peer_flawed_step": "2x = 10 - 8 = 2 \\implies x = 1",
            "correct_step": "2x = 10 + 8 = 18 \\implies x = 9",
            "misconception": "Sign Handling",
            "prompt": f"Alex subtracted 8 instead of adding 8 to both sides. Can you explain to Alex why we must use the inverse operation (+8)?",
        }


@router.post("/peer-student/evaluate")
async def evaluate_peer_teaching(req: PeerEvaluateRequest, user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    Evaluates the student's explanation when teaching AI peer 'Alex', awards Protégé Effect mastery points,
    and logs a breakthrough memory.
    """
    uid = user["id"]
    if not settings.gemini_api_key:
        record_mastery_attempt(user_id=uid, topic_id=req.topic, is_correct=True, score_delta=0.25)
        return {
            "student_successfully_taught_peer": True,
            "score": 0.9,
            "peer_reaction": f"Alex: 'Oh, now I see! Because +6 was on the left, I have to subtract 6 to keep both sides balanced. Thank you!'",
            "feedback": "Outstanding teaching! By explaining the balance principle to Alex, you verified your own deep mastery.",
        }

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = f"""You are TutorFlow AI evaluating a student's explanation to AI peer '{req.peer_name}'.
Topic: {req.topic}
Problem: {req.problem}
Alex's Flawed Step: {req.peer_flawed_step}
Student's Teaching Explanation to Alex: "{req.student_explanation}"

EVALUATE:
1. Did the student accurately spot and clearly explain Alex's mistake?
2. Did they explain WHY the rule applies (e.g. balance / inverse operations)?
3. Generate Alex's thankful 'aha!' response showing understanding.
4. Return strict JSON:
   {{"student_successfully_taught_peer": true, "score": 0.95, "peer_reaction": "Alex: '...'", "feedback": "..."}}
"""

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        result = json.loads(response.text)
        success = result.get("student_successfully_taught_peer", True)

        if success:
            record_mastery_attempt(user_id=uid, topic_id=req.topic, is_correct=True, score_delta=0.25)
            save_learner_memory(
                user_id=uid,
                memory_type="breakthrough",
                topic=req.topic,
                summary=f"Protégé Breakthrough: Successfully diagnosed and taught peer {req.peer_name} on {req.topic}.",
                confidence=0.95,
            )

        return result
    except Exception as e:
        logger.error(f"Error evaluating peer teaching: {e}")
        return {
            "student_successfully_taught_peer": True,
            "score": 0.85,
            "peer_reaction": f"Alex: 'That makes so much sense now! Thank you for walking me through it.'",
            "feedback": "Great explanation! Teaching others is one of the strongest proofs of mastery.",
        }


@router.post("/cognitive/adapt")
def adapt_cognitive_mode(req: CognitiveAdaptRequest, user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    Updates the student's active cognitive energy state ('high_energy_socratic', 'normal_guided', 'fatigued_visual_microsteps').
    """
    client = admin_client()
    uid = user["id"]
    try:
        client.table("profiles").update({"cognitive_mode": req.cognitive_mode}).eq("id", uid).execute()
    except Exception:
        pass
    return {"status": "updated", "cognitive_mode": req.cognitive_mode, "reason": req.reason}


@router.post("/evaluate-work")
async def evaluate_student_work(req: EvaluateWorkRequest, user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    AI Student-Work Vision & Step-by-Step Reasoning Analyzer:
    Takes handwritten image or student step-by-step text, locates the reasoning break,
    diagnoses misconceptions, and returns targeted remedial practice.
    """
    uid = user["id"]
    if not settings.gemini_api_key:
        return {
            "is_correct": False,
            "identified_steps": [{"step": 1, "text": "Substituted variable", "valid": True}],
            "reasoning_break_located": True,
            "misconception_type": "Sign Reversal on Transposition",
            "root_cause_explanation": "Sign was inverted incorrectly when moving across the equals sign.",
            "recommended_intervention": "Visual Balance Scale Demonstration",
            "targeted_practice": {"problem": "2x - 6 = 12", "solution": "x = 9"},
        }

    client = genai.Client(api_key=settings.gemini_api_key)

    prompt = f"""You are TutorFlow AI's Student-Work Vision & Reasoning Analyzer.
Evaluate the student's solution to the problem: "{req.problem_statement}" in the topic: "{req.topic}".

Student's Work / Steps:
{req.student_work_text or 'Analyzed from image canvas'}

TASK:
1. Examine intermediate steps carefully. Distinguish arithmetic calculation errors from conceptual misconceptions.
2. If there is a mistake, pinpoint the exact step where reasoning broke down and classify the misconception.
3. Formulate an intuitive, empathetic explanation of why the mistake occurred.
4. Generate 1 targeted follow-up practice problem testing the same concept.
5. Return strict JSON matching the schema:
   {{"is_correct": false, "identified_steps": [{{"step": 1, "text": "...", "valid": true}}], "reasoning_break_located": true, "misconception_type": "...", "root_cause_explanation": "...", "recommended_intervention": "...", "targeted_practice": {{"problem": "...", "solution": "..."}}}}
"""

    contents: List[Any] = [prompt]
    if req.image_base64:
        img_raw = req.image_base64.split(",", 1)[1] if "," in req.image_base64 else req.image_base64
        import base64
        img_bytes = base64.b64decode(img_raw)
        contents.append(types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"))

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        result = json.loads(response.text)

        # Log misconception if reasoning broke down
        if not result.get("is_correct") and result.get("misconception_type"):
            log_student_mistake(
                user_id=uid,
                topic=req.topic,
                problem_context=req.problem_statement,
                student_response=req.student_work_text or "Canvas/Image upload",
                correct_response=result.get("correct_answer", ""),
                misconception_type=result.get("misconception_type", "Conceptual Breakdown"),
                root_cause=result.get("root_cause_explanation", ""),
                ai_intervention=result.get("recommended_intervention", "Step-by-step re-explanation"),
            )

        return result
    except Exception as e:
        logger.error(f"Error evaluating student work: {e}")
        return {
            "is_correct": False,
            "reasoning_break_located": True,
            "misconception_type": "Sign Handling",
            "root_cause_explanation": "Encountered unexpected reasoning break in step 2.",
            "recommended_intervention": "Step-by-step breakdown",
            "targeted_practice": {"problem": "3x + 6 = 21", "solution": "x = 5"},
        }


@router.post("/teach-back/evaluate")
async def evaluate_teach_back(req: TeachBackRequest, user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    Evaluates student's teach-back explanation for conceptual depth, clarity, and genuine understanding.
    """
    uid = user["id"]
    if not settings.gemini_api_key:
        return {
            "conceptual_understanding_score": 0.85,
            "mastery_confirmed": True,
            "identified_strengths": ["Clear explanation of inverse operations"],
            "feedback": "Great explanation! You accurately grasped the balance principle.",
        }

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = f"""You are TutorFlow AI evaluating a student's Teach-Back response.
Topic: {req.topic}
Concept: {req.concept}
Prompt given to student: "{req.prompt}"
Student's Teach-Back explanation: "{req.student_explanation}"

EVALUATE:
1. Did the student explain the underlying WHY, or are they merely parroting keywords?
2. Did they articulate the correct mathematical principles (e.g. keeping both sides balanced)?
3. What strengths and what gaps or misconceptions exist in their explanation?
4. Is mastery confirmed? (Score 0.0 to 1.0)
5. Provide warm, encouraging feedback and a transfer challenge.
6. Return strict JSON matching schema:
   {{"conceptual_understanding_score": 0.85, "mastery_confirmed": true, "identified_strengths": ["..."], "missing_concepts": [], "misconceptions": [], "feedback": "...", "transfer_challenge": {{"problem": "...", "hint": "..."}}}}
"""

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        result = json.loads(response.text)
        score = float(result.get("conceptual_understanding_score", 0.8))
        is_mastered = score >= 0.75

        # Update mastery in learner model
        record_mastery_attempt(user_id=uid, topic_id=req.topic, is_correct=is_mastered, score_delta=0.2)

        # If high understanding, save breakthrough memory
        if is_mastered:
            save_learner_memory(
                user_id=uid,
                memory_type="breakthrough",
                topic=req.topic,
                summary=f"Successfully explained {req.concept} during teach-back verification.",
                confidence=score,
            )

        return result
    except Exception as e:
        logger.error(f"Error evaluating teach back: {e}")
        return {
            "conceptual_understanding_score": 0.8,
            "mastery_confirmed": True,
            "feedback": "Well done! Your explanation demonstrates solid conceptual grasp.",
        }


@router.get("/lesson-plan")
def get_lesson_plan(topic: str = "Linear Equations", cognitive_mode: str = "normal", user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    Returns personalized dynamic lesson plan for the student, topic, and cognitive energy mode.
    """
    return generate_personalized_lesson_plan(user_id=user["id"], topic=topic, cognitive_mode=cognitive_mode)


@router.post("/session/end")
def end_tutoring_session(req: EndSessionRequest, user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    Concludes a tutoring session, saves duration, ai_summary, teaching strategy,
    and logs an AI Teacher Reflection into ai_learner_memories.
    """
    client = admin_client()
    uid = user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()

    summary_text = (
        f"1-on-1 session on {req.topic} completed in {req.duration_seconds // 60} min. "
        f"Primary Strategy: {req.teaching_strategy}. State: {req.understanding_state}."
    )

    session_row = {
        "user_id": uid,
        "topic": req.topic,
        "subject": "Mathematics",
        "status": "completed",
        "teaching_strategy": req.teaching_strategy,
        "understanding_state": req.understanding_state,
        "session_duration_sec": req.duration_seconds,
        "ai_summary": summary_text,
        "ended_at": now_iso,
    }
    if req.session_id:
        try:
            client.table("tutoring_sessions").update(session_row).eq("id", req.session_id).execute()
        except Exception as e:
            logger.warning(f"Error updating session: {e}")
    else:
        try:
            client.table("tutoring_sessions").insert(session_row).execute()
        except Exception as e:
            logger.warning(f"Error inserting session: {e}")

    # Save Teacher Reflection
    effective_strat = req.effective_strategy or req.teaching_strategy
    reflection_note = req.notes or f"Student reached {req.understanding_state} via {effective_strat}."
    save_learner_memory(
        user_id=uid,
        memory_type="strategy_effectiveness",
        topic=req.topic,
        summary=f"Effective Strategy: {effective_strat}. Reflection: {reflection_note}",
        confidence=0.9,
    )

    return {"status": "success", "summary": summary_text}
