from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from security.key_manager import kms
from database.db import db

router = APIRouter(prefix="/api/keys", tags=["Key Management & Shamir Secret Sharing"])

class RecoverKeyRequest(BaseModel):
    shares: List[str] = Field(..., min_length=1, max_length=3, description="List of share strings 'x-hex'")

@router.get("/status")
async def get_kms_status():
    """Returns public KMS status without exposing key bytes."""
    return kms.get_key_status()

@router.post("/generate")
async def generate_master_key():
    """
    Generates a new master key and creates a 2-of-3 Shamir split.
    Master key bytes are kept isolated in memory; only key ID and masked shares are returned.
    """
    try:
        result = kms.generate_new_master_key()
        db.log_audit_event(
            event_type="KMS",
            action="GENERATE_MASTER_KEY",
            status="SUCCESS",
            details=f"New master key generated (ID: {result['key_id']}). Split into 3 Shamir shares (Threshold: 2)."
        )
        return {
            "success": True,
            "key_id": result["key_id"],
            "threshold": result["threshold"],
            "total_shares": result["total_shares"],
            "shares": result["shares"],
            "message": "Master key generated in secure memory and partitioned into 3 Shamir shares. Raw key never leaves the KMS enclave."
        }
    except Exception as e:
        db.log_audit_event("KMS", "GENERATE_MASTER_KEY", "FAILURE", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recover")
async def recover_master_key(req: RecoverKeyRequest):
    """
    Tests Shamir key recovery.
    - If 2 or 3 valid shares are provided: Reconstructs key via Lagrange interpolation.
    - If 1 share is provided: Fails mathematically because threshold is 2.
    """
    num_shares = len(req.shares)
    
    if num_shares < 2:
        db.log_audit_event(
            event_type="KMS",
            action="RECOVER_MASTER_KEY",
            status="FAILURE",
            details=f"Unauthorized key recovery attempt with insufficient shares ({num_shares}/2 provided)."
        )
        raise HTTPException(
            status_code=400,
            detail="Threshold Violation: Shamir (2,3) scheme requires at least 2 independent shares to reconstruct the master secret. 1 share alone contains zero Shannon information."
        )

    try:
        recovery_result = kms.recover_master_key(req.shares)
        db.log_audit_event(
            event_type="KMS",
            action="RECOVER_MASTER_KEY",
            status="SUCCESS",
            details=f"Master key successfully reconstructed using {num_shares} shares: {req.shares[0][:4]}..., {req.shares[1][:4]}..."
        )
        return recovery_result
    except ValueError as ve:
        db.log_audit_event("KMS", "RECOVER_MASTER_KEY", "FAILURE", f"Invalid shares: {str(ve)}")
        raise HTTPException(status_code=400, detail=f"Invalid share data: {str(ve)}")
    except Exception as e:
        db.log_audit_event("KMS", "RECOVER_MASTER_KEY", "FAILURE", str(e))
        raise HTTPException(status_code=500, detail=f"Key recovery failed: {str(e)}")
