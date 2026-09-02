import json
import logging
import math
import re
import uuid
import zipfile
import io
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

from backend.config import settings
from backend.services.supabase import admin_client

logger = logging.getLogger("tutorflow.rag_service")

# In-memory store fallback if database table is pending migration
_IN_MEMORY_DOCS: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_CHUNKS: Dict[str, List[Dict[str, Any]]] = {}
_IN_MEMORY_CLASSES: Dict[str, Dict[str, Any]] = {}


# ------------------------------------------------------------------------------
# 1. Text Extraction
# ------------------------------------------------------------------------------
def extract_text_from_docx_bytes(file_bytes: bytes) -> str:
    """Extracts raw text from a .docx file without third-party dependencies."""
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
            xml_content = docx.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            paragraphs = []
            for p in tree.findall(".//w:p", namespaces):
                texts = [node.text for node in p.findall(".//w:t", namespaces) if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            return "\n\n".join(paragraphs)
    except Exception as e:
        logger.warning(f"Failed to parse DOCX using standard XML extractor: {e}")
        return ""


async def extract_text_from_file_bytes(
    file_bytes: bytes, filename: str, mime_type: str
) -> str:
    """
    Extracts text from text, markdown, docx, or uses Gemini multimodal OCR for PDF/images.
    """
    fn = filename.lower()
    # Plain text / Markdown
    if mime_type.startswith("text/") or fn.endswith((".txt", ".md", ".csv", ".json")):
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""

    # Word DOCX
    if fn.endswith(".docx") or "officedocument.wordprocessingml" in mime_type:
        text = extract_text_from_docx_bytes(file_bytes)
        if text.strip():
            return text

    # For PDF or Images, leverage Gemini's multimodal vision
    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            doc_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type or "application/pdf")
            prompt = (
                "Extract and transcribe the full educational text from this study document or image cleanly and accurately. "
                "Preserve section titles, definitions, mathematical equations (in standard LaTeX where applicable), and key problems."
            )
            resp = client.models.generate_content(
                model=settings.gemini_model,
                contents=[doc_part, prompt],
            )
            extracted = resp.text or ""
            if extracted.strip():
                return extracted
        except Exception as e:
            logger.warning(f"Gemini multimodal extraction fallback failed for {filename}: {e}")

    # Fallback to UTF-8 lossy decoding
    try:
        raw = file_bytes.decode("utf-8", errors="ignore")
        # Keep only printable characters
        printable = re.sub(r"[^\x20-\x7E\n\t]", " ", raw)
        clean = re.sub(r"\s+", " ", printable).strip()
        return clean if len(clean) > 50 else ""
    except Exception:
        return ""


# ------------------------------------------------------------------------------
# 2. Semantic Chunking
# ------------------------------------------------------------------------------
def chunk_text(
    text: str, chunk_size: int = 700, chunk_overlap: int = 120
) -> List[Dict[str, Any]]:
    """
    Splits text into overlapping semantic chunks preserving sentence boundaries.
    """
    cleaned = text.strip()
    if not cleaned:
        return []

    # First split by paragraph breaks
    paragraphs = re.split(r"\n\s*\n", cleaned)
    raw_segments: List[str] = []
    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
        if len(p_clean) > chunk_size:
            # Sub-split long paragraphs by sentences
            sentences = re.split(r"(?<=[.?!])\s+", p_clean)
            cur = ""
            for s in sentences:
                if len(cur) + len(s) < chunk_size:
                    cur += (" " if cur else "") + s
                else:
                    if cur:
                        raw_segments.append(cur)
                    cur = s
            if cur:
                raw_segments.append(cur)
        else:
            raw_segments.append(p_clean)

    # Now create sliding chunks with overlap
    chunks: List[Dict[str, Any]] = []
    current_chunk = ""
    chunk_index = 0

    for seg in raw_segments:
        if not current_chunk:
            current_chunk = seg
        elif len(current_chunk) + len(seg) + 2 <= chunk_size:
            current_chunk += "\n\n" + seg
        else:
            chunks.append({
                "chunk_index": chunk_index,
                "chunk_text": current_chunk.strip(),
            })
            chunk_index += 1
            # Overlap from the end of current chunk
            overlap_prefix = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else ""
            current_chunk = (overlap_prefix + "\n" + seg).strip()

    if current_chunk.strip():
        chunks.append({
            "chunk_index": chunk_index,
            "chunk_text": current_chunk.strip(),
        })

    return chunks


