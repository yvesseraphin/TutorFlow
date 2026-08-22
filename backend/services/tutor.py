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
    settings.require_gemini()
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
    if not result.text:
        raise RuntimeError("Gemini returned an empty response. Please try again.")
    return result.text
