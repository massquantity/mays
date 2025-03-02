import json
import logging
import os
from pathlib import Path

from fastapi import HTTPException, status
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.embeddings.mistralai import MistralAIEmbedding
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.embeddings.openai import OpenAIEmbedding, OpenAIEmbeddingModelType
from llama_index.embeddings.voyageai import VoyageEmbedding
from llama_index.llms.deepseek import DeepSeek
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.llms.mistralai import MistralAI
from llama_index.llms.ollama import Ollama
from llama_index.llms.openai import OpenAI

PERSIST_DIR = Path.cwd().absolute() / "persist_dir"
DATA_DIR = str(PERSIST_DIR / "data")
EMBED_DIR = str(PERSIST_DIR / "embed")
IMAGE_DIR = str(PERSIST_DIR / "images")
INDEX_DIR = str(PERSIST_DIR / "index_storage")
BM25_DIR = str(PERSIST_DIR / "bm25_retriever")
VECTOR_INDEX_ID = "vector_index"
TREE_INDEX_ID = "tree_index"

logger = logging.getLogger("uvicorn")


def create_save_dirs():
    for d in (DATA_DIR, IMAGE_DIR, INDEX_DIR):
        d = Path(d)
        if not (d.exists() and d.is_dir()):
            d.mkdir(parents=True)


def is_dir_empty(directory: str):
    dir_iter = Path(directory).iterdir()
    return len(list(dir_iter)) == 0


def clear_index_dir():
    index_dir = Path(INDEX_DIR)
    for i in index_dir.iterdir():
        if i.is_file():
            i.unlink()


def check_api_key():
    is_mistral_model = (
        "mistral" in Settings.embed_model.model_name.lower()
        or "mistral" in Settings.llm.class_name()
    )
    if is_mistral_model and not os.getenv("MISTRAL_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid mistral api key. Get it from https://console.mistral.ai/api-keys/",
        )


def load_embed_config():
    config_path = Path(EMBED_DIR) / "embed_config.json"
    if config_path.exists():
        return json.loads(config_path.read_text())
    else:
        logger.error("No embed_config found, file should be indexed first.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No embed_config found.",
        )


def save_embed_config(embed_model: str, api_key: str):
    config_path = Path(EMBED_DIR) / "embed_config.json"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    file = json.dumps({"embed_model": embed_model, "api_key": api_key}, indent=4)
    config_path.write_text(file)


def embed_model_settings(model_name: str, api_key: str):
    if model_name.startswith("gpt"):
        Settings.embed_model = OpenAIEmbedding(
            model=OpenAIEmbeddingModelType.TEXT_EMBED_3_SMALL,
            dimensions=256,
            api_key=api_key,
        )
    elif model_name.startswith("mistral"):
        Settings.embed_model = MistralAIEmbedding(
            model_name="mistral-embed", api_key=api_key
        )
    elif model_name.startswith("voyage"):
        Settings.embed_model = VoyageEmbedding(
            model_name="voyage-3", voyage_api_key=api_key
        )
    elif model_name.startswith("ollama"):
        Settings.embed_model = OllamaEmbedding(
            model_name="mxbai-embed-large", ollama_additional_kwargs={"keep_alive": -1}
        )
    elif model_name.startswith("huggingface"):
        model_folder = Path.home() / "Workspace/models/huggingface"
        Settings.embed_model = HuggingFaceEmbedding(
            model_name=f"{model_folder}/bge-large-zh-v1.5",
            cache_folder=model_folder,
            query_instruction="为这个句子生成表示以用于检索相关文章：",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported embed model: `{model_name}`.",
        )


def global_model_settings(
    model_name: str, api_key: str, temperature: float, max_tokens: int, top_p: float
):
    if model_name.startswith("gpt"):
        Settings.llm = OpenAI(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
            additional_kwargs={"top_p": top_p},
        )
    elif model_name.startswith("mistral"):
        Settings.llm = MistralAI(
            model="mistral-small-latest",
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
            additional_kwargs={"top_p": top_p},
        )
    elif model_name.startswith("deepseek"):
        Settings.llm = DeepSeek(
            model="deepseek-chat",
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
            additional_kwargs={"top_p": top_p},
        )
    elif model_name.startswith("ollama"):
        Settings.llm = Ollama(
            model="qwen2.5:7b",
            request_timeout=360.0,
            temperature=temperature,
            additional_kwargs={
                "keep_alive": -1,
                "num_ctx": 4096,
                "num_predict": max_tokens,
                "top_p": top_p,
            },
        )
    elif model_name.startswith("huggingface"):
        model_folder = Path.home() / "Workspace/models/huggingface"
        Settings.llm = HuggingFaceLLM(
            model_name=f"{model_folder}/Qwen2-0.5B-Instruct",
            tokenizer_name=f"{model_folder}/Qwen2-0.5B-Instruct",
            max_new_tokens=max_tokens,
            model_kwargs={"cache_dir": model_folder},
            tokenizer_kwargs={"cache_dir": model_folder},
            generate_kwargs={"temperature": temperature, "top_p": top_p},
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported llm model: `{model_name}`.",
        )
