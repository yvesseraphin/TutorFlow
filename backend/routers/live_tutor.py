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
                    name="write_math_equation",
                    description="Write a formatted LaTeX mathematical equation or step onto the whiteboard in handwriting style.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "latex": types.Schema(type=types.Type.STRING, description="The clean equation or mathematical step, e.g. '2x + 4 = 10' or '⟵ -3, -2, -1, 0, 1, 2, 3 ⟶'"),
                            "x": types.Schema(type=types.Type.NUMBER, description="X coordinate percentage (e.g. 6 for left side)"),
                            "y": types.Schema(type=types.Type.NUMBER, description="Y coordinate percentage (0-100)"),
                            "color": types.Schema(type=types.Type.STRING, description="Marker color: 'blue', 'green', 'red', 'purple', 'black', 'orange'"),
                            "explanation": types.Schema(type=types.Type.STRING, description="Brief note explaining this step"),
                        },
                        required=["latex"],
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
    except Exception as e:
        logger.warning(f"[LIVE WS] Failed parsing handshake: {e}")
        topic = "Algebra"
        user_id = ""
        cognitive_mode = "normal"

    # Load student's AI profile
    learner_context = get_student_learner_context(user_id=user_id, topic=topic, cognitive_mode=cognitive_mode) if user_id else {}
    profile = learner_context.get("profile", {})
    missing_prereqs = learner_context.get("missing_prerequisites", [])
    past_mistakes = learner_context.get("unresolved_mistakes", [])
    effective_strategies = learner_context.get("effective_strategies", [])
    student_full_name = profile.get("name") or "there"
    first_name = student_full_name.split()[0] if student_full_name and student_full_name != "Student" else ""
    greeting_target = first_name if first_name else "there"
    canonical_topic = learner_context.get("topic", topic)
    current_session_id = str(uuid.uuid4())
    if user_id and is_valid_uuid(user_id):
        try:
            admin_client().table("tutoring_sessions").insert({
                "id": current_session_id,
                "user_id": user_id,
                "topic": canonical_topic,
                "subject": "Mathematics",
                "status": "in_progress",
                "teaching_strategy": cognitive_mode or "Visual Intuition",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            logger.info(f"[LIVE WS DB] Created live tutoring session {current_session_id}")
        except Exception as sess_err:
            logger.warning(f"[LIVE WS DB] Could not create session row: {sess_err}")

    live_model_name = settings.gemini_live_model or "gemini-2.5-flash-native-audio-latest"

    system_instruction_text = f"""You are TutorFlow AI, a warm, joyful, encouraging, and patient 1-on-1 private teacher.
Topic: {canonical_topic}.
Name: {greeting_target}.
Grade Level: {profile.get('grade', '9th Grade')}.
Cognitive Mode: {cognitive_mode}.
Missing Prerequisites: {json.dumps(missing_prereqs)}.
Past Misconceptions: {[m.get('misconception_type') for m in past_mistakes]}.

CRITICAL CONVERSATIONAL & TEACHING RULES:
1. NATURAL SECOND-PERSON DIALOGUE:
   - Always talk directly to the student as "you".
   - NEVER use the word "learner", "student", or "user" when speaking.
   - Speak like a friendly, enthusiastic human tutor in a voice call.

2. ALWAYS EXPLAIN WHILE WRITING ON THE WHITEBOARD (MANDATORY):
   - The student learns mathematics by SEEING IT WRITTEN AS YOU SPEAK.
   - For every concept, example, practice problem, or hint, YOU MUST CALL `write_math_equation` (or `draw_number_line` for number sense/integers, or `display_interactive_balance_scale` for algebra equations) AT THE SAME TIME as speaking!
   - Never explain in pure audio alone without writing the equations, steps, and visual representations on the whiteboard.

3. PROACTIVE GUIDANCE ON HESITATION & MISTAKES:
   - Always respond out loud with clear spoken audio to every student turn.
   - If the student hesitates, pauses, seems unsure, or says "I don't know" / "I'm stuck" / "um":
     * Step in proactively with warm encouragement ("No worries, let's break it down together!").
     * Write the first breakdown step or hint equation directly on the whiteboard (`write_math_equation`), and ask a simple guiding question to help them finish it.
   - When the student answers:
     * If correct: Celebrate briefly ("Spot on!", "Exactly right!", "Awesome!"), explain why in 1 sentence, write the next step on the board, and proceed.
     * If incorrect: Validate their effort ("Great try! Close..."), write the correction hint on the board, and guide them.
   - When the student asks to repeat or re-explain ("repeat the question", "say that again", "I don't understand"):
     * Instantly repeat the question or current step cheerfully in clear words and ensure it is clearly written on the whiteboard!

4. STRUCTURED 4-STEP LESSON FLOW & CLEAR CONCLUSION:
   - Step 1 (Visual Intuition): Introduce the concept with an intuitive real-world analogy, write the concept on the board, and call `update_lesson_step(step_index=1, step_title="Visual Intuition")`.
   - Step 2 (Worked Whiteboard Example): Call `clear_ai_writing()` to start fresh. Work through a clear example on the whiteboard using `write_math_equation`, `draw_number_line`, or `display_interactive_balance_scale` and call `update_lesson_step(step_index=2, step_title="Worked Example")`.
   - Step 3 (Guided Practice): Call `clear_ai_writing()`. Write ONE practice problem on the whiteboard using `write_math_equation` and ask the student to solve it. Call `update_lesson_step(step_index=3, step_title="Guided Practice")`.
   - Step 4 (Mastery & Conclusion): Once the student answers correctly, enthusiastically conclude the lesson:
     * Say: "Congratulations! You have successfully mastered today's lesson on {canonical_topic}! You did an amazing job today. We are all finished with this topic. You can click 'End Lesson' to view your report card, or let me know if you want to explore anything else!"
     * Call `conclude_lesson(mastery_summary="Mastered core concepts and practice in " + canonical_topic)` and `update_lesson_step(step_index=4, step_title="Lesson Concluded")`.

5. BITE-SIZED MICRO-STEPS:
   - In each spoken turn, speak ONLY 1-2 concise, energetic sentences, followed by 1 clear guiding question. Keep turns snappy, visual, and conversational.
   - NEVER speak internal labels like 'Thought:', '[Strategy Adaptation]', 'Reasoning:', or raw JSON.
"""

    client = genai.Client(
        api_key=settings.gemini_api_key,
        http_options={"api_version": "v1alpha"}
    )

    config = types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=profile.get("voice_preference", "Aoede"))
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
                                    if "," in img_b64:
                                        img_b64 = img_b64.split(",", 1)[1]
                                    if img_b64:
                                        try:
                                            img_bytes = base64.b64decode(img_b64)
                                            async with _send_lock:
                                                await session.send_realtime_input(
                                                    video=types.Blob(data=img_bytes, mime_type="image/jpeg")
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
                                elif msg_type == "interrupt":
                                    logger.info("[LIVE WS USER ACTION] Student triggered voice barge-in interrupt")
                                    try:
                                        async with _send_lock:
                                            await session.send_client_content(
                                                turns=[],
                                                turn_complete=True,
                                            )
                                    except Exception as e:
                                        logger.error(f"[LIVE WS] Error sending interrupt: {e}")
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
                            f"You are the AI Teacher starting a live 1-on-1 session on '{canonical_topic}'. "
                            f"Greet the student ({greeting_target}) super warmly and cheerfully in 1-2 spoken sentences. "
                            f"Give a fun, super simple 1-sentence real-world analogy for {canonical_topic} that a child can grasp immediately, "
                            f"and ask if they're ready to explore it together. Keep it warm, simple, and exciting!"
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
        logger.info("[LIVE WS] Session finished cleanly.")
