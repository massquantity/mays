import os
from pathlib import Path

from fastapi import HTTPException, status
from llama_index.core import Settings
from llama_index.embeddings.mistralai import MistralAIEmbedding
from llama_index.llms.mistralai import MistralAI

DATA_DIR = "./data"

PERSIST_DIR = "./index_storage"


def create_save_dirs():
    for d in (DATA_DIR, IMAGE_DIR, PERSIST_DIR):
        d = Path(d)
        if not (d.exists() and d.is_dir()):
            d.mkdir()


def is_dir_empty(directory: str):
    dir_iter = Path(directory).iterdir()
    return len(list(dir_iter)) == 0


def clear_index_dir():
    index_dir = Path(PERSIST_DIR)
    for i in index_dir.iterdir():
        if i.is_file():
            i.unlink()


def check_api_key():
    is_mistral_model = (
        "mistral" in Settings.embed_model.model_name.lower()
        or "mistral" in Settings.llm.__class__.__name__.lower()
    )
    if is_mistral_model and not os.getenv("MISTRAL_API_KEY"):
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
