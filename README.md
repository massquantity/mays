# mays

This project builds a RAG chatbot. It supports file uploading and question answering.

Mistral is used as LLM model, one can get api key from https://console.mistral.ai/api-keys.

https://github.com/zylon-ai/private-gpt?tab=readme-ov-file#-architecture
+ The API is built using FastAPI and follows OpenAI's API scheme.
+ The RAG pipeline is based on LlamaIndex.

## Get Started

First, install the dependencies and run the backend.
```bash
$ cd backend
$ pip install -r requirements.txt
$ export MISTRAL_API_KEY=...  # set the mistral api key environment variable
$ python main.py
```

Second, run the frontend. [pnpm](https://pnpm.io/) is used to manage dependencies.
```bash
$ cd frontend
$ pnpm install
$ pnpm run dev
```

Open http://localhost:3000 with your browser to see the result.
