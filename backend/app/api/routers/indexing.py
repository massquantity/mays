import base64
import subprocess
from pathlib import Path

import Stemmer
import pymupdf
from fastapi import APIRouter, Depends, HTTPException
from llama_index.core import (
    SimpleDirectoryReader,
    StorageContext,
    TreeIndex,
    VectorStoreIndex,
    load_index_from_storage,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import BaseNode
from llama_index.core.storage.docstore import BaseDocumentStore, SimpleDocumentStore
from pydantic import BaseModel
from starlette import status

from ...bm25 import MixedLanguageBM25Retriever
from ...logger import get_logger
from ...utils import (
    BM25_DIR,
    DATA_DIR,
    INDEX_DIR,
    VECTOR_INDEX_ID,
    clear_index_dir,
    create_save_dirs,
    embed_model_settings,
    is_dir_empty,
    load_embed_config,
    save_embed_config,
)

logger = get_logger(__name__)

router = APIRouter()


class UploadRequest(BaseModel):
    fileName: str
    content: str
    isBase64: bool
    embedModel: str
    apiKey: str


def save_file(request: UploadRequest):
    file_name = request.fileName
    file_path = Path(DATA_DIR) / file_name
    file_content = request.content
    if request.isBase64:
        file_content = base64.b64decode(file_content)
        if file_name.endswith("pdf") and is_scanned_pdf(file_content):
            logger.info(f"Detected scanned PDF: {file_name}, performing OCR")
            ocr_pdf(file_content, file_path)
        else:
            file_path.write_bytes(file_content)
    else:
        file_path.write_text(file_content, encoding="utf-8")
    logger.info(f"Finished writing data to {DATA_DIR}/{file_name}")
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
            logger.error("Tesseract is not installed or not working properly")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="`tesseract` is not installed.",
            )
    except FileNotFoundError as err:
        logger.error("Tesseract is not installed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="`tesseract` is not installed.",
        ) from err


def load_index(new_embed_model: str | None = None):
    # ensure indexing construction, index updating and rag using the same embedding setting
    embed_config = load_embed_config()
    embed_model, api_key = embed_config["embed_model"], embed_config["api_key"]
    if new_embed_model and new_embed_model != embed_model:
        logger.warning(
            f"The requested embed_model {new_embed_model} does not match with "
            f"saved embed_model {embed_model}, using {embed_model}..."
        )
    embed_model_settings(embed_model, api_key)
    
    logger.debug(f"Loading index from storage at {INDEX_DIR}")
    storage_context = StorageContext.from_defaults(persist_dir=INDEX_DIR)
    vector_index = load_index_from_storage(storage_context, index_id=VECTOR_INDEX_ID)
    # tree_index = load_index_from_storage(storage_context, index_id=TREE_INDEX_ID)
    return vector_index


@router.post("", dependencies=[Depends(create_save_dirs)])
async def indexing(request: UploadRequest):
    file_path = save_file(request)
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    splitter = SentenceSplitter(chunk_size=512, chunk_overlap=20)
    nodes = await splitter.aget_nodes_from_documents(documents, show_progress=True)
    if is_dir_empty(INDEX_DIR):
        embed_model_settings(request.embedModel, request.apiKey)
        docstore = SimpleDocumentStore()
        await docstore.async_add_documents(nodes)
        storage_context = StorageContext.from_defaults(docstore=docstore)
        vector_index = init_vector_index(nodes, storage_context)
        # tree_index = init_tree_index(nodes, storage_context)
        save_embed_config(request.embedModel, request.apiKey)
    else:
        vector_index = load_index(request.embedModel)
        vector_index.insert_nodes(nodes)
        # tree_index.insert_nodes(nodes)
        clear_index_dir()

    vector_index.set_index_id(index_id=VECTOR_INDEX_ID)
    vector_index.storage_context.persist(persist_dir=INDEX_DIR)
    # tree_index.set_index_id(index_id=TREE_INDEX_ID)
    # tree_index.storage_context.persist(persist_dir=PERSIST_DIR)
    # share same docstore across different index
    # https://docs.llamaindex.ai/en/stable/examples/docstore/DocstoreDemo/
    # assert vector_index.docstore is tree_index.docstore
    bm25_retriever = init_bm25(vector_index.docstore)
    bm25_retriever.persist(BM25_DIR)
    logger.info(f"Finished indexing to {INDEX_DIR} and {BM25_DIR}...")


def init_vector_index(nodes: list[BaseNode], storage_context: StorageContext):
    return VectorStoreIndex(
        nodes=nodes,
        storage_context=storage_context,
        # use_async=True,
        show_progress=True,
    )


def init_tree_index(nodes: list[BaseNode], storage_context: StorageContext):
    return TreeIndex(
        nodes=nodes,
        num_children=10,
        storage_context=storage_context,
        # use_async=True,
        show_progress=True,
    )


def init_bm25(docstore: BaseDocumentStore):
    top_k = min(2, len(docstore.docs))
    # return BM25Retriever.from_defaults(
    #     docstore=docstore,
    #     similarity_top_k=top_k,
    #     stemmer=Stemmer.Stemmer("english"),
    #     language="english",
    # )
    return MixedLanguageBM25Retriever(
        docstore=docstore,
        similarity_top_k=top_k,
        stemmer=Stemmer.Stemmer("english"),
        verbose=True,
    )
