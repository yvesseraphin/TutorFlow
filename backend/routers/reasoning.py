from fastapi import APIRouter, Depends

from backend.services.supabase import admin_client, current_user

router = APIRouter(prefix="/reasoning", tags=["Explainable AI"])

# Extended misconception rule-book
RULES = [
    {
        "misconception": "distributive_property",
        "display_name": "Distributive Property",
        "heuristics": [
            "Multiplier omitted from a term inside parentheses",
            "a(b + c) written as ab + c instead of ab + ac",
        ],
        "intervention_hierarchy": [
            {"attempt": 1, "strategy": "Ask a guided distribution question"},
            {"attempt": 2, "strategy": "Use a visual area model (rectangle method)"},
            {"attempt": 3, "strategy": "Substitute concrete numbers (e.g. a=3, b=2, c=4)"},
        ],
    },
    {
        "misconception": "negative_signs",
        "display_name": "Negative Sign Errors",
        "heuristics": [
            "Incorrect sign after distributing a negative",
            "-(a - b) treated as -a - b instead of -a + b",
        ],
        "intervention_hierarchy": [
            {"attempt": 1, "strategy": "Review double-negative sign rules"},
            {"attempt": 2, "strategy": "Use a number-line walk-through"},
            {"attempt": 3, "strategy": "Colour-code positive/negative terms on whiteboard"},
        ],
    },
    {
        "misconception": "equation_balance",
        "display_name": "Equation Balancing",
        "heuristics": [
            "Operation applied to only one side of an equation",
            "Missing mirrored step when isolating a variable",
        ],
        "intervention_hierarchy": [
            {"attempt": 1, "strategy": "Use a balance-scale explanation"},
            {"attempt": 2, "strategy": "Re-do the step side-by-side with annotations"},
        ],
    },
    {
        "misconception": "incorrect_answer",
        "display_name": "Incorrect Answer",
        "heuristics": [
            "Final answer does not satisfy the original equation",
            "Substitution check fails",
        ],
        "intervention_hierarchy": [
            {"attempt": 1, "strategy": "Ask student to verify by substituting the answer back"},
            {"attempt": 2, "strategy": "Walk through each algebraic step from the beginning"},
        ],
    },
]

_RULE_INDEX: dict[str, dict] = {r["misconception"]: r for r in RULES}


@router.get("/active-insight")
def active_insight(user: dict = Depends(current_user)) -> dict:
    rows = (
        admin_client()
        .table("weaknesses")
        .select("*")
        .eq("user_id", user["id"])
        .eq("resolved", False)
        .order("confidence", desc=True)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        return {
            "current_misconception": None,
            "display_name": "No active misconception",
            "confidence": 0,
            "evidence": ["No persisted incorrect-answer pattern has been detected."],
            "strategy_chosen": "Continue guided practice",
            "strategy_rationale": "There is not enough evidence yet to select a remedial intervention.",
            "suggested_intervention": "Start a lesson and submit answers to build your learning profile.",
        }

    item = rows[0]
    rule = _RULE_INDEX.get(item["kind"]) or RULES[0]
    return {
        "current_misconception": item["kind"],
        "display_name": rule.get("display_name", item["kind"]),
        "confidence": float(item["confidence"]),
        "evidence": [
            f"Detected {item['occurrences']} time(s) while practising '{item['skill']}'.",
        ],
        "strategy_chosen": rule["intervention_hierarchy"][-1]["strategy"],
        "strategy_rationale": (
            "The intervention is chosen from the matched misconception rule "
            "and the current confidence score."
        ),
        "suggested_intervention": rule["intervention_hierarchy"][0]["strategy"],
    }


@router.get("/rules")
def rules(_: dict = Depends(current_user)) -> list[dict]:
    return RULES


@router.get("/history")
def history(user: dict = Depends(current_user)) -> list[dict]:
    """All weaknesses (resolved and active) ordered by most recent."""
    rows = (
        admin_client()
        .table("weaknesses")
        .select("*")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .execute()
        .data
        or []
    )
    return rows
