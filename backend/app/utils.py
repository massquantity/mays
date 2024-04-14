import os
import shutil
from pathlib import Path

from fastapi import HTTPException, status
from llama_index.core import Settings
from llama_index.embeddings.mistralai import MistralAIEmbedding
from llama_index.llms.mistralai import MistralAI

DATA_DIR = "./data"

PERSIST_DIR = "./index_storage"


def create_dir():
    data_dir, index_dir = Path(DATA_DIR), Path(PERSIST_DIR)
    if not data_dir.exists():
        data_dir.mkdir()

    if not index_dir.exists():
        index_dir.mkdir()
    else:
        shutil.rmtree(index_dir)


def check_api_key():
    if not os.getenv("MISTRAL_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid mistral api key. Get it from https://console.mistral.ai/api-keys/",
        )


def global_model_settings():
    Settings.llm = MistralAI(
        model="mistral-tiny", api_key=os.environ["MISTRAL_API_KEY"]
    )
    Settings.embed_model = MistralAIEmbedding(
        model_name="mistral-embed", api_key=os.environ["MISTRAL_API_KEY"]
    )
