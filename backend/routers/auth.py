import jwt
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from backend.database import get_db
from backend.models import User, CognitiveTwin
from backend.schemas import UserCreate, UserLogin, Token, UserResponse, UserUpdate, PreferencesUpdate
from backend.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

# Helper to verify token and get current user
def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=Token)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        password_hash=hashed_pwd,
        full_name=user_in.full_name,
        school="TutorFlow Academy",
        grade="9th Grade",
        learning_goals=["Master Linear Equations", "Improve Graphing Skills"],
        current_streak=1,
        last_active_date=datetime.datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Initialize Cognitive Twin automatically (requested feature)
    initial_twin = CognitiveTwin(
        user_id=user.id,
        learning_style={"Visual": 60.0, "Analytical": 25.0, "Example-driven": 15.0},
        knowledge_map={
            "nodes": [
                {"id": "alg-1", "label": "Variables & Expressions", "status": "mastered", "mastery": 0.9},
                {"id": "alg-2", "label": "Linear Equations", "status": "weak", "mastery": 0.4},
                {"id": "alg-3", "label": "Distributive Expansion", "status": "unlocked", "mastery": 0.25},
                {"id": "alg-4", "label": "Quadratic Functions", "status": "locked", "mastery": 0.0}
            ],
            "edges": [
                {"source": "alg-1", "target": "alg-2"},
                {"source": "alg-2", "target": "alg-3"},
                {"source": "alg-3", "target": "alg-4"}
            ]
        },
        misconception_graph={
            "nodes": [
                {"id": "m1", "label": "Distributive confusion", "severity": 0.8},
                {"id": "m2", "label": "Sign mistakes", "severity": 0.5}
            ],
            "edges": []
        },
        confidence_tracker=[
            {"date": "2026-07-15", "value": 0.3},
            {"date": "2026-07-16", "value": 0.4},
            {"date": "2026-07-17", "value": 0.45},
            {"date": "2026-07-18", "value": 0.5}
        ],
        forgetting_curve={
            "retention": 0.85,
            "concepts_at_risk": ["Distributive Property", "Combining Like Terms"]
        },
        predictions={
            "predicted_weaknesses": ["Systems of Inequalities"],
            "upcoming_struggles": "Quadratic equation factorization may prove difficult due to remaining integer multiplication confusion."
        }
    )
    db.add(initial_twin)
    db.commit()
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Increment streak if active today vs yesterday
    today = datetime.datetime.utcnow().date()
    if user.last_active_date:
        last_active = user.last_active_date.date()
        if today == last_active + datetime.timedelta(days=1):
            user.current_streak += 1
        elif today > last_active + datetime.timedelta(days=1):
            user.current_streak = 1
    else:
        user.current_streak = 1
        
    user.last_active_date = datetime.datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/forgot-password")
def forgot_password(email_data: dict):
    if "email" not in email_data:
        raise HTTPException(status_code=400, detail="Email is required")
    # Return 200 for security, simulating send email
    return {"message": f"Password reset link sent to {email_data['email']}"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(profile_in: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.school is not None:
        current_user.school = profile_in.school
    if profile_in.grade is not None:
        current_user.grade = profile_in.grade
    if profile_in.learning_goals is not None:
        current_user.learning_goals = profile_in.learning_goals
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/preferences", response_model=UserResponse)
def update_preferences(prefs_in: PreferencesUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if prefs_in.voice_settings is not None:
        current_user.voice_settings = prefs_in.voice_settings
    if prefs_in.ai_personality is not None:
        current_user.ai_personality = prefs_in.ai_personality
    if prefs_in.theme is not None:
        current_user.theme = prefs_in.theme
    if prefs_in.notification_settings is not None:
        current_user.notification_settings = prefs_in.notification_settings
        
    db.commit()
    db.refresh(current_user)
    return current_user
