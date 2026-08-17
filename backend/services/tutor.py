import re
from collections.abc import Sequence

from openai import OpenAI

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


def respond(topic: str, learner_context: dict, messages: Sequence[dict], student_message: str) -> str:
    settings.require_openai()
    client = OpenAI(api_key=settings.openai_api_key)
    context = {"topic": topic, "mastery": learner_context.get("mastery", []), "active_weaknesses": learner_context.get("weaknesses", [])}
    input_items = [{"role": "system", "content": TUTOR_SYSTEM_PROMPT + "\nLearner context: " + str(context)}]
    input_items.extend({"role": item["role"], "content": item["content"]} for item in messages)
    input_items.append({"role": "user", "content": student_message})
    result = client.responses.create(model=settings.openai_chat_model, input=input_items)
    return result.output_text
