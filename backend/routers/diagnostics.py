from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.services.diagnostic_engine import evaluate_diagnostic_assessment, generate_diagnostic_questions
from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics"])


class StartDiagnosticRequest(BaseModel):
    subject: str = "Mathematics"
    target_topic: Optional[str] = None


class SubmitAnswerItem(BaseModel):
    question_text: str
    topic_tested: str
    prerequisite_skill: Optional[str] = None
    difficulty: int = 1
    student_answer: str
    correct_answer: str


class SubmitDiagnosticRequest(BaseModel):
    assessment_id: str
    answers: List[SubmitAnswerItem]


@router.post("/start")
def start_diagnostic(req: StartDiagnosticRequest, user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]

    # Create assessment record
    res = client.table("diagnostic_assessments").insert({
        "user_id": uid,
        "subject": req.subject,
        "target_topic": req.target_topic,
        "status": "in_progress",
        "overall_score": 0.0,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to initialize diagnostic assessment")

    assessment_id = res.data[0]["id"]
    questions = generate_diagnostic_questions(subject=req.subject, target_topic=req.target_topic)

    return {
        "assessment_id": assessment_id,
        "subject": req.subject,
        "target_topic": req.target_topic,
        "questions": questions,
    }


@router.post("/submit")
def submit_diagnostic(req: SubmitDiagnosticRequest, user: dict = Depends(current_user)) -> dict:
    uid = user["id"]
    answers_dicts = [a.model_dump() for a in req.answers]
    result = evaluate_diagnostic_assessment(
        user_id=uid,
        assessment_id=req.assessment_id,
        answers=answers_dicts,
    )
    return result


@router.get("/latest")
def get_latest_diagnostic(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]
    res = (
        client.table("diagnostic_assessments")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        return {"assessment": None}
    return {"assessment": res.data[0]}
