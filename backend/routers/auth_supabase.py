from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from backend.services.supabase import admin_client, current_user, public_client
from backend.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = Field(default=None, max_length=120)


class PasswordResetRequest(BaseModel):
    email: EmailStr


def session_payload(session, user) -> dict:
    return {
        "access_token": session.access_token if session else None,
        "refresh_token": session.refresh_token if session else None,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "full_name": (user.user_metadata or {}).get("full_name", "")},
    }


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(credentials: Credentials):
    try:
        result = public_client().auth.sign_up({
            "email": str(credentials.email),
            "password": credentials.password,
            "options": {"data": {"full_name": credentials.full_name or ""}},
        })
        if result.user:
            admin_client().table("profiles").upsert({"id": result.user.id, "full_name": credentials.full_name or ""}).execute()
        return {**session_payload(result.session, result.user), "requires_email_confirmation": result.session is None}
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to create account") from exc


@router.post("/login")
def login(credentials: Credentials):
    try:
        result = public_client().auth.sign_in_with_password({"email": str(credentials.email), "password": credentials.password})
        return session_payload(result.session, result.user)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password") from exc


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(_: dict = Depends(current_user)):
    # Supabase access tokens are JWTs; the frontend removes local session tokens on logout.
    return None


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
def forgot_password(credentials: PasswordResetRequest):
    # Kept deliberately non-enumerating: Supabase returns success whether or not
    # the address belongs to an account.
    try:
        public_client().auth.reset_password_for_email(str(credentials.email), {"redirect_to": settings.password_reset_redirect_url})
    except Exception:
        pass
    return None


@router.get("/me")
def me(user: dict = Depends(current_user)):
    profile = admin_client().table("profiles").select("*").eq("id", user["id"]).maybe_single().execute().data or {}
    return {**user, "profile": profile}
