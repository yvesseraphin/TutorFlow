import json
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.config import settings
from backend.services.supabase import admin_client, current_user
from backend.services.tutor import TUTOR_SYSTEM_PROMPT, detect_weakness, respond

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])


class SessionCreate(BaseModel):
    topic: str = Field(min_length=2, max_length=160)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class AttemptCreate(BaseModel):
    skill: str = Field(min_length=2, max_length=120)
    answer: str = Field(min_length=1, max_length=4000)
    expected_answer: str = Field(min_length=1, max_length=4000)


class RealtimeOffer(BaseModel):
    sdp: str = Field(min_length=1)
    topic: str = Field(min_length=2, max_length=160)


def learner_context(user_id: str) -> dict:
    client = admin_client()
    mastery = client.table("skill_mastery").select("skill,mastery,attempts,correct_attempts").eq("user_id", user_id).execute().data or []
    weaknesses = client.table("weaknesses").select("skill,kind,confidence,occurrences").eq("user_id", user_id).eq("resolved", False).execute().data or []
    return {"mastery": mastery, "weaknesses": weaknesses}


@router.post("/sessions")
def create_session(payload: SessionCreate, user: dict = Depends(current_user)):
    result = admin_client().table("tutoring_sessions").insert({"user_id": user["id"], "topic": payload.topic, "status": "active"}).execute()
    return result.data[0]


@router.get("/sessions/{session_id}")
def get_session(session_id: uuid.UUID, user: dict = Depends(current_user)):
    client = admin_client()
    session = client.table("tutoring_sessions").select("*").eq("id", str(session_id)).eq("user_id", user["id"]).maybe_single().execute().data
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = client.table("lesson_messages").select("role,content,created_at").eq("session_id", str(session_id)).order("created_at").execute().data or []
    return {**session, "messages": messages, "learner_context": learner_context(user["id"])}


@router.post("/sessions/{session_id}/messages")
def message(session_id: uuid.UUID, payload: MessageCreate, user: dict = Depends(current_user)):
    client = admin_client()
    session = client.table("tutoring_sessions").select("topic").eq("id", str(session_id)).eq("user_id", user["id"]).maybe_single().execute().data
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    history = client.table("lesson_messages").select("role,content").eq("session_id", str(session_id)).order("created_at", desc=True).limit(16).execute().data or []
    history.reverse()
    client.table("lesson_messages").insert({"session_id": str(session_id), "user_id": user["id"], "role": "user", "content": payload.content}).execute()
    weakness, confidence = detect_weakness(payload.content)
    if weakness:
        client.table("weaknesses").upsert({"user_id": user["id"], "skill": session["topic"], "kind": weakness, "confidence": confidence, "occurrences": 1}, on_conflict="user_id,skill,kind").execute()
    try:
        answer = respond(session["topic"], learner_context(user["id"]), history, payload.content)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    saved = client.table("lesson_messages").insert({"session_id": str(session_id), "user_id": user["id"], "role": "assistant", "content": answer}).execute().data[0]
    return {"message": saved, "detected_weakness": weakness, "confidence": confidence, "learner_context": learner_context(user["id"])}


@router.post("/attempts")
def record_attempt(payload: AttemptCreate, user: dict = Depends(current_user)):
    correct = payload.answer.strip().casefold() == payload.expected_answer.strip().casefold()
    client = admin_client()
    existing = client.table("skill_mastery").select("attempts,correct_attempts").eq("user_id", user["id"]).eq("skill", payload.skill).maybe_single().execute().data or {"attempts": 0, "correct_attempts": 0}
    attempts, correct_attempts = existing["attempts"] + 1, existing["correct_attempts"] + int(correct)
    mastery = round(correct_attempts / attempts, 3)
    client.table("skill_mastery").upsert({"user_id": user["id"], "skill": payload.skill, "attempts": attempts, "correct_attempts": correct_attempts, "mastery": mastery}, on_conflict="user_id,skill").execute()
    if not correct:
        client.table("weaknesses").upsert({"user_id": user["id"], "skill": payload.skill, "kind": "incorrect_answer", "confidence": 0.9, "occurrences": 1}, on_conflict="user_id,skill,kind").execute()
    return {"correct": correct, "mastery": mastery, "context": learner_context(user["id"])}


@router.post("/realtime/connect")
async def realtime_connect(offer: RealtimeOffer, _: dict = Depends(current_user)):
    settings.require_openai()
    session = {"type": "realtime", "model": settings.openai_realtime_model, "instructions": TUTOR_SYSTEM_PROMPT + f" Current topic: {offer.topic}."}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.openai.com/v1/realtime/calls",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            files={"sdp": ("offer.sdp", offer.sdp, "application/sdp"), "session": (None, json.dumps(session), "application/json")},
        )
    if response.is_error:
        raise HTTPException(status_code=502, detail="Unable to start realtime lesson")
    return {"sdp": response.text, "content_type": "application/sdp"}
