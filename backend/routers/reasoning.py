from fastapi import APIRouter, Depends

from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/reasoning", tags=["Explainable AI"])

RULES = [
    {"misconception": "distributive_property", "heuristics": ["Multiplier omitted from a term inside parentheses"], "intervention_hierarchy": [{"attempt": 1, "strategy": "Ask a guided distribution question"}, {"attempt": 2, "strategy": "Use a visual area model"}]},
    {"misconception": "negative_signs", "heuristics": ["Incorrect sign after distributing a negative"], "intervention_hierarchy": [{"attempt": 1, "strategy": "Review sign rules"}, {"attempt": 2, "strategy": "Use a number-line example"}]},
    {"misconception": "equation_balance", "heuristics": ["Operation appears on only one side of an equation"], "intervention_hierarchy": [{"attempt": 1, "strategy": "Use a balance-scale explanation"}]},
]


@router.get("/active-insight")
def active_insight(user: dict = Depends(current_user)) -> dict:
    rows = admin_client().table("weaknesses").select("*").eq("user_id", user["id"]).eq("resolved", False).order("confidence", desc=True).limit(1).execute().data or []
    if not rows:
        return {"current_misconception": "No active misconception", "confidence": 0, "evidence": ["No persisted incorrect-answer pattern has been detected."], "strategy_chosen": "Continue guided practice", "strategy_rationale": "There is not enough evidence to select a remedial intervention.", "suggested_intervention": "Start a lesson and submit answers to build a learning profile."}
    item = rows[0]
    rule = next((rule for rule in RULES if rule["misconception"] == item["kind"]), RULES[0])
    return {"current_misconception": item["kind"], "confidence": float(item["confidence"]), "evidence": [f"Detected {item['occurrences']} time(s) while practising {item['skill']}."], "strategy_chosen": rule["intervention_hierarchy"][-1]["strategy"], "strategy_rationale": "The intervention is selected from the matched misconception rule and current confidence.", "suggested_intervention": rule["intervention_hierarchy"][0]["strategy"]}


@router.get("/rules")
def rules(_: dict = Depends(current_user)) -> list[dict]:
    return RULES
