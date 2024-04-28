import base64
import logging
from pathlib import Path

from fastapi import APIRouter
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from pydantic import BaseModel

from ...utils import (
    DATA_DIR,
    PERSIST_DIR,
    check_api_key,
    create_dir,
    global_model_settings,
)

check_api_key()

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


# todo: add new file, test OpenAI model
@router.post("")
async def indexing(request: UploadRequest):
    global_model_settings()
    create_dir()
    file_path = save_file(request)
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    index = VectorStoreIndex.from_documents(documents, show_progress=True)
    index.storage_context.persist(persist_dir=PERSIST_DIR)
    logger.info(f"Finished indexing to {PERSIST_DIR}...")
