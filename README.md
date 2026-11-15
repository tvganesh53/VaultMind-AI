# VaultMind AI — Privacy-Preserving AI Agent
## Mathematics for Systems Security: AI Pipeline Secret Sharing

VaultMind AI is an enterprise-grade cybersecurity prototype created for the **Mathematics for Systems Security Hackathon (AI Pipeline Secret Sharing Track)**.

VaultMind AI resolves a fundamental vulnerability in generative AI pipelines: **the inadvertent leakage of confidential user credentials, bank records, and personal identifiers to external Large Language Models (LLMs).**

---

## 🌟 Core Innovations & Highlights

- **AES-256-GCM Authenticated Storage**: Local encryption with fresh 96-bit CSPRNG nonces and 128-bit GMAC authentication tags to ensure confidentiality and integrity against bit-flipping attacks.
- **Shamir (2-of-3) Secret Sharing Engine**: Master key partitioned mathematically on a linear polynomial $f(x) = S + a_1 x \pmod p$ over Galois Field $GF(2^{256} + 297)$. Any 2 shares reconstruct the key via Lagrange interpolation; 1 share alone contains zero Shannon information.
- **Isolated AI Trust Boundary**: Pre-inference inspection engine that redacts sensitive PII (emails, cards, bank accounts, Aadhaar/national IDs, and custom keywords), sending only sanitized surrogate tokens (`[TOKEN_#]`) to the LLM.
- **Zero Key Exposure**: Cryptographic keys and Shamir shares are strictly isolated in memory and never accessible to the AI model, server logs, or client-side storage.
- **Interactive Security Operations Center (SOC)**: High-fidelity dark glassmorphic cybersecurity dashboard with 6 specialized labs:
  1. **Home / Landing Page**
  2. **Security Dashboard** (Live telemetry, throughput charts, engine states)
  3. **Secure AI Chat** (Real-time 6-stage pipeline visualization)
  4. **Encryption Lab** (Live encryption, authenticated decryption, bit-flip tamper testing)
  5. **Secret Sharing Lab** (Key splitting, 2-share reconstruction, 1-share rejection proof)
  6. **Security Monitor** (Non-sensitive immutable audit log stream)

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.12)
- Node.js 18+ (Tested on Node 24)

### 1. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment if not already present
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Add your OpenAI API key to backend/.env
# If omitted, VaultMind AI automatically operates in deterministic Offline Mock Mode!

# Run the FastAPI server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API and Swagger UI will be available at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```powershell
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Automated Security Test Suite

To run all 16 automated cryptographic and privacy tests:
```powershell
# In project root
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\python.exe -m pytest backend/tests -v
```

Verified Test Scenarios:
- `test_aes_encryption_and_decryption`: Verifies bidirectional AES-256-GCM cipher validity.
- `test_wrong_key_fails_decryption`: Confirms invalid keys trigger authentication errors.
- `test_modified_ciphertext_fails_authentication`: Confirms 1-bit tamper triggers GMAC verification rejection.
- `test_nonce_uniqueness_every_encryption`: Validates fresh 96-bit nonce generation.
- `test_two_shares_reconstruct_master_key`: Proves all pairs ((1,2), (2,3), (1,3)) reconstruct the key.
- `test_one_share_cannot_reconstruct_key`: Proves 1 share fails mathematically.
- `test_invalid_and_corrupt_shares_rejected`: Proves corrupt shares are rejected.
- `test_sensitive_info_redaction`: Proves emails, cards, bank accounts, Aadhaar are redacted.
- `test_custom_user_defined_terms_redaction`: Validates user-defined sensitive word masking.
- `test_ai_chat_sanitization_and_isolation`: Proves sensitive data is missing from LLM dispatch.
- `test_audit_logs_contain_no_plaintext_secrets`: Guarantees audit logs exclude cleartext secrets.

---

## 📐 Cryptographic Specifications

- **Galois Field Prime**: $p = 2^{256} + 297$ (Smallest prime $> 2^{256}$)
- **Secret Sharing Scheme**: $(k=2, n=3)$ Shamir Polynomial Interpolation
- **Symmetric Cipher**: AES-256-GCM (NIST SP 800-38D)
- **Nonce Size**: 96 bits (12 bytes CSPRNG)
- **Authentication Tag Size**: 128 bits (16 bytes GMAC)
- **Zero-Knowledge Principle**: The AI inference component possesses zero awareness of master key material.

---

## 📜 Devpost Submission Artifacts
- [Mathematical Explanation](file:///c:/Users/tvgan/Downloads/VaultMind-AI/docs/mathematical_explanation.md)
- [System Architecture](file:///c:/Users/tvgan/Downloads/VaultMind-AI/docs/architecture.md)
- [Security Threat Model](file:///c:/Users/tvgan/Downloads/VaultMind-AI/docs/security.md)
