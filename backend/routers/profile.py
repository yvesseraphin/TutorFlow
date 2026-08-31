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
    client = admin_client()
    uid = user["id"]

    res = client.table("profiles").select("*").eq("id", uid).execute()
    profile = res.data[0] if (res and res.data) else None

    meta = user.get("metadata", {}) or {}
    oauth_avatar = meta.get("avatar_url") or meta.get("picture") or meta.get("avatar") or None

    if not profile:
        full_name = (
            meta.get("full_name")
            or meta.get("name")
            or user.get("email", "").split("@")[0]
        )
        upsert_res = (
            client.table("profiles")
            .upsert({
                "id": uid,
                "full_name": full_name,
                "avatar_url": oauth_avatar,
            })
            .execute()
        )
        profile = upsert_res.data[0] if (upsert_res and upsert_res.data) else {"id": uid, "full_name": full_name, "avatar_url": oauth_avatar}
    elif not profile.get("avatar_url") and oauth_avatar:
        client.table("profiles").update({"avatar_url": oauth_avatar}).eq("id", uid).execute()
        profile["avatar_url"] = oauth_avatar

    final_avatar = profile.get("avatar_url") or oauth_avatar
    return {**user, **profile, "avatar_url": final_avatar}


@router.patch("")
def update_profile(payload: ProfileUpdate, user: dict = Depends(current_user)) -> dict:
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    client = admin_client()
    uid = user["id"]

    result = client.table("profiles").update(updates).eq("id", uid).execute()
    if not result or not result.data:
        upsert_payload = {"id": uid, **updates}
        result = client.table("profiles").upsert(upsert_payload).execute()

    if not result or not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile.")

    return result.data[0]

