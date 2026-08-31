from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from backend.services.supabase import admin_client, current_user, public_client
from backend.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = Field(default=None, max_length=120)
    grade: str | None = None
    school: str | None = None
    learning_goals: list[str] | None = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    grade: str | None = None
    school: str | None = None
    learning_goals: list[str] | None = None
    bio: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = None


def session_payload(session, user) -> dict:
    meta = user.user_metadata or {}
    avatar = meta.get("avatar_url") or meta.get("picture") or meta.get("avatar") or None
    return {
        "access_token": session.access_token if session else None,
        "refresh_token": session.refresh_token if session else None,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": meta.get("full_name", ""),
            "avatar_url": avatar,
        },
    }


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(credentials: Credentials):
    try:
        result = public_client().auth.sign_up(
            {
                "email": str(credentials.email),
                "password": credentials.password,
                "options": {"data": {"full_name": credentials.full_name or ""}},
            }
        )
        if result.user:
            profile_data: dict = {
                "id": result.user.id,
                "full_name": credentials.full_name or "",
            }
            if credentials.grade:
                profile_data["grade"] = credentials.grade
            if credentials.school:
                profile_data["school"] = credentials.school
            if credentials.learning_goals:
                profile_data["learning_goals"] = credentials.learning_goals
            admin_client().table("profiles").upsert(profile_data).execute()
        return {
            **session_payload(result.session, result.user),
            "requires_email_confirmation": result.session is None,
        }
    except Exception as exc:
        err_msg = str(exc)
        if "user already registered" in err_msg.lower() or "already exists" in err_msg.lower():
            detail = "An account with this email already exists. Please log in instead."
        elif "password" in err_msg.lower():
            detail = "Password must be at least 8 characters long."
        else:
            detail = err_msg or "Unable to create account. Please check your information and try again."
        raise HTTPException(status_code=400, detail=detail) from exc


@router.post("/login")
def login(credentials: Credentials):
    try:
        result = public_client().auth.sign_in_with_password(
            {"email": str(credentials.email), "password": credentials.password}
        )
        return session_payload(result.session, result.user)
    except Exception as exc:
        err_msg = str(exc)
        if "email not confirmed" in err_msg.lower():
            detail = "Your email address is not verified yet. Please check your inbox (and spam folder) for the verification link to activate your account."
        elif "invalid login credentials" in err_msg.lower() or "invalid_credentials" in err_msg.lower() or "invalid_grant" in err_msg.lower():
            detail = "Invalid email or password. Please verify your credentials and try again."
        else:
            detail = err_msg or "Sign-in failed. Please check your email and password."
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
        ) from exc


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
def resend_verification(credentials: PasswordResetRequest):
    try:
        public_client().auth.resend(
            {"type": "signup", "email": str(credentials.email)}
        )
        return {"status": "ok", "message": "Verification email resent successfully."}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc) or "Failed to resend verification email.") from exc


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(_: dict = Depends(current_user)):
    return None


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
def forgot_password(credentials: PasswordResetRequest):
    try:
        public_client().auth.reset_password_for_email(
            str(credentials.email),
            {"redirect_to": settings.password_reset_redirect_url},
        )
    except Exception:
        pass
    return None


@router.get("/me")
def me(user: dict = Depends(current_user)) -> dict:
    profile = {}
    uid = user["id"]
    client = admin_client()
    meta = user.get("metadata", {}) or {}
    oauth_avatar = meta.get("avatar_url") or meta.get("picture") or meta.get("avatar") or None
    try:
        res = client.table("profiles").select("*").eq("id", uid).execute()
        if res and res.data and len(res.data) > 0:
            profile = res.data[0]
            # Backfill OAuth avatar if profile doesn't have one yet
            if not profile.get("avatar_url") and oauth_avatar:
                client.table("profiles").update({"avatar_url": oauth_avatar}).eq("id", uid).execute()
                profile["avatar_url"] = oauth_avatar
        else:
            full_name = meta.get("full_name") or meta.get("name") or user.get("email", "").split("@")[0]
            new_p = {"id": uid, "full_name": full_name, "avatar_url": oauth_avatar}
            client.table("profiles").upsert(new_p).execute()
            profile = new_p
    except Exception:
        profile = {"avatar_url": oauth_avatar}
    return {**user, "profile": profile, "avatar_url": profile.get("avatar_url") or oauth_avatar}


@router.patch("/me")
def update_me(payload: ProfileUpdate, user: dict = Depends(current_user)) -> dict:
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    admin_client().table("profiles").update(update_data).eq("id", user["id"]).execute()
    return me(user)
