from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from fastapi import APIRouter, Depends

from backend.services.ai_learner import KNOWLEDGE_GRAPH
from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
def dashboard(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]

    # 1. Fetch user profile
    profile_res = client.table("profiles").select("*").eq("id", uid).execute()
    profile = profile_res.data[0] if profile_res.data else {}
    first_name = (profile.get("full_name") or "there").split()[0]

    # 2. Fetch student learner model records
    mastery_rows = (
        client.table("student_learner_model")
        .select("*")
        .eq("user_id", uid)
        .order("updated_at", desc=True)
        .execute()
        .data
        or []
    )

    # Fallback to legacy skill_mastery if student_learner_model is empty
    if not mastery_rows:
        legacy_mastery = (
            client.table("skill_mastery")
            .select("skill,mastery,attempts,correct_attempts,updated_at")
            .eq("user_id", uid)
            .execute()
            .data
            or []
        )
        for row in legacy_mastery:
            mastery_rows.append({
                "topic_id": row["skill"],
                "mastery_score": float(row["mastery"]),
                "attempts_count": row["attempts"],
                "correct_count": row["correct_attempts"],
                "status": "mastered" if float(row["mastery"]) >= 0.85 else "in_progress",
                "retention_stability": 1.0,
                "next_review_due_at": None,
            })

    # 3. Sessions
    sessions = (
        client.table("tutoring_sessions")
        .select("id,topic,status,created_at,ended_at")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )

    # 4. Unresolved mistakes & teacher memories
    mistakes = (
        client.table("ai_mistake_logs")
        .select("*")
        .eq("user_id", uid)
        .eq("resolved", False)
        .order("created_at", desc=True)
        .limit(3)
        .execute()
        .data
        or []
    )

    memories = (
        client.table("ai_learner_memories")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(3)
        .execute()
        .data
        or []
    )

    # Aggregations
    total_attempts = sum(r.get("attempts_count", 0) for r in mastery_rows)
    total_correct = sum(r.get("correct_count", 0) for r in mastery_rows)
    accuracy = round(total_correct / total_attempts, 3) if total_attempts else 0.0

    completed_sessions = [s for s in sessions if s.get("status") == "completed"]
    mastered_count = sum(1 for r in mastery_rows if float(r.get("mastery_score", 0)) >= 0.85)

    overall_mastery = (
        round(sum(float(r.get("mastery_score", 0)) for r in mastery_rows) / max(1, len(mastery_rows)), 3)
        if mastery_rows
        else 0.0
    )

    # Weekly Activity Map
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

    # Calculate streak
    streak = 0
    session_dates: set = set()
    for s in sessions:
        try:
            d = datetime.fromisoformat(s["created_at"].replace("Z", "+00:00")).date()
            session_dates.add(d)
        except Exception:
            pass

    check_date = today
    while check_date in session_dates:
        streak += 1
        check_date -= timedelta(days=1)
    if streak == 0 and (today - timedelta(days=1)) in session_dates:
        check_date = today - timedelta(days=1)
        while check_date in session_dates:
            streak += 1
            check_date -= timedelta(days=1)

    # AI Personalized Greeting & Context
    recent_topic = sessions[0]["topic"] if sessions else "Linear Equations"
    if mistakes:
        latest_mistake = mistakes[0]
        greeting_text = (
            f"Welcome back, {first_name}! Last time we worked on {recent_topic}. "
            f"I noticed a small stumbling block with {latest_mistake.get('misconception_type', 'sign rules')}. "
            f"Let's do a quick 2-minute warmup to master it!"
        )
    elif memories:
        greeting_text = (
            f"Great to see you again, {first_name}! {memories[0].get('summary', 'Ready for your next learning milestone?')} "
            f"Let's jump straight into {recent_topic}."
        )
    else:
        greeting_text = (
            f"Hello {first_name}! I'm your AI Teacher, ready to guide you step-by-step through your mathematics journey."
        )

    # Spaced Repetition Retention Risks
    now_iso = datetime.now(timezone.utc).isoformat()
    retention_risk_topics = [
        {
            "topic": r["topic_id"],
            "mastery": float(r.get("mastery_score", 0)),
            "last_practiced": r.get("last_practiced_at"),
            "due": True,
        }
        for r in mastery_rows
        if r.get("next_review_due_at") and r["next_review_due_at"] <= now_iso
    ]

    # Next Recommended Lesson
    mastered_topics = {r["topic_id"] for r in mastery_rows if float(r.get("mastery_score", 0)) >= 0.85}
    next_topic = "Linear Equations (One-Step)"
    for t_name, t_info in KNOWLEDGE_GRAPH.items():
        prereqs_met = all(p in mastered_topics or p not in KNOWLEDGE_GRAPH for p in t_info.get("prerequisites", []))
        if t_name not in mastered_topics and prereqs_met:
            next_topic = t_name
            break

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
            "skill": r["topic_id"],
            "mastery": float(r.get("mastery_score", 0)),
            "attempts": r.get("attempts_count", 0),
            "correct_attempts": r.get("correct_count", 0),
            "status": r.get("status", "in_progress"),
        }
        for r in mastery_rows
    ]

    return {
        "overall_mastery": overall_mastery,
        "mastered_count": mastered_count,
        "total_topics": len(KNOWLEDGE_GRAPH),
        "total_sessions": len(sessions),
        "completed_sessions": len(completed_sessions),
        "total_practice_problems": total_attempts,
        "accuracy": accuracy,
        "streak_days": streak,
        "ai_teacher_greeting": greeting_text,
        "next_recommended_lesson": next_topic,
        "retention_risk_topics": retention_risk_topics,
        "unresolved_mistakes": mistakes,
        "weekly_activity": weekly_activity,
        "recent_sessions": recent_sessions,
        "skill_mastery": skill_mastery_list,
    }
