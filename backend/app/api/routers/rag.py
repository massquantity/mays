import json
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from llama_index.core import PromptTemplate
from llama_index.core.agent import ReActAgent
from llama_index.core.base.llms.types import ChatMessage
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.response_synthesizers import TreeSummarize
from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.core.tools import QueryEngineTool
from llama_index.postprocessor.voyageai_rerank import VoyageAIRerank
from mistralai import Mistral
from openai import AsyncOpenAI
from pydantic import BaseModel

from .indexing import load_index
from ...bm25 import MixedLanguageBM25Retriever
from ...logger import get_logger
from ...utils import BM25_DIR, EMBED_DIR, INDEX_DIR, global_model_settings

REACT_CONTEXT_PROMPT = (
    "If the question can be answered directly from your internal knowledge, "
    "DO NOT use any tool. Only use tools when the question requires real-time, "
    "private, or domain-specific data that you do not already know."
)

# "Important: If the question can be answered directly from your internal knowledge, "
# "DO NOT use the context. Only use context when the question requires real-time, "
# "private, or domain-specific data that you do not already know.\n"
TREE_SUMMARIZE_PROMPT = (
    "Context information from multiple sources is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Important: First try to answer the query using only the information provided "
    "in the context above. If you cannot find answer or relevant information in the context, "
    "then and only then use your general knowledge to provide the best possible answer. "
    "Do not indicate whether you used context or general knowledge in your response.\n"
    "Query: {query_str}\n"
    "Answer: "
)

logger = get_logger(__name__)

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


async def get_chat_engine():
    logger.info(f"Loading index from {INDEX_DIR} and {BM25_DIR}...")
    vector_index = load_index()
    vector_retriever = vector_index.as_retriever(similarity_top_k=4, verbose=True)
    # tree_retriever = tree_index.as_retriever(
    #     retriever_mode="select_leaf",
    #     child_branch_factor=2,  # 4, 10
    #     verbose=True,
    # )
    bm25_retriever = MixedLanguageBM25Retriever.from_persist_dir(BM25_DIR)
    retriever = QueryFusionRetriever(
        [vector_retriever, bm25_retriever],
        similarity_top_k=10,
        num_queries=1,  # todo: 4
        retriever_weights=[2.0, 1.0],
        use_async=True,
        verbose=True,
    )
    reranker = init_reranker()
    response_synthesizer = init_response_synthesizer()
    query_engine = RetrieverQueryEngine.from_args(
        retriever=retriever,
        node_postprocessors=[reranker],
        response_synthesizer=response_synthesizer,
        # response_mode="tree_summarize",
        verbose=True,
    )
    query_engine_tool = QueryEngineTool.from_defaults(query_engine)
    react_chat_engine = ReActAgent.from_tools(
        tools=[query_engine_tool],
        max_iterations=7,
        verbose=True,
        context=REACT_CONTEXT_PROMPT,
    )
    return react_chat_engine


def init_reranker():
    config_path = Path(EMBED_DIR) / "embed_config.json"
    config = json.loads(config_path.read_text())
    return VoyageAIRerank(model="rerank-2", api_key=config["api_key"], top_n=2)


def init_response_synthesizer():
    # return CompactAndRefine(
    #     text_qa_template=PromptTemplate(TREE_SUMMARIZE_PROMPT),
    #     verbose=True,
    # )
    return TreeSummarize(
        summary_template=PromptTemplate(TREE_SUMMARIZE_PROMPT),
        use_async=True,
        verbose=True,
    )


async def rag_chat(request: Request, chatRequest: ChatRequest):
    global_model_settings(
        model_name=chatRequest.llm,
        api_key=chatRequest.apiKey,
        temperature=chatRequest.temperature,
        max_tokens=chatRequest.maxTokens,
        top_p=chatRequest.topP,
    )
    chat_engine = await get_chat_engine()
    # chat_engine = index.as_chat_engine(chat_mode="condense_plus_context")
    logger.info(f"Chat engine type: {chat_engine.__class__.__name__}")
    last_message = chatRequest.messages.pop()
    chat_history = [ChatMessage(**m.model_dump()) for m in chatRequest.messages]
    response = await chat_engine.astream_chat(last_message.content, chat_history)
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
    if Path(INDEX_DIR).exists():
        return await rag_chat(request, chatRequest)
    else:
        logger.info(f"No index found in {INDEX_DIR}, using simple chat...")
        return await simple_chat(chatRequest)
