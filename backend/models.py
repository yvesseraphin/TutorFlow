import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    school = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    learning_goals = Column(JSON, default=list) # List of goals
    current_streak = Column(Integer, default=0)
    last_active_date = Column(DateTime, nullable=True)
    mastery_score = Column(Float, default=0.0) # Overall mastery percentage
    confidence_score = Column(Float, default=0.0) # Self-reported/tracked confidence
    
    # Custom Preferences
    voice_settings = Column(JSON, default=lambda: {"voiceName": "Default", "speed": 1.0, "pitch": 1.0})
    ai_personality = Column(String, default="Empathetic Tutor")
    theme = Column(String, default="dark")
    notification_settings = Column(JSON, default=lambda: {"reminders": True, "alerts": True})
    
    # Relationships
    diagnostic_assessments = relationship("DiagnosticAssessment", back_populates="user", cascade="all, delete-orphan")
    cognitive_twin = relationship("CognitiveTwin", uselist=False, back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    misconceptions = relationship("MisconceptionModel", back_populates="user", cascade="all, delete-orphan")
    review_items = relationship("ReviewItem", back_populates="user", cascade="all, delete-orphan")

class DiagnosticAssessment(Base):
    __tablename__ = "diagnostic_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    questions = Column(JSON) # Questions presented
    answers = Column(JSON) # User answers (text, whiteboard strokes, audio transcripts)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Float)
    cognitive_profile = Column(JSON) # Resulting profile: style, strength, initial twin state
    
    user = relationship("User", back_populates="diagnostic_assessments")

class CognitiveTwin(Base):
    __tablename__ = "cognitive_twins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    knowledge_map = Column(JSON) # Nodes & Edges (JSON structure)
    misconception_graph = Column(JSON) # Graph of misconceptions and connections
    learning_style = Column(JSON) # Visual, analytical, example-driven percentages
    confidence_tracker = Column(JSON) # History points [time, score]
    forgetting_curve = Column(JSON) # Concepts & current decay levels
    predictions = Column(JSON) # Predicted future struggles / weaknesses
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="cognitive_twin")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, nullable=False)
    status = Column(String, default="completed") # active, completed
    duration = Column(Integer, default=0) # in seconds
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    timeline = Column(JSON) # Explanation history: timestamp, item, category
    transcription = Column(JSON) # Speech-to-text live dialogue logs
    whiteboard_replay = Column(JSON) # Drawing strokes sequence
    feedback = Column(JSON) # AI feedback messages
    
    user = relationship("User", back_populates="sessions")

class MisconceptionModel(Base):
    __tablename__ = "misconceptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, nullable=False)
    error_type = Column(String, nullable=False) # e.g., "distributive-law", "sign-mistake"
    description = Column(String)
    confidence = Column(Float, default=0.0) # Confidence score of classifier
    occurrences = Column(Integer, default=0)
    evidence = Column(JSON) # Mistakes history leading to classification
    active_intervention = Column(String) # Current strategy (e.g. visual explanation)
    is_resolved = Column(Boolean, default=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="misconceptions")

class ReviewItem(Base):
    __tablename__ = "review_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    concept = Column(String, nullable=False)
    formula_or_fact = Column(String)
    status = Column(String, default="active") # active, mastered, archived
    last_reviewed = Column(DateTime, nullable=True)
    next_review = Column(DateTime, default=datetime.datetime.utcnow)
    mistake_history = Column(JSON, default=list) # List of recorded wrong answers & explanations
    
    user = relationship("User", back_populates="review_items")
