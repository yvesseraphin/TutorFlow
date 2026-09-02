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

    # AI Personalized Brief Summary & Context
    recent_topic = sessions[0]["topic"] if sessions else None
    if mistakes:
        latest_mistake = mistakes[0]
        concept_hint = latest_mistake.get("misconception_type")
        if concept_hint:
            greeting_text = f"Strengthen your understanding on {concept_hint} with step-by-step guided practice."
        else:
            greeting_text = "Strengthen your core math skills with step-by-step guided practice."
    elif memories and recent_topic:
        greeting_text = f"Continue your progress on {recent_topic} with step-by-step guided practice."
    else:
        greeting_text = "Step-by-step guided practice tailored to your learning flow."

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

    # Check if user completed a diagnostic assessment or has existing mastery records
    try:
        diag_check = (
            client.table("diagnostic_assessments")
            .select("id")
            .eq("user_id", uid)
            .eq("status", "completed")
            .limit(1)
            .execute()
        )
        has_completed_diagnostic = bool(diag_check.data) or any(float(r.get("mastery_score", 0)) > 0 for r in mastery_rows)
    except Exception:
        has_completed_diagnostic = bool(mastery_rows)

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
        "has_completed_diagnostic": has_completed_diagnostic,
        "avatar_url": profile.get("avatar_url") or (user.get("metadata", {}) or {}).get("avatar_url") or (user.get("metadata", {}) or {}).get("picture") or "",
    }


@router.get("/notifications")
def get_notifications(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    notifications: List[Dict[str, Any]] = []

    try:
        # 1. Due Spaced Repetition Flashcards
        due_cards_res = (
            client.table("revision_flashcards")
            .select("id,topic,next_review_at")
            .eq("user_id", uid)
            .lte("next_review_at", now_iso)
            .order("next_review_at", desc=False)
            .limit(10)
            .execute()
        )
        due_cards = due_cards_res.data or []
        if due_cards:
            topics = list({c["topic"] for c in due_cards if c.get("topic")})
            topic_str = ", ".join(topics[:2])
            msg = f"{len(due_cards)} flashcard(s) ready for review in {topic_str}."
            notifications.append({
                "id": "flashcards-due",
                "type": "flashcard",
                "title": "Spaced Revision Due",
                "subtitle": msg,
                "desc": msg,
                "created_at": due_cards[0].get("next_review_at") or now_iso,
                "topic": topics[0] if topics else "Mathematics",
                "action_url": f"/classroom?topic={topics[0]}" if topics else "/classroom",
            })

        # 2. Retention Risks from Learner Model
        retention_res = (
            client.table("student_learner_model")
            .select("topic_id,mastery_score,next_review_due_at,updated_at")
            .eq("user_id", uid)
            .lte("next_review_due_at", now_iso)
            .order("next_review_due_at", desc=False)
            .limit(5)
            .execute()
        )
        retention_rows = retention_res.data or []
        for r in retention_rows:
            ret_msg = f"Quick 2-min review scheduled to retain your {int(float(r.get('mastery_score', 0)) * 100)}% mastery."
            notifications.append({
                "id": f"retention-{r['topic_id']}",
                "type": "retention",
                "title": f"Spaced Repetition Review Due: {r['topic_id']}",
                "subtitle": ret_msg,
                "desc": ret_msg,
                "created_at": r.get("updated_at") or now_iso,
                "topic": r["topic_id"],
                "action_url": f"/classroom?topic={r['topic_id']}",
            })

        # 3. AI Learner Memories & Insights
        memories_res = (
            client.table("ai_learner_memories")
            .select("id,memory_type,topic,summary,created_at")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .limit(3)
            .execute()
        )
        memories = memories_res.data or []
        for m in memories:
            m_type = m.get("memory_type", "insight").replace("_", " ").title()
            mem_summary = m.get("summary") or f"Personalized study memory created for {m.get('topic', 'your learning session')}."
            notifications.append({
                "id": f"mem-{m['id']}",
                "type": "memory",
                "title": f"AI Teacher Insight: {m_type}",
                "subtitle": mem_summary,
                "desc": mem_summary,
                "created_at": m.get("created_at") or now_iso,
                "topic": m.get("topic", ""),
                "action_url": f"/classroom?topic={m.get('topic', '')}" if m.get("topic") else "/classroom",
            })

        # 4. Recent Completed Tutoring Sessions
        sessions_res = (
            client.table("tutoring_sessions")
            .select("id,topic,status,ai_summary,created_at")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .limit(2)
            .execute()
        )
        sessions = sessions_res.data or []
        for s in sessions:
            summary_text = s.get("ai_summary") or f"Session completed for {s['topic']}."
            notifications.append({
                "id": f"sess-{s['id']}",
                "type": "session",
                "title": f"Lesson Completed: {s['topic']}",
                "subtitle": summary_text,
                "desc": summary_text,
                "created_at": s.get("created_at") or now_iso,
                "topic": s.get("topic", ""),
                "action_url": f"/classroom?topic={s.get('topic', '')}",
            })

        # 5. Diagnostic Assessments
        diag_res = (
            client.table("diagnostic_assessments")
            .select("id,subject,target_topic,overall_score,detected_gaps,created_at")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        diagnostics = diag_res.data or []
        for d in diagnostics:
            gaps_count = len(d.get("detected_gaps") or [])
            score_pct = int(float(d.get("overall_score", 0)) * 100)
            gap_msg = f"{gaps_count} focus area(s) identified." if gaps_count > 0 else "All prerequisites verified!"
            diag_text = f"Readiness Score: {score_pct}%. {gap_msg}"
            notifications.append({
                "id": f"diag-{d['id']}",
                "type": "diagnostic",
                "title": "AI Diagnostic Summary",
                "subtitle": diag_text,
                "desc": diag_text,
                "created_at": d.get("created_at") or now_iso,
                "topic": d.get("target_topic", "Mathematics"),
                "action_url": "/classroom",
            })
    except Exception as e:
        # Graceful fallback if tables are empty
        pass

    # 6. Fallback if brand new user
    if not notifications:
        welcome_sub = "Take an AI Diagnostic or start your first lesson to begin building your knowledge graph."
        notifications.append({
            "id": "welcome-tutorflow",
            "type": "welcome",
            "title": "Welcome to TutorFlow 2.0!",
            "subtitle": welcome_sub,
            "desc": welcome_sub,
            "created_at": now_iso,
            "topic": "Getting Started",
            "action_url": "/classroom",
        })

    return {"notifications": notifications}

