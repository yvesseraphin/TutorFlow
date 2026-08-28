from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/profile", tags=["Profile"])


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    grade: str | None = None
    school: str | None = None
    curriculum: str | None = None
    preferred_teaching_style: str | None = None
    learning_pace: str | None = None
    voice_preference: str | None = None
    language_preference: str | None = None
    bio: str | None = Field(default=None, max_length=500)
    learning_goals: list[str] | None = None
    avatar_url: str | None = None


@router.get("")
def get_profile(user: dict = Depends(current_user)) -> dict:
    profile = (
        admin_client()
        .table("profiles")
        .select("*")
        .eq("id", user["id"])
        .maybe_single()
        .execute()
        .data
    )
    if not profile:
        profile = (
            admin_client()
            .table("profiles")
            .upsert({
                "id": user["id"],
                "full_name": user.get("metadata", {}).get("full_name", ""),
            })
            .execute()
            .data[0]
        )
    return {**user, **profile}


@router.patch("")
def update_profile(payload: ProfileUpdate, user: dict = Depends(current_user)) -> dict:
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    result = (
        admin_client()
        .table("profiles")
        .update(updates)
        .eq("id", user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return result.data[0]

