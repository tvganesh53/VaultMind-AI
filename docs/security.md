# VaultMind AI — Security Boundaries & Threat Model

---

## 1. Threat Model & Security Posture

| Threat Vector | Traditional AI Chatbot | VaultMind AI Defense |
|---|---|---|
| **Direct Prompt PII Exposure** | User sends credit card or banking data directly to remote LLM API. | Privacy Gateway redacts PII before dispatch; replaces with `[TOKEN_#]` placeholders. |
| **Data in Transit / Rest Tampering** | Plain unauthenticated storage or ECB/CBC mode susceptible to bit-flipping. | Authenticated AES-256-GCM. 128-bit GMAC tag verification immediately catches any single bit manipulation. |
| **Master Key Compromise** | Single master key stored in plaintext config or database file. | Master key is dynamically generated in an isolated memory enclave and split into 3 Shamir shares (2-of-3 threshold). |
| **Insider Key Exfiltration** | Rogue administrator with access to 1 share attempts recovery. | 1 share reveals strictly zero Shannon information ($H(S \mid \text{Share}_1) = H(S)$). 2 custodians must cooperate. |
| **LLM Hallucinated Key Extraction** | Prompt injection tricks LLM into revealing system secrets or encryption keys. | Isolated trust boundary: The LLM agent has no programmatic access, reference, or environment variables containing key material. |
| **Audit Log Leakage** | Debug logs print user prompts and internal tokens in cleartext. | Audit logging engine strictly strips plaintext PII and master keys. |

---

## 2. Cryptographic Parameter Specification

- **Modulus**: Prime $p = 2^{256} + 297$
- **Interpolation Scheme**: Lagrange Polynomial Evaluation over $\mathbb{F}_p$:
  $$\ell_j(0) = \prod_{m \ne j} \frac{-x_m}{x_j - x_m} \pmod p$$
- **Symmetric Cipher**: AES-256-GCM (NIST SP 800-38D)
- **Nonce Specification**: 96 bits (12 bytes) from OS CSPRNG (`os.urandom`)
- **Authentication Tag**: 128 bits (16 bytes) computed via GHASH in Galois Field $GF(2^{128})$

---

## 3. Residual Limitations & Operational Guidance

1. **Regex Heuristic Boundaries**:
   Regex pattern matching reliably flags standard structured identifiers (emails, cards, 10–12 digit numbers). It cannot detect contextual, implicit, or semantic disclosures (e.g., "The code to the safe is the year my mother was born"). Users must leverage the manual sensitive keyword definition input for domain-specific secrets.
2. **Key Share Custody**:
   Shamir secret sharing provides mathematical information-theoretic protection. Real-world security relies on independent custodians storing their shares across separated physical and network enclaves.
