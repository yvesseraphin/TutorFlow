import time
from fastapi import Header, HTTPException, status
from supabase import Client, create_client

from backend.config import settings

_USER_CACHE: dict[str, tuple[float, dict]] = {}
_CACHE_TTL_SECONDS = 120.0


def admin_client() -> Client:
    settings.require_supabase()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def public_client() -> Client:
    settings.require_supabase()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()

    now = time.time()
    if token in _USER_CACHE:
        cached_at, cached_user = _USER_CACHE[token]
        if now - cached_at < _CACHE_TTL_SECONDS:
            return cached_user

    try:
        response = public_client().auth.get_user(token)
        if not response.user:
            raise ValueError("No authenticated user")
        user_info = {
            "id": response.user.id,
            "email": response.user.email,
            "metadata": response.user.user_metadata or {},
        }
        _USER_CACHE[token] = (now, user_info)
        return user_info
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session") from exc
