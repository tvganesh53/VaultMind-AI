import pytest
from privacy.redaction import PrivacyGateway

def test_sensitive_info_redaction():
    text = (
        "Hello, my email is alice@example.com and phone is 9876543210. "
        "Transfer $500 to account 123456789012 or use card 4532-1234-5678-9012."
    )
    result = PrivacyGateway.redact(text)
    sanitized = result["sanitized_text"]

    assert "alice@example.com" not in sanitized
    assert "9876543210" not in sanitized
    assert "123456789012" not in sanitized
    assert "4532-1234-5678-9012" not in sanitized
    assert "[EMAIL_1]" in sanitized
    assert "[CARD_1]" in sanitized
    assert result["count"] >= 4

def test_custom_user_defined_terms_redaction():
    text = "Project Falcon uses secret key AlphaOmega for authentication."
    result = PrivacyGateway.redact(text, custom_terms=["Falcon", "AlphaOmega"])
    sanitized = result["sanitized_text"]

    assert "Falcon" not in sanitized
    assert "AlphaOmega" not in sanitized
    assert "[CONFIDENTIAL_1]" in sanitized
    assert "[CONFIDENTIAL_2]" in sanitized

def test_aadhaar_redaction():
    text = "Citizen Aadhaar number is 5432 1234 5678 for verification."
    result = PrivacyGateway.redact(text)
    sanitized = result["sanitized_text"]

    assert "5432 1234 5678" not in sanitized
    assert "[AADHAAR_1]" in sanitized
