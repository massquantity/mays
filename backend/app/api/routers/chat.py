import os
from typing import List

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from mistralai.async_client import MistralAsyncClient
from mistralai.models.chat_completion import ChatMessage
from pydantic import BaseModel

if not os.getenv("MISTRAL_API_KEY"):
    raise RuntimeError("Invalid mistral api key. Get it from https://console.mistral.ai/api-keys/")

router = APIRouter()

mistral_client = MistralAsyncClient(api_key=os.environ["MISTRAL_API_KEY"])
model = "open-mistral-7b"


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


@router.post("")
async def chat(request: ChatRequest):
    messages = [ChatMessage(role=m.role, content=m.content) for m in request.messages]
    response = mistral_client.chat_stream(model=model, messages=messages)

    async def token_stream_generator():
        async for chunk in response:
            yield chunk.choices[0].delta.content

    return StreamingResponse(token_stream_generator(), media_type="text/plain")
