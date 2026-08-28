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

    system_instruction_text = f"""You are TutorFlow AI, an elite, highly conversational, and warm 1-on-1 private teacher teaching the student: {profile.get('name', 'Student')}.
Grade Level: {profile.get('grade', 'Senior 2')}.
Topic: {topic}.
Teaching Style: {profile.get('teaching_style', 'step_by_step')}.
Missing Foundation / Prerequisites: {json.dumps(missing_prereqs)}.
Past Misconceptions to watch: {[m.get('misconception_type') for m in past_mistakes]}.

TEACHING PRINCIPLES:
1. Speak aloud using short, natural, encouraging spoken sentences (1-3 sentences per turn).
2. Use your tools (`write_math_equation`, `highlight_board`, `show_socratic_hint`) concurrently to write and draw on the whiteboard while explaining.
3. If the student speaks or writes an answer, evaluate it instantly. If correct, praise and advance. If wrong, provide warm Socratic hints without giving the final answer immediately.
4. If missing prerequisites exist, do a 1-minute foundation review first.
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

    try:
        async with client.aio.live.connect(
            model="gemini-2.5-flash-native-audio-latest",
            config=config,
        ) as session:
            logger.info("Connected to Gemini Multimodal Live API session")
            await websocket.send_json({
                "type": "ready",
                "model": "gemini-2.5-flash-native-audio-latest",
                "topic": topic,
                "missing_prerequisites": missing_prereqs,
            })

            async def client_to_gemini():
                """Reads audio PCM, canvas frames, and student messages from browser and forwards to Gemini."""
                try:
                    while True:
                        raw_data = await websocket.receive_text()
                        msg = json.loads(raw_data)
                        msg_type = msg.get("type")

                        if msg_type == "audio":
                            audio_b64 = msg.get("data")
                            if audio_b64:
                                audio_bytes = base64.b64decode(audio_b64)
                                await session.send(
                                    input=types.LiveClientRealtimeInput(
                                        media_chunks=[types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")]
                                    )
                                )
                        elif msg_type == "image":
                            img_b64 = msg.get("data", "")
                            if "," in img_b64:
                                img_b64 = img_b64.split(",", 1)[1]
                            if img_b64:
                                img_bytes = base64.b64decode(img_b64)
                                await session.send(
                                    input=types.LiveClientRealtimeInput(
                                        media_chunks=[types.Blob(data=img_bytes, mime_type="image/jpeg")]
                                    )
                                )
                        elif msg_type == "text":
                            text_content = msg.get("text", "")
                            if text_content:
                                await session.send(
                                    input=types.Content(
                                        role="user",
                                        parts=[types.Part.from_text(text=text_content)]
                                    ),
                                    end_of_turn=True
                                )
                except WebSocketDisconnect:
                    logger.info("Client disconnected from WebSocket (client_to_gemini)")
                except Exception as e:
                    logger.error(f"Error in client_to_gemini: {e}")

            async def gemini_to_client():
                """Reads audio chunks and tool calls from Gemini and streams them back to the student's browser."""
                try:
                    async for response in session.receive():
                        server_content = response.server_content
                        if server_content is not None:
                            model_turn = server_content.model_turn
                            if model_turn is not None:
                                for part in model_turn.parts:
                                    if part.inline_data:
                                        audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                        await websocket.send_json({
                                            "type": "audio",
                                            "data": audio_b64,
                                            "mimeType": part.inline_data.mime_type
                                        })
                                    if part.text:
                                        await websocket.send_json({
                                            "type": "text",
                                            "text": part.text
                                        })

                            if server_content.turn_complete:
                                await websocket.send_json({"type": "turn_complete"})

                        tool_call = response.tool_call
                        if tool_call is not None:
                            function_responses = []
                            for fc in tool_call.function_calls:
                                name = fc.name
                                args = fc.args or {}
                                call_id = fc.id

                                logger.info(f"AI Teacher invoked tool: {name}({args})")

                                # Send whiteboard action to browser UI
                                await websocket.send_json({
                                    "type": "whiteboard_action",
                                    "tool": name,
                                    "args": args,
                                })

                                function_responses.append(
                                    types.FunctionResponse(
                                        name=name,
                                        id=call_id,
                                        response={"status": "displayed_on_board"}
                                    )
                                )

                            await session.send(
                                input=types.LiveClientToolResponse(
                                    function_responses=function_responses
                                )
                            )
                except WebSocketDisconnect:
                    logger.info("Client disconnected from WebSocket (gemini_to_client)")
                except Exception as e:
                    logger.error(f"Error in gemini_to_client: {e}")

            done, pending = await asyncio.wait(
                [
                    asyncio.create_task(client_to_gemini()),
                    asyncio.create_task(gemini_to_client()),
                ],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for task in pending:
                task.cancel()

    except Exception as e:
        logger.error(f"Gemini Live session failed: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
            await websocket.close()
        except Exception:
            pass
