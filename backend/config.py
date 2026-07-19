import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TutorFlow Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tutorflow-super-secret-key-for-jwt-tokens-hackathon-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database configuration (defaults to SQLite, can be overridden by PostgreSQL URL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./tutorflow.db")
    
    # Redis configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    USE_MOCK_REDIS: bool = os.getenv("USE_MOCK_REDIS", "True").lower() == "true"
    
    # AI API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CLAUDE_API_KEY: str = os.getenv("CLAUDE_API_KEY", "")
    
    class Config:
        case_sensitive = True

settings = Settings()
