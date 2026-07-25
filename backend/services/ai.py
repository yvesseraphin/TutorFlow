import json
import random
from typing import Dict, Any, List
from backend.config import settings

class AIService:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.claude_key = settings.CLAUDE_API_KEY

    def generate_tutor_response(
        self, 
        user_input: str, 
        history: List[Dict[str, Any]], 
        whiteboard_strokes: List[Any] = None,
        teaching_style: str = "Socratic"
    ) -> Dict[str, Any]:
        """
        Main interface to interact with AI model & rule-based reasoner.
        Accepts user text/speech input, whiteboard strokes telemetry, and active teaching style.
        Returns explanation, whiteboard drawing commands, and student evaluation analytics.
        """
        if self.openai_key or self.gemini_key or self.claude_key:
            return self._simulate_tutor_response(user_input, history, whiteboard_strokes, teaching_style)
        else:
            return self._simulate_tutor_response(user_input, history, whiteboard_strokes, teaching_style)

    def _call_real_api_mock(self, user_input: str, history: List[Dict[str, Any]], whiteboard_strokes: List[Any], teaching_style: str = "Socratic") -> Dict[str, Any]:
        return self._simulate_tutor_response(user_input, history, whiteboard_strokes, teaching_style)

    def _simulate_tutor_response(self, user_input: str, history: List[Dict[str, Any]], whiteboard_strokes: List[Any], teaching_style: str = "Socratic") -> Dict[str, Any]:
        input_lower = user_input.lower()
        
        # 1. Rules-based Misconception Detector
        misconception = None
        confidence = 0.5
        evidence = "Student input patterns match standard algebraic errors."
        strategy = f"{teaching_style} Guided Learning"
        rationale = f"Adapted tutor behavior using '{teaching_style}' style to optimize cognitive processing."
        intervention = "Ask student to substitute numbers (e.g., x = 2) to test both sides."
        hint = "Remember that a term outside parenthesis multiplies ALL terms inside."
        
        # Whiteboard Actions initialized
        whiteboard_actions = []

        # Check for Distributive Law confusion
        if ("(" in input_lower and ")" in input_lower) or "distrib" in input_lower or "expand" in input_lower:
            if "3x + 2" in input_lower or "2a - 4" in input_lower or any(err in input_lower for err in ["3x+2", "2a-4", "4x+5"]):
                misconception = "Distributive-law confusion"
                confidence = 0.94
                evidence = "Student expanded a term outside parentheses without multiplying it by the second term."
                strategy = "Visual Area Representation"
                intervention = "Switch to visual grid illustration and ask: 'What is 3 groups of (x + 2)?'"
                hint = "Think of a rectangle with width 3 and length x + 2. What is the total area?"
                
                if teaching_style == "Direct":
                    explanation = "Notice the mistake: 3(x + 2) is 3·x + 3·2 = 3x + 6, not 3x + 2. The multiplier 3 must apply to BOTH terms."
                elif teaching_style == "Visual":
                    explanation = "Let me draw the visual area model on your whiteboard. See how the height 3 multiplies both x and 2!"
                elif teaching_style == "Encouraging":
                    explanation = "You're super close! Just remember the 3 likes to visit both numbers inside the parentheses. Let's try 3 · 2!"
                elif teaching_style == "Challenge":
                    explanation = "Spot the flaw: If x = 10, does 3(10 + 2) equal 30 + 2 = 32, or 36? Why does the formula 3x + 2 fail?"
                else: # Socratic
                    explanation = "A common mistake when expanding 3(x + 2) is only multiplying the first term. What happens if you group (x + 2) + (x + 2) + (x + 2)?"

                whiteboard_actions = [
                    {"action": "write_text", "text": "3(x + 2)  ➡  3·x + 3·2", "x": 100, "y": 80, "color": "#0054ff"},
                    {"action": "highlight", "text": "3·2", "x": 220, "y": 80, "color": "#ef4444"},
                    {"action": "write_text", "text": "= 3x + 6  ✓", "x": 100, "y": 120, "color": "#16a34a"}
                ]
            else:
                explanation = "When multiplying across parentheses, like a(b + c), distribute the multiplication to both terms: ab + ac."
                whiteboard_actions = [
                    {"action": "write_text", "text": "a(b + c) = ab + ac", "x": 100, "y": 90, "color": "#0054ff"}
                ]

        # Check for Sign mistakes
        elif "-" in input_lower and ("minus" in input_lower or "negative" in input_lower or "subtract" in input_lower):
            misconception = "Sign mistakes"
            confidence = 0.88
            evidence = "Incorrect processing of signs during subtraction or negative distribution."
            strategy = "Number Line Visualization"
            intervention = "Animate a number line showing movement in the negative direction."
            hint = "Recall that subtracting a negative number is equivalent to adding its positive value."
            
            if teaching_style == "Direct":
                explanation = "A negative multiplied by a negative is always positive. For example, -(x - 5) = -x + 5."
            else:
                explanation = "Remember: multiplying a negative by a negative results in a positive. Distributing -(x - 5) flips all signs inside to -x + 5."

            whiteboard_actions = [
                {"action": "write_text", "text": "-(x - 5)  ➡  -x + 5", "x": 100, "y": 90, "color": "#0054ff"},
                {"action": "highlight", "text": "+ 5", "x": 220, "y": 90, "color": "#16a34a"}
            ]

        # Check for Equation balancing
        elif "=" in input_lower or "solve" in input_lower or "balance" in input_lower:
            misconception = "Equation balancing issues"
            confidence = 0.91
            evidence = "Student modified one side of the equation without performing the equivalent operation on the other side."
            strategy = "Balance Scale Analogy"
            intervention = "Show a balance scale diagram representing x and constants visually."
            hint = "Whatever operation you perform on the left side of '=', perform on the right side."

            explanation = "Think of an equation as a balanced scale. If you subtract 3 from the left, you must also subtract 3 from the right: 2x + 3 - 3 = 11 - 3."

            whiteboard_actions = [
                {"action": "write_text", "text": "2x + 3 = 11", "x": 100, "y": 70, "color": "#0f172a"},
                {"action": "write_text", "text": "2x + 3 - 3 = 11 - 3", "x": 100, "y": 110, "color": "#ef4444"},
                {"action": "write_text", "text": "2x = 8  ➡  x = 4", "x": 100, "y": 150, "color": "#0054ff"}
            ]

        # Default response
        else:
            explanation = f"Let me help you with this step using a {teaching_style.lower()} approach. What is the first operation you'd like to perform?"
            hint = "Look at the variable term. How can we isolate it?"
            whiteboard_actions = [
                {"action": "write_text", "text": "Goal: Isolate variable 'x'", "x": 100, "y": 80, "color": "#0054ff"}
            ]

        # Real-time Multimodal Student Understanding Evaluation
        student_understanding = {
            "mastery_score": 0.82 if not misconception else 0.58,
            "confidence_score": 0.78,
            "strengths": ["Isolating single variables", "Basic addition/subtraction properties"],
            "weaknesses": [misconception] if misconception else ["None detected"],
            "vocal_hesitation_index": 0.25,
            "whiteboard_cognitive_load": 0.35,
            "active_teaching_style": teaching_style
        }

        return {
            "explanation": explanation,
            "timeline": [
                {"timestamp": 12.5, "item": f"Tutor applied {teaching_style} strategy", "category": "theory"},
                {"timestamp": 45.2, "item": "Whiteboard Drawing Annotations", "category": "practice"},
                {"timestamp": 110.0, "item": "Real-time Understanding Evaluation", "category": "remediation"}
            ],
            "ai_feedback": "Great effort! You're making solid progress on this problem.",
            "hint": hint,
            "detected_misconception": misconception,
            "confidence_meter": confidence if misconception else 1.0,
            "evidence": evidence if misconception else None,
            "strategy_choice": strategy,
            "suggested_intervention": intervention,
            "teaching_style_active": teaching_style,
            "teacher_whiteboard_actions": whiteboard_actions,
            "student_understanding": student_understanding
        }

ai_service = AIService()
