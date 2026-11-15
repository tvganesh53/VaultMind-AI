import pytest
import base64
from security.encryption import EncryptionEngine

def test_aes_encryption_and_decryption():
    key = EncryptionEngine.generate_key()
    assert len(key) == 32
    
    plaintext = "Sensitive Financial Record: Account 9876543210 with balance $1,250,000"
    enc = EncryptionEngine.encrypt(plaintext, key)
    
    assert "ciphertext" in enc
    assert "nonce" in enc
    assert "tag" in enc
    assert enc["ciphertext"] != plaintext
    
    decrypted = EncryptionEngine.decrypt(enc["ciphertext"], enc["nonce"], enc["tag"], key)
    assert decrypted == plaintext

def test_wrong_key_fails_decryption():
    key1 = EncryptionEngine.generate_key()
    key2 = EncryptionEngine.generate_key()
    plaintext = "Confidential Patient Data"
    
    enc = EncryptionEngine.encrypt(plaintext, key1)
    
    with pytest.raises(ValueError) as excinfo:
        EncryptionEngine.decrypt(enc["ciphertext"], enc["nonce"], enc["tag"], key2)
    assert "Authentication verification failed" in str(excinfo.value) or "invalid" in str(excinfo.value)

def test_modified_ciphertext_fails_authentication():
    key = EncryptionEngine.generate_key()
    plaintext = "Secure Key Material"
    enc = EncryptionEngine.encrypt(plaintext, key)
    
    tampered_ciphertext = EncryptionEngine.tamper_ciphertext(enc["ciphertext"])
    assert tampered_ciphertext != enc["ciphertext"]
    
    with pytest.raises(ValueError) as excinfo:
        EncryptionEngine.decrypt(tampered_ciphertext, enc["nonce"], enc["tag"], key)
    assert "Authentication verification failed" in str(excinfo.value)

def test_nonce_uniqueness_every_encryption():
    key = EncryptionEngine.generate_key()
    plaintext = "Identical Input Message"
    
    enc1 = EncryptionEngine.encrypt(plaintext, key)
    enc2 = EncryptionEngine.encrypt(plaintext, key)
    
    # Even with identical plaintext and key, nonces must be completely different
    assert enc1["nonce"] != enc2["nonce"]
    assert enc1["ciphertext"] != enc2["ciphertext"]
