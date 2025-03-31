import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_FILE_SIZE = 10 * 1024 * 1024  # 10MB
LOG_FILE_COUNT = 5


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name.
    
    Args:
        name: The name of the logger, typically __name__ from the calling module.
    
    Returns:
        A configured logger instance.
    """
    logger = logging.getLogger(name)
    
    # Only configure the logger if it hasn't been configured already
    if not logger.handlers:
        logger.setLevel(getattr(logging, LOG_LEVEL))
        formatter = logging.Formatter(LOG_FORMAT, datefmt="%Y-%m-%d %H:%M:%S")

        # Create console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # Create file handler for persistent logging
        logs_dir = Path("logs")
        logs_dir.mkdir(exist_ok=True)
        
        file_handler = RotatingFileHandler(
            logs_dir / "app.log",
            maxBytes=LOG_FILE_SIZE,
            backupCount=LOG_FILE_COUNT,
            encoding="utf-8",
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        # Set propagation to False to avoid duplicate logs
        logger.propagate = False
    
    return logger


# Set up root logger
root_logger = logging.getLogger()
root_logger.setLevel(getattr(logging, LOG_LEVEL))

# Configure logging for third-party libraries
for logger_name in ["uvicorn", "fastapi"]:
    third_party_logger = logging.getLogger(logger_name)
    third_party_logger.handlers = []  # Remove existing handlers
    third_party_logger.addHandler(logging.NullHandler())
    third_party_logger.propagate = True  # Let root logger handle it
