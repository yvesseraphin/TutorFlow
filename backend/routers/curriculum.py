from fastapi import APIRouter, Depends

from backend.curriculum import CURRICULUM, lesson_for_learner
from backend.services.supabase import current_user

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])


@router.get("")
def curriculum(_: dict = Depends(current_user)) -> dict:
    return {"courses": CURRICULUM}


@router.get("/next-lesson")
def next_lesson(topic: str = "Algebra", user: dict = Depends(current_user)) -> dict:
    return lesson_for_learner(topic, {})
