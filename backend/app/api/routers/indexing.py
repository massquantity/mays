import base64
import logging
import subprocess
from pathlib import Path

import pymupdf
from fastapi import APIRouter, Depends, HTTPException
from llama_index.core import (
    SimpleDirectoryReader,
    StorageContext,
    VectorStoreIndex,
    load_index_from_storage,
)
from pydantic import BaseModel
from starlette import status

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
    file_name = request.fileName
    file_path = Path(DATA_DIR) / file_name
    file_content = request.content
    if request.isBase64:
        file_content = base64.b64decode(file_content)
        if file_name.endswith("pdf") and is_scanned_pdf(file_content):
            ocr_pdf(file_content, file_path)
        else:
            file_path.write_bytes(file_content)
    else:
        file_path.write_text(file_content, encoding="utf-8")
    logger.info(f"Finished writing data to {DATA_DIR}...")
    return file_path


def is_scanned_pdf(content: bytes):
    document = pymupdf.open("pdf", content)
    for page in document:
        text = page.get_text()
        if text.strip():
            return False
    return True


def ocr_pdf(content: bytes, file_path: Path):
    _check_tesseract_installed()
    src_doc = pymupdf.open("pdf", content)
    dst_doc = pymupdf.open()
    for page in src_doc:
        pix = page.get_pixmap(dpi=150)
        ocr_bytes = pix.pdfocr_tobytes(
            language="eng+chi_sim", tessdata="/usr/share/tesseract-ocr/4.00/tessdata"
        )
        img_pdf = pymupdf.open("pdf", ocr_bytes)
        dst_doc.insert_pdf(img_pdf)
        img_pdf.close()
    dst_doc.save(file_path)


def _check_tesseract_installed():
    try:
        res = subprocess.run(
            ["tesseract", "--version"], stdout=subprocess.PIPE, text=True
        )
        if res.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="`tesseract` is not installed.",
            )
    except FileNotFoundError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="`tesseract` is not installed.",
        ) from err


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