# ------------------------------------------------------------------------------
# 3. Vector Embeddings
# ------------------------------------------------------------------------------
def _fallback_embedding(text: str, dim: int = 768) -> List[float]:
    """Deterministic normalized pseudo-embedding fallback."""
    vec = [0.0] * dim
    for i, char in enumerate(text[:1500]):
        val = ord(char)
        idx = (val * (i + 1)) % dim
        vec[idx] += 1.0
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [round(x / norm, 5) for x in vec]


def generate_embedding(text: str) -> List[float]:
    """
    Generates 768-dimensional dense vector embeddings using Google GenAI.
    """
    if not text.strip():
        return [0.0] * 768

    if settings.gemini_api_key:
        try:
            from google.genai import types
            client = genai.Client(api_key=settings.gemini_api_key)
            # Use gemini-embedding-001 with explicit 768-dim output to match vector(768)
            res = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text[:2048],
                config=types.EmbedContentConfig(output_dimensionality=768),
            )
            if hasattr(res, "embeddings") and res.embeddings:
                vals = list(res.embeddings[0].values)
                if len(vals) == 768:
                    return vals
            elif hasattr(res, "embedding") and hasattr(res.embedding, "values"):
                vals = list(res.embedding.values)
                if len(vals) == 768:
                    return vals
        except Exception as e1:
            try:
                client = genai.Client(api_key=settings.gemini_api_key)
                res = client.models.embed_content(
                    model="text-embedding-004",
                    contents=text[:2048],
                )
                if hasattr(res, "embedding") and hasattr(res.embedding, "values"):
                    vals = list(res.embedding.values)
                    if len(vals) == 768:
                        return vals
                elif hasattr(res, "embeddings") and res.embeddings:
                    vals = list(res.embeddings[0].values)
                    if len(vals) == 768:
                        return vals
            except Exception as e2:
                logger.warning(f"Gemini embedding call failed, using deterministic fallback: {e1} / {e2}")

    return _fallback_embedding(text)


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates cosine similarity between two vector lists."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


