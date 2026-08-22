from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from backend.routers.tutor import learner_context
from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/twin", tags=["Cognitive Twin"])


class LearningStyleUpdate(BaseModel):
    style_key: str = Field(min_length=2, max_length=60)
    percentage: float = Field(ge=0, le=100)


class ConfidenceSnapshotCreate(BaseModel):
    score: float = Field(ge=0, le=1)
    label: str | None = Field(default=None, max_length=120)


def _mastery_status(mastery: float) -> str:
    if mastery >= 0.8:
        return "mastered"
    if mastery > 0:
        return "weak"
    return "unlocked"


@router.get("/profile")
def profile(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]

    context = learner_context(uid)
    weaknesses = context["weaknesses"]
    mastery = context["mastery"]

    nodes = [
        {
            "id": row["skill"],
            "label": row["skill"],
            "mastery": float(row["mastery"]),
            "status": _mastery_status(float(row["mastery"])),
        }
        for row in mastery
    ]

    snapshots = (
        client.table("confidence_snapshots")
        .select("score,label,created_at")
        .eq("user_id", uid)
        .order("created_at", desc=False)
        .limit(20)
        .execute()
        .data
        or []
    )
    confidence_tracker = [
        {
            "date": datetime.fromisoformat(s["created_at"].replace("Z", "+00:00")).strftime("%b %d"),
            "val": round(float(s["score"]) * 100),
            "label": s.get("label", ""),
        }
        for s in snapshots
    ]

    style_rows = (
        client.table("learning_style_profiles")
        .select("style_key,percentage")
        .eq("user_id", uid)
        .execute()
        .data
        or []
    )
    learning_style = {r["style_key"]: float(r["percentage"]) for r in style_rows}

    if not learning_style:
        learning_style = {"Visual": 0.0, "Analytical": 0.0, "Example-driven": 0.0}

    retention = (
        round(sum(float(r["mastery"]) for r in mastery) / len(mastery), 3)
        if mastery
        else 0.0
    )

    return {
        "learning_style": learning_style,
        "knowledge_map": {"nodes": nodes, "edges": []},
        "misconception_graph": {
            "nodes": [
                {
                    "id": row["id"],
                    "label": row["kind"],
                    "severity": float(row["confidence"]),
                    "occurrences": row["occurrences"],
                }
                for row in weaknesses
            ],
            "edges": [],
        },
        "forgetting_curve": {
            "retention": retention,
            "concepts_at_risk": [row["skill"] for row in weaknesses],
        },
        "predictions": {
            "predicted_weaknesses": [row["skill"] for row in weaknesses],
            "upcoming_struggles": (
                "Continue practising skills with low mastery."
                if weaknesses
                else "No active learning risks detected. Keep up the great work!"
            ),
        },
        "confidence_tracker": confidence_tracker,
    }


@router.get("/knowledge-map")
def knowledge_map(user: dict = Depends(current_user)) -> dict:
    return profile(user)["knowledge_map"]


@router.get("/misconceptions")
def misconceptions(user: dict = Depends(current_user)) -> list[dict]:
    return (
        admin_client()
        .table("weaknesses")
        .select("*")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .execute()
        .data
        or []
    )


@router.post("/confidence-snapshot", status_code=201)
def add_confidence_snapshot(
    payload: ConfidenceSnapshotCreate,
    user: dict = Depends(current_user),
) -> dict:
    row = {
        "user_id": user["id"],
        "score": round(payload.score, 3),
        "label": payload.label or "",
    }
    result = admin_client().table("confidence_snapshots").insert(row).execute()
    return result.data[0]


@router.post("/learning-style", status_code=200)
def update_learning_style(
    payload: LearningStyleUpdate,
    user: dict = Depends(current_user),
) -> dict:
    row = {
        "user_id": user["id"],
        "style_key": payload.style_key,
        "percentage": round(payload.percentage, 2),
    }
    result = (
        admin_client()
        .table("learning_style_profiles")
        .upsert(row, on_conflict="user_id,style_key")
        .execute()
    )
    return result.data[0]
