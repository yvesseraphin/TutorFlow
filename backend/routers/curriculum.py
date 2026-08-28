from typing import Any, Dict, List
from fastapi import APIRouter, Depends

from backend.services.ai_learner import KNOWLEDGE_GRAPH
from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])


@router.get("")
@router.get("/")
def get_curriculum_root(user: dict = Depends(current_user)) -> dict:
    from backend.curriculum import CURRICULUM
    return {"courses": CURRICULUM}


@router.get("/tree")
def get_curriculum_tree(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]

    # Fetch student's mastery records
    mastery_res = (
        client.table("student_learner_model")
        .select("topic_id,mastery_score,status,retention_stability,last_practiced_at")
        .eq("user_id", uid)
        .execute()
    )
    mastery_map = {m["topic_id"]: m for m in (mastery_res.data or [])}

    nodes: List[Dict[str, Any]] = []
    categories: Dict[str, List[Dict[str, Any]]] = {}

    for topic_name, info in KNOWLEDGE_GRAPH.items():
        user_record = mastery_map.get(topic_name, {})
        mastery_score = float(user_record.get("mastery_score", 0.0))
        status = user_record.get("status", "not_started" if mastery_score == 0 else ("mastered" if mastery_score >= 0.85 else "in_progress"))

        node = {
            "id": info["id"],
            "title": topic_name,
            "subject": info["subject"],
            "grade": info["grade"],
            "category": info["category"],
            "difficulty": info["difficulty"],
            "prerequisites": info["prerequisites"],
            "core_concepts": info["core_concepts"],
            "user_mastery": mastery_score,
            "status": status,
            "last_practiced_at": user_record.get("last_practiced_at"),
        }
        nodes.append(node)
        cat = info["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(node)

    return {
        "nodes": nodes,
        "categories": categories,
        "total_topics": len(nodes),
    }


@router.get("/next-lesson")
def get_next_lesson(topic: str = "Algebra", user: dict = Depends(current_user)) -> dict:
    from backend.curriculum import lesson_for_learner
    client = admin_client()
    uid = user["id"]
    mastery_res = (
        client.table("student_learner_model")
        .select("topic_id,mastery_score")
        .eq("user_id", uid)
        .execute()
    )
    mastery_rows = [{"skill": r["topic_id"], "mastery": float(r.get("mastery_score", 0))} for r in (mastery_res.data or [])]
    return lesson_for_learner(topic, mastery_rows)

