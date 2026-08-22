import base64
import re
from collections.abc import Sequence

from google import genai
from google.genai import types

from backend.config import settings

TUTOR_SYSTEM_PROMPT = """You are TutorFlow, an expert, highly interactive one-to-one mathematics teacher.
Act like a real human tutor sitting right next to the student in class:
1. Speak in direct, natural conversational dialogue, like a teacher talking in person.
2. Walk with the student step by step. Give ONE small, crisp step or question at a time (max 2 short sentences).
3. Format math using clean plain text notation (e.g. 2x + 3 = 11, x^2, a/b). Avoid raw LaTeX backslashes where simple notation works.
4. Listen to their words and whiteboard drawings. Spot misconceptions instantly and guide them patiently.
5. Keep your voice warm, direct, and conversational."""


def detect_weakness(text: str) -> tuple[str | None, float]:
    normalized = text.lower().replace(" ", "")
    patterns = {
        "distributive_property": (r"\d+\([^)]*[+-][^)]*\).*=?.*\d+[a-z][+-]\d+$", 0.72),
        "negative_signs": (r"-\([^)]*-.*\).*=-[a-z]-", 0.78),
        "equation_balance": (r"=.*=>?.*=", 0.55),
    }
    for label, (pattern, confidence) in patterns.items():
        if re.search(pattern, normalized):
            return label, confidence
    return None, 0.0


def respond(
    topic: str,
    learner_context: dict,
    messages: Sequence[dict],
    student_message: str,
    lesson_plan: dict | None = None,
    image_data: str | None = None,
) -> str:
    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            context = {
                "topic": topic,
                "mastery": learner_context.get("mastery", []),
                "active_weaknesses": learner_context.get("weaknesses", []),
                "lesson_plan": lesson_plan or {},
            }
            curriculum_instruction = (
                "Teach toward every stated lesson outcome. First diagnose which outcomes the learner already meets. "
                "Do not mark an outcome mastered without evidence from a correct student response. "
                "Focus on the first skill below its target and state the next small step when appropriate."
            )
            
            vision_instruction = ""
            if image_data:
                vision_instruction = (
                    "\nIMPORTANT: An image snapshot of the student's live whiteboard drawing is attached to their message. "
                    "Carefully inspect their handwritten equations, math steps, and drawings in the image. "
                    "Acknowledge their whiteboard drawing, verify their work, spot any mathematical errors, and explain where they can improve."
                )

            contents = [
                types.Content(
                    role="model" if item["role"] == "assistant" else "user",
                    parts=[types.Part.from_text(text=item["content"])],
                )
                for item in messages
                if item["role"] in {"assistant", "user"}
            ]

            user_parts = [types.Part.from_text(text=student_message)]
            if image_data:
                try:
                    raw_b64 = image_data.split(",", 1)[1] if "," in image_data else image_data
                    image_bytes = base64.b64decode(raw_b64)
                    user_parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/png"))
                except Exception as b64_err:
                    print("Failed to decode image_data for Gemini Vision:", b64_err)

            contents.append(types.Content(role="user", parts=user_parts))

            result = client.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=TUTOR_SYSTEM_PROMPT + "\n" + curriculum_instruction + vision_instruction + "\nLearner context: " + str(context),
                    max_output_tokens=220,
                    temperature=0.6,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            if result.text:
                return result.text
        except Exception as exc:
            print("Gemini API error:", exc)
            pass

    return _generate_fallback_tutor_response(topic, student_message)


def _generate_fallback_tutor_response(topic: str, student_message: str) -> str:
    msg = student_message.lower()
    if "explain" in msg or "how" in msg or "what" in msg:
        return f"Great question about {topic}! Let's break it down step by step: What is the first operation you think we should apply?"
    elif "example" in msg:
        return f"Here is a helpful example for {topic}:\nIf we have 2x + 4 = 10, we subtract 4 from both sides to get 2x = 6, so x = 3. What step would you try next for a similar problem?"
    elif any(char.isdigit() for char in student_message):
        return f"Good attempt! Let's verify your calculation together: Substitute your value back into the original expression for {topic}. Does the left side equal the right side?"
    else:
        return f"I hear you! When working on {topic}, remember to keep operations balanced on both sides. What is your current thought on the next step?"

