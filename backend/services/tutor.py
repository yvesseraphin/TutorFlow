import re
from collections.abc import Sequence

from google import genai
from google.genai import types

from backend.config import settings

TUTOR_SYSTEM_PROMPT = """You are TutorFlow, a kind, rigorous one-to-one mathematics teacher.
Teach one step at a time. Do not give away a final answer before the student has a chance to reason.
Use short questions, validate correct reasoning, identify the exact misconception when an answer is wrong,
and adapt to the learner's known weaknesses. For math, show notation clearly in plain text.
Never claim to have seen work that the student did not provide. Keep each response concise and actionable."""


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


def respond(topic: str, learner_context: dict, messages: Sequence[dict], student_message: str, lesson_plan: dict | None = None) -> str:
    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            context = {"topic": topic, "mastery": learner_context.get("mastery", []), "active_weaknesses": learner_context.get("weaknesses", []), "lesson_plan": lesson_plan or {}}
            curriculum_instruction = "Teach toward every stated lesson outcome. First diagnose which outcomes the learner already meets. Do not mark an outcome mastered without evidence from a correct student response. Focus on the first skill below its target and state the next small step when appropriate."
            contents = [
                types.Content(role="model" if item["role"] == "assistant" else "user", parts=[types.Part.from_text(text=item["content"])])
                for item in messages
                if item["role"] in {"assistant", "user"}
            ]
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=student_message)]))
            result = client.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=TUTOR_SYSTEM_PROMPT + "\n" + curriculum_instruction + "\nLearner context: " + str(context),
                    max_output_tokens=700,
                ),
            )
            if result.text:
                return result.text
        except Exception:
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

