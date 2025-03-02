import logging
import os
import shutil
from pathlib import Path

from fastapi import Depends, FastAPI, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from llama_index.core import Settings, SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.base.base_query_engine import BaseQueryEngine
from llama_index.core.selectors import LLMSingleSelector
from llama_index.core.tools import ToolMetadata
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
from llama_index.multi_modal_llms.ollama import OllamaMultiModal

from app.api.routers.indexing import UploadRequest, load_index, save_file
from app.api.routers.rag import ChatRequest
from app.utils import (
    IMAGE_DIR,
    INDEX_DIR,
    clear_index_dir,
    create_save_dirs,
    is_dir_empty,
)

LLM_MODEL = "qwen2.5:7b"
EMBED_MODEL = "mxbai-embed-large"
MULTI_MODAL_MODEL = "llava:7b"

logger = logging.getLogger("uvicorn")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def init_app_state():
    index = image_name = None
    if Path(INDEX_DIR).exists() and not is_dir_empty(INDEX_DIR):
        index = load_index()
    if Path(IMAGE_DIR).exists() and not is_dir_empty(IMAGE_DIR):
        image_files = Path(IMAGE_DIR).glob("*")
        latest_image = max(image_files, key=lambda p: p.stat().st_mtime)
        image_name = latest_image.name
    app.state.index = index
    app.state.image_name = image_name


init_app_state()

Settings.llm = Ollama(
    model=LLM_MODEL,
    request_timeout=360.0,
    additional_kwargs={"keep_alive": -1},
)
Settings.embed_model = OllamaEmbedding(
    model_name=EMBED_MODEL, ollama_additional_kwargs={"keep_alive": -1}
)


@app.post("/api/indexing", dependencies=[Depends(create_save_dirs)])
async def upload_file(request: UploadRequest):
    file_path = save_file(request)
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    index = app.state.index
    if index is None:
        index = VectorStoreIndex.from_documents(documents, show_progress=True)
    else:
        index.insert(documents[0], show_progress=True)
        clear_index_dir()
    index.storage_context.persist(persist_dir=INDEX_DIR)
    app.state.index = index
    logger.info(f"Finished indexing to {INDEX_DIR}...")


@app.post("/api/image", dependencies=[Depends(create_save_dirs)])
def upload_image(file: UploadFile):
    file_path = Path(IMAGE_DIR) / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    app.state.image_name = file.filename
    logger.info(f"Finished uploading image to {IMAGE_DIR}...")


def select_api(query: str):
    selector = LLMSingleSelector.from_defaults()
    llm_tool = ToolMetadata(
        description="Useful for general purpose question answering", name="llm"
    )
    index_tool = ToolMetadata(
        description="Userful for information retrieval related to documents",
        name="index",
    )
    image_tool = ToolMetadata(
        description="Userful for question answering about images", name="image"
    )
    if app.state.index is None and app.state.image_name is None:
        logger.info("No index or image is found, using basic llm.")
        return "llm"

    names = "llm"
    choices = [llm_tool]
    if app.state.index is not None:
        choices.append(index_tool)
        names += ", index"
    if app.state.image_name is not None:
        choices.append(image_tool)
        names += ", image"
    select_index = selector.select(choices, query).selections[0].index
    api = choices[select_index].name
    logger.info(f"tool choices: {names}, using {api}")
    return api


@app.post("/api/rag")
async def chat(request: Request, chatRequest: ChatRequest):
    query = chatRequest.messages.pop().content
    api = select_api(query)
    if api == "index":
        return await query_index(request, query)
    elif api == "image":
        return await query_image(request, query)
    else:
        return await query_llm(request, query)


async def query_llm(request: Request, query: str):
    response = await Settings.llm.astream_complete(query)

    async def token_stream_generator():
        async for token in response:
            if await request.is_disconnected():
                break
            yield token.delta

    return StreamingResponse(token_stream_generator(), media_type="text/plain")


async def query_index(request: Request, query: str):
    query_engine: BaseQueryEngine = app.state.index.as_query_engine(streaming=True)
    response = await query_engine.aquery(query)

    async def token_stream_generator():
        async for token in response.async_response_gen():
            if await request.is_disconnected():
                break
            yield token

    return StreamingResponse(token_stream_generator(), media_type="text/plain")


async def query_image(request: Request, query: str):
    mm_model = OllamaMultiModal(model=MULTI_MODAL_MODEL)
    file_path = Path(IMAGE_DIR) / app.state.image_name
    image_documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    response = mm_model.stream_complete(query, image_documents)

    async def token_stream_generator():
        for token in response:
            if await request.is_disconnected():
                break
            yield token.text  # token.delta

    return StreamingResponse(token_stream_generator(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn

    app_host = os.getenv("APP_HOST", "0.0.0.0")
    app_port = int(os.getenv("APP_PORT", 8000))
    uvicorn.run(app="main_local:app", host=app_host, port=app_port, reload=True)
