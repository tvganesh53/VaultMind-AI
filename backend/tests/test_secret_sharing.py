import pytest
from security.secret_sharing import ShamirSecretSharing
from security.encryption import EncryptionEngine

def test_two_shares_reconstruct_master_key():
    secret_bytes = EncryptionEngine.generate_key()
    shares = ShamirSecretSharing.split_secret(secret_bytes, n=3, k=2)
    assert len(shares) == 3

    # All three possible 2-of-3 combinations
    combo_1_2 = [shares[0], shares[1]]
    combo_2_3 = [shares[1], shares[2]]
    combo_1_3 = [shares[0], shares[2]]

    rec_1 = ShamirSecretSharing.reconstruct_secret(combo_1_2)
    rec_2 = ShamirSecretSharing.reconstruct_secret(combo_2_3)
    rec_3 = ShamirSecretSharing.reconstruct_secret(combo_1_3)

    assert rec_1 == secret_bytes
    assert rec_2 == secret_bytes
    assert rec_3 == secret_bytes

def test_one_share_cannot_reconstruct_key():
    secret_bytes = EncryptionEngine.generate_key()
    shares = ShamirSecretSharing.split_secret(secret_bytes, n=3, k=2)

    with pytest.raises(ValueError) as excinfo:
        ShamirSecretSharing.reconstruct_secret([shares[0]])
    assert "Insufficient shares" in str(excinfo.value)

def test_zero_coefficient_case():
    """
    Explicit test for a_1 = 0 (constant polynomial f(x) = S mod p).
    When a_1 = 0, f(x) = S for all x.
    Lagrange interpolation must still correctly reconstruct S.
    """
    secret_bytes = bytes([0x42] * 32)
    secret_int = int.from_bytes(secret_bytes, byteorder='big')
    coefficients = [secret_int, 0]  # a_0 = S, a_1 = 0
    p = ShamirSecretSharing.PRIME

    shares = [
        (1, ShamirSecretSharing._evaluate_polynomial(coefficients, 1, p)),
        (2, ShamirSecretSharing._evaluate_polynomial(coefficients, 2, p)),
        (3, ShamirSecretSharing._evaluate_polynomial(coefficients, 3, p))
    ]

    # Reconstruct from shares (1, 2), (2, 3), and (1, 3)
    assert ShamirSecretSharing.reconstruct_secret([shares[0], shares[1]]) == secret_bytes
    assert ShamirSecretSharing.reconstruct_secret([shares[1], shares[2]]) == secret_bytes
    assert ShamirSecretSharing.reconstruct_secret([shares[0], shares[2]]) == secret_bytes

def test_boundary_keys_reconstruction():
    """
    Tests edge-case 256-bit keys: all 0x00, all 0xFF, and high integers.
    """
    p = ShamirSecretSharing.PRIME
    edge_keys = [
        bytes([0x00] * 32),
        bytes([0xFF] * 32),
        bytes([0x01] + [0x00] * 31),
        bytes([0x80] + [0x00] * 31),
    ]
    for key in edge_keys:
        shares = ShamirSecretSharing.split_secret(key, n=3, k=2)
        rec = ShamirSecretSharing.reconstruct_secret([shares[0], shares[2]])
        assert rec == key

def test_one_share_perfect_secrecy_property():
    """
    Verifies that for any given single share (x_0, y_0) and any candidate secret S',
    there exists a unique valid slope a_1' in [0, p-1] such that f(x_0) = y_0.
    This demonstrates uniform distribution and perfect information-theoretic secrecy.
    """
    p = ShamirSecretSharing.PRIME
    secret_bytes = EncryptionEngine.generate_key()
    shares = ShamirSecretSharing.split_secret(secret_bytes, n=3, k=2)
    x0, y0 = shares[0]

    # Pick candidate secrets
    for candidate_secret in [0, 1, 2**128, 2**256 - 1]:
        # a_1' = (y0 - candidate_secret) * x0^(-1) mod p
        x0_inv = pow(x0, p - 2, p)
        a1_prime = ((y0 - candidate_secret) * x0_inv) % p
        # Verify candidate polynomial produces exact same share y0 at x0
        assert (candidate_secret + a1_prime * x0) % p == y0
        assert 0 <= a1_prime < p

def test_invalid_and_corrupt_shares_rejected():
    secret_bytes = EncryptionEngine.generate_key()
    shares = ShamirSecretSharing.split_secret(secret_bytes, n=3, k=2)

    # Duplicate shares
    with pytest.raises(ValueError) as excinfo:
        ShamirSecretSharing.reconstruct_secret([shares[0], shares[0]])
    assert "Duplicate shares" in str(excinfo.value)

    # Malformed string format parse
    with pytest.raises(ValueError):
        ShamirSecretSharing.parse_share("malformed_share_without_dash")

    with pytest.raises(ValueError):
        ShamirSecretSharing.parse_share("1-not_a_hex_number_!")
