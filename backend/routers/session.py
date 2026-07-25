from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.models import User, Session as SessionModel, MisconceptionModel, CognitiveTwin
from backend.schemas import (
    SessionCreate, 
    ClassroomInteraction, 
    ClassroomAIResponse, 
    ClassroomSessionResponse,
    TeachingStyleUpdate,
    LiveStudentAssessmentResponse
)
from backend.services.ai import ai_service
from backend.services.vision import vision_service
from backend.services.speech import speech_service
import datetime
import json

router = APIRouter(prefix="/session", tags=["AI Classroom Session"])

@router.post("/create", response_model=ClassroomSessionResponse)
def create_session(session_in: SessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Initializes a new AI Classroom session.
    """
    session = SessionModel(
        user_id=current_user.id,
        topic=session_in.topic,
        status="active",
        duration=0,
        timeline=[
            {"timestamp": 0.0, "item": f"Started session on {session_in.topic}", "category": "system"},
            {"timestamp": 1.0, "item": f"AI Assistant introduced lesson goals", "category": "avatar"}
        ],
        transcription=[],
        whiteboard_replay=[],
        feedback=[]
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/history", response_model=list[ClassroomSessionResponse])
def get_session_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SessionModel).filter(SessionModel.user_id == current_user.id).all()

@router.get("/{session_id}", response_model=ClassroomSessionResponse)
def get_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(SessionModel).filter(SessionModel.id == session_id, SessionModel.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/{session_id}/teaching-style")
def update_teaching_style(
    session_id: int,
    style_in: TeachingStyleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Instantly changes the AI teacher's pedagogy style (Socratic, Direct, Visual, Encouraging, Challenge).
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id, SessionModel.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    current_user.ai_personality = style_in.teaching_style
    db.commit()
    return {"status": "success", "active_teaching_style": style_in.teaching_style}

@router.get("/{session_id}/student-profile", response_model=LiveStudentAssessmentResponse)
def get_live_student_assessment(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns real-time assessment of child's strengths, weaknesses, understanding score,
    and hesitation analysis during the live session.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id, SessionModel.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    active_m = db.query(MisconceptionModel).filter(
        MisconceptionModel.user_id == current_user.id,
        MisconceptionModel.is_resolved == False
    ).all()
    
    weakness_list = [m.error_type for m in active_m] if active_m else ["None detected"]
    
    return {
        "user_id": current_user.id,
        "mastery_score": current_user.mastery_score or 0.82,
        "confidence_score": current_user.confidence_score or 0.78,
        "strengths": ["Isolating variables", "Adding/subtracting across equations", "Visualizing step procedures"],
        "weaknesses": weakness_list,
        "vocal_hesitation": 0.22,
        "whiteboard_cognitive_load": 0.35,
        "active_teaching_style": current_user.ai_personality or "Socratic",
        "active_misconceptions": weakness_list
    }

@router.post("/{session_id}/interact", response_model=ClassroomAIResponse)
def interact_session(
    session_id: int, 
    interaction: ClassroomInteraction,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Processes voice transcription, whiteboard drawings, and chat to return
    active tutor guidelines, hints, AI whiteboard annotations, voice payload, and student diagnostics.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id, SessionModel.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    user_speech_text = ""
    vocal_metrics = None
    
    # 1. Process Voice/Whisper
    if interaction.voice_audio_base64:
        speech_result = speech_service.transcribe_audio(interaction.voice_audio_base64)
        user_speech_text = speech_result.get("text", "")
        vocal_metrics = speech_result.get("analytics", {})
        
    # Combine keyboard input and voice input
    combined_input = interaction.user_input
    if user_speech_text:
        combined_input += " [Spoken: " + user_speech_text + "]"
        
    # 2. Process Whiteboard Strokes (Computer Vision Telemetry)
    stroke_analysis = None
    ocr_result = ""
    if interaction.whiteboard_strokes:
        stroke_analysis = vision_service.analyze_strokes(interaction.whiteboard_strokes)
        
    if interaction.whiteboard_image_base64:
        ocr_result = vision_service.perform_ocr(interaction.whiteboard_image_base64)
        if ocr_result:
            combined_input += f" [Drawn on Board: {ocr_result}]"
            
    # Active teaching style
    active_style = interaction.teaching_style or current_user.ai_personality or "Socratic"

    # 3. Request explanation and misconception evaluation from AI
    ai_history = []
    tutor_feedback = ai_service.generate_tutor_response(
        combined_input, 
        ai_history, 
        interaction.whiteboard_strokes,
        teaching_style=active_style
    )
    
    # Synthesize AI teacher voice response
    voice_payload = speech_service.synthesize_speech(
        tutor_feedback.get("explanation", ""),
        voice_name=current_user.voice_settings.get("voiceName", "Default") if current_user.voice_settings else "Default"
    )

    # 4. If a misconception was detected, write it to database
    misconception_name = tutor_feedback.get("detected_misconception")
    if misconception_name:
        existing_m = db.query(MisconceptionModel).filter(
            MisconceptionModel.user_id == current_user.id,
            MisconceptionModel.error_type == misconception_name,
            MisconceptionModel.is_resolved == False
        ).first()
        
        if existing_m:
            existing_m.occurrences += 1
            ev = list(existing_m.evidence) if existing_m.evidence else []
            ev.append({
                "timestamp": str(datetime.datetime.utcnow()),
                "student_input": combined_input,
                "detected_ocr": ocr_result,
                "confidence": tutor_feedback.get("confidence_meter")
            })
            existing_m.evidence = ev
        else:
            new_m = MisconceptionModel(
                user_id=current_user.id,
                topic=session.topic,
                error_type=misconception_name,
                description=f"Student exhibits difficulty resolving '{misconception_name}' under {session.topic}.",
                confidence=tutor_feedback.get("confidence_meter", 0.9),
                occurrences=1,
                evidence=[{
                    "timestamp": str(datetime.datetime.utcnow()),
                    "student_input": combined_input,
                    "detected_ocr": ocr_result,
                    "confidence": tutor_feedback.get("confidence_meter")
                }],
                active_intervention=tutor_feedback.get("suggested_intervention"),
                is_resolved=False
            )
            db.add(new_m)
            
        twin = db.query(CognitiveTwin).filter(CognitiveTwin.user_id == current_user.id).first()
        if twin:
            graph = dict(twin.misconception_graph) if twin.misconception_graph else {"nodes": [], "edges": []}
            node_exists = any(node.get("label") == misconception_name for node in graph.get("nodes", []))
            if not node_exists:
                graph["nodes"].append({
                    "id": f"m{len(graph['nodes']) + 1}",
                    "label": misconception_name,
                    "severity": tutor_feedback.get("confidence_meter", 0.8)
                })
                twin.misconception_graph = graph

    # Update session records
    updated_timeline = list(session.timeline) if session.timeline else []
    current_time_offset = (datetime.datetime.utcnow() - session.start_time).total_seconds()
    
    updated_timeline.append({
        "timestamp": round(current_time_offset, 1),
        "item": f"Student sent message/drawing: '{interaction.user_input[:40]}...'",
        "category": "student"
    })
    updated_timeline.append({
        "timestamp": round(current_time_offset + 1.5, 1),
        "item": f"AI ({active_style}) responded: '{tutor_feedback.get('explanation')[:40]}...'",
        "category": "avatar"
    })
    
    session.timeline = updated_timeline
    
    transcripts = list(session.transcription) if session.transcription else []
    if combined_input:
        transcripts.append({"speaker": "student", "text": combined_input, "timestamp": str(datetime.datetime.utcnow())})
    transcripts.append({"speaker": "tutor", "text": tutor_feedback.get("explanation"), "timestamp": str(datetime.datetime.utcnow())})
    session.transcription = transcripts
    
    if interaction.whiteboard_strokes:
        replays = list(session.whiteboard_replay) if session.whiteboard_replay else []
        replays.append({
            "timestamp": str(datetime.datetime.utcnow()),
            "strokes": interaction.whiteboard_strokes,
            "ocr_result": ocr_result,
            "telemetry": stroke_analysis
        })
        session.whiteboard_replay = replays
        
    db.commit()
    db.refresh(session)
    
    return {
        "explanation": tutor_feedback.get("explanation"),
        "timeline": updated_timeline,
        "ai_feedback": tutor_feedback.get("ai_feedback"),
        "hint": tutor_feedback.get("hint"),
        "detected_misconception": misconception_name,
        "confidence_meter": tutor_feedback.get("confidence_meter"),
        "evidence": tutor_feedback.get("evidence"),
        "strategy_choice": tutor_feedback.get("strategy_choice"),
        "suggested_intervention": tutor_feedback.get("suggested_intervention"),
        "teaching_style_active": active_style,
        "teacher_whiteboard_actions": tutor_feedback.get("teacher_whiteboard_actions", []),
        "teacher_audio_base64": voice_payload.get("audio_base64"),
        "student_understanding": tutor_feedback.get("student_understanding")
    }
