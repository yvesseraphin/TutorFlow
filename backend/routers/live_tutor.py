import asyncio
import base64
from datetime import datetime, timezone
import json
import logging
from typing import Any, Optional
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types

from backend.config import settings
from backend.services.ai_learner import (
    find_topic_node,
    get_student_learner_context,
    log_student_mistake,
    record_mastery_attempt,
    save_learner_memory,
)
from backend.services.supabase import admin_client

import google.genai.live


def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except Exception:
        return False

# Ensure Google GenAI Live WebSocket connection never times out on keepalive pings
if hasattr(google.genai.live, "ws_connect"):
    _orig_ws_connect = google.genai.live.ws_connect

    def _patched_live_ws_connect(*args, **kwargs):
        kwargs["ping_interval"] = None
        kwargs["ping_timeout"] = None
        kwargs["close_timeout"] = 10
        return _orig_ws_connect(*args, **kwargs)

    google.genai.live.ws_connect = _patched_live_ws_connect

logger = logging.getLogger("tutorflow.live_tutor")
logger.setLevel(logging.INFO)
router = APIRouter(tags=["live-tutor"])


def get_live_tools():
    return [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="clear_ai_writing",
                    description="Clear previous AI handwriting from the whiteboard to start a clean new step or worked example.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "reason": types.Schema(type=types.Type.STRING, description="Why the board is being cleared (e.g. 'Starting practice problem')")
                        },
                    ),
                ),
                types.FunctionDeclaration(
                    name="clear_student_whiteboard",
                    description="Clear student handwritten drawings from the whiteboard to prevent overlap or prepare a fresh workspace.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "reason": types.Schema(type=types.Type.STRING, description="Why student work is being cleared (e.g. 'Starting clean worked example')")
                        },
                    ),
                ),
                types.FunctionDeclaration(
                    name="write_math_equation",
                    description="Write a formatted LaTeX mathematical equation or step onto the whiteboard in natural teacher handwriting style.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "latex": types.Schema(type=types.Type.STRING, description="The clean equation or mathematical step, e.g. '2x + 4 = 10' or 'x = 3'"),
                            "step_number": types.Schema(type=types.Type.INTEGER, description="Step sequence number (1, 2, 3, 4...) for clean top-to-bottom layout"),
                            "arrow_label": types.Schema(type=types.Type.STRING, description="Instructional transformation arrow from previous step, e.g. '- 4 from both sides', '÷ 2'"),
                            "is_final_solution": types.Schema(type=types.Type.BOOLEAN, description="Set true if this is the final solved answer to box/circle it"),
                            "x": types.Schema(type=types.Type.NUMBER, description="Optional X coordinate percentage (e.g. 8 for left alignment)"),
                            "y": types.Schema(type=types.Type.NUMBER, description="Optional Y coordinate percentage (0-100)"),
                            "color": types.Schema(type=types.Type.STRING, description="Marker color: 'blue', 'green', 'red', 'purple', 'black', 'orange'"),
                            "explanation": types.Schema(type=types.Type.STRING, description="Brief note explaining this step"),
                        },
                        required=["latex"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="draw_arrow_annotation",
                    description="Draw an instructional whiteboard arrow pointing from one step to the next with an operation note (e.g. 'subtract 5 from both sides').",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "from_step": types.Schema(type=types.Type.INTEGER, description="Starting step number (e.g. 1)"),
                            "to_step": types.Schema(type=types.Type.INTEGER, description="Target step number (e.g. 2)"),
                            "action_text": types.Schema(type=types.Type.STRING, description="Transformation action note (e.g. '− 5 from both sides', '÷ 2')"),
                            "color": types.Schema(type=types.Type.STRING, description="Marker color: 'blue', 'green', 'red', 'purple', 'black', 'orange'"),
                        },
                        required=["action_text"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="highlight_board",
                    description="Highlight, box, or circle a specific coordinate on the whiteboard to emphasize a step, variable, or error.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "x": types.Schema(type=types.Type.NUMBER, description="X percentage (0-100)"),
                            "y": types.Schema(type=types.Type.NUMBER, description="Y percentage (0-100)"),
                            "width": types.Schema(type=types.Type.NUMBER, description="Width percentage (1-100)"),
                            "height": types.Schema(type=types.Type.NUMBER, description="Height percentage (1-100)"),
                            "label": types.Schema(type=types.Type.STRING, description="Brief explanation note"),
                        },
                        required=["x", "y"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="display_interactive_balance_scale",
                    description="Display an interactive visual balance scale comparing left and right expressions on the whiteboard.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "left_expression": types.Schema(type=types.Type.STRING, description="Expression on left side, e.g. '2x + 4'"),
                            "right_expression": types.Schema(type=types.Type.STRING, description="Expression on right side, e.g. '10'"),
                            "operation_applied": types.Schema(type=types.Type.STRING, description="e.g. '-4 from both sides'"),
                            "is_balanced": types.Schema(type=types.Type.BOOLEAN, description="Whether both sides are balanced"),
                        },
                        required=["left_expression", "right_expression"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="animate_step_transformation",
                    description="Show an animated step transformation with sign flip tracking on the whiteboard.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "from_latex": types.Schema(type=types.Type.STRING, description="Previous equation state"),
                            "to_latex": types.Schema(type=types.Type.STRING, description="New equation state after operation"),
                            "operation_label": types.Schema(type=types.Type.STRING, description="The mathematical inverse operation applied"),
                            "highlight_sign": types.Schema(type=types.Type.STRING, description="Any sign flip to draw attention to"),
                        },
                        required=["from_latex", "to_latex", "operation_label"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="trigger_ai_peer_challenge",
                    description="Multi-Agent Protégé Effect: Simulate a virtual AI peer student ('Alex') making a common misconception, and invite the human student to correct them.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "peer_name": types.Schema(type=types.Type.STRING, description="Name of peer student, e.g. 'Alex'"),
                            "problem": types.Schema(type=types.Type.STRING, description="The math problem being attempted"),
                            "peer_flawed_step": types.Schema(type=types.Type.STRING, description="Flawed reasoning step taken by the peer"),
                            "misconception_targeted": types.Schema(type=types.Type.STRING, description="Target misconception (e.g. 'Adding instead of subtracting')"),
                            "prompt_to_student": types.Schema(type=types.Type.STRING, description="Prompt inviting student to explain what Alex did wrong"),
                        },
                        required=["peer_name", "problem", "peer_flawed_step", "prompt_to_student"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="adapt_cognitive_load",
                    description="Adapt the cognitive intensity and pace of teaching based on student energy or fatigue signals.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "energy_mode": types.Schema(
                                type=types.Type.STRING,
                                description="'high_energy_socratic', 'normal_guided', 'fatigued_visual_microsteps'"
                            ),
                            "reason": types.Schema(type=types.Type.STRING, description="Observed signal"),
                        },
                        required=["energy_mode", "reason"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="switch_teaching_strategy",
                    description="Dynamically switch the active AI teaching strategy in real time based on student understanding.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "strategy": types.Schema(
                                type=types.Type.STRING,
                                description="Strategy: 'Visual Intuition', 'Concrete Analogy', 'Step-by-Step Decomposition', 'Socratic Guided Discovery', 'Protégé Peer Teaching', 'Teach-Back Verification', 'Transfer Practice'"
                            ),
                            "reason": types.Schema(type=types.Type.STRING, description="Why this strategy is selected"),
                            "target_concept": types.Schema(type=types.Type.STRING, description="The concept being targeted"),
                        },
                        required=["strategy", "reason"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="report_misconception",
                    description="Diagnose and report the exact conceptual misconception or reasoning break when a student makes an error.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "misconception_type": types.Schema(type=types.Type.STRING, description="Type of misconception (e.g. 'Sign Reversal on Transposition', 'Combining Unlike Terms', 'Distributive Property Negation')"),
                            "explanation": types.Schema(type=types.Type.STRING, description="Clear, student-friendly explanation of why the mistake happened"),
                            "root_cause": types.Schema(type=types.Type.STRING, description="The underlying missing intuition or prerequisite"),
                            "intervention_strategy": types.Schema(type=types.Type.STRING, description="Strategy to correct it (e.g. 'Balance Scale Model', 'Number Line Visualization')"),
                        },
                        required=["misconception_type", "explanation"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="trigger_teach_back",
                    description="Prompt the student to explain the concept in their own words or solve a transfer problem to verify genuine understanding.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "prompt": types.Schema(type=types.Type.STRING, description="The teach-back question or transfer challenge"),
                            "concept": types.Schema(type=types.Type.STRING, description="Concept being tested"),
                        },
                        required=["prompt"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="show_socratic_hint",
                    description="Display a subtle guided hint badge on the student's screen when they are stuck.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "hint_text": types.Schema(type=types.Type.STRING, description="The progressive guiding hint prompt"),
                        },
                        required=["hint_text"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="update_lesson_step",
                    description="Advance the lesson progress indicator to a specific step index.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "step_title": types.Schema(type=types.Type.STRING, description="Title of current step"),
                            "step_index": types.Schema(type=types.Type.INTEGER, description="Current step index (1, 2, 3...)"),
                        },
                        required=["step_title", "step_index"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="record_understanding_state",
                    description="Record a change in the student's estimated understanding state and update their learner model mastery.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "state": types.Schema(
                                type=types.Type.STRING,
                                description="State: 'Mastered', 'Understands', 'Partially understands', 'Needs reinforcement', 'Misconception detected', 'Prerequisite gap detected', 'Uncertain'"
                            ),
                            "concept": types.Schema(type=types.Type.STRING, description="Concept assessed"),
                            "confidence_delta": types.Schema(type=types.Type.NUMBER, description="Mastery delta"),
                        },
                        required=["state", "concept"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="save_teacher_reflection",
                    description="Log an AI teacher reflection evaluating strategy effectiveness, student response, and future teaching preferences.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "effective_strategy": types.Schema(type=types.Type.STRING, description="The teaching strategy that produced breakthrough"),
                            "student_response": types.Schema(type=types.Type.STRING, description="How the student responded"),
                            "future_preference_notes": types.Schema(type=types.Type.STRING, description="Recommendation for future lessons"),
                        },
                        required=["effective_strategy", "student_response"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="generate_transfer_challenge",
                    description="Present a transfer challenge problem testing the same concept in a new variation.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "problem_latex": types.Schema(type=types.Type.STRING, description="The problem LaTeX string"),
                            "concept": types.Schema(type=types.Type.STRING, description="Concept being transferred"),
                            "guidance": types.Schema(type=types.Type.STRING, description="Instructions to the student"),
                        },
                        required=["problem_latex", "concept"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="draw_number_line",
                    description="Draw a clean visual number line on the whiteboard with custom range and highlighted numbers.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "min_val": types.Schema(type=types.Type.INTEGER, description="Minimum integer on number line (e.g. -5)"),
                            "max_val": types.Schema(type=types.Type.INTEGER, description="Maximum integer on number line (e.g. 5)"),
                            "highlight_points": types.Schema(type=types.Type.STRING, description="Comma-separated points to circle, e.g. '-3, 2'"),
                            "label": types.Schema(type=types.Type.STRING, description="Label note under the number line"),
                        },
                    ),
                ),
                types.FunctionDeclaration(
                    name="conclude_lesson",
                    description="Conclude today's lesson after completing practice and achieving mastery. Celebrates achievement and invites the student to end or ask final questions.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "mastery_summary": types.Schema(type=types.Type.STRING, description="Summary of what was mastered"),
                            "celebration_message": types.Schema(type=types.Type.STRING, description="Encouraging conclusion statement"),
                        },
                        required=["mastery_summary"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="draw_geometric_shape",
                    description="Draw a geometric figure or graph model on the whiteboard (right_triangle, triangle, rectangle, circle, coordinate_grid).",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "shape_type": types.Schema(type=types.Type.STRING, description="'right_triangle', 'triangle', 'rectangle', 'circle', 'coordinate_grid'"),
                            "label": types.Schema(type=types.Type.STRING, description="Annotation note for the shape"),
                            "color": types.Schema(type=types.Type.STRING, description="Color of the shape: 'blue', 'green', 'red', 'purple', 'black'"),
                        },
                        required=["shape_type"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="clear_ai_writing",
                    description="Clear previous AI handwriting notes and equations from the whiteboard to avoid clutter before starting a new step or problem.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={},
                    ),
                ),
                types.FunctionDeclaration(
                    name="clear_board_annotations",
                    description="Clear temporary AI annotations, arrows, or highlights from the whiteboard.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={},
                    ),
                ),
            ]
        )
    ]


