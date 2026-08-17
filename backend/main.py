from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routers import auth_supabase, tutor

app = FastAPI(title=settings.project_name, version="2.0.0", description="Supabase-backed adaptive tutoring API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_supabase.router, prefix=settings.api_v1_str)
app.include_router(tutor.router, prefix=settings.api_v1_str)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "supabase_configured": bool(settings.supabase_url and settings.supabase_anon_key and settings.supabase_service_role_key),
        "openai_configured": bool(settings.openai_api_key),
    }
