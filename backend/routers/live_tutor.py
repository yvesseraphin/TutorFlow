import asyncio
import base64
import json
import logging
from typing import Any, Optional

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

logger = logging.getLogger("tutorflow.live_tutor")
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
    logger.info("Student connected to Live Tutor WebSocket")

    if not settings.gemini_api_key:
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
    except Exception:
        topic = "Algebra"
        user_id = ""
        cognitive_mode = "normal"

    # Load student's AI Learner profile
    learner_context = get_student_learner_context(user_id=user_id, topic=topic, cognitive_mode=cognitive_mode) if user_id else {}
    profile = learner_context.get("profile", {})
    missing_prereqs = learner_context.get("missing_prerequisites", [])
    past_mistakes = learner_context.get("unresolved_mistakes", [])
    effective_strategies = learner_context.get("effective_strategies", [])
    student_full_name = profile.get("name") or "there"
    first_name = student_full_name.split()[0] if student_full_name and student_full_name != "Student" else ""
    canonical_topic = learner_context.get("topic", topic)

    system_instruction_text = f"""You are TutorFlow AI, a warm, patient, and highly adaptive 1-on-1 private teacher.
Topic: {canonical_topic}.
Grade Level: {profile.get('grade', '9th Grade')}.
Cognitive Mode: {cognitive_mode}.
Missing Prerequisites: {json.dumps(missing_prereqs)}.
Past Misconceptions: {[m.get('misconception_type') for m in past_mistakes]}.

NATURAL HUMAN TEACHER GUIDELINES:
1. TALK LIKE A REAL HUMAN TEACHER: Be warm, encouraging, conversational, and direct. Keep spoken turns concise (1-3 sentences).
2. DO NOT SPAM THE STUDENT'S NAME: Greet them naturally at the start (e.g. 'Hey {first_name or "there"}'), but DO NOT repeat their name in every response. Address them naturally as 'you'. Never start sentences with their full name.
3. NEVER EXPOSE INTERNAL TAGS: Never speak or output internal labels like 'Thought:', '[Strategy Adaptation]', 'Reasoning:', or raw JSON.
4. WHITEBOARD & DRAWING:
   - Always write equations and steps starting at the left side of the whiteboard (x ≈ 6%).
   - Pick rich marker colors: 'blue' for standard equations, 'green' for correct steps/tips, 'red' for errors/negative numbers, 'purple' for definitions, 'orange' for key transformations.
   - Use clean, standard characters (e.g. '⟵ -3, -2, -1, 0, 1, 2, 3 ⟶' or '2x + 4 = 10') and never raw LaTeX macros like '\\longleftrightarrow'.
   - When explaining or when asked to write, proactively call `write_math_equation` or `display_interactive_balance_scale`.
   - Observe what the student writes on their canvas in real time.
5. PEDAGOGICAL STRATEGY SHIFT:
   - Call `switch_teaching_strategy` when shifting between Visual Intuition, Concrete Analogy, Step-by-Step, Socratic, Protégé, or Teach-Back.
   - Call `report_misconception` when diagnosing a root error.
   - Call `trigger_ai_peer_challenge` to have the student teach peer 'Alex'.
   - Call `adapt_cognitive_load` if the student is tired or overwhelmed.
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

    MAX_GEMINI_RECONNECTS = 3
    for _attempt in range(1, MAX_GEMINI_RECONNECTS + 1):
        if _state["client_disconnected"]:
            break

        if _attempt > 1:
            try:
                await websocket.send_json({"type": "reconnecting"})
            except Exception:
                break
            await asyncio.sleep(2)

        try:
            async with client.aio.live.connect(
                model="gemini-2.0-flash-exp",
                config=config,
            ) as session:
                logger.info(f"Connected to Gemini Live (attempt {_attempt})")

                await websocket.send_json({
                    "type": "ready",
                    "model": "gemini-2.0-flash-exp",
                    "topic": canonical_topic,
                    "missing_prerequisites": missing_prereqs,
                    "cognitive_mode": cognitive_mode,
                })

                if _attempt == 1:
                    greeting_target = first_name if first_name else "there"
                    kickoff_prompt = (
                        f"You are the AI Teacher starting a live 1-on-1 session on '{canonical_topic}'. "
                        f"Greet the student ({greeting_target}) warmly in 1-2 spoken sentences, give a simple intuitive 1-sentence hook for {canonical_topic}, "
                        f"and warmly ask if they are ready to jump in. Keep it natural."
                    )
                    try:
                        await session.send_client_content(
                            turns=[types.Content(role="user", parts=[types.Part.from_text(text=kickoff_prompt)])],
                            turn_complete=True,
                        )
                    except Exception as e:
                        logger.error(f"Could not send kickoff: {e}")

                async def client_to_gemini():
                    _background_tasks: set = set()
                    try:
                        while True:
                            raw_data = await websocket.receive_text()
                            msg = json.loads(raw_data)
                            msg_type = msg.get("type")

                            if msg_type == "audio":
                                audio_b64 = msg.get("data")
                                if audio_b64:
                                    audio_bytes = base64.b64decode(audio_b64)
                                    await session.send_realtime_input(
                                        audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
                                    )
                            elif msg_type == "image" or msg_type == "canvas_frame":
                                img_b64 = msg.get("data", "")
                                if "," in img_b64:
                                    img_b64 = img_b64.split(",", 1)[1]
                                if img_b64:
                                    try:
                                        img_bytes = base64.b64decode(img_b64)
                                        await session.send_realtime_input(
                                            video=types.Blob(data=img_bytes, mime_type="image/jpeg")
                                        )
                                    except Exception as img_err:
                                        logger.warning(f"Canvas stream error: {img_err}")
                            elif msg_type == "text":
                                text_content = msg.get("text", "")
                                if text_content:
                                    logger.info(f"[CHAT IN] Student typed: '{text_content}'")
                                    try:
                                        await session.send_client_content(
                                            turns=[types.Content(role="user", parts=[types.Part.from_text(text=text_content)])],
                                            turn_complete=True,
                                        )
                                        logger.info("Sent text turn directly into Gemini Live session")
                                    except Exception as e:
                                        logger.error(f"Error sending text turn to live session: {e}")
                            elif msg_type == "tool_response":
                                tool_name = msg.get("name")
                                call_id = msg.get("call_id")
                                tool_res = msg.get("result", {"status": "ok"})
                                if tool_name and call_id:
                                    await session.send_tool_response(
                                        function_responses=[
                                            types.FunctionResponse(
                                                name=tool_name,
                                                id=call_id,
                                                response=tool_res,
                                            )
                                        ]
                                    )
                    except WebSocketDisconnect:
                        _state["client_disconnected"] = True
                    except asyncio.CancelledError:
                        raise
                    except Exception as e:
                        logger.error(f"client_to_gemini error: {e}")

                async def gemini_to_client():
                    try:
                        async for response in session.receive():
                            server_content = response.server_content
                            if server_content is not None:
                                if server_content.interrupted:
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

                                if server_content.turn_complete:
                                    await websocket.send_json({"type": "audio_turn_complete"})

                            tool_call = response.tool_call
                            if tool_call is not None:
                                function_responses = []
                                for fc in tool_call.function_calls:
                                    name = fc.name
                                    args = fc.args or {}
                                    call_id = fc.id

                                    await websocket.send_json({
                                        "type": "whiteboard_action",
                                        "tool": name,
                                        "args": args,
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
                                        except Exception as db_err:
                                            logger.warning(f"DB persistence error for tool {name}: {db_err}")

                                    function_responses.append(
                                        types.FunctionResponse(
                                            name=name,
                                            id=call_id,
                                            response={"status": "executed_and_displayed"},
                                        )
                                    )
                                await session.send_tool_response(function_responses=function_responses)
                    except WebSocketDisconnect:
                        _state["client_disconnected"] = True
                    except asyncio.CancelledError:
                        raise
                    except Exception as e:
                        logger.error(f"gemini_to_client error: {e}")

                client_task = asyncio.create_task(client_to_gemini())
                gemini_task = asyncio.create_task(gemini_to_client())

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

        except Exception as e:
            logger.error(f"Gemini session error: {e}")
