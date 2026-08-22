import asyncio
import base64
import json
import logging
from typing import Any, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types

from backend.config import settings

logger = logging.getLogger("tutorflow.live_tutor")
router = APIRouter(tags=["live-tutor"])

TEACHER_SYSTEM_INSTRUCTION = """You are TutorFlow AI, a live, proactive, highly conversational math teacher and tutor sitting directly next to the student in a 1-on-1 private lesson.
Key teaching persona & behavioral rules:
1. Instant Feedback on Answers: When the student speaks an answer (such as "4", "x = 5", "subtract 3", or any response), evaluate it immediately! If correct, celebrate enthusiastically ("Spot on!", "Exactly right!", "Great job!") and immediately pose the next step or problem. If incorrect, guide them warmly to find the right path.
2. Conversational Momentum: Never remain passive or silent. Keep the lesson moving forward with short, natural, energetic spoken sentences (1-3 concise sentences per turn).
3. Live Whiteboard Guidance: When the student writes or updates the whiteboard, immediately comment on their written steps and guide their work.
4. Voice & Tone: Warm, energetic, encouraging, articulate, and fast-paced like an elite private tutor.
5. Real-time Interruption: The student can speak or interrupt at any time. When interrupted, adapt instantly.
6. Visual Annotations: You can call `highlight_board` to point to a specific region on the board or `write_board_hint` to show a formula hint.
"""

