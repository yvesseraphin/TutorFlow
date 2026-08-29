import asyncio
import base64
import json
import logging
from typing import Any, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types

from backend.config import settings
from backend.services.ai_learner import get_student_learner_context, log_student_mistake, record_mastery_attempt, save_learner_memory
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
                    description="Write a formatted LaTeX mathematical equation or step onto the whiteboard for the student to see.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "latex": types.Schema(type=types.Type.STRING, description="The LaTeX string, e.g. '2x + 4 = 10' or '\\frac{d}{dx}[x^2] = 2x'"),
                            "x": types.Schema(type=types.Type.NUMBER, description="X coordinate percentage (0-100)"),
                            "y": types.Schema(type=types.Type.NUMBER, description="Y coordinate percentage (0-100)"),
                            "explanation": types.Schema(type=types.Type.STRING, description="Brief note explaining this step"),
                        },
                        required=["latex"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="highlight_board",
                    description="Highlight or circle a specific bounding box on the whiteboard to draw attention to an operation or error.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "x": types.Schema(type=types.Type.NUMBER, description="X percentage (0-100)"),
                            "y": types.Schema(type=types.Type.NUMBER, description="Y percentage (0-100)"),
                            "width": types.Schema(type=types.Type.NUMBER, description="Width percentage (1-100)"),
                            "height": types.Schema(type=types.Type.NUMBER, description="Height percentage (1-100)"),
                            "label": types.Schema(type=types.Type.STRING, description="Brief note"),
                        },
                        required=["x", "y"],
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
                                description="Strategy name: 'Visual Intuition', 'Concrete Analogy', 'Step-by-Step Decomposition', 'Socratic Guided Discovery', 'Teach-Back Verification'"
                            ),
                            "reason": types.Schema(type=types.Type.STRING, description="Why this strategy is being applied now"),
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
                            "explanation": types.Schema(type=types.Type.STRING, description="Clear, student-friendly explanation of the misconception"),
                            "intervention_strategy": types.Schema(type=types.Type.STRING, description="Strategy to fix it (e.g. 'Balance Scale Model', 'Color-Coded Decomposition')"),
                        },
                        required=["misconception_type", "explanation"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="trigger_teach_back",
                    description="Prompt the student to explain the concept in their own words or solve a transfer problem to confirm genuine understanding.",
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
                            "hint_text": types.Schema(type=types.Type.STRING, description="The guiding hint prompt"),
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
    except Exception:
        topic = "Linear Equations"
        user_id = ""

    # Load student's AI Learner profile and dynamic lesson plan
    learner_context = get_student_learner_context(user_id=user_id, topic=topic) if user_id else {}
    profile = learner_context.get("profile", {})
    missing_prereqs = learner_context.get("missing_prerequisites", [])
    past_mistakes = learner_context.get("unresolved_mistakes", [])
    student_name = profile.get("name") or "Student"

    system_instruction_text = f"""You are TutorFlow AI, an adaptive, warm, and highly conversational 1-on-1 private teacher teaching the student: {student_name}.
Grade Level: {profile.get('grade', 'Senior 2')}.
Topic: {topic}.
Known Missing Prerequisites: {json.dumps(missing_prereqs)}.
Past Misconceptions to watch for: {[m.get('misconception_type') for m in past_mistakes]}.

CORE TEACHING PHILOSOPHY & ADAPTIVE STRATEGY ENGINE:
1. START GENTLY: Greet {student_name} with excitement. Introduce the topic with a quick, intuitive 1-sentence real-world analogy. DO NOT ask intimidating test questions right away. Ask an easy starter (e.g. "Ready to see how simple this is? Let's dive in!").
2. ADAPT TEACHING IN REAL TIME: Use your `switch_teaching_strategy` tool whenever you shift strategies:
   - 'Visual Intuition': Writing equations and drawings on the board.
   - 'Concrete Analogy': Comparing equations to a balance scale or seesaw.
   - 'Step-by-Step Decomposition': Breaking multi-step operations into bite-sized micro-steps.
   - 'Socratic Guided Discovery': Asking leading questions to let the student discover the rule.
   - 'Teach-Back Verification': Asking the student to explain the core concept back or solve a transfer problem.
3. MISCONCEPTION DIAGNOSIS: When the student makes a mistake, DO NOT just say "incorrect". Use `report_misconception` to diagnose the exact reasoning break (e.g. forgetting to flip sign when moving across equals sign), explain WHY it happens, and switch teaching strategy immediately.
4. WHITEBOARD SYNC: Use `write_math_equation` and `highlight_board` proactively so the whiteboard stays synced with your voice.
5. CONCISE & SPOKEN: Keep spoken turns short (1-3 sentences per turn). No internal thoughts or markdown headers in speech.
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
            logger.info(f"Connecting to Gemini Live (attempt {_attempt}) model=gemini-3.1-flash-live-preview topic={topic}")
            async with client.aio.live.connect(
                model="gemini-3.1-flash-live-preview",
                config=config,
            ) as session:
                logger.info(f"Connected to Gemini Live (attempt {_attempt})")

                await websocket.send_json({
                    "type": "ready",
                    "model": "gemini-3.1-flash-live-preview",
                    "topic": topic,
                    "missing_prerequisites": missing_prereqs,
                })

                if _attempt == 1:
                    kickoff_prompt = (
                        f"You are the AI Teacher. The 1-on-1 session on '{topic}' is starting right now. "
                        f"Greet {student_name} warmly in 1-2 spoken sentences, give a simple intuitive 1-sentence hook for {topic}, "
                        f"and warmly invite them to say 'Ready' or 'Let's go' to begin. Do not quiz them with hard math yet."
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
                                                f"You are TutorFlow AI, an elite and friendly 1-on-1 tutor for {profile.get('name', 'the student')} "
                                                f"in the subject: '{topic}'. "
                                                f"The student says: '{prompt_text}'. "
                                                f"Give a clear, warm, step-by-step 1-3 sentence response directly to the student. "
                                                f"Do NOT include any internal thoughts, reasoning headers, or meta text."
                                            )
                                            logger.info("Generating text chat stream via gemini-2.5-flash...")
                                            chat_stream = await client.aio.models.generate_content_stream(
                                                model="gemini-2.5-flash",
                                                contents=chat_prompt,
                                            )
                                            async for chunk in chat_stream:
                                                if chunk.text:
                                                    await websocket.send_json({"type": "text", "text": chunk.text})
                                            await websocket.send_json({"type": "turn_complete"})
                                            logger.info("Chat text stream completed")
                                        except Exception as err:
                                            logger.error(f"Chat reply error: {type(err).__name__}: {err!r}", exc_info=True)

                                    task = asyncio.create_task(stream_chat_reply(text_content))
                                    _background_tasks.add(task)
                                    task.add_done_callback(_background_tasks.discard)
                            elif msg_type == "tool_response":
                                tool_name = msg.get("name")
                                call_id = msg.get("call_id")
                                tool_res = msg.get("result", {"status": "ok"})
                                logger.info(f"[TOOL RES] tool={tool_name}, call_id={call_id}")
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
                                    await websocket.send_json({
                                        "type": "whiteboard_action",
                                        "tool": name,
                                        "args": args,
                                    })
                                    function_responses.append(
                                        types.FunctionResponse(
                                            name=name,
                                            id=call_id,
                                            response={"status": "displayed_on_board"},
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

