from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends

from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
def dashboard(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]

    mastery_rows = (
        client.table("skill_mastery")
        .select("skill,mastery,attempts,correct_attempts,updated_at")
        .eq("user_id", uid)
        .order("updated_at", desc=True)
        .execute()
        .data
        or []
    )
    sessions = (
        client.table("tutoring_sessions")
        .select("id,topic,status,created_at,ended_at")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )
    weakness_rows = (
        client.table("weaknesses")
        .select("skill,kind,confidence,occurrences,resolved,updated_at")
        .eq("user_id", uid)
        .eq("resolved", False)
        .order("confidence", desc=True)
        .execute()
        .data
        or []
    )

    total_attempts = sum(r["attempts"] for r in mastery_rows)
    total_correct = sum(r["correct_attempts"] for r in mastery_rows)
    accuracy = round(total_correct / total_attempts, 3) if total_attempts else 0.0

    completed_sessions = [s for s in sessions if s["status"] == "completed"]

    overall_mastery = (
        round(sum(float(r["mastery"]) for r in mastery_rows) / len(mastery_rows), 3)
        if mastery_rows
        else 0.0
    )

    today = datetime.now(timezone.utc).date()
    weekly_activity: dict[str, int] = {}
    for i in range(6, -1, -1):
        day = (today - timedelta(days=i)).strftime("%a")
        weekly_activity[day] = 0
    for s in sessions:
        try:
            session_date = datetime.fromisoformat(
                s["created_at"].replace("Z", "+00:00")
            ).date()
            delta = (today - session_date).days
            if 0 <= delta <= 6:
                day_label = session_date.strftime("%a")
                if day_label in weekly_activity:
                    weekly_activity[day_label] += 1
        except Exception:
            pass

    recent_sessions = [
        {
            "id": s["id"],
            "topic": s["topic"],
            "status": s["status"],
            "created_at": s["created_at"],
            "ended_at": s.get("ended_at"),
        }
        for s in sessions[:5]
    ]

    skill_mastery_list = [
        {
            "skill": r["skill"],
            "mastery": float(r["mastery"]),
            "attempts": r["attempts"],
            "correct_attempts": r["correct_attempts"],
        }
        for r in mastery_rows
    ]

    streak = 0
    check_date = today
    session_dates: set = set()
    for s in sessions:
        try:
            d = datetime.fromisoformat(s["created_at"].replace("Z", "+00:00")).date()
            session_dates.add(d)
        except Exception:
            pass
    while check_date in session_dates:
        streak += 1
        check_date -= timedelta(days=1)

    latest_confidence_row = (
        client.table("confidence_snapshots")
        .select("score,created_at")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
        or []
    )
    latest_confidence = (
        float(latest_confidence_row[0]["score"]) if latest_confidence_row else None
    )

    return {
        "overall_mastery": overall_mastery,
        "accuracy": accuracy,
        "total_attempts": total_attempts,
        "total_correct": total_correct,
        "sessions_completed": len(completed_sessions),
        "total_sessions": len(sessions),
        "current_streak": streak,
        "weekly_activity": weekly_activity,
        "recent_sessions": recent_sessions,
        "skill_mastery": skill_mastery_list,
        "active_weaknesses": weakness_rows,
        "topic_mastery": {r["skill"]: float(r["mastery"]) for r in mastery_rows},
        "latest_confidence": latest_confidence,
    }


@router.get("/sessions")
def all_sessions(user: dict = Depends(current_user)) -> list[dict]:
    return (
        admin_client()
        .table("tutoring_sessions")
        .select("id,topic,status,created_at,ended_at")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )


@router.get("/skill-progress")
def skill_progress(user: dict = Depends(current_user)) -> list[dict]:
    return (
        admin_client()
        .table("skill_mastery")
        .select("skill,mastery,attempts,correct_attempts,updated_at")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .execute()
        .data
        or []
    )
