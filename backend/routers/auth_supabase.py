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
    full_name = meta.get("full_name") or ""
    
    # Query database profile table to ensure avatar_url is always returned immediately on login
    if user and getattr(user, "id", None):
        try:
            p_res = admin_client().table("profiles").select("full_name,avatar_url").eq("id", user.id).execute()
            if p_res.data and len(p_res.data) > 0:
                p = p_res.data[0]
                if p.get("avatar_url"):
                    avatar = p["avatar_url"]
                if p.get("full_name") and not full_name:
                    full_name = p["full_name"]
        except Exception:
            pass

    return {
        "access_token": session.access_token if session else None,
        "refresh_token": session.refresh_token if session else None,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": full_name,
            "avatar_url": avatar,
        },
    }


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(credentials: Credentials):
    try:
        redirect_url = f"{settings.cors_origins[0]}/auth/callback" if settings.cors_origins else "http://localhost:5173/auth/callback"
        result = public_client().auth.sign_up(
            {
                "email": str(credentials.email),
                "password": credentials.password,
                "options": {
                    "data": {"full_name": credentials.full_name or ""},
                    "email_redirect_to": redirect_url,
                },
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
        redirect_url = f"{settings.cors_origins[0]}/auth/callback" if settings.cors_origins else "http://localhost:5173/auth/callback"
        public_client().auth.resend(
            {
                "type": "signup",
                "email": str(credentials.email),
                "options": {
                    "email_redirect_to": redirect_url,
                },
            }
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


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)


class DeleteAccountRequest(BaseModel):
    password: str


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, user: dict = Depends(current_user)):
    # 1. Verify old password
    try:
        public_client().auth.sign_in_with_password(
            {"email": user["email"], "password": payload.old_password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your current password is incorrect. Please check and try again.",
        ) from exc

    # 2. Update to new password
    try:
        admin_client().auth.admin.update_user_by_id(
            user["id"],
            {"password": payload.new_password},
        )
        return {"status": "ok", "message": "Password changed successfully."}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc) or "Failed to update password.",
        ) from exc


@router.post("/delete-account")
def delete_account(payload: DeleteAccountRequest, user: dict = Depends(current_user)):
    # 1. Verify password before destruction
    try:
        public_client().auth.sign_in_with_password(
            {"email": user["email"], "password": payload.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password. Account deletion cancelled.",
        ) from exc

    uid = user["id"]
    client = admin_client()

    # 2. Delete all student database records
    tables = [
        ("diagnostic_assessments", "user_id"),
        ("sessions", "user_id"),
        ("student_mistakes", "user_id"),
        ("student_memories", "user_id"),
        ("student_topic_mastery", "user_id"),
        ("spaced_repetition_cards", "user_id"),
        ("profiles", "id"),
    ]
    for table_name, user_col in tables:
        try:
            client.table(table_name).delete().eq(user_col, uid).execute()
        except Exception:
            pass

    # 3. Clean up related files from storage buckets
    try:
        buckets = ["avatars", "lesson_notes", "whiteboards"]
        for b in buckets:
            try:
                files = client.storage.from_(b).list(uid)
                if files:
                    client.storage.from_(b).remove([f"{uid}/{f['name']}" for f in files])
            except Exception:
                pass
    except Exception:
        pass

    # 4. Permanently delete auth user
    try:
        client.auth.admin.delete_user(uid)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc) or "Failed to delete auth user.",
        ) from exc

    return {"status": "ok", "message": "Your account and all associated data have been permanently deleted."}

