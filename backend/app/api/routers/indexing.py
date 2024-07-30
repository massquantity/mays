import base64
import logging
from pathlib import Path

from fastapi import APIRouter, Depends
from llama_index.core import (
    SimpleDirectoryReader,
    StorageContext,
    VectorStoreIndex,
    load_index_from_storage,
)
from pydantic import BaseModel

from ...utils import (
    DATA_DIR,
    PERSIST_DIR,
    clear_index_dir,
    create_save_dirs,
    embed_model_settings,
    is_dir_empty,
)

logger = logging.getLogger("uvicorn")

router = APIRouter()


class UploadRequest(BaseModel):
    fileName: str
    content: str
    isBase64: bool
    modelName: str
    apiKey: str


def save_file(request: UploadRequest):
    file_path = Path(DATA_DIR) / request.fileName
    file_content = request.content
    if request.isBase64:
        file_content = base64.b64decode(file_content)
        file_path.write_bytes(file_content)
    else:
        file_path.write_text(file_content, encoding="utf-8")
    logger.info(f"Finished writing data to {DATA_DIR}...")
    return file_path


def load_index():
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    return load_index_from_storage(storage_context)


@router.post("", dependencies=[Depends(create_save_dirs)])
async def indexing(request: UploadRequest):
    embed_model_settings(request.modelName, request.apiKey)
    file_path = save_file(request)
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    if is_dir_empty(PERSIST_DIR):
        index = VectorStoreIndex.from_documents(documents, show_progress=True)
    else:
        index = load_index()
        for doc in documents:
            index.insert(doc, show_progress=True)
        clear_index_dir()
    index.storage_context.persist(persist_dir=PERSIST_DIR)
    logger.info(f"Finished indexing to {PERSIST_DIR}...")