def get_topic_pedagogical_hook(topic_name: str) -> dict:
    """Returns a captivating real-world story hook, concept formula, and worked example for any topic."""
    t_lower = (topic_name or "").lower()
    
    if "variable" in t_lower or "expression" in t_lower:
        return {
            "hook": "Think of a variable as a mystery box holding a number that can change. Like if custom sneakers cost $50 base plus $5 for each patch, our algebraic formula is 50 + 5x.",
            "concept_eq": "50 + 5x \\quad (\\text{where } x = \\text{patches})",
            "worked_example_intro": "Let's see what happens if someone orders 3 patches. Watch my pen on the board as we evaluate 50 + 5x for x = 3!",
            "worked_eq_1": "50 + 5x \\quad \\text{for } x = 3",
            "worked_eq_2": "= 50 + 5(3)",
            "worked_eq_3": "= 50 + 15 = 65",
            "practice_prompt": "Now your turn: If someone buys 4 patches instead (x = 4), what would 50 + 5x evaluate to?"
        }
    elif "combining" in t_lower or "like term" in t_lower:
        return {
            "hook": "If you buy 3 apples, 2 bananas, and 4 more apples at a market, you combine matching fruits into 7 apples and 2 bananas. Variables with matching letters work the exact same way!",
            "concept_eq": "3x + 2y + 4x = 7x + 2y",
            "worked_example_intro": "Watch how we group and combine matching terms in 4x + 7 + 2x - 3 on the board.",
            "worked_eq_1": "4x + 7 + 2x - 3",
            "worked_eq_2": "= (4x + 2x) + (7 - 3)",
            "worked_eq_3": "= 6x + 4",
            "practice_prompt": "Try this one: What does 5x + 3 + 2x simplify to?"
        }
    elif "linear equation" in t_lower or "one-step" in t_lower or "multi-step" in t_lower:
        return {
            "hook": "An algebraic equation is like a balanced playground scale. Whatever inverse tool we use on the left side, we must use on the right to keep it in perfect balance!",
            "concept_eq": "2x + 5 = 15",
            "worked_example_intro": "Watch how we isolate x in 2x + 5 = 15 using inverse operations.",
            "worked_eq_1": "2x + 5 = 15",
            "worked_eq_2": "2x = 10",
            "worked_eq_3": "x = 5",
            "practice_prompt": "Your turn: If 3x + 2 = 14, what is our first inverse step to isolate 3x?"
        }
    elif "angle" in t_lower:
        return {
            "hook": "Whenever two straight roads or lines cross in an 'X', the angles directly opposite each other are exact twins called vertical angles!",
            "concept_eq": "\\angle 1 = \\angle 2 \\quad (\\text{vertical angles})",
            "worked_example_intro": "Let's find the missing angle variable when two vertical angles are 2x + 10° and 70°.",
            "worked_eq_1": "2x + 10^\\circ = 70^\\circ",
            "worked_eq_2": "2x = 60^\\circ",
            "worked_eq_3": "x = 30^\\circ",
            "practice_prompt": "What if the vertical angle was 80° instead? How would you set up 2x + 10° = 80°?"
        }
    elif "pythagor" in t_lower or "triangle" in t_lower:
        return {
            "hook": "If you want to walk from home plate to second base across a baseball diamond, cutting diagonally across the grass is always a shortcut. Pythagoras discovered the exact formula: a² + b² = c²!",
            "concept_eq": "a^2 + b^2 = c^2",
            "worked_example_intro": "Watch how we find the diagonal hypotenuse c when legs are a = 3 and b = 4.",
            "worked_eq_1": "3^2 + 4^2 = c^2",
            "worked_eq_2": "9 + 16 = 25 = c^2",
            "worked_eq_3": "c = \\sqrt{25} = 5",
            "practice_prompt": "What if the legs were a = 6 and b = 8? What is 6² + 8²?"
        }
    elif "function" in t_lower or "relation" in t_lower:
        return {
            "hook": "Think of a function like a smart vending machine: every time you press button A1 (input x), you are 100% guaranteed to get one specific snack (output y).",
            "concept_eq": "f(x) = 2x + 1",
            "worked_example_intro": "Let's calculate the output f(3) when we feed 3 into f(x) = 2x + 1.",
            "worked_eq_1": "f(x) = 2x + 1",
            "worked_eq_2": "f(3) = 2(3) + 1 = 6 + 1",
            "worked_eq_3": "= 7",
            "practice_prompt": "If we input x = 4 instead, what does f(4) equal?"
        }
    elif "slope" in t_lower or "graph" in t_lower:
        return {
            "hook": "Slope is simply how steep a ramp or mountain is: how many steps you rise UP divided by how many steps you run FORWARD (rise over run).",
            "concept_eq": "m = \\frac{\\text{rise}}{\\text{run}} = \\frac{y_2 - y_1}{x_2 - x_1}",
            "worked_example_intro": "Let's calculate the slope between point (1, 2) and point (3, 8) on the coordinate plane.",
            "worked_eq_1": "m = \\frac{8 - 2}{3 - 1}",
            "worked_eq_2": "m = \\frac{6}{2}",
            "worked_eq_3": "m = 3",
            "practice_prompt": "If a line rises 10 units over a run of 2 units, what is its slope?"
        }
    elif "mean" in t_lower or "median" in t_lower or "statistic" in t_lower or "center" in t_lower:
        return {
            "hook": "If 4 friends have $5 each and a billionaire walks in, the 'mean' average gets distorted into billions, but the 'median' tells you the true middle story!",
            "concept_eq": "\\text{Mean} = \\frac{\\text{Sum of numbers}}{\\text{Count of numbers}}",
            "worked_example_intro": "Watch how we find the true mean of three scores: 4, 8, and 12.",
            "worked_eq_1": "\\text{Mean} = \\frac{4 + 8 + 12}{3}",
            "worked_eq_2": "= \\frac{24}{3}",
            "worked_eq_3": "= 8",
            "practice_prompt": "What is the mean of 10, 20, and 30?"
        }
    elif "probability" in t_lower:
        return {
            "hook": "When you roll a 6-sided die in a board game, probability is the math of your winning outcomes divided by all possible outcomes.",
            "concept_eq": "P(\\text{event}) = \\frac{\\text{favorable}}{\\text{total}}",
            "worked_example_intro": "Let's find the probability of rolling an even number {2, 4, 6} on a standard 6-sided die.",
            "worked_eq_1": "P(\\text{even}) = \\frac{3}{6}",
            "worked_eq_2": "= \\frac{1}{2}",
            "worked_eq_3": "= 50\\%",
            "practice_prompt": "What is the probability of rolling a number greater than 4 on a 6-sided die?"
        }
    elif "pemdas" in t_lower or "order of operation" in t_lower or "operation" in t_lower:
        return {
            "hook": "Why do we even have an order of operations? If you have 10 - 2 × 3, someone might subtract first and get 24, while someone else multiplies first and gets 4! To stop math from falling into chaos, mathematicians agreed on a universal traffic law: PEMDAS. Parentheses first, then Exponents, then Multiplication & Division left-to-right, and finally Addition & Subtraction.",
            "concept_eq": "\\text{P} \\to \\text{E} \\to \\text{M / D} \\to \\text{A / S}",
            "worked_example_intro": "Let's walk through an expression step-by-step: 10 - 2 × 3. Notice why multiplication must be done before subtraction!",
            "worked_eq_1": "10 - 2 \\times 3",
            "worked_eq_2": "= 10 - 6",
            "worked_eq_3": "= 4",
            "practice_prompt": "What if we had parentheses: (10 - 2) × 3? Which part would we have to calculate first now?"
        }
    elif "fraction" in t_lower or "ratio" in t_lower:
        return {
            "hook": "Fractions are just sharing pizza fairly! The bottom number (denominator) tells you how many equal slices the whole pizza was cut into, and the top number (numerator) tells you how many slices you actually have on your plate.",
            "concept_eq": "\\frac{\\text{Numerator (Parts)}}{\\text{Denominator (Total)}}",
            "worked_example_intro": "Watch how we combine matching slices when adding 1/4 + 2/4.",
            "worked_eq_1": "\\frac{1}{4} + \\frac{2}{4}",
            "worked_eq_2": "= \\frac{1 + 2}{4}",
            "worked_eq_3": "= \\frac{3}{4}",
            "practice_prompt": "If you have 2/5 + 1/5, what does that combine to?"
        }
    elif "exponent" in t_lower or "power" in t_lower:
        return {
            "hook": "Multiplication is repeated addition (3 × 4 is 3 added 4 times). Exponents are repeated multiplication! 2³ isn't 2 × 3; it means multiplying 2 by itself 3 times: 2 × 2 × 2 = 8.",
            "concept_eq": "b^n = \\underbrace{b \\times b \\times \\dots \\times b}_{n \\text{ times}}",
            "worked_example_intro": "Let's evaluate 3³ step by step.",
            "worked_eq_1": "3^3 = 3 \\times 3 \\times 3",
            "worked_eq_2": "= 9 \\times 3",
            "worked_eq_3": "= 27",
            "practice_prompt": "What does 4² evaluate to?"
        }
    elif "inequalit" in t_lower:
        return {
            "hook": "Think of an inequality like a speed limit sign: your speed doesn't have to be exact, it just has to stay within a boundary! An inequality describes a whole range of possibilities.",
            "concept_eq": "x < 5 \\quad (\\text{all values strictly less than 5})",
            "worked_example_intro": "Watch how we solve and graph 2x + 1 > 7.",
            "worked_eq_1": "2x + 1 > 7",
            "worked_eq_2": "2x > 6",
            "worked_eq_3": "x > 3",
            "practice_prompt": "If x > 3, is the number 4 a valid solution?"
        }
    elif "factor" in t_lower or "quadratic" in t_lower:
        return {
            "hook": "Factoring a quadratic is like detective work: we have an area or total expression, and we want to find the two mystery puzzle pieces that multiplied together to create it!",
            "concept_eq": "x^2 + bx + c = (x + p)(x + q)",
            "worked_example_intro": "Let's factor x² + 5x + 6 by finding two numbers that multiply to 6 and add to 5.",
            "worked_eq_1": "x^2 + 5x + 6",
            "worked_eq_2": "p \\times q = 6, \\quad p + q = 5 \\implies 2 \\text{ and } 3",
            "worked_eq_3": "= (x + 2)(x + 3)",
            "practice_prompt": "What two numbers multiply to 10 and add to 7?"
        }
    else:
        return {
            "hook": f"Every big breakthrough in {topic_name} comes from one simple intuitive rule that makes complex problems easy to unlock.",
            "concept_eq": f"\\text{{{topic_name}}}",
            "worked_example_intro": f"Watch the whiteboard as I model a clear step-by-step example for {topic_name}.",
            "worked_eq_1": f"\\text{{Step 1: Understand the setup}}",
            "worked_eq_2": f"\\text{{Step 2: Apply the core rule}}",
            "worked_eq_3": f"\\text{{Step 3: Solution verified}}",
            "practice_prompt": f"Let's try a guided example on {topic_name} together!"
        }


