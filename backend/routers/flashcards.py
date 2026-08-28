from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.services.supabase import admin_client, current_user

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

    default_cards = [
        {
            "user_id": uid,
            "session_id": req.session_id,
            "topic": topic,
            "front_prompt": f"What is the core definition and rule for {topic}?",
            "back_explanation": f"In {topic}, keep both sides of the equation balanced by applying the identical inverse operation.",
            "formula_latex": "a = b \\implies a + c = b + c",
        },
        {
            "user_id": uid,
            "session_id": req.session_id,
            "topic": topic,
            "front_prompt": "What mistake should you always avoid with negative signs?",
            "back_explanation": "Remember to distribute the negative sign to EVERY term inside parentheses: -(x - 4) = -x + 4.",
            "formula_latex": "-(a - b) = -a + b",
        },
        {
            "user_id": uid,
            "session_id": req.session_id,
            "topic": topic,
            "front_prompt": "How do you verify if your solution is correct?",
            "back_explanation": "Substitute your answer back into the original equation to verify both sides equal each other.",
            "formula_latex": "x_{\\text{val}} \\rightarrow f(x) = 0",
        },
    ]

    for c in default_cards:
        client.table("revision_flashcards").insert(c).execute()

    return {"status": "created", "cards_count": len(default_cards), "topic": topic}
