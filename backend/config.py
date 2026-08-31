from functools import lru_cache

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "TutorFlow API"
    api_v1_str: str = "/api/v1"
    frontend_origins: str = "http://localhost:5173"
    password_reset_redirect_url: str = "http://localhost:5173/login"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_live_model: str = "gemini-2.5-flash-native-audio-latest"

    model_config = SettingsConfigDict(
        env_file=(Path(__file__).resolve().parent / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def require_supabase(self) -> None:
        if not all((self.supabase_url, self.supabase_anon_key, self.supabase_service_role_key)):
            raise RuntimeError("Supabase is not configured. Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to backend/.env.")

    def require_gemini(self) -> None:
        if not self.gemini_api_key:
            raise RuntimeError("Gemini is not configured. Add GEMINI_API_KEY to backend/.env.")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
