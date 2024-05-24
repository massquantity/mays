# mays

This project builds a RAG chatbot based on LlamaIndex. It supports file uploading and chatting.

[Mistral 7B](https://docs.mistral.ai/getting-started/models/) is used as the LLM model, and one can get api key from https://console.mistral.ai/api-keys.

## Running

First, install the dependencies and run the backend. Requires Python >= 3.8.
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
