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
from backend.services.lesson_planner import generate_personalized_lesson_plan
from backend.services.supabase import admin_client

logger = logging.getLogger("tutorflow.live_tutor")
router = APIRouter(tags=["live-tutor"])


def get_live_tools():
    return [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="write_math_equation",
                    description="Write a formatted LaTeX mathematical equation or step onto the whiteboard in real time.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "latex": types.Schema(type=types.Type.STRING, description="The LaTeX string, e.g. '2x + 4 = 10' or 'x = 3'"),
                            "x": types.Schema(type=types.Type.NUMBER, description="X coordinate percentage (0-100)"),
                            "y": types.Schema(type=types.Type.NUMBER, description="Y coordinate percentage (0-100)"),
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
                            "reason": types.Schema(type=types.Type.STRING, description="Observed signal (e.g. 'Student hesitated on multi-step arithmetic, switching to micro-steps')"),
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
                            "confidence_delta": types.Schema(type=types.Type.NUMBER, description="Mastery delta (e.g. 0.15 for mastery, -0.1 for struggle)"),
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

    # Parse initial handshake / initialization message
    try:
        init_raw = await websocket.receive_text()
        init_data = json.loads(init_raw)
        topic = init_data.get("topic", "Linear Equations")
        user_id = init_data.get("user_id", "")
        cognitive_mode = init_data.get("cognitive_mode", "normal")
    except Exception:
        topic = "Linear Equations"
        user_id = ""
        cognitive_mode = "normal"

    # Load student's AI Learner profile and dynamic lesson plan
    learner_context = get_student_learner_context(user_id=user_id, topic=topic, cognitive_mode=cognitive_mode) if user_id else {}
    profile = learner_context.get("profile", {})
    missing_prereqs = learner_context.get("missing_prerequisites", [])
    past_mistakes = learner_context.get("unresolved_mistakes", [])
    effective_strategies = learner_context.get("effective_strategies", [])
    student_name = profile.get("name") or "Student"
    canonical_topic = learner_context.get("topic", topic)

    system_instruction_text = f"""You are TutorFlow AI, an elite, warm, highly adaptive 1-on-1 private teacher teaching the student: {student_name}.
Grade Level: {profile.get('grade', '9th Grade')}.
Topic: {canonical_topic}.
Active Cognitive Energy Mode: {cognitive_mode}.
Known Missing Prerequisites: {json.dumps(missing_prereqs)}.
Past Misconceptions to watch for: {[m.get('misconception_type') for m in past_mistakes]}.
Proven Past Effective Strategies: {effective_strategies[:2]}.

TUTORFLOW ADVANCED PEDAGOGICAL AI LOOP:
1. START WARMLY: Greet {student_name} with excitement. Introduce {canonical_topic} with an intuitive 1-sentence real-world analogy.
2. GENERATIVE UI & WHITEBOARD:
   - Use `display_interactive_balance_scale` to display visual balance scales when explaining equations.
   - Use `animate_step_transformation` when moving terms or inverting signs.
   - Use `write_math_equation` and `highlight_board` proactively so the board stays synchronized with your voice in real time.
3. MULTI-AGENT PROTÉGÉ EFFECT (TEACHING THE PEER):
   - At appropriate milestones, use `trigger_ai_peer_challenge` to introduce virtual peer student 'Alex' who makes a common mistake.
   - Invite {student_name} to teach and correct Alex. When {student_name} explains it, praise them for mastering the concept!
4. COGNITIVE ENERGY & BURNOUT ADAPTATION:
   - If {student_name} appears fatigued, struggles repeatedly, or asks for simple explanations, call `adapt_cognitive_load` ('fatigued_visual_microsteps'), slow down, and switch to lightweight visual analogies.
5. REAL-TIME STRATEGY SHIFT:
   - Call `switch_teaching_strategy` whenever shifting between Visual Intuition, Concrete Analogy, Step-by-Step Decomposition, Socratic Guided Discovery, Protégé Peer Teaching, and Teach-Back Verification.
6. MISCONCEPTION DIAGNOSIS:
   - When the student makes an error, NEVER simply say "wrong". Call `report_misconception` to diagnose the exact reasoning break, explain WHY it happened, and switch strategy immediately.
7. UNDERSTANDING & REFLECTION:
   - Call `record_understanding_state` when mastery changes.
   - Call `save_teacher_reflection` when an effective teaching strategy breakthrough occurs.
8. CONCISE & SPOKEN: Keep spoken turns short (1-3 sentences per turn). No markdown headers or thoughts in speech.
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
            logger.info("Client disconnected. Stopping Gemini reconnect loop.")
            break

        if _attempt > 1:
            logger.info(f"Reconnecting to Gemini Live (attempt {_attempt}/{MAX_GEMINI_RECONNECTS})...")
            try:
                await websocket.send_json({"type": "reconnecting"})
            except Exception:
                break
            await asyncio.sleep(2)

        try:
            logger.info(f"Connecting to Gemini Live (attempt {_attempt}) model=gemini-3.1-flash-live-preview topic={canonical_topic}")
            async with client.aio.live.connect(
                model="gemini-3.1-flash-live-preview",
                config=config,
            ) as session:
                logger.info(f"Connected to Gemini Live (attempt {_attempt})")

                await websocket.send_json({
                    "type": "ready",
                    "model": "gemini-3.1-flash-live-preview",
                    "topic": canonical_topic,
                    "missing_prerequisites": missing_prereqs,
                    "cognitive_mode": cognitive_mode,
                })

                if _attempt == 1:
                    kickoff_prompt = (
                        f"You are the AI Teacher. The 1-on-1 session on '{canonical_topic}' is starting right now. "
                        f"Greet {student_name} warmly in 1-2 spoken sentences, give a simple intuitive 1-sentence hook for {canonical_topic}, "
                        f"and warmly invite them to say 'Ready' or 'Let's go' to begin."
                    )
                    try:
                        logger.info("Sending kickoff turn to Gemini Live...")
                        await session.send_client_content(
                            turns=[types.Content(role="user", parts=[types.Part.from_text(text=kickoff_prompt)])],
                            turn_complete=True,
                        )
                        logger.info("Kickoff turn sent successfully")
                    except Exception as e:
                        logger.error(f"Could not send kickoff: {type(e).__name__}: {e!r}", exc_info=True)

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
                                    logger.debug(f"[AUDIO IN] {len(audio_bytes)} bytes PCM -> Gemini")
                                    await session.send_realtime_input(
                                        audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
                                    )
                            elif msg_type == "image" or msg_type == "canvas_frame":
                                img_b64 = msg.get("data", "")
                                if "," in img_b64:
                                    img_b64 = img_b64.split(",", 1)[1]
                                if img_b64:
                                    img_bytes = base64.b64decode(img_b64)
                                    logger.info(f"[CANVAS IN] {len(img_bytes)} bytes -> Gemini")
                                    await session.send_realtime_input(
                                        media=types.Blob(data=img_bytes, mime_type="image/jpeg")
                                    )
                            elif msg_type == "text":
                                text_content = msg.get("text", "")
                                if text_content:
                                    logger.info(f"[CHAT IN] Student typed: '{text_content}'")
                                    try:
                                        await session.send_client_content(
                                            turns=[types.Content(role="user", parts=[types.Part.from_text(text=text_content)])],
                                            turn_complete=True,
                                        )
                                        logger.info("Sent chat turn to Live Audio session")
                                    except Exception as e:
                                        logger.error(f"Error sending text to Gemini: {type(e).__name__}: {e!r}", exc_info=True)

                                    async def stream_chat_reply(prompt_text):
                                        try:
                                            chat_prompt = (
                                                f"You are TutorFlow AI, an elite adaptive 1-on-1 teacher for {student_name} "
                                                f"in the topic: '{canonical_topic}'. "
                                                f"The student says or asks: '{prompt_text}'. "
                                                f"Give a clear, warm, step-by-step 1-3 sentence response directly to the student. "
                                                f"Do NOT include internal thoughts or headers."
                                            )
                                            chat_stream = await client.aio.models.generate_content_stream(
                                                model=settings.gemini_model,
                                                contents=chat_prompt,
                                            )
                                            async for chunk in chat_stream:
                                                if chunk.text:
                                                    await websocket.send_json({"type": "text", "text": chunk.text})
                                            await websocket.send_json({"type": "turn_complete"})
                                        except Exception as err:
                                            logger.error(f"Chat reply error: {type(err).__name__}: {err!r}", exc_info=True)

                                    task = asyncio.create_task(stream_chat_reply(text_content))
                                    _background_tasks.add(task)
                                    task.add_done_callback(_background_tasks.discard)
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
                        logger.info("Client disconnected (client_to_gemini)")
                    except asyncio.CancelledError:
                        raise
                    except Exception as e:
                        logger.error(f"client_to_gemini error: {type(e).__name__}: {e!r}", exc_info=True)

                async def gemini_to_client():
                    try:
                        audio_chunk_count = 0
                        async for response in session.receive():
                            server_content = response.server_content
                            if server_content is not None:
                                model_turn = server_content.model_turn
                                if model_turn is not None:
                                    for part in model_turn.parts:
                                        if part.inline_data:
                                            audio_chunk_count += 1
                                            audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                            await websocket.send_json({
                                                "type": "audio",
                                                "data": audio_b64,
                                                "mimeType": part.inline_data.mime_type,
                                            })
                                            if audio_chunk_count % 20 == 0:
                                                logger.info(f"[AUDIO OUT] {audio_chunk_count} chunks sent")

                                if server_content.turn_complete:
                                    logger.info(f"[TURN COMPLETE] {audio_chunk_count} audio chunks total")
                                    await websocket.send_json({"type": "audio_turn_complete"})

                            tool_call = response.tool_call
                            if tool_call is not None:
                                function_responses = []
                                for fc in tool_call.function_calls:
                                    name = fc.name
                                    args = fc.args or {}
                                    call_id = fc.id
                                    logger.info(f"AI Teacher tool: {name}({args})")

                                    # Notify UI via whiteboard action
                                    await websocket.send_json({
                                        "type": "whiteboard_action",
                                        "tool": name,
                                        "args": args,
                                    })

                                    # Execute background persistence based on pedagogical tool
                                    if user_id:
                                        try:
                                            if name == "report_misconception":
                                                log_student_mistake(
                                                    user_id=user_id,
                                                    topic=canonical_topic,
                                                    problem_context=args.get("explanation", ""),
                                                    student_response="Spoken/drawn attempt in live lesson",
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
                                            elif name == "trigger_ai_peer_challenge":
                                                save_learner_memory(
                                                    user_id=user_id,
                                                    memory_type="preference",
                                                    topic=canonical_topic,
                                                    summary=f"Protégé Challenge initiated with peer {args.get('peer_name')}: {args.get('misconception_targeted')}",
                                                    confidence=0.9,
                                                )
                                            elif name == "switch_teaching_strategy":
                                                strat = args.get("strategy", "Visual Intuition")
                                                reason = args.get("reason", "Adapting to learner progress")
                                                save_learner_memory(
                                                    user_id=user_id,
                                                    memory_type="preference",
                                                    topic=canonical_topic,
                                                    summary=f"Strategy switched to {strat}: {reason}",
                                                    confidence=0.85,
                                                )
                                        except Exception as db_err:
                                            logger.warning(f"Background persistence error for tool {name}: {db_err}")

                                    function_responses.append(
                                        types.FunctionResponse(
                                            name=name,
                                            id=call_id,
                                            response={"status": "executed_and_displayed"},
                                        )
                                    )
                                await session.send_tool_response(function_responses=function_responses)
                        logger.warning("Gemini session.receive() ended")
                    except WebSocketDisconnect:
                        _state["client_disconnected"] = True
                        logger.info("Client disconnected (gemini_to_client)")
                    except asyncio.CancelledError:
                        raise
                    except Exception as e:
                        logger.error(f"gemini_to_client error: {type(e).__name__}: {e!r}", exc_info=True)
                        try:
                            await websocket.send_json({
                                "type": "error",
                                "message": f"AI stream error: {type(e).__name__}: {str(e) or 'unknown'}",
                            })
                        except Exception:
                            pass

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

                if gemini_task in done and not _state["client_disconnected"]:
                    logger.info(f"Gemini session ended (attempt {_attempt}) - will reconnect if attempts remain.")

        except Exception as e:
            err_str = f"{type(e).__name__}: {str(e) or repr(e)}"
            logger.error(f"Gemini session error (attempt {_attempt}): {err_str}", exc_info=True)
            if not _state["client_disconnected"]:
                if _attempt < MAX_GEMINI_RECONNECTS:
                    try:
                        await websocket.send_json({"type": "reconnecting"})
                    except Exception:
                        break
                else:
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Could not maintain AI connection after {MAX_GEMINI_RECONNECTS} attempts. {err_str}",
                        })
                    except Exception:
                        pass
