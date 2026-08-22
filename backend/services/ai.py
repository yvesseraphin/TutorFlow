from typing import Any, Dict, List

from backend.config import settings


class AIService:
    def generate_tutor_response(
        self,
        user_input: str,
        history: List[Dict[str, Any]],
        whiteboard_strokes: List[Any] | None = None,
        teaching_style: str = "Socratic",
    ) -> Dict[str, Any]:
        return self._rule_based_response(user_input, history, whiteboard_strokes, teaching_style)

    def _rule_based_response(
        self,
        user_input: str,
        history: List[Dict[str, Any]],
        whiteboard_strokes: List[Any] | None,
        teaching_style: str,
    ) -> Dict[str, Any]:
        lower = user_input.lower()

        misconception: str | None = None
        confidence = 0.5
        evidence = "Student input patterns match standard algebraic errors."
        strategy = f"{teaching_style} Guided Learning"
        rationale = f"Adapted tutor behaviour using '{teaching_style}' style."
        intervention = "Ask student to substitute numbers (e.g. x = 2) to test both sides."
        hint = "Remember that a term outside parentheses multiplies ALL terms inside."
        whiteboard_actions: list[dict] = []

        if ("(" in lower and ")" in lower) or "distrib" in lower or "expand" in lower:
            misconception = "Distributive-law confusion"
            confidence = 0.94
            evidence = "Student expanded without multiplying the external factor to every term."
            strategy = "Visual Area Representation"
            intervention = "Switch to visual grid and ask: 'What is 3 groups of (x + 2)?'"
            hint = "Think of a rectangle with width 3 and length x + 2. What is the total area?"
            if teaching_style == "Direct":
                explanation = "3(x + 2) = 3·x + 3·2 = 3x + 6, NOT 3x + 2. The multiplier applies to BOTH terms."
            elif teaching_style == "Visual":
                explanation = "Let me draw the area model. Height 3 multiplies both x and 2!"
            elif teaching_style == "Encouraging":
                explanation = "You're close! The 3 visits both numbers inside the parentheses. Let's try 3 · 2!"
            elif teaching_style == "Challenge":
                explanation = "If x = 10, does 3(10 + 2) equal 32 or 36? Why does 3x + 2 fail?"
            else:
                explanation = "What happens if you expand (x + 2) + (x + 2) + (x + 2)?"
            whiteboard_actions = [
                {"action": "write_text", "text": "3(x + 2)  ➡  3·x + 3·2", "x": 100, "y": 80, "color": "#0054ff"},
                {"action": "highlight", "text": "3·2", "x": 220, "y": 80, "color": "#ef4444"},
                {"action": "write_text", "text": "= 3x + 6  ✓", "x": 100, "y": 120, "color": "#16a34a"},
            ]
        elif "-" in lower and ("minus" in lower or "negative" in lower or "subtract" in lower):
            misconception = "Sign mistakes"
            confidence = 0.88
            evidence = "Incorrect sign processing during subtraction or negative distribution."
            strategy = "Number Line Visualization"
            intervention = "Animate a number line moving in the negative direction."
            hint = "Subtracting a negative is the same as adding the positive value."
            explanation = "Remember: -(x - 5) = -x + 5. Distributing a negative flips every sign inside."
            whiteboard_actions = [
                {"action": "write_text", "text": "-(x - 5)  ➡  -x + 5", "x": 100, "y": 90, "color": "#0054ff"},
                {"action": "highlight", "text": "+ 5", "x": 220, "y": 90, "color": "#16a34a"},
            ]
        elif "=" in lower or "solve" in lower or "balance" in lower:
            misconception = "Equation balancing issues"
            confidence = 0.91
            evidence = "Student applied an operation to one side without mirroring it."
            strategy = "Balance Scale Analogy"
            intervention = "Show a balance-scale diagram for x and constants."
            hint = "Whatever you do to the left side of '=' you must do to the right."
            explanation = "Think of a balance: 2x + 3 - 3 = 11 - 3, so 2x = 8, x = 4."
            whiteboard_actions = [
                {"action": "write_text", "text": "2x + 3 = 11", "x": 100, "y": 70, "color": "#0f172a"},
                {"action": "write_text", "text": "2x + 3 - 3 = 11 - 3", "x": 100, "y": 110, "color": "#ef4444"},
                {"action": "write_text", "text": "2x = 8  ➡  x = 4", "x": 100, "y": 150, "color": "#0054ff"},
            ]
        else:
            explanation = f"Let me help using a {teaching_style.lower()} approach. What operation would you like to perform first?"
            hint = "Look at the variable term. How can we isolate it?"
            whiteboard_actions = [
                {"action": "write_text", "text": "Goal: Isolate variable 'x'", "x": 100, "y": 80, "color": "#0054ff"}
            ]

        student_understanding = {
            "mastery_score": 0.82 if not misconception else 0.58,
            "confidence_score": 0.78,
            "strengths": ["Isolating single variables", "Basic addition/subtraction"],
            "weaknesses": [misconception] if misconception else [],
            "vocal_hesitation_index": 0.25,
            "whiteboard_cognitive_load": 0.35,
            "active_teaching_style": teaching_style,
        }

        return {
            "explanation": explanation,
            "timeline": [
                {"timestamp": 12.5, "item": f"Applied {teaching_style} strategy", "category": "theory"},
                {"timestamp": 45.2, "item": "Whiteboard annotations", "category": "practice"},
                {"timestamp": 110.0, "item": "Real-time evaluation", "category": "remediation"},
            ],
            "ai_feedback": "Good effort! Keep going.",
            "hint": hint,
            "detected_misconception": misconception,
            "confidence_meter": confidence if misconception else 1.0,
            "evidence": evidence if misconception else None,
            "strategy_choice": strategy,
            "suggested_intervention": intervention,
            "teaching_style_active": teaching_style,
            "teacher_whiteboard_actions": whiteboard_actions,
            "student_understanding": student_understanding,
        }


ai_service = AIService()

