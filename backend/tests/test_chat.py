import os
os.environ["MISTRAL_API_KEY"] = "..."

from fastapi.testclient import TestClient

from ..main import app

client = TestClient(app)

request = {"messages": [{"role": "user", "content": "Hello, I'm xxx"}]}


def test_chat():
    client = TestClient(app)
    response = client.post("/api/chat", json=request)
    assert response.status_code == 200
    assert len(response.text) > 0


def test_stream_chat():
    client = TestClient(app)
    response = ""
    with client.stream("POST", "/api/chat", json=request) as r:
        for token in r.iter_text():
            response += token
        assert r.status_code == 200
        assert len(response) > 0