@router.websocket("/live-tutor")
async def live_tutor_websocket(websocket: WebSocket, token: Optional[str] = None):
    await websocket.accept()
    logger.info("[LIVE WS] Student connected to Live Tutor WebSocket")

    if not settings.gemini_api_key:
        logger.error("[LIVE WS] Gemini API key is missing from backend configuration.")
        await websocket.send_json({
            "type": "error",
            "message": "Gemini API key is not configured on the backend.",
        })
        await websocket.close()
        return

    # Parse initial handshake
    try:
        init_raw = await websocket.receive_text()
        init_data = json.loads(init_raw)
        topic = init_data.get("topic", "Algebra")
        user_id = init_data.get("user_id", "")
        cognitive_mode = init_data.get("cognitive_mode", "normal")
        class_id = init_data.get("class_id", "")
        document_id = init_data.get("document_id", "")
    except Exception as e:
        logger.warning(f"[LIVE WS] Failed parsing handshake: {e}")
        topic = "Algebra"
        user_id = ""
        cognitive_mode = "normal"
        class_id = ""
        document_id = ""

    # Load student's AI profile & canonical topic node
    learner_context = get_student_learner_context(user_id=user_id, topic=topic, cognitive_mode=cognitive_mode) if user_id else {}
    profile = learner_context.get("profile", {})
    missing_prereqs = learner_context.get("missing_prerequisites", [])
    past_mistakes = learner_context.get("unresolved_mistakes", [])
    effective_strategies = learner_context.get("effective_strategies", [])
    student_full_name = profile.get("name") or "there"
    first_name = student_full_name.split()[0] if student_full_name and student_full_name != "Student" else ""
    greeting_target = first_name if first_name else "there"
    
    topic_node = find_topic_node(topic)
    canonical_topic = topic_node["name"] if topic_node else (learner_context.get("topic") or topic)
    topic_category = topic_node.get("category", "General") if topic_node else "General"
    topic_subject = topic_node.get("subject", "Mathematics") if topic_node else "Mathematics"

    # Resolve dedicated pedagogical hook & worked example for this topic
    hook_data = get_topic_pedagogical_hook(canonical_topic)

    # RAG Retrieval from student's uploaded document or class
    rag_context = ""
    try:
        from backend.services.rag_service import build_rag_prompt_context, get_custom_class_by_id
        target_doc_id = document_id
        if class_id and not target_doc_id:
            c_info = get_custom_class_by_id(class_id, user_id)
            if c_info:
                target_doc_id = c_info.get("document_id")

        if target_doc_id:
            rag_context = build_rag_prompt_context(
                query=f"{canonical_topic} {topic}",
                user_id=user_id,
                document_id=target_doc_id,
                top_k=4,
            )
            if rag_context:
                logger.info(f"[LIVE WS RAG] Injected {len(rag_context)} chars of study material context into tutor prompt")
    except Exception as rag_err:
        logger.warning(f"[LIVE WS RAG] Retrieval error: {rag_err}")

    current_session_id = str(uuid.uuid4())
    session_start_time = datetime.now(timezone.utc)
    if user_id and is_valid_uuid(user_id):
        try:
            admin_client().table("tutoring_sessions").insert({
                "id": current_session_id,
                "user_id": user_id,
                "topic": canonical_topic,
                "subject": topic_category if topic_category != "General" else topic_subject,
                "status": "active",
                "teaching_strategy": cognitive_mode or "Visual Intuition",
                "class_id": class_id if is_valid_uuid(class_id) else None,
                "document_id": target_doc_id if is_valid_uuid(target_doc_id) else None,
                "created_at": session_start_time.isoformat(),
            }).execute()
            logger.info(f"[LIVE WS DB] Created live tutoring session {current_session_id} for topic '{canonical_topic}' ({topic_category})")
        except Exception as sess_err:
            logger.warning(f"[LIVE WS DB] Could not create session row: {sess_err}")

    live_model_name = settings.gemini_live_model or "gemini-2.5-flash-native-audio-latest"

    system_instruction_text = f"""You are TutorFlow AI, an enthusiastic, charismatic, world-class 1-on-1 private teacher (in the style of 3Blue1Brown and Sal Khan).
Active Lesson Subject: {topic_subject}.
Active Lesson Category: {topic_category}.
Active Lesson Topic: {canonical_topic}.
Student Name: {greeting_target}.
Grade Level: {profile.get('grade', '9th Grade')}.
Cognitive Mode: {cognitive_mode}.
Past Misconceptions: {[m.get('misconception_type') for m in past_mistakes]}.

TOPIC PEDAGOGICAL BLUEPRINT:
- Concept Intuition & Story Hook: "{hook_data['hook']}"
- Key Concept Rule/Formula: "{hook_data['concept_eq']}"
- Worked Example Intro: "{hook_data['worked_example_intro']}"
- First Step: "{hook_data['worked_eq_1']}"
- Second Step: "{hook_data['worked_eq_2']}"
- Final Result: "{hook_data['worked_eq_3']}"
- Practice Problem for Student: "{hook_data['practice_prompt']}"

CORE PEDAGOGICAL DIRECTIVES (MUST FOLLOW STRICTLY):

1. PHASE 1: CONCEPT INTUITION & "WHY" FIRST (DO NOT RUSH TO EXAMPLES):
   - In your first turn, welcome {greeting_target} warmly.
   - Explain the BIG PICTURE CONCEPT in natural, captivating words using the Story Hook: "{hook_data['hook']}".
   - Write ONLY the main concept rule or formula on the board: `write_math_equation(latex="{hook_data['concept_eq']}")`.
   - Explain what that rule means conceptually in plain English.
   - Check in with the student: ask if the concept makes intuitive sense before diving into any calculation!
   - NEVER start calculating an example problem in turn 1! The student must understand the concept first.

2. PHASE 2: STRICT WHITEBOARD PACING — EXACTLY ONE STEP PER SPEECH TURN:
   - When solving an example with the student, WRITE ONLY ONE STEP on the whiteboard per conversational turn!
   - ABSOLUTE PROHIBITION: DO NOT emit multiple `write_math_equation` or transformation tool calls in the same turn!
   - Structure for each step:
     * First speak: Explain the mathematical intuition and reason for the upcoming step (e.g. why we evaluate parentheses before multiplication).
     * Call `write_math_equation` for that single line with a helpful `arrow_label` (e.g. 'Parentheses first', 'Evaluate 3²', 'Multiply').
     * Pause and engage the student (e.g. "Notice how we simplified the inside? What operation do you see next?").
   - Give the student time to see the writing and respond.

3. PHASE 3: TEACH BEYOND THE EQUATION (NO ROBOTIC READING):
   - Never just read numbers out loud (e.g. "10 minus 9 is 1").
   - World-class teachers explain the insight, the "why", and the common trap:
     * "Notice how tempting it is to subtract first here? That is the #1 trap students fall into! But remember our PEMDAS rule: multiplication always has priority over subtraction."
   - Connect every step back to the core concept.

4. PHASE 4: GUIDED PRACTICE ("YOU DO"):
   - After completing the example step-by-step, present the practice problem: "{hook_data['practice_prompt']}".
   - Encourage the student to write their answer on the whiteboard using their marker or say it aloud.
   - If they write on the board or click "Check My Board", inspect their work and provide encouraging, specific feedback.

5. WHITEBOARD MULTI-PAGE & SPATIAL NON-OVERLAPPING AWARENESS:
   - The student has an interactive multi-page whiteboard and can create multiple pages.
   - You will receive real-time notifications about how many pages exist, which page the student is currently viewing, and if they have drawn.
   - NEVER write over or overlap the student's handwritten work or math calculations!
   - You have two powerful clearing tools:
     * `clear_ai_writing`: Clears your own teacher equations/notes from the board.
     * `clear_student_whiteboard`: Clears the student's drawing when starting a fresh problem or if needed to prevent clutter.
   - CRITICAL WHITEBOARD VISIBILITY RULE:
     * When calling `write_math_equation`, you MUST ALWAYS provide the `latex` field containing the formula, title, or equation you want to appear on the whiteboard (e.g. `latex: "\\text{{Step 1: Identify Graph Axes}}"`).
     * Never leave `latex` blank or pass only `explanation`! The student's board renders the `latex` string. If omitted, the board stays blank.
"""

    if rag_context:
        system_instruction_text += f"\n\n{rag_context}\n\nIMPORTANT GROUNDING RULE: The student uploaded this document/notes. Anchor your explanations, formulas, definitions, and examples in this material!"


    valid_voices = {"Aoede", "Puck", "Charon", "Kore", "Fenrir"}
    pref_voice = profile.get("voice_preference", "Aoede")
    if pref_voice not in valid_voices:
        pref_voice = "Aoede"

    config = types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=pref_voice)
            )
        ),
        system_instruction=types.Content(
            parts=[types.Part.from_text(text=system_instruction_text)]
        ),
        tools=get_live_tools(),
    )

    _state = {"client_disconnected": False}
    _send_lock = asyncio.Lock()
    handled_tool_call_ids: set[str] = set()
    recent_turns: list[str] = []
    _attempt = 0

    # Periodic background heartbeat keeping client WebSocket alive
    async def client_keepalive():
        try:
            while not _state["client_disconnected"]:
                await asyncio.sleep(15)
                if not _state["client_disconnected"]:
                    try:
                        await websocket.send_json({"type": "keepalive", "time": asyncio.get_event_loop().time()})
                    except Exception:
                        break
        except asyncio.CancelledError:
            pass

    keepalive_task = asyncio.create_task(client_keepalive())

    try:
        # Infinite virtual session loop: If Google closes the 15-min live session, hot-swap to a fresh session seamlessly!
        while not _state["client_disconnected"]:
            _attempt += 1
            if _attempt > 1:
                logger.info(f"[LIVE WS] Seamlessly renewing Gemini Live session (session #{_attempt})...")
                try:
                    await websocket.send_json({"type": "session_renewing", "attempt": _attempt})
                except Exception:
                    _state["client_disconnected"] = True
                    break
                await asyncio.sleep(0.3)

            try:
                client = genai.Client(
                    api_key=settings.gemini_api_key,
                    http_options={"api_version": "v1alpha"}
                )
                async with client.aio.live.connect(
                    model=live_model_name,
                    config=config,
                ) as session:
                    logger.info(f"[LIVE WS] Active Gemini Live connection established '{live_model_name}' (session #{_attempt})")

                    await websocket.send_json({
                        "type": "ready",
                        "model": live_model_name,
                        "topic": canonical_topic,
                        "missing_prerequisites": missing_prereqs,
                        "cognitive_mode": cognitive_mode,
                        "session_attempt": _attempt,
                    })

                    async def client_to_gemini():
                        try:
                            while not _state["client_disconnected"]:
                                raw_data = await websocket.receive_text()
                                msg = json.loads(raw_data)
                                msg_type = msg.get("type")

                                if msg_type == "ping":
                                    # Fast application-level ping/pong
                                    await websocket.send_json({
                                        "type": "pong",
                                        "timestamp": msg.get("timestamp"),
                                    })
                                    continue
                                elif msg_type in ("pong", "keepalive"):
                                    continue
                                elif msg_type == "audio":
                                    # Handled client-side via SpeechTranscriber
                                    pass
                                elif msg_type in ("image", "canvas_frame"):
                                    img_b64 = msg.get("data", "")
                                    trigger_turn = msg.get("triggerTurn", False)
                                    if "," in img_b64:
                                        img_b64 = img_b64.split(",", 1)[1]
                                    if img_b64:
                                        try:
                                            img_bytes = base64.b64decode(img_b64)
                                            async with _send_lock:
                                                if trigger_turn:
                                                    logger.info("[LIVE WS VISION] Student clicked Check My Board — sending whiteboard image and inspection prompt")
                                                    inspect_turn = (
                                                        f"System event: The student just requested you to inspect what they wrote or calculated on the whiteboard for '{canonical_topic}'. "
                                                        "Look carefully at the attached whiteboard image in this turn. "
                                                        "Inspect the student's mathematical steps, numbers, equations, or drawings on the board. "
                                                        "Speak out loud immediately to the student: let them know warmly if their work is correct, "
                                                        "celebrate if it's right, or give a friendly, helpful hint if they made an arithmetic or conceptual error!"
                                                    )
                                                    await session.send_client_content(
                                                        turns=[
                                                            types.Content(
                                                                role="user",
                                                                parts=[
                                                                    types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                                                                    types.Part.from_text(text=inspect_turn),
                                                                ],
                                                            )
                                                        ],
                                                        turn_complete=True,
                                                    )
                                                else:
                                                    await session.send_realtime_input(
                                                        media=types.Blob(data=img_bytes, mime_type="image/jpeg")
                                                    )
                                        except Exception as img_err:
                                            logger.warning(f"[LIVE WS] Canvas frame stream warning: {img_err}")
                                elif msg_type == "text":
                                    text_content = msg.get("text", "")
                                    if text_content:
                                        logger.info(f"[LIVE WS STUDENT SPEECH] Student said: '{text_content}'")
                                        recent_turns.append(f"Student: {text_content}")
                                        if len(recent_turns) > 10:
                                            recent_turns.pop(0)
                                        try:
                                            async with _send_lock:
                                                await session.send_client_content(
                                                    turns=[types.Content(role="user", parts=[types.Part.from_text(text=text_content)])],
                                                    turn_complete=True,
                                                )
                                            logger.info(f"[LIVE WS GEMINI] Delivered student turn to Gemini Live")
                                        except Exception as e:
                                            logger.error(f"[LIVE WS GEMINI ERROR] Error sending text turn: {e}")
                                elif msg_type == "whiteboard_state":
                                    active_pg = msg.get("active_page", 1)
                                    total_pgs = msg.get("total_pages", 1)
                                    pg_title = msg.get("page_title", f"Page {active_pg}")
                                    student_wrote = msg.get("student_has_written", False)
                                    strokes_count = msg.get("student_strokes_count", 0)
                                    logger.info(f"[LIVE WS] Whiteboard state: page {active_pg}/{total_pgs} ('{pg_title}') - strokes: {strokes_count}")
                                    try:
                                        async with _send_lock:
                                            await session.send_client_content(
                                                turns=[
                                                    types.Content(
                                                        role="user",
                                                        parts=[
                                                            types.Part.from_text(
                                                                text=f"System note: The student is currently on Whiteboard Page {active_pg} of {total_pgs} ('{pg_title}'). "
                                                                     f"{'The student has drawn work on this page. Never overlap their handwriting!' if student_wrote else 'This page is empty.'}"
                                                            )
                                                        ],
                                                    )
                                                ],
                                                turn_complete=False,
                                            )
                                    except Exception as ws_err:
                                        logger.warning(f"[LIVE WS] Whiteboard state forwarding warning: {ws_err}")
                                elif msg_type == "interrupt":
                                    logger.info("[LIVE WS USER ACTION] Student triggered voice barge-in interrupt")
                                    # Interruption on Gemini Live is naturally handled when client pauses audio playback and sends subsequent speech or turns.
                                elif msg_type == "tool_response":
                                    tool_name = msg.get("name")
                                    call_id = msg.get("call_id")
                                    tool_res = msg.get("result", {"status": "ok"})
                                    if tool_name and call_id and call_id not in handled_tool_call_ids:
                                        handled_tool_call_ids.add(call_id)
                                        try:
                                            async with _send_lock:
                                                await session.send_tool_response(
                                                    function_responses=[
                                                        types.FunctionResponse(
                                                            name=tool_name,
                                                            id=call_id,
                                                            response=tool_res,
                                                        )
                                                    ]
                                                )
                                            logger.info(f"[LIVE WS TOOL RESPONSE] Client tool response confirmed for {tool_name} ({call_id})")
                                        except Exception as e:
                                            logger.warning(f"[LIVE WS] Tool response send error: {e}")
                        except WebSocketDisconnect:
                            logger.info("[LIVE WS] Client WebSocket disconnected")
                            _state["client_disconnected"] = True
                        except asyncio.CancelledError:
                            raise
                        except Exception as e:
                            logger.error(f"[LIVE WS] client_to_gemini error: {e}", exc_info=True)

                    async def gemini_to_client():
                        try:
                            while not _state["client_disconnected"]:
                                async for response in session.receive():
                                    server_content = response.server_content
                                    if server_content is not None:
                                        if server_content.interrupted:
                                            logger.info("[LIVE WS] Gemini voice generation interrupted by student")
                                            await websocket.send_json({"type": "interrupted"})

                                        model_turn = server_content.model_turn
                                        if model_turn is not None:
                                            for part in model_turn.parts:
                                                if part.inline_data:
                                                    audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                                    await websocket.send_json({
                                                        "type": "audio",
                                                        "data": audio_b64,
                                                        "mimeType": part.inline_data.mime_type,
                                                    })
                                                if getattr(part, "text", None) and not getattr(part, "thought", False):
                                                    raw_text = part.text
                                                    if not raw_text.startswith("**") and not raw_text.startswith("Thought:"):
                                                        logger.info(f"[LIVE WS AI TRANSCRIPT] Teacher: '{raw_text[:60]}...'")
                                                        recent_turns.append(f"Teacher: {raw_text[:80]}")
                                                        if len(recent_turns) > 10:
                                                            recent_turns.pop(0)
                                                        await websocket.send_json({
                                                            "type": "text_delta",
                                                            "text": raw_text,
                                                        })

                                        if server_content.turn_complete:
                                            logger.info("[LIVE WS AI TURN] Gemini Live speech turn completed")
                                            await websocket.send_json({"type": "audio_turn_complete"})

                                    tool_call = response.tool_call
                                    if tool_call is not None:
                                        function_responses = []
                                        for fc in tool_call.function_calls:
                                            name = fc.name
                                            args = fc.args or {}
                                            call_id = fc.id

                                            logger.info(f"[LIVE WS WHITEBOARD TOOL] AI called whiteboard action '{name}' | Args: {args}")
                                            handled_tool_call_ids.add(call_id)

                                            await websocket.send_json({
                                                "type": "whiteboard_action",
                                                "tool": name,
                                                "args": args,
                                                "call_id": call_id,
                                            })

                                            if user_id:
                                                try:
                                                    if name == "report_misconception":
                                                        log_student_mistake(
                                                            user_id=user_id,
                                                            topic=canonical_topic,
                                                            problem_context=args.get("explanation", ""),
                                                            student_response="Live lesson interaction",
                                                            correct_response="",
                                                            misconception_type=args.get("misconception_type", "Conceptual Gap"),
                                                            root_cause=args.get("root_cause", args.get("explanation", "")),
                                                            ai_intervention=args.get("intervention_strategy", "Adaptive Strategy Switch"),
                                                        )
                                                    elif name == "record_understanding_state":
                                                        state_val = args.get("state", "Understands")
                                                        is_corr = state_val in ("Mastered", "Understands")
                                                        score_d = float(args.get("confidence_delta", 0.15))
                                                        record_mastery_attempt(
                                                            user_id=user_id,
                                                            topic_id=args.get("concept") or canonical_topic,
                                                            is_correct=is_corr,
                                                            score_delta=abs(score_d),
                                                        )
                                                    elif name == "save_teacher_reflection":
                                                        eff_strat = args.get("effective_strategy", "Adaptive Strategy")
                                                        notes = args.get("future_preference_notes", args.get("student_response", ""))
                                                        save_learner_memory(
                                                            user_id=user_id,
                                                            memory_type="strategy_effectiveness",
                                                            topic=canonical_topic,
                                                            summary=f"Effective Strategy: {eff_strat}. Notes: {notes}",
                                                            confidence=0.95,
                                                        )
                                                    elif name == "conclude_lesson":
                                                        summary_msg = args.get("mastery_summary", f"Successfully completed lesson on {canonical_topic}.")
                                                        celeb_msg = args.get("celebration_message", "Great job mastering today's topic!")
                                                        
                                                        # 1. Update student mastery model in DB
                                                        mastery_result = record_mastery_attempt(
                                                            user_id=user_id,
                                                            topic_id=canonical_topic,
                                                            is_correct=True,
                                                            score_delta=0.45,
                                                            is_completion=True,
                                                        )
                                                        logger.info(f"[LIVE WS DB] Mastery attempt logged for {canonical_topic}: {mastery_result}")

                                                        # 2. Update tutoring_sessions status to 'completed'
                                                        try:
                                                            admin_client().table("tutoring_sessions").update({
                                                                "status": "completed",
                                                                "ai_summary": f"{summary_msg} {celeb_msg}".strip(),
                                                                "ended_at": datetime.now(timezone.utc).isoformat(),
                                                            }).eq("id", current_session_id).execute()
                                                        except Exception as s_err:
                                                            logger.warning(f"[LIVE WS DB] Session update error: {s_err}")

                                                        # 3. Save positive learner memory
                                                        save_learner_memory(
                                                            user_id=user_id,
                                                            memory_type="mastery_milestone",
                                                            topic=canonical_topic,
                                                            summary=f"Mastered {canonical_topic}. {summary_msg}",
                                                            confidence=1.0,
                                                        )

                                                        # 4. Determine next topic in curriculum
                                                        mastered_topics = {canonical_topic}
                                                        try:
                                                            m_res = admin_client().table("student_learner_model").select("topic_id,mastery_score").eq("user_id", user_id).execute()
                                                            if m_res.data:
                                                                for r in m_res.data:
                                                                    if float(r.get("mastery_score", 0)) >= 0.85:
                                                                        mastered_topics.add(r["topic_id"])
                                                        except Exception:
                                                            pass

                                                        next_topic = "Linear Equations (Two-Step & Multi-Step)"
                                                        for t_name, t_info in KNOWLEDGE_GRAPH.items():
                                                            prereqs_met = all(p in mastered_topics or p not in KNOWLEDGE_GRAPH for p in t_info.get("prerequisites", []))
                                                            if t_name not in mastered_topics and prereqs_met:
                                                                next_topic = t_name
                                                                break

                                                        await websocket.send_json({
                                                            "type": "lesson_completed",
                                                            "topic": canonical_topic,
                                                            "summary": summary_msg,
                                                            "celebration": celeb_msg,
                                                            "next_topic": next_topic,
                                                        })
                                                except Exception as db_err:
                                                    logger.warning(f"[LIVE WS DB] DB persistence warning for tool {name}: {db_err}")

                                            function_responses.append(
                                                types.FunctionResponse(
                                                    name=name,
                                                    id=call_id,
                                                    response={"status": "executed_and_displayed"},
                                                )
                                            )

                                        if function_responses:
                                            try:
                                                async with _send_lock:
                                                    await session.send_tool_response(function_responses=function_responses)
                                                logger.info(f"[LIVE WS TOOL] Sent confirmation tool response for {[f.name for f in function_responses]}")
                                            except Exception as tr_err:
                                                logger.error(f"[LIVE WS TOOL] Failed sending tool response: {tr_err}")

                                await asyncio.sleep(0.01)
                        except WebSocketDisconnect:
                            logger.info("[LIVE WS] Client WebSocket disconnected during receive")
                            _state["client_disconnected"] = True
                        except asyncio.CancelledError:
                            raise
                        except Exception as e:
                            logger.error(f"[LIVE WS] gemini_to_client error: {e}", exc_info=True)

                    client_task = asyncio.create_task(client_to_gemini())
                    gemini_task = asyncio.create_task(gemini_to_client())

                    # Send kickoff turn on first attempt, or context resume turn on renewal
                    if _attempt == 1:
                        kickoff_prompt = (
                            f"You are TutorFlow AI starting a 1-on-1 private lesson with {greeting_target} on '{canonical_topic}'. "
                            f"1. Greet {greeting_target} warmly in 1 short, enthusiastic sentence. "
                            f"2. Introduce the concept using this exact story hook: '{hook_data['hook']}' "
                            f"3. Write the core concept rule or formula '{hook_data['concept_eq']}' on the whiteboard using `write_math_equation`. "
                            f"4. Ask {greeting_target} a warm check-in question to see if the core idea makes sense before working on an example together. "
                            f"CRITICAL: Do NOT start calculating a multi-step example in this opening turn! Teach the big-picture intuition first."
                        )
                        async def send_kickoff():
                            try:
                                await asyncio.sleep(0.2)
                                logger.info("[LIVE WS] Sending warm introductory kickoff turn...")
                                async with _send_lock:
                                    await session.send_client_content(
                                        turns=[types.Content(role="user", parts=[types.Part.from_text(text=kickoff_prompt)])],
                                        turn_complete=True,
                                    )
                            except Exception as e:
                                logger.error(f"[LIVE WS] Could not send kickoff prompt: {e}")

                        asyncio.create_task(send_kickoff())
                    else:
                        # Seamless resumption without greeting again
                        resume_context = " | ".join(recent_turns[-4:]) if recent_turns else "Ongoing lesson"
                        resume_prompt = (
                            f"System update: The live session has seamlessly continued for '{canonical_topic}'. "
                            f"Recent conversational context: {resume_context}. "
                            f"Do NOT greet or introduce yourself again. Continue directly from the active step!"
                        )
                        async def send_resume():
                            try:
                                await asyncio.sleep(0.2)
                                async with _send_lock:
                                    await session.send_client_content(
                                        turns=[types.Content(role="user", parts=[types.Part.from_text(text=resume_prompt)])],
                                        turn_complete=True,
                                    )
                            except Exception as e:
                                logger.warning(f"[LIVE WS] Resume prompt error: {e}")

                        asyncio.create_task(send_resume())

                    done, pending = await asyncio.wait(
                        [client_task, gemini_task],
                        return_when=asyncio.FIRST_COMPLETED,
                    )

                    for task in pending:
                        task.cancel()
                        try:
                            await task
                        except (asyncio.CancelledError, Exception):
                            pass

                    if _state["client_disconnected"]:
                        break

            except WebSocketDisconnect:
                logger.info("[LIVE WS] WebSocketDisconnect caught at outer level")
                _state["client_disconnected"] = True
                break
            except Exception as e:
                logger.error(f"[LIVE WS] Gemini session exception (attempt #{_attempt}): {e}", exc_info=True)
                if _state["client_disconnected"]:
                    break
                await asyncio.sleep(1.0)

    finally:
        keepalive_task.cancel()
        try:
            await keepalive_task
        except (asyncio.CancelledError, Exception):
            pass
        if user_id and is_valid_uuid(user_id) and current_session_id:
            try:
                ended_at = datetime.now(timezone.utc)
                duration_sec = max(1, int((ended_at - session_start_time).total_seconds()))
                admin_client().table("tutoring_sessions").update({
                    "status": "completed",
                    "ended_at": ended_at.isoformat(),
                    "session_duration_sec": duration_sec,
                }).eq("id", current_session_id).execute()
                logger.info(f"[LIVE WS DB] Session {current_session_id} finalized with duration {duration_sec}s")
            except Exception as fin_err:
                logger.warning(f"[LIVE WS DB] Session duration update warning: {fin_err}")
        logger.info("[LIVE WS] Session finished cleanly.")
