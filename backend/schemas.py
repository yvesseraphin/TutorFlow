from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# Auth Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    school: Optional[str] = None
    grade: Optional[str] = None
    learning_goals: List[str] = []
    current_streak: int = 0
    mastery_score: float = 0.0
    confidence_score: float = 0.0
    voice_settings: Dict[str, Any] = {}
    ai_personality: str
    theme: str
    notification_settings: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    learning_goals: Optional[List[str]] = None

class PreferencesUpdate(BaseModel):
    voice_settings: Optional[Dict[str, Any]] = None
    ai_personality: Optional[str] = None
    theme: Optional[str] = None
    notification_settings: Optional[Dict[str, Any]] = None

# Onboarding & Diagnostic
class DiagnosticAnswer(BaseModel):
    question_id: int
    answer: str
    drawing_strokes: Optional[List[Any]] = None
    audio_transcript: Optional[str] = None

class DiagnosticSubmission(BaseModel):
    answers: List[DiagnosticAnswer]
    time_taken_seconds: int

class DiagnosticResult(BaseModel):
    score: float
    confidence_level: float
    learning_style: Dict[str, float]
    knowledge_map: Dict[str, Any]

# Session / Classroom
class SessionCreate(BaseModel):
    topic: str

class WhiteboardStroke(BaseModel):
    tool: str
    color: str
    points: List[Dict[str, float]]
    thickness: int

class SessionTimelineItem(BaseModel):
    timestamp: float
    item: str
    category: str

class ClassroomSessionResponse(BaseModel):
    id: int
    topic: str
    status: str
    duration: int
    start_time: datetime
    timeline: List[Dict[str, Any]] = []
    transcription: List[Dict[str, Any]] = []
    whiteboard_replay: List[Dict[str, Any]] = []
    feedback: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class TeachingStyleUpdate(BaseModel):
    teaching_style: str = Field(..., description="Socratic, Direct, Visual, Encouraging, Challenge")

class ClassroomInteraction(BaseModel):
    user_input: str
    whiteboard_image_base64: Optional[str] = None # For OCR/Vision pipeline
    whiteboard_strokes: Optional[List[Any]] = None
    voice_audio_base64: Optional[str] = None # For Whisper
    teaching_style: Optional[str] = "Socratic" # Optional style override

class ClassroomAIResponse(BaseModel):
    explanation: str
    timeline: List[Dict[str, Any]]
    ai_feedback: str
    hint: str
    detected_misconception: Optional[str] = None
    confidence_meter: float
    evidence: Optional[str] = None
    strategy_choice: Optional[str] = None
    suggested_intervention: Optional[str] = None
    teaching_style_active: str = "Socratic"
    teacher_whiteboard_actions: List[Dict[str, Any]] = [] # AI drawing instructions for frontend whiteboard
    teacher_audio_base64: Optional[str] = None # Voice audio response payload
    student_understanding: Optional[Dict[str, Any]] = None # Real-time student strengths, weaknesses, metrics

class LiveStudentAssessmentResponse(BaseModel):
    user_id: int
    mastery_score: float
    confidence_score: float
    strengths: List[str]
    weaknesses: List[str]
    vocal_hesitation: float
    whiteboard_cognitive_load: float
    active_teaching_style: str
    active_misconceptions: List[str]

# Cognitive Twin
class CognitiveTwinResponse(BaseModel):
    knowledge_map: Dict[str, Any]
    misconception_graph: Dict[str, Any]
    learning_style: Dict[str, float]
    confidence_tracker: List[Dict[str, Any]]
    forgetting_curve: Dict[str, Any]
    predictions: Dict[str, Any]

    class Config:
        from_attributes = True

# Explainable AI Reasoning
class ReasoningInsight(BaseModel):
    current_misconception: Optional[str]
    confidence: float
    evidence: List[str]
    strategy_chosen: str
    strategy_rationale: str
    suggested_intervention: str

# Analytics
class ProgressAnalytics(BaseModel):
    learning_time_distribution: Dict[str, int] # e.g. {"Monday": 30, ...}
    topic_mastery: Dict[str, float] # {"Algebra": 0.85, ...}
    accuracy_over_time: List[Dict[str, Any]]
    achievements: List[Dict[str, Any]]
    streak: int

# Review
class MistakeBookItem(BaseModel):
    id: int
    concept: str
    formula_or_fact: Optional[str]
    status: str
    last_reviewed: Optional[datetime]
    next_review: datetime
    mistake_history: List[Dict[str, Any]]

    class Config:
        from_attributes = True