def get_live_tools():
    return [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="highlight_board",
                    description="Highlight or circle a specific box/region on the whiteboard to draw the student's attention to an equation or mistake.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "x": types.Schema(type=types.Type.NUMBER, description="X coordinate percentage (0-100) on the whiteboard"),
                            "y": types.Schema(type=types.Type.NUMBER, description="Y coordinate percentage (0-100) on the whiteboard"),
                            "width": types.Schema(type=types.Type.NUMBER, description="Width percentage (1-100) of highlight area"),
                            "height": types.Schema(type=types.Type.NUMBER, description="Height percentage (1-100) of highlight area"),
                            "label": types.Schema(type=types.Type.STRING, description="Optional brief label or explanation"),
                        },
                        required=["x", "y"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="write_board_hint",
                    description="Write an AI hint or formula notation onto the student's whiteboard canvas.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "text": types.Schema(type=types.Type.STRING, description="The hint text or mathematical equation to display"),
                            "x": types.Schema(type=types.Type.NUMBER, description="X coordinate percentage (0-100)"),
                            "y": types.Schema(type=types.Type.NUMBER, description="Y coordinate percentage (0-100)"),
                        },
                        required=["text"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="clear_board_annotations",
                    description="Clear AI tutor highlights or temporary annotations from the whiteboard.",
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

    client = genai.Client(
        api_key=settings.gemini_api_key,
        http_options={"api_version": "v1alpha"}
    )

    config = types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Aoede")
            )
        ),
        system_instruction=types.Content(
            parts=[types.Part.from_text(text=TEACHER_SYSTEM_INSTRUCTION)]
        ),
        tools=get_live_tools(),
    )

    try:
        async with client.aio.live.connect(
            model="gemini-2.5-flash-native-audio-latest",
            config=config,
        ) as session:
            logger.info("Connected to Gemini Multimodal Live API session")
            await websocket.send_json({"type": "ready", "model": "gemini-2.5-flash-native-audio-latest"})

            async def client_to_gemini():
                """Reads audio PCM, canvas frames, and text from student browser WebSocket and forwards to Gemini."""
                try:
                    while True:
                        raw_data = await websocket.receive_text()
                        msg = json.loads(raw_data)
                        msg_type = msg.get("type")

                        if msg_type == "audio":
                            # PCM 16kHz mono audio chunk from browser
                            audio_b64 = msg.get("data")
                            if audio_b64:
                                pcm_bytes = base64.b64decode(audio_b64)
                                await session.send_realtime_input(
                                    media=types.Blob(data=pcm_bytes, mime_type="audio/pcm;rate=16000")
                                )

                        elif msg_type == "canvas_frame" or msg_type == "image":
                            # Compressed JPEG/WebP whiteboard snapshot
                            img_b64 = msg.get("data")
                            if img_b64:
                                if "," in img_b64:
                                    img_b64 = img_b64.split(",", 1)[1]
                                img_bytes = base64.b64decode(img_b64)
                                mime = msg.get("mime_type", "image/jpeg")
                                await session.send_realtime_input(
                                    media=types.Blob(data=img_bytes, mime_type=mime)
                                )
                                if msg.get("trigger_turn") or msg.get("speak_feedback"):
                                    prompt_text = msg.get("prompt") or "I just drew or wrote this on the whiteboard. Please give me quick, clear verbal guidance or feedback."
                                    await session.send_client_content(
                                        turns=[
                                            types.Content(
                                                role="user",
                                                parts=[types.Part.from_text(text=prompt_text)]
                                            )
                                        ],
                                        turn_complete=True,
                                    )

                        elif msg_type == "text":
                            # Text prompt or typed chat message
                            text_content = msg.get("text", "")
                            if text_content.strip():
                                await session.send_client_content(
                                    turns=[
                                        types.Content(
                                            role="user",
                                            parts=[types.Part.from_text(text=text_content)]
                                        )
                                    ],
                                    turn_complete=True,
                                )

                        elif msg_type == "tool_response":
                            call_id = msg.get("call_id")
                            name = msg.get("name")
                            result = msg.get("result", {"status": "ok"})
                            await session.send_tool_response(
                                function_responses=[
                                    types.FunctionResponse(
                                        name=name,
                                        id=call_id,
                                        response=result,
                                    )
                                ]
                            )

                        elif msg_type == "ping":
                            await websocket.send_json({"type": "pong"})

                except WebSocketDisconnect:
                    logger.info("Client WebSocket disconnected")
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error(f"Error in client_to_gemini loop: {e}", exc_info=True)

            async def gemini_to_client():
                """Streams Gemini Live audio PCM (24kHz), transcripts, interruption, and tool calls to browser."""
                try:
                    async for response in session.receive():
                        server_content = response.server_content
                        if server_content is not None:
                            # 1. Native Barge-in / Interruption signal
                            if getattr(server_content, "interrupted", False):
                                await websocket.send_json({"type": "interrupted"})

                            model_turn = getattr(server_content, "model_turn", None)
                            if model_turn and model_turn.parts:
                                for part in model_turn.parts:
                                    # Audio PCM chunk
                                    if part.inline_data:
                                        audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                        await websocket.send_json({
                                            "type": "audio",
                                            "data": audio_b64,
                                            "mime_type": part.inline_data.mime_type or "audio/pcm;rate=24000",
                                        })
                                    # Transcribed text chunk
                                    if part.text:
                                        await websocket.send_json({
                                            "type": "text_delta",
                                            "text": part.text,
                                        })

                            if getattr(server_content, "turn_complete", False):
                                await websocket.send_json({"type": "turn_complete"})

                        # 2. Tool calls (e.g. AI wants to highlight board or write hint)
                        tool_call = getattr(response, "tool_call", None)
                        if tool_call and getattr(tool_call, "function_calls", None):
                            for call in tool_call.function_calls:
                                await websocket.send_json({
                                    "type": "tool_call",
                                    "call_id": call.id,
                                    "name": call.name,
                                    "args": call.args,
                                })

                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error(f"Error in gemini_to_client loop: {e}", exc_info=True)

            c2g_task = asyncio.create_task(client_to_gemini())
            g2c_task = asyncio.create_task(gemini_to_client())

            done, pending = await asyncio.wait(
                [c2g_task, g2c_task],
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in pending:
                task.cancel()

    except Exception as e:
        logger.error(f"Gemini Live session error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Live AI session failed: {str(e)}",
            })
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info("Live Tutor WebSocket session closed")
