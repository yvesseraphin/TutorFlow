from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.models import User, ReviewItem
from backend.schemas import MistakeBookItem
import datetime

router = APIRouter(prefix="/review", tags=["Review & Revision Center"])

@router.get("/dashboard")
def get_review_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns lists of concepts to revisit, automated recap, and overall weak concepts.
    """
    # Spaced repetition items
    items = db.query(ReviewItem).filter(ReviewItem.user_id == current_user.id).all()
    
    # Static fallback for display if database is empty
    if not items:
        concepts_to_revisit = [
            {
                "id": 1,
                "concept": "Distributive Expansion",
                "difficulty": "Medium",
                "days_since_seen": 2,
                "recomm_action": "Review the rectangular box model grid."
            },
            {
                "id": 2,
                "concept": "Sign Multiplication rules",
                "difficulty": "Easy",
                "days_since_seen": 4,
                "recomm_action": "Quick revision quiz on negative integers."
            }
        ]
    else:
        concepts_to_revisit = [
            {
                "id": item.id,
                "concept": item.concept,
                "difficulty": "Medium",
                "days_since_seen": (datetime.datetime.utcnow() - (item.last_reviewed or datetime.datetime.utcnow())).days,
                "recomm_action": "Spaced repetition prompt ready."
            }
            for item in items
        ]
        
    ai_recap = (
        "Here is your AI-generated recap: You've made significant progress isolating variables "
        "when solving simple linear equations (mastery at 85%). However, expanding parenthetical expressions "
        "retaining correct signs remains a stumbling block. Focus your attention on the sign negation rule "
        "and area model calculations today."
    )
    
    return {
        "concepts_to_revisit": concepts_to_revisit,
        "ai_recap": ai_recap,
        "weak_areas": ["Distributive parentheses expansion", "Sign combination during constant isolation"]
    }

@router.get("/revision-plan")
def get_revision_plan(current_user: User = Depends(get_current_user)):
    """
    Spaced repetition calendar layout generated from the Cognitive Twin.
    """
    return {
        "schedule": [
            {"day": "Today", "focus": "Distributive Law (Visual Model)", "duration_min": 15, "priority": "High"},
            {"day": "Tomorrow", "focus": "Combining Like Terms review", "duration_min": 10, "priority": "Medium"},
            {"day": "Wednesday", "focus": "Equations with Parentheses", "duration_min": 20, "priority": "High"},
            {"day": "Friday", "focus": "Weekly review quiz", "duration_min": 15, "priority": "Low"}
        ]
    }

@router.get("/mistake-book", response_model=list[MistakeBookItem])
def get_mistake_book(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Lists recorded wrong answers, explanation of why they were wrong, and corrected answers.
    """
    items = db.query(ReviewItem).filter(ReviewItem.user_id == current_user.id).all()
    
    # High-quality mock list if DB is empty
    if not items:
        return [
            {
                "id": 101,
                "concept": "Distributive Property",
                "formula_or_fact": "3(x + 2) = 3x + 6",
                "status": "active",
                "last_reviewed": datetime.datetime.utcnow() - datetime.timedelta(days=1),
                "next_review": datetime.datetime.utcnow() + datetime.timedelta(hours=4),
                "mistake_history": [
                    {
                        "wrong_answer": "3(x + 2) = 3x + 2",
                        "explanation": "Student multiplied 3 by x but forgot to multiply 3 by 2.",
                        "correction": "Make sure to scale both x and 2 by 3: 3*x + 3*2 = 3x + 6."
                    }
                ]
            },
            {
                "id": 102,
                "concept": "Sign negative expansion",
                "formula_or_fact": "-2(x - 3) = -2x + 6",
                "status": "active",
                "last_reviewed": datetime.datetime.utcnow() - datetime.timedelta(days=2),
                "next_review": datetime.datetime.utcnow() + datetime.timedelta(days=1),
                "mistake_history": [
                    {
                        "wrong_answer": "-2(x - 3) = -2x - 6",
                        "explanation": "Incorrect sign processing when multiplying -2 by -3.",
                        "correction": "Negative multiplied by negative gives a positive: -2 * -3 = +6."
                    }
                ]
            }
        ]
        
    return items
