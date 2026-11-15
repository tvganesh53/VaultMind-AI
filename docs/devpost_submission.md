# VaultMind AI — Devpost Project Submission & Video Script

## Project Title
**VaultMind AI — Privacy-Preserving AI Agent with Shamir Secret Sharing & Authenticated Encryption**

## Tagline
*Your Data. Your Keys. Your Privacy. Air-gapping sensitive user identity and financial records from external AI models using Shamir (2-of-3) Secret Sharing and AES-256-GCM.*

---

## 1. Devpost Project Description

### Inspiration
The rapid adoption of conversational AI poses a critical enterprise dilemma: employees and customers inadvertently paste sensitive data (credit cards, bank accounts, emails, patient IDs) directly into AI prompts. Transmitting raw plaintext to external cloud LLMs violates privacy regulations (GDPR, HIPAA, DPDP) and risks data exfiltration. Furthermore, naive encryption cannot solve this—ordinary AES ciphertext is unintelligible noise to an LLM.

We asked ourselves: **Can we design an architecture that mathematically seals confidential records in local storage, sanitizes conversational prompts before inference, and protects the master encryption key using threshold cryptography so no single entity or AI provider can compromise it?**

### What It Does
**VaultMind AI** is an enterprise-grade privacy gateway and cryptographic system that acts as an intelligent trust boundary between users and LLMs:
1. **Privacy Redaction Gateway**: Scans prompts for financial identifiers (credit cards, bank accounts), contact details (emails, phone numbers), and national IDs (Aadhaar, SSN). It substitutes them with readable surrogate placeholders (e.g. `[CARD_1]`, `[EMAIL_1]`).
2. **AES-256-GCM Sealed Vault**: Simultaneously seals the sensitive user payload in a local authenticated encrypted vault using random 96-bit CSPRNG nonces and 128-bit GMAC tags.
3. **Shamir (2-of-3) Secret Sharing**: The 256-bit master key is split into 3 independent mathematical shares on a degree-1 polynomial $f(x) = S + a_1 x \pmod p$ over Galois Field $GF(2^{256} + 297)$. Any 2 custodian shares reconstruct the key; 1 share alone contains zero Shannon information.
4. **Isolated AI Trust Boundary**: The external LLM (OpenAI or offline deterministic Mock AI) receives *strictly* sanitized tokens. The LLM has zero architectural access to master keys, secret shares, or raw database records.
5. **Interactive Security Operations Center**: A cybersecurity dashboard featuring an Encryption Lab (with live bit-flip tamper demonstration), Secret Sharing Lab (2-share recovery and 1-share rejection testing), and an immutable Security Audit Monitor.

### How We Built It
- **Cryptographic Backend**: Python, `cryptography` library (AES-256-GCM), custom Shamir implementation over Galois Field $GF(2^{256} + 297)$ using CSPRNG randomness (`secrets`), and SQLite for encrypted record management.
- **API & Pipeline Gateway**: FastAPI, Pydantic v2, Uvicorn, and Starlette.
- **Frontend SOC**: React 19, Vite, Recharts for cryptographic throughput metrics, Lucide React icons, and a custom dark glassmorphic cybersecurity design system.

### Mathematical & Cryptographic Highlights
- **Galois Field Modulus**: We selected $p = 2^{256} + 297$, the smallest prime strictly greater than $2^{256}$, ensuring 256-bit AES keys fit naturally in $\mathbb{F}_p$ without truncation.
- **Lagrange Reconstruction**:
  $$S = \sum_{j=0}^{k-1} y_j \prod_{m \ne j} \frac{-x_m}{x_j - x_m} \pmod p$$
  with modular inversion calculated via Fermat's Little Theorem ($a^{p-2} \pmod p$).
- **Authentication Guarantee**: AES-GCM tags guarantee that flipping even a single bit in the ciphertext causes immediate GMAC verification failure before any plaintext is released.

### What We Learned & Overcame
- In threshold secret sharing, choosing a prime smaller than $2^{256}$ causes modular distortion for random 256-bit keys. Deriving the exact prime $2^{256} + 297$ solved this while guaranteeing information-theoretic security.
- Balancing regex tokenization with surrogate placeholders ensures the LLM retains enough context to answer queries without ever viewing private identifiers.

---

## 2. 2-Minute Demonstration Video Script

**[Visual: Opening shot of VaultMind AI Landing Page in Dark Cybersecurity Mode]**
> *"Every day, millions of users paste sensitive information—credit card numbers, bank accounts, and personal emails—into AI chatbots. But sending this confidential data to external LLMs creates massive privacy and compliance risks."*

**[Visual: Transition to Secure AI Chat Page]**
> *"Enter VaultMind AI: an enterprise privacy-preserving AI architecture built for the Mathematics for Systems Security hackathon. Let's see it in action."*

**[Visual: User clicks sample prompt containing card number 4532... and email alice@vaultcorp.com, then clicks 'Process Through Privacy Gateway']**
> *"Here, the user submits a financial query with a credit card, email, and bank account. Watch the 6-stage pipeline execute in real time:*
> *First, the Privacy Gateway detects all sensitive identifiers.*
> *Second, it seals the original data in a local AES-256-GCM encrypted vault.*
> *Third, it sanitizes the prompt, replacing confidential entities with surrogate tokens like `[CARD_1]` and `[EMAIL_1]`.*
> *And finally, it sends ONLY the sanitized prompt to the AI. Notice what the AI sees: zero card numbers, zero emails, and zero encryption keys. The AI gives an intelligent, contextual answer without ever seeing the private data!"*

**[Visual: Switch to Secret Sharing Lab Page]**
> *"Now, how do we protect the master encryption key? Let's open the Secret Sharing Lab.*
> *Using Shamir's Secret Sharing over Galois Field GF(2^256 + 297), VaultMind splits the 256-bit AES master key across three independent custodian shares."*

**[Visual: Click 'Test 1-Share Recovery']**
> *"What if an attacker gets hold of one share? Let's test single-share recovery. The system immediately rejects it! By information theory, a single share reveals exactly zero bits of the master key."*

**[Visual: Select Share 1 and Share 3, then click 'Reconstruct Key']**
> *"Now, we select any two valid shares—Custodian A and Custodian C. Using Lagrange polynomial interpolation, the master key is reconstructed with 100% mathematical precision!"*

**[Visual: Switch to Encryption Lab Page and click 'Test Tampering']**
> *"In the Encryption Lab, every encryption produces a fresh 96-bit CSPRNG nonce and a 128-bit GMAC tag. If an attacker flips even a single bit of ciphertext in transit, AES-GCM immediately catches the tamper and aborts decryption."*

**[Visual: Show Security Monitor and Dashboard]**
> *"Finally, our Security Monitor logs every cryptographic operation, while guaranteeing that no plaintext secrets or master keys ever leak into audit trails.*
> *VaultMind AI: Your Data. Your Keys. Your Privacy."*
