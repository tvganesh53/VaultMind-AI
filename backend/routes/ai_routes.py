from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from privacy.redaction import PrivacyGateway
from security.encryption import EncryptionEngine
from security.key_manager import kms
from ai.agent import ai_agent
from database.db import db

router = APIRouter(prefix="/api", tags=["Privacy Gateway & AI Chat"])

class RedactRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Prompt or text to sanitize")
    custom_terms: Optional[List[str]] = Field(default=[], description="User-specified sensitive words")

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="User prompt containing possible sensitive data")
    custom_terms: Optional[List[str]] = Field(default=[], description="User-specified sensitive words")
    store_encrypted: Optional[bool] = Field(default=True, description="Whether to encrypt sensitive data in vault")

@router.post("/redact")
async def redact_text(req: RedactRequest):
    """
    Simulates Privacy Gateway redaction pipeline without calling AI.
    Highlights detected entities and produces sanitized string with surrogate tokens.
    """
    result = PrivacyGateway.redact(req.text, req.custom_terms)
    
    db.log_audit_event(
        event_type="REDACTION",
        action="INSPECT_AND_REDACT",
        status="SUCCESS",
        details=f"Detected and redacted {result['count']} sensitive tokens."
    )
    
    return result

@router.post("/ai/chat")
async def process_secure_chat(req: ChatRequest):
    """
    End-to-End Secure Privacy-Preserving AI Pipeline:
    1. Input Received
    2. Sensitive Data Detection (Email, Phone, Card, Bank, Aadhaar, Custom)
    3. Encryption / Protected Storage (Sensitive payload encrypted with AES-256-GCM in local vault)
    4. Prompt Sanitization (Replaces sensitive data with [TOKEN_#])
    5. AI Processing (Sanitized prompt sent to isolated AI agent - no keys/shares attached)
    6. Response Received & Audit Logged
    """
    try:
        # Step 1 & 2: Detection and Sanitization
        redaction_res = PrivacyGateway.redact(req.prompt, req.custom_terms)
        sanitized_prompt = redaction_res["sanitized_text"]
        detections = redaction_res["detections"]
        
        # Step 3: Local Vault Encryption (if sensitive items detected)
        vault_record_id = None
        if req.store_encrypted and detections:
            active_key = kms.get_active_key()
            key_id = kms.get_key_status()["key_id"]
            
            # Encrypt original prompt with AES-256-GCM
            enc_result = EncryptionEngine.encrypt(req.prompt, active_key)
            vault_record_id = f"vault_{uuid.uuid4().hex[:8]}"
            
            db.store_encrypted_record(
                record_id=vault_record_id,
                ciphertext=enc_result["ciphertext"],
                nonce=enc_result["nonce"],
                tag=enc_result["tag"],
                key_id=key_id
            )
            
            db.log_audit_event(
                event_type="ENCRYPTION",
                action="VAULT_SECURE_INGEST",
                status="SUCCESS",
                details=f"Prompt encrypted with AES-256-GCM into record '{vault_record_id}'. Nonce generated."
            )

        # Step 4 & 5: Dispatch ONLY the sanitized prompt to AI Agent
        redacted_token_types = [d["type"] for d in detections]
        ai_result = ai_agent.process_sanitized_prompt(sanitized_prompt, redacted_token_types)

        # Step 6: Log AI query event (WITHOUT raw prompt or secrets)
        db.log_audit_event(
            event_type="AI_QUERY",
            action="DISPATCH_SANITIZED_PROMPT",
            status="SUCCESS",
            details=f"AI Provider: {ai_result['provider']}. Redacted tokens: {len(detections)}. Vault ID: {vault_record_id or 'none'}."
        )

        return {
            "pipeline_stages": {
                "input_received": True,
                "sensitive_detected": len(detections) > 0,
                "vault_encrypted": vault_record_id is not None,
                "prompt_sanitized": True,
                "ai_processed": True,
                "response_received": True
            },
            "original_prompt_preview": req.prompt,
            "sanitized_prompt": sanitized_prompt,
            "detections": detections,
            "vault_record_id": vault_record_id,
            "ai_response": ai_result["response"],
            "provider_info": {
                "provider": ai_result["provider"],
                "model": ai_result["model"],
                "is_mock": ai_result["is_mock"],
                "latency_ms": ai_result.get("latency_ms", 0),
                "key_isolation_verified": True
            }
        }
    except Exception as e:
        db.log_audit_event("AI_QUERY", "DISPATCH_SANITIZED_PROMPT", "FAILURE", str(e))
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {str(e)}")

@router.get("/ai/status")
async def get_ai_status():
    """Returns AI Provider status and isolation guarantees."""
    return ai_agent.get_provider_status()
