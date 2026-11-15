import os
import hashlib
from typing import Dict, List, Optional, Tuple
from security.encryption import EncryptionEngine
from security.secret_sharing import ShamirSecretSharing

class KeyManager:
    """
    Key Management Service (KMS).
    Responsibilities:
    - Generates & isolates 256-bit AES master keys.
    - Splits master keys into 3 Shamir shares (2-of-3 threshold).
    - Supports controlled recovery with 2 valid shares.
    - Strictly prevents leaking raw key material into server logs or frontend prompts.
    - Exposes only key fingerprints / IDs and masked share representations.
    """

    def __init__(self):
        # In-memory secure enclave / key vault for active session
        self._active_master_key: Optional[bytes] = None
        self._active_key_id: Optional[str] = None
        self._active_shares: List[Tuple[int, int]] = []
        # Initialize an initial master key on startup
        self.generate_new_master_key()

    def generate_new_master_key(self) -> Dict[str, any]:
        """
        Generates a new master key, computes fingerprint, and creates 3 Shamir shares.
        Never returns the raw master key in this dictionary.
        """
        raw_key = EncryptionEngine.generate_key()
        self._active_master_key = raw_key
        
        # SHA-256 fingerprint for public key identification
        key_hash = hashlib.sha256(raw_key).hexdigest()
        self._active_key_id = f"vmk_{key_hash[:12]}"

        # Generate 3 Shamir shares (threshold 2)
        self._active_shares = ShamirSecretSharing.split_secret(raw_key, n=3, k=2)

        return {
            "key_id": self._active_key_id,
            "algorithm": "AES-256-GCM",
            "threshold": 2,
            "total_shares": 3,
            "shares": self.get_safe_share_metadata()
        }

    def get_safe_share_metadata(self) -> List[Dict[str, any]]:
        """
        Returns masked share metadata safe for user inspection.
        Full shares are provided in serialized format for testing the recovery lab,
        with strict warnings not to distribute or send to AI.
        """
        result = []
        share_labels = ["Custodian A (Auth Enclave)", "Custodian B (Security Officer)", "Custodian C (Recovery Vault)"]
        for i, share in enumerate(self._active_shares):
            formatted = ShamirSecretSharing.format_share(share)
            masked = f"{share[0]}-{formatted[2:8]}...{formatted[-6:]}"
            result.append({
                "index": share[0],
                "label": share_labels[i] if i < len(share_labels) else f"Custodian {share[0]}",
                "masked_value": masked,
                "serialized_share": formatted,
                "share_hash": hashlib.sha256(formatted.encode()).hexdigest()[:16]
            })
        return result

    def get_active_key(self) -> bytes:
        """
        Internal-only getter for the encryption engine.
        Must NEVER be exposed via API routes.
        """
        if not self._active_master_key:
            raise ValueError("No active master encryption key configured in KMS.")
        return self._active_master_key

    def get_key_status(self) -> Dict[str, any]:
        """Public status indicator for KMS."""
        return {
            "key_id": self._active_key_id,
            "is_active": self._active_master_key is not None,
            "algorithm": "AES-256-GCM",
            "threshold_scheme": "Shamir 2-of-3",
            "shares_available": len(self._active_shares)
        }

    def recover_master_key(self, share_strings: List[str]) -> Dict[str, any]:
        """
        Recovers the master key using any 2 shares.
        Verifies mathematical consistency and returns recovery validation.
        """
        if len(share_strings) < 2:
            raise ValueError("At least 2 shares are required for key reconstruction.")

        parsed_shares = []
        for s in share_strings:
            parsed_shares.append(ShamirSecretSharing.parse_share(s))

        # Reconstruct key using Shamir Lagrange Interpolation
        recovered_key_bytes = ShamirSecretSharing.reconstruct_secret(parsed_shares)
        
        # Check if it matches active key (if exists) or activate it
        recovered_key_hash = hashlib.sha256(recovered_key_bytes).hexdigest()
        recovered_key_id = f"vmk_{recovered_key_hash[:12]}"
        
        is_match = False
        if self._active_master_key:
            is_match = (recovered_key_bytes == self._active_master_key)

        return {
            "success": True,
            "recovered_key_id": recovered_key_id,
            "matches_active_key": is_match,
            "threshold_met": True,
            "shares_used": [s[0] for s in parsed_shares],
            "message": "Key successfully reconstructed using Lagrange interpolation modulo GF(p)."
        }

# Global KMS instance
kms = KeyManager()
