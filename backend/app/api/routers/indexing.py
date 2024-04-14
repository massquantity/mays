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
    file_content = base64.b64decode(request.content)
    with open(Path(DATA_DIR) / request.fileName, "wb") as f:
        f.write(file_content)
    logger.info(f"Finished writing data to {DATA_DIR}...")


# todo: add new file, test OpenAI model
@router.post("")
async def indexing(request: UploadRequest):
    global_model_settings()
    create_dir()
    save_file(request)
    documents = SimpleDirectoryReader(DATA_DIR).load_data()
    index = VectorStoreIndex.from_documents(documents)
    index.storage_context.persist(persist_dir=PERSIST_DIR)
    logger.info(f"Finished indexing to {PERSIST_DIR}...")
