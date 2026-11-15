# Mathematical Explanation of Cryptographic Primitives in VaultMind AI

VaultMind AI bridges privacy-preserving client interaction with cloud LLM inference using a multi-tiered cryptographic and information-theoretic privacy architecture:
1. **Shamir's Secret Sharing Scheme over Finite Field $GF(p)$**
2. **AES-256-GCM Authenticated Encryption with Nonce-Uniqueness**
3. **Information-Theoretic Privacy Boundary & Key Isolation**

---

## 1. Shamir's Secret Sharing Scheme ($k$-of-$n$ Threshold)

### Mathematical Formulation
Shamir's Secret Sharing scheme (introduced by Adi Shamir in 1979) is based on polynomial interpolation over a finite Galois field $\mathbb{F}_p = GF(p)$, where $p$ is a large prime.

Let $S \in \mathbb{F}_p$ denote the master 256-bit AES encryption key represented as an integer:
$$0 \le S < 2^{256} < p$$

To divide the secret $S$ into $n$ shares such that any $k$ shares can reconstruct $S$, but any $k-1$ or fewer shares reveal strictly zero information about $S$, we construct a random polynomial $f(x)$ of degree $k - 1$:
$$f(x) = a_0 + a_1 x + a_2 x^2 + \dots + a_{k-1} x^{k-1} \pmod p$$
where:
- $a_0 = S$ is the constant term (the master secret).
- $a_1, a_2, \dots, a_{k-1}$ are independent, uniformly distributed random coefficients chosen from the complete finite field $\mathbb{F}_p$ using a Cryptographically Secure Pseudorandom Number Generator:
  $$a_1 \leftarrow \text{secrets.randbelow}(p) \quad \text{where } a_1 \in [0, p-1]$$
  Note on Information-Theoretic Security: Generating $a_1$ uniformly across the entire field $\mathbb{F}_p$ (including zero) is strictly required for perfect secrecy, ensuring $H(S \mid \text{Share}_1) = H(S)$.

### VaultMind Parameter Configuration
In VaultMind AI, we instantiate a $(k=2, n=3)$ threshold scheme:
- Threshold $k = 2$
- Total shares $n = 3$
- Prime modulus:
  $$p = 2^{256} + 297$$
  $p$ is the smallest prime strictly greater than $2^{256}$. This guarantees that any 32-byte (256-bit) cryptographic key lies within $\mathbb{F}_p$ without modular truncation or wrap-around distortion.

The polynomial simplifies to a degree-1 linear function:
$$f(x) = S + a_1 x \pmod p$$

Three shares are computed at non-zero points $x \in \{1, 2, 3\}$:
- $\text{Share}_1 = (1, f(1) \pmod p)$
- $\text{Share}_2 = (2, f(2) \pmod p)$
- $\text{Share}_3 = (3, f(3) \pmod p)$

### Lagrange Interpolation at $x = 0$
Given any $k = 2$ distinct points $(x_0, y_0)$ and $(x_1, y_1)$, the polynomial $f(x)$ is uniquely determined by the Lagrange basis polynomials:
$$f(x) = \sum_{j=0}^{k-1} y_j \cdot \ell_j(x) \pmod p$$
where the Lagrange basis polynomial $\ell_j(x)$ is defined as:
$$\ell_j(x) = \prod_{\substack{0 \le m < k \\ m \ne j}} \frac{x - x_m}{x_j - x_m} \pmod p$$

To recover the master secret $S = f(0)$, we evaluate the basis at $x = 0$:
$$\ell_j(0) = \prod_{\substack{0 \le m < k \\ m \ne j}} \frac{-x_m}{x_j - x_m} \pmod p$$

For two shares $(x_0, y_0)$ and $(x_1, y_1)$:
$$\ell_0(0) = \frac{-x_1}{x_0 - x_1} \pmod p$$
$$\ell_1(0) = \frac{-x_0}{x_1 - x_0} \pmod p$$

