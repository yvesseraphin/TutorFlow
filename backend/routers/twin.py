from fastapi import APIRouter, Depends

from backend.routers.tutor import learner_context
from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/twin", tags=["Cognitive Twin"])


def _mastery_status(mastery: float) -> str:
    if mastery >= 0.8:
        return "mastered"
    if mastery > 0:
        return "weak"
    return "unlocked"


@router.get("/profile")
def profile(user: dict = Depends(current_user)) -> dict:
    context = learner_context(user["id"])
    weaknesses = context["weaknesses"]
    mastery = context["mastery"]
    nodes = [
        {"id": row["skill"], "label": row["skill"], "mastery": float(row["mastery"]), "status": _mastery_status(float(row["mastery"]))}
        for row in mastery
    ]
    return {
        "learning_style": {},
        "knowledge_map": {"nodes": nodes, "edges": []},
        "misconception_graph": {"nodes": [
            {"id": row["id"], "label": row["kind"], "severity": float(row["confidence"]), "occurrences": row["occurrences"]}
            for row in weaknesses
        ], "edges": []},
        "forgetting_curve": {"retention": round(sum(float(row["mastery"]) for row in mastery) / len(mastery), 2) if mastery else 0, "concepts_at_risk": [row["skill"] for row in weaknesses]},
        "predictions": {"predicted_weaknesses": [row["skill"] for row in weaknesses], "upcoming_struggles": "Continue practising skills with low mastery." if weaknesses else "No active learning risks detected."},
        "confidence_tracker": [],
    }


@router.get("/knowledge-map")
def knowledge_map(user: dict = Depends(current_user)) -> dict:
    return profile(user)["knowledge_map"]


@router.get("/misconceptions")
def misconceptions(user: dict = Depends(current_user)) -> list[dict]:
    return admin_client().table("weaknesses").select("*").eq("user_id", user["id"]).order("updated_at", desc=True).execute().data or []
