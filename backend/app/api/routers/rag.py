import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from llama_index.core.base.llms.types import ChatMessage, MessageRole
from mistralai.async_client import MistralAsyncClient
from mistralai.models.chat_completion import ChatMessage as MistralChatMessage
from openai import AsyncOpenAI
from pydantic import BaseModel

from .indexing import load_index
from ...utils import PERSIST_DIR, global_model_settings

logger = logging.getLogger("uvicorn")

router = APIRouter()


class Message(BaseModel):
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    modelName: str
    apiKey: str
    temperature: float
    maxTokens: int
    topP: float


async def rag_chat(request: Request, chatRequest: ChatRequest):
    logger.info(f"Loading index from {PERSIST_DIR}...")
    global_model_settings(
        model_name=chatRequest.modelName,
        api_key=chatRequest.apiKey,
        temperature=chatRequest.temperature,
        max_tokens=chatRequest.maxTokens,
        top_p=chatRequest.topP,
    )
    index = load_index()
    logger.info(f"Finished loading index from {PERSIST_DIR}")

    if len(chatRequest.messages) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No message provided",
        )
    last_message = chatRequest.messages.pop()
    if last_message.role != MessageRole.USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Last message must be from user",
        )
    messages = [
        ChatMessage(role=m.role, content=m.content) for m in chatRequest.messages
    ]
    chat_engine = index.as_chat_engine(chat_mode="condense_plus_context")
    response = await chat_engine.astream_chat(last_message.content, messages)
    # response = chat_engine.stream_chat(last_message.content, messages)

    async def token_stream_generator():
        # for token in response.response_gen:
        async for token in response.async_response_gen():
            if await request.is_disconnected():
                break
            yield token

    return StreamingResponse(token_stream_generator(), media_type="text/plain")


async def simple_chat(chatRequest: ChatRequest):
    if "gpt" in chatRequest.modelName:
        openai_client = AsyncOpenAI(api_key=chatRequest.apiKey)
        messages = [{"role": m.role, "content": m.content} for m in chatRequest.messages]
        response = openai_client.chat.completions.create(
            model=chatRequest.modelname,
            messages=messages,
            temperature=chatRequest.temperature,
            max_tokens=chatRequest.maxTokens,
            top_p=chatRequest.topP,
            stream=True,
        )
    elif chatRequest.modelName == "mistral":
        mistral_client = MistralAsyncClient(api_key=chatRequest.apiKey)
        messages = [
            MistralChatMessage(role=m.role.value, content=m.content)
            for m in chatRequest.messages
        ]
        response = mistral_client.chat_stream(
            model="open-mistral-7b",
            messages=messages,
            temperature=chatRequest.temperature,
            max_tokens=chatRequest.maxTokens,
            top_p=chatRequest.topP,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported model using pure chat: `{chatRequest.modelName}`.",
        )

    async def token_stream_generator():
        async for chunk in response:
            yield chunk.choices[0].delta.content

    return StreamingResponse(token_stream_generator(), media_type="text/plain")


@router.post("")
async def chat(request: Request, chatRequest: ChatRequest):
    if Path(PERSIST_DIR).exists():
        return await rag_chat(request, chatRequest)
    else:
        logger.info(f"No index found in {PERSIST_DIR}, using simple chat...")
        return await simple_chat(chatRequest)
