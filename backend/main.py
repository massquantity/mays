import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.chat import router as chat_router
from app.api.routers.indexing import router as indexing_router
from app.api.routers.rag import router as rag_router

app = FastAPI()

if os.getenv("ENVIRONMENT", "dev") == "dev":
    logger = logging.getLogger("uvicorn")
    logger.warning("Running in development mode - allowing CORS for all origins")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(chat_router, prefix="/api/chat")
app.include_router(indexing_router, prefix="/api/indexing")
app.include_router(rag_router, prefix="/api/rag")


if __name__ == "__main__":
    import uvicorn

    app_host = os.getenv("APP_HOST", "0.0.0.0")
    app_port = int(os.getenv("APP_PORT", 8000))
    uvicorn.run(app="main:app", host=app_host, port=app_port, reload=True)
