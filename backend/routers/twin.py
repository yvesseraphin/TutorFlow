from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.models import User, CognitiveTwin, MisconceptionModel
from backend.schemas import CognitiveTwinResponse
import datetime

router = APIRouter(prefix="/twin", tags=["Cognitive Twin"])

@router.get("/profile", response_model=CognitiveTwinResponse)
def get_cognitive_twin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the comprehensive Cognitive Twin summary.
    """
    twin = db.query(CognitiveTwin).filter(CognitiveTwin.user_id == current_user.id).first()
    if not twin:
        raise HTTPException(status_code=404, detail="Cognitive Twin profile not initialized yet.")
    return twin

@router.get("/knowledge-map")
def get_knowledge_map(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns detailed interactive knowledge graph structure (Algebra).
    """
    # Nodes representing concepts, showing connections and student mastery levels
    return {
        "subject": "Algebra",
        "nodes": [
            {"id": "alg-1", "label": "Variables & Expressions", "status": "mastered", "mastery": 0.95, "desc": "Understanding letters as variables and simplifying expressions."},
            {"id": "alg-2", "label": "Linear Equations", "status": "mastered", "mastery": 0.85, "desc": "Solving single-variable equations like ax + b = c."},
            {"id": "alg-3", "label": "Distributive Expansion", "status": "weak", "mastery": 0.42, "desc": "Multiplying terms across brackets, e.g., a(b + c)."},
            {"id": "alg-4", "label": "Combining Like Terms", "status": "unlocked", "mastery": 0.65, "desc": "Summing terms with the same variable factors."},
            {"id": "alg-5", "label": "Systems of Equations", "status": "locked", "mastery": 0.0, "desc": "Solving two or more equations with multiple variables."},
            {"id": "alg-6", "label": "Quadratic Factorization", "status": "locked", "mastery": 0.0, "desc": "Factoring ax^2 + bx + c = 0."}
        ],
        "edges": [
            {"source": "alg-1", "target": "alg-2", "relationship": "prerequisite"},
            {"source": "alg-2", "target": "alg-3", "relationship": "extends"},
            {"source": "alg-1", "target": "alg-4", "relationship": "prerequisite"},
            {"source": "alg-4", "target": "alg-3", "relationship": "co-requisite"},
            {"source": "alg-3", "target": "alg-6", "relationship": "prerequisite"},
            {"source": "alg-2", "target": "alg-5", "relationship": "prerequisite"}
        ]
    }

@router.get("/misconceptions")
def get_misconception_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the list and timeline of mistakes the student made.
    """
    misconceptions = db.query(MisconceptionModel).filter(MisconceptionModel.user_id == current_user.id).all()
    
    # Static fallback for display if database is clean
    if not misconceptions:
        return [
            {
                "id": 1,
                "topic": "Algebra",
                "error_type": "Distributive-law confusion",
                "description": "Expanding terms outside parenthetical blocks incorrectly, e.g. 3(x + 2) = 3x + 2.",
                "confidence": 0.93,
                "occurrences": 3,
                "active_intervention": "Switch to visual grid representations.",
                "is_resolved": False,
                "detected_at": datetime.datetime.utcnow() - datetime.timedelta(days=2)
            },
            {
                "id": 2,
                "topic": "Algebra",
                "error_type": "Sign mistakes",
                "description": "Incorrect signs when subtracting negative integer expressions, e.g. -2(-x + 3) = 2x - 6.",
                "confidence": 0.85,
                "occurrences": 2,
                "active_intervention": "Reinforce through number-line walkthroughs.",
                "is_resolved": True,
                "detected_at": datetime.datetime.utcnow() - datetime.timedelta(days=4)
            }
        ]
        
    return misconceptions

@router.get("/learning-patterns")
def get_learning_patterns(current_user: User = Depends(get_current_user)):
    """
    Returns learning styles and attention indicators.
    """
    return {
        "preferred_teaching_methods": [
            {"method": "Visual Diagrams", "engagement_index": 0.88, "status": "highly_effective"},
            {"method": "Socratic Dialogue", "engagement_index": 0.72, "status": "moderately_effective"},
            {"method": "Text Explanations", "engagement_index": 0.45, "status": "ineffective"}
        ],
        "attention_patterns": {
            "average_focus_time_minutes": 22.4,
            "optimal_session_duration": 30.0,
            "fatigue_threshold_minutes": 25.0,
            "distraction_triggers": ["Monotonous text panels", "Excessive verbal cues"]
        },
        "hesitation_statistics": {
            "average_stroke_delay_seconds": 1.8,
            "equation_type_delays": {
                "isolation": 1.2,
                "distribution": 3.4,
                "negative_signs": 2.9
            }
        }
    }

@router.get("/predictions")
def get_predictions(current_user: User = Depends(get_current_user)):
    """
    Predictive analytics showing future struggles.
    """
    return {
        "predicted_weak_concepts": [
            {"concept": "Quadratic Factorization", "struggle_probability": 0.87, "reason": "Requires strong foundation in sign multiplication and distributive expansion which are currently weak areas."},
            {"concept": "Systems of Equations by Elimination", "struggle_probability": 0.62, "reason": "Fractions / division operations trigger moderate arithmetic hesitation scores."}
        ],
        "remediation_pathways": [
            {"step": 1, "concept": "Distributive Expansion visual exercises", "relevance": "High"},
            {"step": 2, "concept": "Basic factoring of integers", "relevance": "Medium"},
            {"step": 3, "concept": "Quadratic factorization visual mapping", "relevance": "High"}
        ]
    }
