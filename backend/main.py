import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base
from backend.routers import auth, diagnostic, session, twin, reasoning, analytics, review

# Initialize database schemas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="TutorFlow API for AI/ML powered tutoring, cognitive twin modeling, explainable AI diagnostics.",
    version="1.0.0"
)

# Set CORS origins to allow local React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon demo ease, allow all. In production, lock this down.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(diagnostic.router, prefix=settings.API_V1_STR)
app.include_router(session.router, prefix=settings.API_V1_STR)
app.include_router(twin.router, prefix=settings.API_V1_STR)
app.include_router(reasoning.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(review.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "TutorFlow Backend",
        "endpoints": [
            f"{settings.API_V1_STR}/auth",
            f"{settings.API_V1_STR}/diagnostic",
            f"{settings.API_V1_STR}/session",
            f"{settings.API_V1_STR}/twin",
            f"{settings.API_V1_STR}/reasoning",
            f"{settings.API_V1_STR}/analytics",
            f"{settings.API_V1_STR}/review"
        ]
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
