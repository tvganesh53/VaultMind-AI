import secrets
from typing import List, Tuple

class ShamirSecretSharing:
    """
    Shamir's Secret Sharing Scheme over Galois Field GF(p).
    Configured for (k=2, n=3) threshold:
      - 3 independently generated shares.
      - Any 2 shares can reconstruct the master secret S.
      - 1 share reveals strictly ZERO information about S (information-theoretic security).
    
    Polynomial: f(x) = S + a_1 * x mod p
    where:
      S is the master key integer,
      a_1 is a cryptographically secure random coefficient from secrets.randbelow(p),
      p is a prime strictly greater than the maximum secret size (256-bit prime).
    """

    # Standard 257-bit Mersenne prime: 2^257 - 93 (or 2^256 + 297, or Secp256k1 prime)
    # Secp256k1 order/prime is standard for 256-bit cryptography:
    # 2^256 - 2^32 - 977 (strictly greater than any 32-byte / 256-bit integer if using 2^256+407)
    # Standard 257-bit prime strictly greater than 2^256 (smallest prime > 2^256 is 2^256 + 297)
    # Ensures every 32-byte (256-bit) integer fits strictly within the Galois field GF(p)
    PRIME: int = (2 ** 256) + 297

    THRESHOLD: int = 2
    TOTAL_SHARES: int = 3

    @classmethod
    def split_secret(cls, secret_bytes: bytes, n: int = TOTAL_SHARES, k: int = THRESHOLD) -> List[Tuple[int, int]]:
        """
        Splits a 32-byte secret into n shares with threshold k.
        Returns a list of tuples: [(1, y_1), (2, y_2), ..., (n, y_n)]
        """
        if len(secret_bytes) != 32:
            raise ValueError("Secret must be exactly 32 bytes (256 bits).")

        secret_int = int.from_bytes(secret_bytes, byteorder='big')
        if secret_int >= cls.PRIME:
            raise ValueError("Secret integer exceeds prime field modulus.")

        # Generate k - 1 random coefficients for polynomial f(x) = S + a1*x + ... + a_(k-1)*x^(k-1) mod p
        # For k = 2, we need exactly 1 random coefficient a_1
        coefficients = [secret_int]
        for _ in range(k - 1):
            # Cryptographically secure random integer uniformly chosen from GF(p), i.e., [0, PRIME - 1]
            coef = secrets.randbelow(cls.PRIME)
            coefficients.append(coef)

        # Generate n shares at distinct non-zero coordinates x = 1, 2, ..., n
        shares = []
        for x in range(1, n + 1):
            y = cls._evaluate_polynomial(coefficients, x, cls.PRIME)
            shares.append((x, y))

        return shares

    @classmethod
    def reconstruct_secret(cls, shares: List[Tuple[int, int]], prime: int = None) -> bytes:
        """
        Reconstructs the 32-byte secret using Lagrange interpolation modulo p.
        Requires at least k=2 valid distinct shares.
        """
        if prime is None:
            prime = cls.PRIME

        if len(shares) < cls.THRESHOLD:
            raise ValueError(f"Insufficient shares: threshold is {cls.THRESHOLD}, but provided {len(shares)}.")

        # Validate distinct x coordinates and check for valid range
        x_coords = [s[0] for s in shares]
        if len(set(x_coords)) != len(x_coords):
            raise ValueError("Duplicate shares detected. Shares must have distinct x coordinates.")

        for x, y in shares:
            if not (1 <= x <= 255):
                raise ValueError(f"Invalid share x coordinate: {x}")
            if not (0 <= y < prime):
                raise ValueError(f"Invalid share y coordinate for x={x}")

        # Compute Lagrange interpolation at x = 0:
        # S = f(0) = sum_{j=0}^{k-1} [ y_j * prod_{m != j} (0 - x_m) / (x_j - x_m) ] mod p
        k_shares = shares[:cls.THRESHOLD]
        secret_int = 0

        for j, (xj, yj) in enumerate(k_shares):
            numerator = 1
            denominator = 1
            for m, (xm, _) in enumerate(k_shares):
                if m == j:
                    continue
                numerator = (numerator * (-xm)) % prime
                denominator = (denominator * (xj - xm)) % prime

            # Modular inverse: denominator^(-1) mod prime
            # Using Fermat's Little Theorem: a^(p-2) mod p since p is prime
            inv_denominator = pow(denominator, prime - 2, prime)
            lagrange_basis = (numerator * inv_denominator) % prime
            secret_int = (secret_int + (yj * lagrange_basis)) % prime

        # Convert back to 32 bytes
        return secret_int.to_bytes(32, byteorder='big')

    @classmethod
    def _evaluate_polynomial(cls, coefficients: List[int], x: int, prime: int) -> int:
        """Evaluates f(x) = sum(c_i * x^i) mod p using Horner's method."""
        result = 0
        for coeff in reversed(coefficients):
            result = (result * x + coeff) % prime
        return result

    @classmethod
    def format_share(cls, share: Tuple[int, int]) -> str:
        """Formats share (x, y) into a clean hex string 'x-hex(y)'."""
        x, y = share
        return f"{x}-{hex(y)[2:]}"

    @classmethod
    def parse_share(cls, share_str: str) -> Tuple[int, int]:
        """Parses share string 'x-hex' back to (x, y)."""
        parts = share_str.strip().split("-")
        if len(parts) != 2:
            raise ValueError("Invalid share format. Expected 'x-<hex_value>'.")
        x = int(parts[0])
        y = int(parts[1], 16)
        return (x, y)
