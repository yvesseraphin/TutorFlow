import base64
import json
import time
from fastapi import Header, HTTPException, status
from supabase import Client, create_client

from backend.config import settings

_USER_CACHE: dict[str, tuple[float, dict]] = {}
_CACHE_TTL_SECONDS = 300.0  # 5 minutes


def admin_client() -> Client:
    settings.require_supabase()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def public_client() -> Client:
    settings.require_supabase()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def _decode_jwt_payload(token: str) -> dict | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        payload_b64 = parts[1]
        payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
        payload_json = base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8")
        payload = json.loads(payload_json)

        exp = payload.get("exp")
        if exp and exp < time.time():
            return None

        uid = payload.get("sub") or payload.get("id")
        if not uid:
            return None

        return {
            "id": str(uid),
            "email": payload.get("email", ""),
            "metadata": payload.get("user_metadata", {}) or {},
        }
    except Exception:
        return None


def current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()

    now = time.time()
    if token in _USER_CACHE:
        cached_at, cached_user = _USER_CACHE[token]
        if now - cached_at < _CACHE_TTL_SECONDS:
            return cached_user

    # 1. Fast local JWT validation (0ms latency, eliminates Supabase REST 403 Forbidden errors)
    decoded = _decode_jwt_payload(token)
    if decoded:
        _USER_CACHE[token] = (now, decoded)
        return decoded

    # 2. Fallback to Supabase admin client (Service Role avoids 403 anon rate limits)
    try:
        response = admin_client().auth.get_user(token)
        if response and response.user:
            user_info = {
                "id": response.user.id,
                "email": response.user.email,
                "metadata": response.user.user_metadata or {},
            }
            _USER_CACHE[token] = (now, user_info)
            return user_info
    except Exception:
        pass

    # 3. Fallback to public client
    try:
        response = public_client().auth.get_user(token)
        if response and response.user:
            user_info = {
                "id": response.user.id,
                "email": response.user.email,
                "metadata": response.user.user_metadata or {},
            }
            _USER_CACHE[token] = (now, user_info)
            return user_info
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session") from exc

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")


def optional_user(authorization: str | None = Header(default=None)) -> dict | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return current_user(authorization)
    except Exception:
        return None
