import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.chat import router

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

app.include_router(router, prefix="/api/chat")


if __name__ == "__main__":
    import uvicorn

    app_host = os.getenv("APP_HOST", "0.0.0.0")
    app_port = int(os.getenv("APP_PORT", 8000))
    uvicorn.run(app="main:app", host=app_host, port=app_port, reload=True)
