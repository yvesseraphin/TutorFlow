import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routers import analytics, auth_supabase, curriculum, diagnostics, flashcards, live_tutor, profile

app = FastAPI(
    title=settings.project_name,
    version="2.0.0",
    description="Supabase-backed adaptive tutoring API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_supabase.router, prefix=settings.api_v1_str)
app.include_router(live_tutor.router, prefix=settings.api_v1_str)
app.include_router(analytics.router, prefix=settings.api_v1_str)
app.include_router(curriculum.router, prefix=settings.api_v1_str)
app.include_router(diagnostics.router, prefix=settings.api_v1_str)
app.include_router(flashcards.router, prefix=settings.api_v1_str)
app.include_router(profile.router, prefix=settings.api_v1_str)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "supabase_configured": bool(
            settings.supabase_url
            and settings.supabase_anon_key
            and settings.supabase_service_role_key
        ),
        "gemini_configured": bool(settings.gemini_api_key),
    }
