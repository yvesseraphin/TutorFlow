import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile
from google import genai
from google.genai import types

from backend.config import settings
from backend.services.ai_learner import KNOWLEDGE_GRAPH
from backend.services.supabase import admin_client, current_user, optional_user

logger = logging.getLogger("tutorflow.curriculum")

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])


@router.get("")
@router.get("/")
def get_curriculum_root(user: dict = Depends(current_user)) -> dict:
    from backend.curriculum import CURRICULUM
    custom_courses = {}

    # Merge custom classes created by the student and prioritize them first
    if user and user.get("id"):
        try:
            from backend.services.rag_service import get_user_custom_classes
            custom_classes = get_user_custom_classes(user["id"])
            for c in custom_classes:
                c_name = c.get("name")
                curr = c.get("curriculum") or {}
                units = curr.get("units") or []
                lessons = []
                for u in units:
                    lessons.append({
                        "title": u.get("title", f"Unit {u.get('unit_number', 1)}"),
                        "skills": u.get("skills", [u.get("title", "Core Concept")]),
                        "outcomes": u.get("outcomes", []),
                        "starter_concept": u.get("starter_concept", ""),
                        "diagnostic_question": u.get("diagnostic_question", ""),
                        "is_custom": True,
                        "class_id": c.get("id"),
                        "document_id": c.get("document_id"),
                    })
                if c_name and lessons:
                    custom_courses[c_name] = lessons
        except Exception as err:
            logger.warning(f"Error merging custom classes into curriculum: {err}")

    # Prioritize custom classes first, followed by standard curriculum
    courses = {**custom_courses, **CURRICULUM}
    return {"courses": courses}


