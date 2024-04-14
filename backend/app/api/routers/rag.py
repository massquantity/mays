import logging
import os
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.core.base.llms.types import ChatMessage, MessageRole
from mistralai.async_client import MistralAsyncClient
from mistralai.models.chat_completion import ChatMessage as MistralChatMessage
from pydantic import BaseModel

from ...utils import PERSIST_DIR, check_api_key, global_model_settings

check_api_key()

logger = logging.getLogger("uvicorn")

router = APIRouter()


class Message(BaseModel):
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


async def rag_chat(request: ChatRequest):
    logger.info(f"Loading index from {PERSIST_DIR}...")
    global_model_settings()
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    index = load_index_from_storage(storage_context)
    logger.info(f"Finished loading index from {PERSIST_DIR}")

    if len(request.messages) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No message provided",
        )
    last_message = request.messages.pop()
    if last_message.role != MessageRole.USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Last message must be from user",
        )
    messages = [ChatMessage(role=m.role, content=m.content) for m in request.messages]
    chat_engine = index.as_chat_engine(chat_mode="condense_plus_context")
    # response = await chat_engine.astream_chat(last_message.content, messages)
    # todo: use `self._aclient.chat_stream` directly
    response = chat_engine.stream_chat(last_message.content, messages)

    async def token_stream_generator():
        # async for token in response.async_response_gen():
        for token in response.response_gen:
            yield token

    return StreamingResponse(token_stream_generator(), media_type="text/plain")


async def simple_chat(request: ChatRequest):
    mistral_client = MistralAsyncClient(api_key=os.environ["MISTRAL_API_KEY"])
    messages = [
        MistralChatMessage(role=m.role.value, content=m.content)
        for m in request.messages
    ]
    response = mistral_client.chat_stream(model="open-mistral-7b", messages=messages)

    async def token_stream_generator():
        async for chunk in response:
            yield chunk.choices[0].delta.content

    return StreamingResponse(token_stream_generator(), media_type="text/plain")


@router.post("")
async def chat(request: ChatRequest):
    if Path(PERSIST_DIR).exists():
        return await rag_chat(request)
    else:
        logger.info(f"No index found in {PERSIST_DIR}, using simple chat...")
        return await simple_chat(request)
