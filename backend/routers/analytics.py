from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.models import User, Session as SessionModel
from backend.schemas import ProgressAnalytics
import datetime
import random

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=ProgressAnalytics)
def get_analytics_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns general progress charts, accuracy scores, and badges.
    """
    # 1. Compute time distribution (mocked distribution for demonstration stability)
    time_dist = {
        "Monday": 25,
        "Tuesday": 40,
        "Wednesday": 15,
        "Thursday": 30,
        "Friday": 50,
        "Saturday": 20,
        "Sunday": 10
    }
    
    # 2. Get topic mastery
    topic_mastery = {
        "Variables & Expressions": 0.95,
        "Linear Equations": 0.85,
        "Distributive Expansion": 0.42,
        "Combining Like Terms": 0.65,
        "Systems of Equations": 0.0,
        "Quadratic Factorization": 0.0
    }
    
    # 3. Accuracy over time
    accuracy_data = [
        {"date": "2026-07-12", "accuracy": 65},
        {"date": "2026-07-13", "accuracy": 70},
        {"date": "2026-07-14", "accuracy": 68},
        {"date": "2026-07-15", "accuracy": 75},
        {"date": "2026-07-16", "accuracy": 72},
        {"date": "2026-07-17", "accuracy": 80},
        {"date": "2026-07-18", "accuracy": 82}
    ]
    
    # 4. Achievements
    achievements = [
        {"id": "streak_3", "title": "Streak Master", "description": "Studied 3 days in a row!", "badge_icon": "🔥", "unlocked": True, "date": "2026-07-16"},
        {"id": "algebra_star", "title": "Equation Isolator", "description": "Solved 10 linear equations correctly.", "badge_icon": "🧭", "unlocked": True, "date": "2026-07-17"},
        {"id": "diagnostic_complete", "title": "Self-Aware Learner", "description": "Completed diagnostic profile setup.", "badge_icon": "🧠", "unlocked": True, "date": "2026-07-15"},
        {"id": "mistake_slayer", "title": "Mistake Conqueror", "description": "Resolved a major active algebraic misconception.", "badge_icon": "⚔️", "unlocked": False, "date": ""}
    ]
    
    return {
        "learning_time_distribution": time_dist,
        "topic_mastery": topic_mastery,
        "accuracy_over_time": accuracy_data,
        "achievements": achievements,
        "streak": current_user.current_streak
    }

@router.get("/performance-trends")
def get_performance_trends(current_user: User = Depends(get_current_user)):
    return {
        "weekly_change_pct": 14.5,
        "average_score_trend": [
            {"week": "Week 1", "score": 62},
            {"week": "Week 2", "score": 68},
            {"week": "Week 3", "score": 75},
            {"week": "Week 4", "score": 83}
        ],
        "strengths": ["Quick at subtracting/adding constants", "Strong verbal logic structure"],
        "weaknesses": ["Hesitates around distributing negatives", "Parenthesis expansion variables"]
    }

@router.get("/achievements")
def get_all_achievements(current_user: User = Depends(get_current_user)):
    return [
        {"title": "Welcome to TutorFlow", "desc": "Created account and profile", "icon": "🎓", "unlocked": True},
        {"title": "Streak Starter", "desc": "Studied 3 consecutive days", "icon": "🔥", "unlocked": True},
        {"title": "Equation Master", "desc": "Solve 20 equations", "icon": "🧩", "unlocked": False},
        {"title": "Whiteboard Picasso", "desc": "Completed a whiteboard diagnostic assessment", "icon": "✏️", "unlocked": True},
        {"title": "XAI Explorer", "desc": "Reviewed a misconception strategy in AI Reasoning", "icon": "👁️", "unlocked": True}
    ]
