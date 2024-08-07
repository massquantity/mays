import os
from pathlib import Path

from fastapi import HTTPException, status
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.embeddings.mistralai import MistralAIEmbedding
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.embeddings.openai import OpenAIEmbedding, OpenAIEmbeddingModelType
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.llms.mistralai import MistralAI
from llama_index.llms.ollama import Ollama
from llama_index.llms.openai import OpenAI

DATA_DIR = "./data"
IMAGE_DIR = "./images"
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


def embed_model_settings(model_name: str, api_key: str):
    if "gpt" in model_name:
        Settings.embed_model = OpenAIEmbedding(
            model=OpenAIEmbeddingModelType.TEXT_EMBED_3_SMALL,
            dimensions=256,
            api_key=api_key,
        )
    elif "mistral" in model_name:
        Settings.embed_model = MistralAIEmbedding(
            model_name="mistral-embed", api_key=api_key
        )
    elif "ollama" in model_name:
        Settings.embed_model = OllamaEmbedding(
            model_name="mxbai-embed-large", ollama_additional_kwargs={"keep_alive": -1}
        )
    elif "huggingface" in model_name:
        model_folder = Path.home() / "Workspace/models/huggingface"
        Settings.embed_model = HuggingFaceEmbedding(
            model_name=f"{model_folder}/bge-large-zh-v1.5", cache_folder=model_folder
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported embed model: `{model_name}`.",
        )


def global_model_settings(
    model_name: str, api_key: str, temperature: float, max_tokens: int, top_p: float
):
    if "gpt" in model_name:
        Settings.llm = OpenAI(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
            additional_kwargs={"top_p": top_p},
        )
    elif "mistral" in model_name:
        Settings.llm = MistralAI(
            model="mistral-tiny",
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
            additional_kwargs={"top_p": top_p},
        )
    elif "ollama" in model_name:
        Settings.llm = Ollama(
            model="qwen2:7b",  # phi3, yi:6b-chat-v1.5-q4_0
            request_timeout=360.0,
            temperature=temperature,
            additional_kwargs={
                "keep_alive": -1,
                "num_ctx": 4096,
                "num_predict": max_tokens,
                "top_p": top_p,
            },
        )
    elif "huggingface" in model_name:
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
