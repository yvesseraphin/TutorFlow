import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel

from backend.config import settings
from backend.services.ai_learner import find_topic_node, get_student_learner_context
from backend.services.supabase import admin_client, current_user

logger = logging.getLogger("tutorflow.flashcards")
router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


class ReviewFlashcardRequest(BaseModel):
    card_id: str
    rating: int  # 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)


class GenerateFlashcardsRequest(BaseModel):
    topic: str
    session_id: Optional[str] = None


@router.get("/due")
def get_due_flashcards(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]
    now = datetime.now(timezone.utc).isoformat()

    res = (
        client.table("revision_flashcards")
        .select("*")
        .eq("user_id", uid)
        .lte("next_review_at", now)
        .order("next_review_at", desc=False)
        .limit(20)
        .execute()
    )
    cards = res.data or []
    return {"due_count": len(cards), "cards": cards}


@router.post("/review")
def review_flashcard(req: ReviewFlashcardRequest, user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]
    now = datetime.now(timezone.utc)

    card_res = (
        client.table("revision_flashcards")
        .select("*")
        .eq("id", req.card_id)
        .eq("user_id", uid)
        .execute()
    )
    if not card_res.data:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    card = card_res.data[0]
    repetitions = card.get("repetitions", 0)
    interval = card.get("interval_days", 1)
    ease_factor = float(card.get("ease_factor", 2.5))
    rating = max(1, min(4, req.rating))

    # SuperMemo SM-2 Spaced Repetition Logic
    if rating >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = int(interval * ease_factor)
        repetitions += 1
    else:
        repetitions = 0
        interval = 1

    # Adjust ease factor
    ease_factor = max(1.3, ease_factor + (0.1 - (5 - (rating + 1)) * (0.08 + (5 - (rating + 1)) * 0.02)))
    next_review = now + timedelta(days=interval)

    update_payload = {
        "repetitions": repetitions,
        "interval_days": interval,
        "ease_factor": round(ease_factor, 2),
        "next_review_at": next_review.isoformat(),
        "updated_at": now.isoformat(),
    }
    client.table("revision_flashcards").update(update_payload).eq("id", req.card_id).execute()

    return {
        "card_id": req.card_id,
        "next_review_at": next_review.isoformat(),
        "interval_days": interval,
        "repetitions": repetitions,
    }


@router.post("/generate")
def generate_flashcards(req: GenerateFlashcardsRequest, user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]
    topic = req.topic

    node = find_topic_node(topic)
    canonical_topic = node["name"] if node else topic
    context = get_student_learner_context(user_id=uid, topic=canonical_topic)
    past_mistakes = context.get("unresolved_mistakes", [])

    cards_to_insert = []

    if settings.gemini_api_key:
        try:
            client_ai = genai.Client(api_key=settings.gemini_api_key)
            prompt = f"""You are TutorFlow's Spaced Repetition Flashcard Engine.
Generate 3 high-impact, conceptual active-recall flashcards for:
Topic: {canonical_topic}
Past Misconceptions to Target: {[m.get('misconception_type') for m in past_mistakes]}

REQUIREMENTS:
1. Card 1: Core definition and fundamental rule.
2. Card 2: Common misconception/sign trap to avoid.
3. Card 3: Verification method / worked formula.
4. Each card must have:
   - front_prompt: Clear question/challenge prompt
   - back_explanation: Concise, student-friendly explanation
   - formula_latex: Relevant LaTeX equation or formula
5. Return strict JSON:
   {{"cards": [{{"front_prompt": "...", "back_explanation": "...", "formula_latex": "..."}}]}}
"""
            response = client_ai.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text)
            gen_cards = data.get("cards") or []
            for c in gen_cards:
                cards_to_insert.append({
                    "user_id": uid,
                    "session_id": req.session_id,
                    "topic": canonical_topic,
                    "front_prompt": c.get("front_prompt", f"Core rule for {canonical_topic}"),
                    "back_explanation": c.get("back_explanation", "Balance both sides of the equation."),
                    "formula_latex": c.get("formula_latex", "L = R"),
                })
        except Exception as e:
            logger.warning(f"Error generating flashcards with Gemini: {e}")

    if not cards_to_insert:
        cards_to_insert = [
            {
                "user_id": uid,
                "session_id": req.session_id,
                "topic": canonical_topic,
                "front_prompt": f"What is the fundamental balancing rule for {canonical_topic}?",
                "back_explanation": f"In {canonical_topic}, whatever operation is applied to one side of the equation must be applied to the other side to maintain equivalence.",
                "formula_latex": "a = b \\implies a + c = b + c",
            },
            {
                "user_id": uid,
                "session_id": req.session_id,
                "topic": canonical_topic,
                "front_prompt": "What critical rule must you follow when distributing negative signs?",
                "back_explanation": "A negative multiplier inverts the sign of every term inside the parentheses: -(a - b) = -a + b.",
                "formula_latex": "-(a - b) = -a + b",
            },
            {
                "user_id": uid,
                "session_id": req.session_id,
                "topic": canonical_topic,
                "front_prompt": "How do you verify whether your computed solution is strictly correct?",
                "back_explanation": "Substitute your computed answer back into the original equation and evaluate if left side equals right side.",
                "formula_latex": "x_{\\text{val}} \\rightarrow f(x) = 0",
            },
        ]

    for c in cards_to_insert:
        try:
            client.table("revision_flashcards").insert(c).execute()
        except Exception as err:
            logger.warning(f"Error inserting flashcard: {err}")

    return {"status": "created", "cards_count": len(cards_to_insert), "topic": canonical_topic, "cards": cards_to_insert}
