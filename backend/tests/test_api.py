import pytest
from starlette.testclient import TestClient
from main import app
from database.db import db
from security.key_manager import kms

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"

def test_encryption_api_and_no_key_leak():
    payload = {"plaintext": "Super secret patient diagnosis"}
    res = client.post("/api/encrypt", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "ciphertext" in data
    assert "nonce" in data
    assert "tag" in data
    # Ensure key itself is NOT exposed in the response
    assert "key" not in data or "master_key" not in data

    # Decrypt
    dec_res = client.post("/api/decrypt", json={
        "ciphertext": data["ciphertext"],
        "nonce": data["nonce"],
        "tag": data["tag"]
    })
    assert dec_res.status_code == 200
    assert dec_res.json()["plaintext"] == payload["plaintext"]

def test_tamper_api_endpoint():
    # Encrypt first
    enc = client.post("/api/encrypt", json={"plaintext": "Vault Integrity Test"}).json()
    tamper_res = client.post("/api/security/tamper-test", json={
        "ciphertext": enc["ciphertext"],
        "nonce": enc["nonce"],
        "tag": enc["tag"]
    })
    assert tamper_res.status_code == 200
    data = tamper_res.json()
    assert data["tamper_detected"] is True
    assert data["tag_verification_failed"] is True

def test_ai_chat_sanitization_and_isolation():
    prompt = "My credit card is 4111 2222 3333 4444 and my email is testuser@secure.org. Can you check my balance?"
    res = client.post("/api/ai/chat", json={"prompt": prompt})
    assert res.status_code == 200
    data = res.json()
    
    # Check that sanitized prompt was created
    sanitized = data["sanitized_prompt"]
    assert "4111 2222 3333 4444" not in sanitized
    assert "testuser@secure.org" not in sanitized
    assert "[CARD_1]" in sanitized
    assert "[EMAIL_1]" in sanitized

    # Check provider info & isolation
    provider_info = data["provider_info"]
    assert provider_info["key_isolation_verified"] is True
    # Ensure raw API key is never returned
    assert "OPENAI_API_KEY" not in provider_info
    assert "api_key" not in provider_info

def test_audit_logs_contain_no_plaintext_secrets():
    # Retrieve audit events
    res = client.get("/api/security/events?limit=20")
    assert res.status_code == 200
    events = res.json()["events"]
    
    # Audit log details must never contain sensitive cards, emails or raw master keys
    for event in events:
        details = event.get("details", "")
        assert "4111 2222 3333 4444" not in details
        assert "testuser@secure.org" not in details
        # Ensure raw 32-byte key is never logged
        assert "active_master_key" not in details

def test_shamir_key_api_generate_and_recover():
    gen_res = client.post("/api/keys/generate")
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    shares = gen_data["shares"]
    assert len(shares) == 3

    # Attempt recovery with 1 share -> Must fail with 400
    fail_res = client.post("/api/keys/recover", json={"shares": [shares[0]["serialized_share"]]})
    assert fail_res.status_code == 400
    assert "Threshold Violation" in fail_res.json()["detail"]

    # Attempt recovery with 2 shares -> Must succeed
    succ_res = client.post("/api/keys/recover", json={
        "shares": [shares[0]["serialized_share"], shares[1]["serialized_share"]]
    })
    assert succ_res.status_code == 200
    succ_data = succ_res.json()
    assert succ_data["success"] is True
    assert succ_data["matches_active_key"] is True
