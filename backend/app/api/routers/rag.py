import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from llama_index.core.base.llms.types import ChatMessage
from mistralai import Mistral
from openai import AsyncOpenAI
from pydantic import BaseModel

from .indexing import load_index
from ...utils import PERSIST_DIR, global_model_settings

REACT_CONTEXT_PROMPT = (
    "If the question can be answered directly from your internal knowledge or indexed "
    "data, DO NOT use any tools. "
    "Only use tools when the question requires real-time, private, or domain-specific "
    "data that you do not already know."
)

logger = logging.getLogger("uvicorn")

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    llm: str
    apiKey: str
    temperature: float
    maxTokens: int
    topP: float


async def rag_chat(request: Request, chatRequest: ChatRequest):
    logger.info(f"Loading index from {PERSIST_DIR}...")
    global_model_settings(
        model_name=chatRequest.llm,
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
    if last_message.role != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Last message must be from user",
        )
    messages = [
        ChatMessage(role=m.role, content=m.content) for m in chatRequest.messages
    ]
    # chat_engine = index.as_chat_engine(chat_mode="condense_plus_context")
    chat_engine = index.as_chat_engine(
        chat_mode="react",
        max_iterations=7,
        verbose=True,
        response_mode="tree_summarize",
        context=REACT_CONTEXT_PROMPT,
    )
    logger.info(f"Chat engine type: {chat_engine.__class__.__name__}")
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
    model_name = chatRequest.llm
    client_args = {"api_key": chatRequest.apiKey}
    messages = [{"role": m.role, "content": m.content} for m in chatRequest.messages]
    if model_name.startswith(("gpt", "deepseek")):
        if model_name.startswith("deepseek"):
            client_args["base_url"] = "https://api.deepseek.com"
            model_name = "deepseek-chat"
        openai_client = AsyncOpenAI(**client_args)
        response = await openai_client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=chatRequest.temperature,
            max_tokens=chatRequest.maxTokens,
            top_p=chatRequest.topP,
            stream=True,
        )
    elif model_name.startswith("mistral"):
        model_name = "mistral-small-latest"
        mistral_client = Mistral(**client_args)
        response = await mistral_client.chat.stream_async(
            model=model_name,
            messages=messages,
            temperature=chatRequest.temperature,
            max_tokens=chatRequest.maxTokens,
            top_p=chatRequest.topP,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported model using pure chat: `{model_name}`.",
        )

    async def token_stream_generator():
        async for chunk in response:
            # TODO: litellm unify
            if model_name.startswith("mistral"):
                chunk = chunk.data
            yield chunk.choices[0].delta.content

    return StreamingResponse(token_stream_generator(), media_type="text/plain")


@router.post("")
async def chat(request: Request, chatRequest: ChatRequest):
    if Path(PERSIST_DIR).exists():
        return await rag_chat(request, chatRequest)
    else:
        logger.info(f"No index found in {PERSIST_DIR}, using simple chat...")
        return await simple_chat(chatRequest)
