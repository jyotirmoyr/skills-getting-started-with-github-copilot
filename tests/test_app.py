import pytest
from fastapi.testclient import TestClient
from src.app import app

def test_root():
    client = TestClient(app)
    response = client.get("/")
    # The root endpoint redirects to /static/index.html
    assert response.status_code in (200, 307)
