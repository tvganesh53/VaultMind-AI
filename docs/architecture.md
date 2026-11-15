# VaultMind AI — System Architecture & Trust Boundaries

VaultMind AI provides a mathematically verified, privacy-preserving pipeline separating sensitive user information from public or private Large Language Model (LLM) providers.

---

## 1. High-Level Architecture Diagram

```
                 +---------------------------------------------+
                 |              USER BROWSER                   |
                 |  (React + Vite Modern Cyber Dashboard)      |
                 +----------------------+----------------------+
                                        | HTTPS / REST
                                        v
                 +---------------------------------------------+
                 |          VAULTMIND PRIVACY GATEWAY          |
                 |      (FastAPI Asynchronous Gateway)         |
                 +----------------------+----------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+--------------------------------+             +-------------------------------+
|       PRIVACY SANITIZER        |             |      AES-256-GCM ENGINE       |
| Regex Heuristic Tokenizer:     |             | Persisted Vault Storage:      |
| Cards, Emails, Banks, Aadhaar  |             | CSPRNG 96-bit Nonce           |
| Custom Sensitive Terms         |             | 128-bit GMAC Authentication   |
| -> Produces [TOKEN_#]          |             | -> Stored in Local SQLite     |
+---------------+----------------+             +---------------+---------------+
                |                                              |
                | Sanitized Prompt ONLY                        | Internal KMS Key Fetch
                v                                              v
+--------------------------------+             +-------------------------------+
| ISOLATED AI SERVICE            |             |     KEY MANAGEMENT SERVICE    |
| Zero Key/Share Visibility      |             | Shamir (2,3) Secret Sharing   |
| OpenAI API or Local Mock AI    |             | Over Galois Field GF(p)       |
| Isolated AI Trust Boundary     |             | Software In-Memory Enclave    |
+--------------------------------+             +-------------------------------+
```

---

## 2. Core Modules & Responsibilities

### A. Privacy Gateway (`backend/privacy/redaction.py`)
- **Inspection**: Analyzes inbound user prompts for high-risk PII:
  - Email addresses (RFC 5322 regex)
  - Credit/Debit cards (13–19 digits, Luhn compliance format)
  - Bank account numbers
  - Indian Aadhaar numbers (12 digits)
  - US SSN identifiers (9 digits)
  - Custom user-specified keywords
- **Surrogate Replacement**: Replaces sensitive tokens with numbered categorical markers (e.g., `[EMAIL_1]`, `[CARD_1]`, `[CONFIDENTIAL_1]`).
- **Limitation Acknowledgment**: Heuristic regular expressions cannot detect implicit semantic hints; the platform provides explicit user-tagging controls.

### B. Authenticated Encryption Engine (`backend/security/encryption.py`)
- **Primitive**: AES-256-GCM (Galois/Counter Mode).
- **Entropy Source**: `os.urandom(12)` generates a fresh 96-bit nonce for every single encryption.
- **Integrity**: Produces a 128-bit Galois Message Authentication Code (GMAC) tag. Tampered ciphertexts trigger an immediate `InvalidTag` abort before releasing any plaintext.

### C. Shamir Secret Sharing Engine (`backend/security/secret_sharing.py`)
- **Primitive**: Shamir's $(2, 3)$ Threshold Secret Sharing over Galois Field $\mathbb{F}_p$.
- **Field Prime**: $p = 2^{256} + 297$ (smallest prime strictly greater than $2^{256}$, ensuring full 256-bit key representation).
- **Properties**:
  - Any 2 valid shares reconstruct the master 32-byte key via Lagrange interpolation modulo $p$.
  - 1 share alone contains strictly zero Shannon information.

### D. Key Management Service (`backend/security/key_manager.py`)
- **State Enclave**: Maintains master key bytes strictly in volatile process memory.
- **Public Surface**: Exposes only public key IDs (SHA-256 fingerprints) and masked share formats for custodian verification.
- **Zero-Leakage**: The key manager prevents keys or shares from entering server logs, database audit logs, or AI prompt payloads.

### E. AI Service & Trust Boundary (`backend/ai/agent.py`)
- **Provider Support**: Live OpenAI integration or deterministic offline Mock AI mode.
- **Isolated AI Trust Boundary**: Receives only sanitized prompts (`[TOKEN_#]`). Has no architectural access to database decryption keys or KMS enclaves.

---

## 3. Database Schema

VaultMind utilizes SQLite for local auditability and sealed persistence:
1. `encrypted_vault`:
   - `record_id`: Unique identifier
   - `ciphertext`: Base64 AES-256 ciphertext
   - `nonce`: Base64 96-bit nonce
   - `tag`: Base64 128-bit authentication tag
   - `key_id`: Active KMS fingerprint
   - `created_at`: Ingestion timestamp
2. `audit_logs`:
   - `id`: Auto-incrementing identifier
   - `event_type`: Category (`ENCRYPTION`, `DECRYPTION`, `REDACTION`, `KMS`, `AI_QUERY`, `TAMPER_TEST`)
   - `action`: Specific operation executed
   - `status`: Outcome (`SUCCESS`, `FAILURE`, `TAMPER_DETECTED`)
   - `details`: Non-sensitive descriptive log (plaintext PII and master keys are strictly banned)