@router.get("/tree")
def get_curriculum_tree(user: dict = Depends(current_user)) -> dict:
    client = admin_client()
    uid = user["id"]

    # Fetch student's mastery records
    mastery_res = (
        client.table("student_learner_model")
        .select("topic_id,mastery_score,status,retention_stability,last_practiced_at")
        .eq("user_id", uid)
        .execute()
    )
    mastery_map = {m["topic_id"]: m for m in (mastery_res.data or [])}

    nodes: List[Dict[str, Any]] = []
    categories: Dict[str, List[Dict[str, Any]]] = {}

    for topic_name, info in KNOWLEDGE_GRAPH.items():
        user_record = mastery_map.get(topic_name, {})
        mastery_score = float(user_record.get("mastery_score", 0.0))
        status = user_record.get("status", "not_started" if mastery_score == 0 else ("mastered" if mastery_score >= 0.85 else "in_progress"))

        node = {
            "id": info["id"],
            "title": topic_name,
            "subject": info["subject"],
            "grade": info["grade"],
            "category": info["category"],
            "difficulty": info["difficulty"],
            "prerequisites": info["prerequisites"],
            "core_concepts": info["core_concepts"],
            "user_mastery": mastery_score,
            "status": status,
            "last_practiced_at": user_record.get("last_practiced_at"),
        }
        nodes.append(node)
        cat = info["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(node)

    return {
        "nodes": nodes,
        "categories": categories,
        "total_topics": len(nodes),
    }


@router.get("/next-lesson")
def get_next_lesson(topic: str = "Algebra", user: dict = Depends(current_user)) -> dict:
    from backend.curriculum import lesson_for_learner
    client = admin_client()
    uid = user["id"]
    mastery_res = (
        client.table("student_learner_model")
        .select("topic_id,mastery_score")
        .eq("user_id", uid)
        .execute()
    )
    mastery_rows = [{"skill": r["topic_id"], "mastery": float(r.get("mastery_score", 0))} for r in (mastery_res.data or [])]
    return lesson_for_learner(topic, mastery_rows)


@router.post("/generate-from-notes")
async def generate_curriculum_from_notes(
    notes: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: Optional[dict] = Depends(optional_user),
) -> dict:
    """
    Ingests raw study materials (notes, syllabus, homework, PDF or image)
    and dynamically synthesizes a structured, pedagogical master curriculum using Gemini.
    """
    extracted_text = ""
    file_part = None
    file_name = None

    if file:
        file_name = file.filename
        file_bytes = await file.read()
        mime = file.content_type or "application/octet-stream"
        
        # Check if text file
        if mime.startswith("text/") or (file_name and file_name.endswith((".txt", ".md"))):
            try:
                extracted_text = file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                pass
        else:
            # Send file directly to Gemini as multimodal Part
            try:
                file_part = types.Part.from_bytes(data=file_bytes, mime_type=mime)
            except Exception as err:
                logger.warning(f"Could not build Gemini Part for uploaded file: {err}")

    raw_input_desc = notes or topic or file_name or "General Topic"
    if extracted_text:
        raw_input_desc += f"\n\nExtracted Notes Content:\n{extracted_text[:4000]}"

    prompt = f"""You are TutorFlow's Master Curriculum Architect.
Analyze the provided student study materials, syllabus, or learning goals, and synthesize a structured, pedagogical master curriculum.

STUDENT NOTES / MATERIALS PROVIDED:
{raw_input_desc}

REQUIREMENTS:
1. Synthesize 3 to 5 coherent, progressive units covering this material from foundational principles to advanced mastery.
2. For each unit, provide:
   - "title": Clear unit title (e.g. "Unit 1: Linear Systems & Matrix Foundations")
   - "skills": 3 to 4 specific sub-skills the student will practice
   - "outcomes": 2 to 3 measurable outcomes
   - "starter_concept": Visual or conceptual intuition to draw on the whiteboard
   - "diagnostic_question": A quick conceptual check question
3. Identify:
   - "course_title": A crisp, professional title for this custom class
   - "subject": General academic subject (e.g. Mathematics, Physics, Computer Science)
   - "prerequisites": List of 2-3 foundational concepts needed before starting
   - "recommended_first_topic": The exact title of Unit 1 to start teaching right now
   - "summary": 2-sentence overview of the student's learning journey

Return strict, clean JSON matching this schema:
{{
  "course_title": "string",
  "subject": "string",
  "summary": "string",
  "prerequisites": ["string"],
  "recommended_first_topic": "string",
  "units": [
    {{
      "unit_number": 1,
      "title": "string",
      "skills": ["string"],
      "outcomes": ["string"],
      "starter_concept": "string",
      "diagnostic_question": "string"
    }}
  ]
}}
"""

    curriculum = None
    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            contents: list = []
            if file_part:
                contents.append(file_part)
            contents.append(prompt)

            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            curriculum = json.loads(response.text)
        except Exception as e:
            logger.error(f"Error generating curriculum from notes via Gemini: {e}")

    if not curriculum or not curriculum.get("units"):
        title_hint = topic or (file_name.rsplit(".", 1)[0] if file_name else "Custom Study Plan")
        curriculum = {
            "course_title": f"{title_hint} Mastery",
            "subject": "Mathematics",
            "summary": f"A personalized curriculum built around {title_hint} with real-time interactive voice and whiteboard guidance.",
            "prerequisites": ["Core foundational algebraic operations", "Basic problem decomposition"],
            "recommended_first_topic": f"Foundations of {title_hint}",
            "units": [
                {
                    "unit_number": 1,
                    "title": f"Foundations of {title_hint}",
                    "skills": [f"{title_hint} definitions", "Intuitive visual models", "Core mechanics"],
                    "outcomes": ["Understand fundamental definitions", "Solve step-by-step introductory problems"],
                    "starter_concept": f"Visual balance and breakdown of {title_hint}",
                    "diagnostic_question": f"Can you describe how {title_hint} works in your own words?",
                },
                {
                    "unit_number": 2,
                    "title": f"Intermediate {title_hint} Problem Solving",
                    "skills": ["Multi-step solving", "Common misconception traps", "Verification"],
                    "outcomes": ["Solve intermediate challenges", "Self-correct common algebraic slips"],
                    "starter_concept": "Two-sided balance scale representation",
                    "diagnostic_question": "What is the first step you would take to isolate the variable?",
                },
                {
                    "unit_number": 3,
                    "title": f"Advanced {title_hint} Applications",
                    "skills": ["Real-world application", "Transfer problem", "Teach-back mastery"],
                    "outcomes": ["Apply concepts to unassisted novel problems", "Demonstrate 100% mastery"],
                    "starter_concept": "Real-world transfer analogy",
                    "diagnostic_question": "How does this rule apply when values are negative?",
                },
            ],
        }

    # Save to RAG pipeline and create custom class
    doc_id = None
    class_id = None
    try:
        from backend.services.rag_service import save_uploaded_document_and_chunks, synthesize_class_from_materials
        full_content = (extracted_text or notes or topic or "").strip()
        if full_content:
            doc_meta = save_uploaded_document_and_chunks(
                user_id=user["id"] if user else "",
                file_name=file_name or (topic or "Study Notes"),
                file_type=file.content_type if file else "text/plain",
                file_size=len(file_bytes) if file else len(full_content),
                extracted_text=full_content,
                summary=curriculum.get("summary", ""),
            )
            doc_id = doc_meta.get("document_id")
            if user and user.get("id"):
                created_class = await synthesize_class_from_materials(
                    extracted_text=full_content,
                    doc_name=file_name or (topic or "Custom Class"),
                    user_id=user["id"],
                    document_id=doc_id,
                    topic_hint=topic,
                )
                class_id = created_class.get("id")
    except Exception as rag_err:
        logger.warning(f"RAG document indexing error in generate-from-notes: {rag_err}")

    # If user is logged in, optionally log/track in learner model
    if user:
        try:
            client = admin_client()
            first_unit = curriculum.get("recommended_first_topic")
            client.table("student_learner_model").upsert(
                {
                    "user_id": user["id"],
                    "topic_id": first_unit,
                    "mastery_score": 0.0,
                    "status": "in_progress",
                },
                on_conflict="user_id,topic_id"
            ).execute()
        except Exception as e:
            logger.warning(f"Could not persist custom curriculum to Supabase: {e}")

    return {
        "success": True,
        "curriculum": curriculum,
        "first_topic": curriculum.get("recommended_first_topic"),
        "course_title": curriculum.get("course_title"),
        "document_id": doc_id,
        "class_id": class_id,
    }

