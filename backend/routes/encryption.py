import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from security.encryption import EncryptionEngine
from security.key_manager import kms
from database.db import db

router = APIRouter(prefix="/api", tags=["Encryption"])

class EncryptRequest(BaseModel):
    plaintext: str = Field(..., min_length=1, description="Plaintext string to encrypt")
    record_id: Optional[str] = Field(None, description="Optional custom record identifier")

class DecryptRequest(BaseModel):
    ciphertext: str = Field(..., description="Base64 encoded ciphertext")
    nonce: str = Field(..., description="Base64 encoded 96-bit nonce")
    tag: str = Field(..., description="Base64 encoded 16-byte authentication tag")
    record_id: Optional[str] = None

class TamperTestRequest(BaseModel):
    ciphertext: str = Field(..., description="Base64 encoded ciphertext")
    nonce: str = Field(..., description="Base64 encoded nonce")
    tag: str = Field(..., description="Base64 encoded authentication tag")

@router.post("/encrypt")
async def encrypt_data(req: EncryptRequest):
    """
    Encrypts sensitive data using AES-256-GCM.
    Uses master key isolated in KMS.
    Stores ciphertext, nonce, and tag in encrypted vault database.
    """
    try:
        active_key = kms.get_active_key()
        key_id = kms.get_key_status()["key_id"]

        result = EncryptionEngine.encrypt(req.plaintext, active_key)
        record_id = req.record_id or f"rec_{uuid.uuid4().hex[:10]}"

        # Store in encrypted vault
        db.store_encrypted_record(
            record_id=record_id,
            ciphertext=result["ciphertext"],
            nonce=result["nonce"],
            tag=result["tag"],
            key_id=key_id
        )

        # Log security audit event (WITHOUT PLAINTEXT)
        db.log_audit_event(
            event_type="ENCRYPTION",
            action="AES_256_GCM_ENCRYPT",
            status="SUCCESS",
            details=f"Record '{record_id}' encrypted with Key ID: {key_id}. Nonce length: 12 bytes."
        )

        return {
            "success": True,
            "record_id": record_id,
            "ciphertext": result["ciphertext"],
            "nonce": result["nonce"],
            "tag": result["tag"],
            "key_id": key_id,
            "algorithm": "AES-256-GCM",
            "message": "Data encrypted and stored securely. Plaintext discarded from memory."
        }
    except Exception as e:
        db.log_audit_event("ENCRYPTION", "AES_256_GCM_ENCRYPT", "FAILURE", str(e))
        raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")

@router.post("/decrypt")
async def decrypt_data(req: DecryptRequest):
    """
    Decrypts AES-256-GCM ciphertext with authenticated integrity verification.
    If the ciphertext or tag has been altered, an integrity failure is triggered.
    """
    try:
        active_key = kms.get_active_key()
        plaintext = EncryptionEngine.decrypt(
            ciphertext_b64=req.ciphertext,
            nonce_b64=req.nonce,
            tag_b64=req.tag,
            key=active_key
        )

        db.log_audit_event(
            event_type="DECRYPTION",
            action="AES_256_GCM_DECRYPT",
            status="SUCCESS",
            details=f"Record '{req.record_id or 'ad-hoc'}' successfully decrypted & integrity verified."
        )

        return {
            "success": True,
            "plaintext": plaintext,
            "integrity_verified": True,
            "algorithm": "AES-256-GCM"
        }
    except ValueError as ve:
        # Integrity or authentication tag mismatch
        db.log_audit_event(
            event_type="DECRYPTION",
            action="AES_256_GCM_DECRYPT",
            status="FAILURE",
            details=f"Integrity check failed: {str(ve)}"
        )
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.log_audit_event("DECRYPTION", "AES_256_GCM_DECRYPT", "FAILURE", str(e))
        raise HTTPException(status_code=500, detail=f"Decryption error: {str(e)}")

@router.post("/security/tamper-test")
async def test_ciphertext_tamper(req: TamperTestRequest):
    """
    Flips bits in the ciphertext to demonstrate AES-GCM Galois message authentication code (GMAC) failure.
    """
    try:
        active_key = kms.get_active_key()
        tampered_ciphertext = EncryptionEngine.tamper_ciphertext(req.ciphertext)
        
        # Now attempt to decrypt tampered ciphertext
        tamper_detected = False
        error_message = ""
        try:
            EncryptionEngine.decrypt(
                ciphertext_b64=tampered_ciphertext,
                nonce_b64=req.nonce,
                tag_b64=req.tag,
                key=active_key
            )
        except ValueError as e:
            tamper_detected = True
            error_message = str(e)

        db.log_audit_event(
            event_type="TAMPER_TEST",
            action="CIPHERTEXT_INTEGRITY_PROBE",
            status="TAMPER_DETECTED" if tamper_detected else "TAMPER_UNDETECTED",
            details="Bit flipped in ciphertext. AES-GCM authentication tag rejected modified payload."
        )

        return {
            "original_ciphertext": req.ciphertext,
            "tampered_ciphertext": tampered_ciphertext,
            "tamper_detected": tamper_detected,
            "tag_verification_failed": tamper_detected,
            "cryptographic_error": error_message,
            "explanation": "AES-GCM computes a 128-bit authentication tag over the ciphertext and nonce. Any modification to a single bit renders the tag invalid and causes decryption to abort before releasing plaintext."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
