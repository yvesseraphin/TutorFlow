import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from backend.services.rag_service import (
    build_rag_prompt_context,
    extract_text_from_file_bytes,
    get_custom_class_by_id,
    get_user_custom_classes,
    save_uploaded_document_and_chunks,
    search_relevant_chunks,
    synthesize_class_from_materials,
)
from backend.services.supabase import admin_client, current_user, optional_user

logger = logging.getLogger("tutorflow.classes_router")
router = APIRouter(prefix="/classes", tags=["Classes & RAG"])


class RagQueryRequest(BaseModel):
    query: str
    top_k: int = 4


@router.get("")
@router.get("/")
async def list_classes(user: dict = Depends(current_user)) -> List[Dict[str, Any]]:
    """
    Returns all personalized classes created by the current student from uploaded documents or notes.
    """
    user_id = user["id"]
    return get_user_custom_classes(user_id=user_id)


@router.get("/{class_id}")
async def get_class(class_id: str, user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    Retrieves details for a specific custom class, including units and curriculum.
    """
    user_id = user["id"]
    class_obj = get_custom_class_by_id(class_id=class_id, user_id=user_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_obj


@router.post("/create-from-document")
async def create_class_from_document(
    notes: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: Optional[dict] = Depends(optional_user),
) -> Dict[str, Any]:
    """
    Full RAG Ingestion Pipeline:
    1. Ingests student study materials (PDF, Word, TXT, image, or typed notes).
    2. Extracts full structured text.
    3. Chunks text and generates 768-dim Gemini embeddings stored in vector store.
    4. Automatically synthesizes a multi-unit academic class structure.
    5. Saves the class permanently to the database so the student can revisit anytime.
    """
    user_id = user["id"] if user else ""
    file_name = file.filename if file else ""
    file_type = file.content_type if file else "text/plain"
    extracted_text = ""
    file_size = 0

    if file:
        file_bytes = await file.read()
        file_size = len(file_bytes)
        extracted_text = await extract_text_from_file_bytes(
            file_bytes=file_bytes,
            filename=file_name,
            mime_type=file_type,
        )

    # Append any typed notes
    if notes and notes.strip():
        if extracted_text:
            extracted_text = f"{notes.strip()}\n\n--- Document Excerpts ---\n{extracted_text}"
        else:
            extracted_text = notes.strip()
            if not file_name:
                file_name = topic or "Study Notes"

    if not extracted_text.strip():
        extracted_text = topic or "General Subject Study Material"
        if not file_name:
            file_name = topic or "New Class"

    # 1. Chunk and index with embeddings into RAG vector store
    summary_preview = extracted_text[:300].replace("\n", " ").strip()
    doc_meta = save_uploaded_document_and_chunks(
        user_id=user_id,
        file_name=file_name,
        file_type=file_type,
        file_size=file_size,
        extracted_text=extracted_text,
        summary=summary_preview,
    )
    document_id = doc_meta.get("document_id")

    # 2. Synthesize complete custom class
    class_data = await synthesize_class_from_materials(
        extracted_text=extracted_text,
        doc_name=file_name,
        user_id=user_id,
        document_id=document_id,
        topic_hint=topic,
    )

    first_topic = ""
    curr = class_data.get("curriculum", {})
    if isinstance(curr, dict):
        first_topic = curr.get("recommended_first_topic")
        if not first_topic and curr.get("units"):
            first_topic = curr["units"][0].get("title", "")

    return {
        "success": True,
        "class": class_data,
        "class_id": class_data["id"],
        "course_title": class_data["name"],
        "first_topic": first_topic or class_data["name"],
        "document_id": document_id,
        "chunk_count": doc_meta.get("chunk_count", 0),
    }


@router.post("/{class_id}/query-rag")
async def query_class_rag(
    class_id: str,
    body: RagQueryRequest,
    user: dict = Depends(current_user),
) -> Dict[str, Any]:
    """
    Queries relevant context chunks for a student question or topic from this class's source document.
    """
    user_id = user["id"]
    class_obj = get_custom_class_by_id(class_id=class_id, user_id=user_id)
    doc_id = class_obj.get("document_id") if class_obj else None

    chunks = search_relevant_chunks(
        query=body.query,
        user_id=user_id,
        document_id=doc_id,
        top_k=body.top_k,
    )
    prompt_context = build_rag_prompt_context(
        query=body.query,
        user_id=user_id,
        document_id=doc_id,
        top_k=body.top_k,
    )

    return {
        "class_id": class_id,
        "query": body.query,
        "matches": chunks,
        "prompt_context": prompt_context,
    }


@router.delete("/{class_id}")
async def delete_class(class_id: str, user: dict = Depends(current_user)) -> Dict[str, Any]:
    """
    Deletes a student's custom class.
    """
    user_id = user["id"]
    try:
        client = admin_client()
        client.table("custom_classes").delete().eq("id", class_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Class deleted"}
    except Exception as e:
        logger.error(f"Error deleting class {class_id}: {e}")
        return {"success": False, "message": str(e)}
