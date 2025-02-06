# mays

This project is a Retrieval-Augmented Generation (RAG) application powered by LlamaIndex, 
enabling document upload and interactive chat functionality.

Supported LLMs: `gpt-3.5-turbo`, `gpt-4o`, `deepseek`, `mistral`. 
We use models from [Voyage AI](https://www.voyageai.com/)  for [embedding](https://docs.voyageai.com/docs/embeddings) and [reranking](https://docs.voyageai.com/docs/reranker).

Make sure you have configured the API keys for both the LLM and embedding services in the application page.

### Backend Setup

The python backend uses [uv](https://github.com/astral-sh/uv) for dependency and environment management, and requires Python 3.12 or higher. 
The `uv sync --python 3.12` command will:
1. Download and install Python 3.12 if it is not available on your system.
2. Create a virtual environment (if one doesn't already exist).
3. Install all [dependencies](https://github.com/massquantity/mays/blob/main/backend/pyproject.toml#L6) into the environment.

```bash
$ cd backend
$ uv sync --python 3.12
$ uv run main.py  # Starts the backend server
```

### Frontend Setup

The [Next.js](https://nextjs.org/) frontend uses [pnpm](https://pnpm.io/) for package management:

```bash
$ cd frontend
$ pnpm install  # Install dependencies
$ pnpm run dev  # Starts the frontend server
```

Once both servers are running, 🌐 Open http://localhost:3000 in your browser to access the application.