# ------------------------------------------------------------------------------
# 4. Storage & Ingestion
# ------------------------------------------------------------------------------
def save_uploaded_document_and_chunks(
    user_id: str,
    file_name: str,
    file_type: str,
    file_size: int,
    extracted_text: str,
    summary: str = "",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Chunks document, generates vector embeddings, and persists document + chunks
    in Supabase and local cache.
    """
    doc_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    meta = metadata or {}

    doc_row = {
        "id": doc_id,
        "user_id": user_id,
        "file_name": file_name,
        "file_type": file_type,
        "file_size": file_size,
        "extracted_text": extracted_text[:100000],  # cap stored raw text
        "summary": summary,
        "status": "processed",
        "metadata": meta,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    # Split into overlapping chunks
    raw_chunks = chunk_text(extracted_text)
    embedded_chunks: List[Dict[str, Any]] = []

    for c in raw_chunks:
        emb = generate_embedding(c["chunk_text"])
        chunk_row = {
            "id": str(uuid.uuid4()),
            "document_id": doc_id,
            "user_id": user_id,
            "chunk_index": c["chunk_index"],
            "chunk_text": c["chunk_text"],
            "embedding": emb,
            "embedding_json": emb,
            "metadata": {"file_name": file_name},
            "created_at": now_iso,
        }
        embedded_chunks.append(chunk_row)

    # Save to in-memory store
    _IN_MEMORY_DOCS[doc_id] = doc_row
    _IN_MEMORY_CHUNKS[doc_id] = embedded_chunks

    # Attempt saving to Supabase
    if user_id:
        try:
            client = admin_client()
            client.table("uploaded_documents").insert({
                "id": doc_id,
                "user_id": user_id,
                "file_name": file_name,
                "file_type": file_type,
                "file_size": file_size,
                "extracted_text": extracted_text[:100000],
                "summary": summary,
                "status": "processed",
                "metadata": meta,
                "created_at": now_iso,
            }).execute()

            # Insert chunks in batch
            batch = []
            for ch in embedded_chunks:
                batch.append({
                    "id": ch["id"],
                    "document_id": doc_id,
                    "user_id": user_id,
                    "chunk_index": ch["chunk_index"],
                    "chunk_text": ch["chunk_text"],
                    "embedding": ch["embedding"],
                    "embedding_json": ch["embedding_json"],
                    "metadata": ch["metadata"],
                    "created_at": now_iso,
                })
            if batch:
                # Insert in chunks of 50 to prevent payload limits
                for i in range(0, len(batch), 50):
                    client.table("document_chunks").insert(batch[i : i + 50]).execute()
            logger.info(f"Successfully saved document {doc_id} with {len(embedded_chunks)} chunks to Supabase")
        except Exception as err:
            logger.warning(f"Could not persist document to Supabase (using memory cache): {err}")

    return {
        "document_id": doc_id,
        "file_name": file_name,
        "chunk_count": len(embedded_chunks),
        "summary": summary,
    }


# ------------------------------------------------------------------------------
# 5. Semantic Vector Retrieval (RAG)
# ------------------------------------------------------------------------------
def search_relevant_chunks(
    query: str,
    user_id: Optional[str] = None,
    document_id: Optional[str] = None,
    top_k: int = 4,
) -> List[Dict[str, Any]]:
    """
    Performs cosine similarity vector search to retrieve the most relevant chunks
    from the student's uploaded document(s).
    """
    if not query.strip():
        return []

    query_emb = generate_embedding(query)

    clean_user_id = user_id if (user_id and len(str(user_id).strip()) == 36) else None
    clean_doc_id = document_id if (document_id and len(str(document_id).strip()) == 36) else None

    # 1. Try Supabase RPC match_document_chunks if available
    if clean_user_id:
        try:
            client = admin_client()
            rpc_res = client.rpc(
                "match_document_chunks",
                {
                    "query_embedding": query_emb,
                    "match_threshold": 0.25,
                    "match_count": top_k,
                    "filter_user_id": clean_user_id,
                    "filter_doc_id": clean_doc_id,
                },
            ).execute()
            if rpc_res.data:
                return rpc_res.data
        except Exception as rpc_err:
            logger.info(f"Supabase RPC match_document_chunks not available or failed: {rpc_err}")

    # 2. Fallback to memory / local chunks cosine search
    candidate_chunks: List[Dict[str, Any]] = []
    if document_id and document_id in _IN_MEMORY_CHUNKS:
        candidate_chunks.extend(_IN_MEMORY_CHUNKS[document_id])
    else:
        for doc_id, chs in _IN_MEMORY_CHUNKS.items():
            if not user_id or _IN_MEMORY_DOCS.get(doc_id, {}).get("user_id") == user_id:
                candidate_chunks.extend(chs)

    # Also try pulling recent chunks from Supabase table if memory was empty
    if not candidate_chunks and user_id:
        try:
            client = admin_client()
            q = client.table("document_chunks").select("id,document_id,chunk_index,chunk_text,embedding_json,metadata").eq("user_id", user_id)
            if document_id:
                q = q.eq("document_id", document_id)
            rows = q.limit(100).execute().data or []
            for r in rows:
                emb = r.get("embedding_json") or []
                candidate_chunks.append({
                    "id": r["id"],
                    "document_id": r["document_id"],
                    "chunk_index": r["chunk_index"],
                    "chunk_text": r["chunk_text"],
                    "embedding": emb,
                    "metadata": r.get("metadata") or {},
                })
        except Exception as fetch_err:
            logger.warning(f"Could not load chunks from Supabase for similarity ranking: {fetch_err}")

    if not candidate_chunks:
        return []

    # Score candidates
    scored = []
    query_words = set(re.findall(r"\w+", query.lower()))
    for c in candidate_chunks:
        emb = c.get("embedding") or []
        sim = cosine_similarity(query_emb, emb) if emb else 0.0

        # Keyword boost
        text_words = set(re.findall(r"\w+", c["chunk_text"].lower()))
        common = len(query_words.intersection(text_words))
        kw_boost = min(common * 0.05, 0.25)
        total_score = sim + kw_boost

        scored.append({
            "id": c.get("id"),
            "document_id": c.get("document_id"),
            "chunk_index": c.get("chunk_index"),
            "chunk_text": c["chunk_text"],
            "metadata": c.get("metadata", {}),
            "similarity": round(total_score, 4),
        })

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:top_k]


def build_rag_prompt_context(
    query: str,
    user_id: Optional[str] = None,
    document_id: Optional[str] = None,
    top_k: int = 4,
) -> str:
    """
    Retrieves the top matching document chunks and formats them into clean,
    grounded instructional context for the AI Teacher.
    """
    matches = search_relevant_chunks(query=query, user_id=user_id, document_id=document_id, top_k=top_k)
    if not matches:
        return ""

    lines = [
        "==================================================================",
        "STUDENT STUDY MATERIAL CONTEXT (RAG - RETRIEVED FROM UPLOADED NOTES):",
        "Use the exact definitions, examples, formulas, and terminology from these excerpts:",
    ]
    for idx, m in enumerate(matches, 1):
        lines.append(f"\n[EXCERPT {idx} | Source: {m.get('metadata', {}).get('file_name', 'Uploaded Document')}]")
        lines.append(m["chunk_text"].strip())
    lines.append("==================================================================")
    return "\n".join(lines)


# ------------------------------------------------------------------------------
# 6. AI Custom Class Synthesis
# ------------------------------------------------------------------------------
async def synthesize_class_from_materials(
    extracted_text: str,
    doc_name: str,
    user_id: str,
    document_id: Optional[str] = None,
    topic_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Uses Gemini to synthesize a structured multi-unit class from uploaded materials
    and saves it to `custom_classes`.
    """
    class_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_sample = extracted_text[:12000].strip() or topic_hint or doc_name

    prompt = f"""You are TutorFlow's Master Academic Architect.
Analyze the student's study materials, syllabus, or notes, and construct a complete, structured custom class.

STUDENT STUDY MATERIAL:
{clean_sample}

INSTRUCTIONS:
1. Provide a crisp, academic 'course_title' (e.g. "Linear Systems & Matrix Foundations" or "Cellular Energetics & Photosynthesis").
2. Determine 'subject' (e.g. Mathematics, Physics, Chemistry, Biology, Computer Science, Economics).
3. Determine 'level' (Beginner, Intermediate, or Advanced).
4. Write a concise 2-sentence 'description'.
5. Synthesize 3 to 4 cohesive progressive 'units' covering the uploaded material thoroughly:
   - "unit_number": integer
   - "title": specific unit title
   - "skills": 3 key sub-skills practiced
   - "outcomes": 2 measurable learning outcomes
   - "starter_concept": a visual math intuition or rule to write on the whiteboard
   - "diagnostic_question": a quick introductory check question
6. Identify the 'recommended_first_topic' (exact title of Unit 1).

Respond with strict JSON matching this structure:
{{
  "course_title": "string",
  "subject": "string",
  "level": "string",
  "description": "string",
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

    parsed_curriculum = None
    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            resp = client.models.generate_content(
                model=settings.gemini_model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            parsed_curriculum = json.loads(resp.text)
        except Exception as e:
            logger.error(f"Error synthesizing class from materials via Gemini: {e}")

    # Fallback curriculum structure if AI call fails
    if not parsed_curriculum or not parsed_curriculum.get("units"):
        title = topic_hint or (doc_name.rsplit(".", 1)[0] if doc_name else "Custom Study Course")
        title = title.replace("-", " ").replace("_", " ").title()
        parsed_curriculum = {
            "course_title": f"{title} Mastery",
            "subject": "Mathematics",
            "level": "Intermediate",
            "description": f"Personalized AI-guided course built from {doc_name or 'uploaded notes'}.",
            "recommended_first_topic": f"Foundations of {title}",
            "units": [
                {
                    "unit_number": 1,
                    "title": f"Foundations of {title}",
                    "skills": [f"Core definitions of {title}", "Visual models", "Basic operations"],
                    "outcomes": ["Understand fundamental principles", "Solve introductory problems with confidence"],
                    "starter_concept": f"Visual breakdown of {title}",
                    "diagnostic_question": f"Can you describe how {title} works in your own words?",
                },
                {
                    "unit_number": 2,
                    "title": f"Applied {title} Problem Solving",
                    "skills": ["Multi-step solving", "Misconception diagnosis", "Algebraic verification"],
                    "outcomes": ["Isolate variables and solve equations", "Self-correct common slips"],
                    "starter_concept": "Two-sided balance scale representation",
                    "diagnostic_question": "What is the key transformation needed in step 1?",
                },
                {
                    "unit_number": 3,
                    "title": f"Advanced {title} Mastery & Transfer",
                    "skills": ["Real-world application", "Synthesis challenges", "Teach-back mastery"],
                    "outcomes": ["Tackle novel unassisted problems", "Achieve 100% conceptual mastery"],
                    "starter_concept": "Real-world transfer analogy",
                    "diagnostic_question": "How does this rule generalize to complex cases?",
                },
            ],
        }

    class_row = {
        "id": class_id,
        "user_id": user_id,
        "name": parsed_curriculum.get("course_title") or f"{doc_name} Class",
        "subject": parsed_curriculum.get("subject") or "Mathematics",
        "description": parsed_curriculum.get("description") or "",
        "level": parsed_curriculum.get("level") or "Intermediate",
        "document_id": document_id,
        "curriculum": parsed_curriculum,
        "progress": 0,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    _IN_MEMORY_CLASSES[class_id] = class_row

    if user_id:
        try:
            client = admin_client()
            client.table("custom_classes").insert({
                "id": class_id,
                "user_id": user_id,
                "name": class_row["name"],
                "subject": class_row["subject"],
                "description": class_row["description"],
                "level": class_row["level"],
                "document_id": document_id,
                "curriculum": parsed_curriculum,
                "progress": 0,
                "created_at": now_iso,
                "updated_at": now_iso,
            }).execute()
            logger.info(f"Saved custom class {class_id} ('{class_row['name']}') to Supabase")
        except Exception as e:
            logger.warning(f"Could not persist custom class to Supabase (using memory fallback): {e}")

    return class_row


def get_user_custom_classes(user_id: str) -> List[Dict[str, Any]]:
    """Retrieves all custom classes created by the student."""
    classes = []
    # 1. Try Supabase
    if user_id:
        try:
            client = admin_client()
            res = (
                client.table("custom_classes")
                .select("id,user_id,name,subject,description,level,document_id,curriculum,progress,created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            if res.data:
                return res.data
        except Exception as e:
            logger.info(f"Could not fetch custom_classes from Supabase: {e}")

    # 2. Fallback to in-memory store
    for c in _IN_MEMORY_CLASSES.values():
        if not user_id or c.get("user_id") == user_id:
            classes.append(c)
    return sorted(classes, key=lambda x: x.get("created_at", ""), reverse=True)


def get_custom_class_by_id(class_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieves a single custom class by id."""
    if class_id in _IN_MEMORY_CLASSES:
        return _IN_MEMORY_CLASSES[class_id]

    if user_id:
        try:
            client = admin_client()
            res = client.table("custom_classes").select("*").eq("id", class_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning(f"Error fetching custom class {class_id}: {e}")
    return None
