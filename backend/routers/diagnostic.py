from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.models import User, DiagnosticAssessment, CognitiveTwin
from backend.schemas import DiagnosticSubmission, DiagnosticResult
import datetime

router = APIRouter(prefix="/diagnostic", tags=["Diagnostic Assessment"])

@router.get("/questions")
def get_diagnostic_questions(current_user: User = Depends(get_current_user)):
    """
    Returns 5 diagnostic questions including whiteboard tasks and voice prompts
    specifically tailored for Algebra assessment.
    """
    return [
        {
            "id": 1,
            "type": "multiple_choice",
            "question": "Solve for x in the equation: 3x - 7 = 14",
            "options": ["x = 5", "x = 7", "x = 21/3", "x = -7"],
            "correct_answer": "x = 7",
            "hint": "Try adding 7 to both sides first."
        },
        {
            "id": 2,
            "type": "multiple_choice",
            "question": "Expand the expression: -2(a - 4)",
            "options": ["-2a - 8", "-2a + 8", "-2a - 4", "-2a + 4"],
            "correct_answer": "-2a + 8",
            "hint": "Be careful when multiplying two negative signs!"
        },
        {
            "id": 3,
            "type": "whiteboard_task",
            "question": "Use the whiteboard to solve: 4(x + 3) = 16. Write down your steps.",
            "instructions": "Click and drag to write on the whiteboard. When done, submit your strokes.",
            "correct_answer": "x = 1",
            "hint": "Divide by 4 first or expand the left side!"
        },
        {
            "id": 4,
            "type": "voice_question",
            "question": "Listen to the prompt: 'Why is it important to perform the same operation on both sides of an equation?' Click the microphone and record your explanation.",
            "instructions": "Hold the microphone icon to record your answer verbally.",
            "correct_answer": "To keep the equation balanced / equivalence",
            "hint": "Think of a balance scale."
        },
        {
            "id": 5,
            "type": "multiple_choice",
            "question": "If 5x + 3 = 2x + 12, what is the value of x?",
            "options": ["x = 3", "x = 5", "x = 9", "x = 15"],
            "correct_answer": "x = 3",
            "hint": "Subtract 2x from both sides first, then subtract 3."
        }
    ]

@router.post("/submit", response_model=DiagnosticResult)
def submit_diagnostic(submission: DiagnosticSubmission, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Scores the diagnostic assessment and initializes/updates the student's Cognitive Twin.
    """
    score_count = 0
    total_questions = len(submission.answers)
    
    # Assess cognitive patterns (mock scoring for diagnostic analytics)
    style_scores = {"Visual": 50.0, "Analytical": 30.0, "Example-driven": 20.0}
    detected_misconceptions = []
    
    for ans in submission.answers:
        # Check for specific algebraic misconception patterns
        if ans.question_id == 2:
            if ans.answer == "-2a - 8" or "-8" in ans.answer:
                # Student made a sign multiplication error
                style_scores["Visual"] += 15.0
                detected_misconceptions.append("Sign mistakes")
        
        elif ans.question_id == 3:
            # Analyze whiteboard strokes if available
            if ans.drawing_strokes and len(ans.drawing_strokes) < 3:
                # Suggests brief work, maybe guessed or struggled to write
                style_scores["Example-driven"] += 10.0
                
        # Simple scoring simulation
        if ans.answer and any(correct in ans.answer for correct in ["7", "+ 8", "1", "balance", "scale", "3"]):
            score_count += 1
            
    final_score = (score_count / total_questions) * 100.0 if total_questions > 0 else 50.0
    
    # Normalize style scores
    total_style = sum(style_scores.values())
    learning_style = {k: round((v / total_style) * 100.0, 1) for k, v in style_scores.items()}
    
    # Generate cognitive profile setup
    knowledge_map = {
        "nodes": [
            {"id": "alg-1", "label": "Variables & Expressions", "status": "mastered" if final_score > 60 else "weak", "mastery": round(final_score/100.0, 2)},
            {"id": "alg-2", "label": "Linear Equations", "status": "weak" if final_score < 80 else "mastered", "mastery": max(0.2, round((final_score-10)/100.0, 2))},
            {"id": "alg-3", "label": "Distributive Expansion", "status": "weak" if "Sign mistakes" in detected_misconceptions else "unlocked", "mastery": 0.3},
            {"id": "alg-4", "label": "Quadratic Functions", "status": "locked", "mastery": 0.0}
        ],
        "edges": [
            {"source": "alg-1", "target": "alg-2"},
            {"source": "alg-2", "target": "alg-3"},
            {"source": "alg-3", "target": "alg-4"}
        ]
    }
    
    # Update current user stats
    current_user.mastery_score = final_score
    current_user.confidence_score = round(final_score * 0.8, 1) # initial estimate
    
    # Update Cognitive Twin
    twin = db.query(CognitiveTwin).filter(CognitiveTwin.user_id == current_user.id).first()
    if not twin:
        twin = CognitiveTwin(user_id=current_user.id)
        db.add(twin)
        
    twin.learning_style = learning_style
    twin.knowledge_map = knowledge_map
    twin.forgetting_curve = {
        "retention": round(final_score / 100.0, 2),
        "concepts_at_risk": ["Distributive expansion" if "Sign mistakes" in detected_misconceptions else "Linear isolation"]
    }
    
    # Create diagnostic assessment record
    assessment = DiagnosticAssessment(
        user_id=current_user.id,
        questions=[{"id": 1}, {"id": 2}, {"id": 3}, {"id": 4}, {"id": 5}],
        answers=[{"id": a.question_id, "answer": a.answer} for a in submission.answers],
        score=final_score,
        cognitive_profile={
            "score": final_score,
            "learning_style": learning_style,
            "detected_misconceptions": detected_misconceptions
        }
    )
    db.add(assessment)
    db.commit()
    
    return {
        "score": final_score,
        "confidence_level": current_user.confidence_score,
        "learning_style": learning_style,
        "knowledge_map": knowledge_map
    }
