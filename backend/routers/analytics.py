from fastapi import APIRouter, Depends

from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
def dashboard(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    mastery = client.table("skill_mastery").select("skill,mastery,attempts,correct_attempts").eq("user_id", user["id"]).execute().data or []
    sessions = client.table("tutoring_sessions").select("id").eq("user_id", user["id"]).execute().data or []
    return {
        "topic_mastery": {row["skill"]: float(row["mastery"]) for row in mastery},
        "attempts": sum(row["attempts"] for row in mastery),
        "correct_attempts": sum(row["correct_attempts"] for row in mastery),
        "sessions_completed": len(sessions),
    }
