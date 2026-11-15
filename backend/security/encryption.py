import os
import base64
from typing import Dict, Any, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

class EncryptionEngine:
    """
    AES-256-GCM Authenticated Encryption Engine.
    Provides confidentiality, integrity, and authenticity guarantees.
    Every encryption produces a cryptographically secure fresh 96-bit (12-byte) nonce.
    """

    KEY_SIZE_BYTES = 32  # 256-bit key
    NONCE_SIZE_BYTES = 12  # 96-bit standard GCM nonce

    @classmethod
    def generate_key(cls) -> bytes:
        """Generates a cryptographically secure 256-bit AES key using os.urandom."""
        return AESGCM.generate_key(bit_length=256)

    @classmethod
    def encrypt(cls, plaintext: str, key: bytes, associated_data: bytes = None) -> Dict[str, str]:
        """
        Encrypts plaintext string using AES-256-GCM.
        Returns base64 encoded ciphertext, nonce, and tag (tag is appended or separated).
        AESGCM.encrypt in cryptography appends the 16-byte authentication tag to the ciphertext.
        """
        if not isinstance(key, bytes) or len(key) != cls.KEY_SIZE_BYTES:
            raise ValueError(f"Encryption key must be exactly {cls.KEY_SIZE_BYTES} bytes (256 bits).")

        if not isinstance(plaintext, str):
            raise TypeError("Plaintext must be a string.")

        # Cryptographically secure random 96-bit nonce for EVERY encryption
        nonce = os.urandom(cls.NONCE_SIZE_BYTES)
        aesgcm = AESGCM(key)

        # AESGCM.encrypt returns ciphertext + 16-byte tag
        ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), associated_data)
        
        # In AESGCM standard output: ciphertext[:-16] is raw ciphertext, ciphertext[-16:] is auth tag
        raw_ciphertext = ciphertext_with_tag[:-16]
        tag = ciphertext_with_tag[-16:]

        return {
            "ciphertext": base64.b64encode(raw_ciphertext).decode('utf-8'),
            "nonce": base64.b64encode(nonce).decode('utf-8'),
            "tag": base64.b64encode(tag).decode('utf-8'),
            "full_payload": base64.b64encode(nonce + ciphertext_with_tag).decode('utf-8')
        }

    @classmethod
    def decrypt(cls, ciphertext_b64: str, nonce_b64: str, tag_b64: str, key: bytes, associated_data: bytes = None) -> str:
        """
        Decrypts AES-256-GCM ciphertext and validates integrity and authenticity tag.
        Raises InvalidTag if ciphertext, nonce, or tag was tampered with.
        """
        if not isinstance(key, bytes) or len(key) != cls.KEY_SIZE_BYTES:
            raise ValueError(f"Decryption key must be exactly {cls.KEY_SIZE_BYTES} bytes (256 bits).")

        try:
            raw_ciphertext = base64.b64decode(ciphertext_b64)
            nonce = base64.b64decode(nonce_b64)
            tag = base64.b64decode(tag_b64)
        except Exception as e:
            raise ValueError(f"Invalid base64 payload: {str(e)}")

        if len(nonce) != cls.NONCE_SIZE_BYTES:
            raise ValueError(f"Invalid nonce length: expected {cls.NONCE_SIZE_BYTES} bytes, got {len(nonce)}.")
        if len(tag) != 16:
            raise ValueError(f"Invalid auth tag length: expected 16 bytes, got {len(tag)}.")

        aesgcm = AESGCM(key)
        # AESGCM expects ciphertext + tag
        ciphertext_with_tag = raw_ciphertext + tag

        try:
            decrypted_bytes = aesgcm.decrypt(nonce, ciphertext_with_tag, associated_data)
            return decrypted_bytes.decode('utf-8')
        except InvalidTag:
            raise ValueError("Authentication verification failed: Ciphertext or authentication tag has been tampered with or key is invalid.")
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")

    @classmethod
    def tamper_ciphertext(cls, ciphertext_b64: str) -> str:
        """
        Utility for security lab to flip bits in base64 ciphertext to demonstrate
        AES-GCM authentication failure.
        """
        data = bytearray(base64.b64decode(ciphertext_b64))
        if len(data) > 0:
            data[0] ^= 0xFF  # Flip all bits of the first byte
        else:
            data.append(0x42)
        return base64.b64encode(bytes(data)).decode('utf-8')