The master secret is reconstructed as:
$$S = \left[ y_0 \cdot \ell_0(0) + y_1 \cdot \ell_1(0) \right] \pmod p$$
Division by $(x_j - x_m)$ in $\mathbb{F}_p$ is executed via the modular multiplicative inverse:
$$(x_j - x_m)^{-1} \equiv (x_j - x_m)^{p-2} \pmod p \quad \text{(Fermat's Little Theorem)}$$

### Information-Theoretic Security Proof (1 Share is Insufficient)
Suppose an adversary intercepts a single share $(x_0, y_0)$. For any candidate secret $S' \in \mathbb{F}_p$, there exists a unique slope:
$$a_1' = (y_0 - S') \cdot x_0^{-1} \pmod p$$
Because $a_1$ was chosen uniformly at random from $\mathbb{F}_p$:
$$\mathbb{P}(S = S' \mid (x_0, y_0)) = \frac{1}{p} = \mathbb{P}(S = S')$$
Thus, the posterior probability of the secret given one share equals the prior probability. A single share reveals **exactly zero Shannon information** regarding the master encryption key.

---

## 2. AES-256-GCM Authenticated Encryption

VaultMind AI protects persisted records and vault payloads using **Advanced Encryption Standard in Galois/Counter Mode (AES-256-GCM)**, compliant with NIST SP 800-38D.

### Authenticated Encryption Mechanics
AES-256-GCM simultaneously provides:
1. **Confidentiality**: Encrypts plaintext $P$ under CTR mode using a 256-bit key $K$ and a 96-bit Initial Vector / Nonce $IV$:
   $$C_i = P_i \oplus \text{AES}_K(\text{Counter}_i)$$
2. **Integrity & Authenticity**: Computes a 128-bit authentication tag $T$ using Galois field multiplication in $GF(2^{128})$:
   $$H = \text{AES}_K(0^{128})$$
   $$T = \text{GHASH}_H(AAD \mathbin{\Vert} C) \oplus \text{AES}_K(IV \mathbin{\Vert} 0^{31}1)$$

### Nonce Uniqueness Requirement
- For every encryption operation, VaultMind generates a fresh 96-bit (12-byte) nonce using `os.urandom()` (backed by OS CSPRNG: CryptGenRandom / `/dev/urandom`).
- Reusing a nonce under the same key $K$ destroys GCM authenticity guarantees (enabling tag forgery and plaintext XOR recovery). VaultMind strictly enforces random, fresh nonces for every record.

### Tamper Resistance
If any single bit in ciphertext $C$, nonce $IV$, or authentication tag $T$ is manipulated in transit or storage:
$$\text{Tag}_{\text{computed}} \ne T$$
The cryptographic engine aborts execution immediately with an `InvalidTag` exception, rejecting decryption before any corrupted or tampered plaintext is exposed.

---

## 3. Privacy Boundary & Redaction Architecture

Traditional chatbots send user inputs directly to remote inference endpoints, leaking sensitive identifiers (emails, cards, bank accounts, personal identity numbers).

VaultMind AI implements a zero-leakage architectural separation:
1. **Local Vault**: High-risk identifiers are extracted and sealed locally in SQLite via AES-256-GCM.
2. **Sanitization Gateway**: Sensitive entities are replaced by deterministic surrogate tokens:
   $$\text{"My account is 1234567890"} \longrightarrow \text{"My account is [ACCOUNT_1]"}$$
3. **Isolated AI Trust Boundary**: The external LLM (OpenAI or local Mock AI) receives *only* sanitized tokens. The LLM never sees:
   - Plaintext private data
   - AES ciphertext (which LLMs cannot process)
   - Master encryption keys
   - Shamir secret shares

This ensures compliance with modern privacy regulations (GDPR, HIPAA, DPDP) while maintaining intelligent, contextual AI assistance.
