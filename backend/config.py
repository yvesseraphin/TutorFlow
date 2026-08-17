from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "TutorFlow API"
    api_v1_str: str = "/api/v1"
    frontend_origin: str = "http://localhost:5173"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4.1-mini"
    openai_realtime_model: str = "gpt-realtime"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def require_supabase(self) -> None:
        if not all((self.supabase_url, self.supabase_anon_key, self.supabase_service_role_key)):
            raise RuntimeError("Supabase is not configured. Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to backend/.env.")

    def require_openai(self) -> None:
        if not self.openai_api_key:
            raise RuntimeError("OpenAI is not configured. Add OPENAI_API_KEY to backend/.env.")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
