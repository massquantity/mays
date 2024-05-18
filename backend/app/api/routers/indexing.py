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
    check_api_key,
    clear_index_dir,
    create_save_dirs,
    global_model_settings,
    is_index_empty,
)

logger = logging.getLogger("uvicorn")

router = APIRouter()


class UploadRequest(BaseModel):
    fileName: str
    content: str
    isBase64: bool


def save_file(request: UploadRequest):
    # todo: plain-text, docx
    file_path = Path(DATA_DIR) / request.fileName
    file_content = base64.b64decode(request.content)
    file_path.write_bytes(file_content)
    logger.info(f"Finished writing data to {DATA_DIR}...")
    return file_path


def load_index():
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    return load_index_from_storage(storage_context)


@router.post(
    "",
    dependencies=[
        Depends(check_api_key),
        Depends(global_model_settings),
        Depends(create_save_dirs),
    ],
)
async def indexing(request: UploadRequest):
    file_path = save_file(request)
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    if is_index_empty():
        index = VectorStoreIndex.from_documents(documents, show_progress=True)
    else:
        index = load_index()
        for doc in documents:
            index.insert(doc, show_progress=True)
        clear_index_dir()
    index.storage_context.persist(persist_dir=PERSIST_DIR)
    logger.info(f"Finished indexing to {PERSIST_DIR}...")
