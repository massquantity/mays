import os
from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from mistralai import Mistral
from pydantic import BaseModel

from ...utils import check_api_key

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


@router.post("", dependencies=[Depends(check_api_key)])
async def chat(request: ChatRequest):
    mistral_client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    response = await mistral_client.chat.stream_async(
        model="mistral-small-latest", messages=messages
    )

    async def token_stream_generator():
        async for chunk in response:
            if chunk.data.choices[0].delta.content is not None:
                yield chunk.data.choices[0].delta.content

    return StreamingResponse(token_stream_generator(), media_type="text/plain")
