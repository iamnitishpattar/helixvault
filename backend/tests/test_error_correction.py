import pytest
import random
from core.error_correction import apply_error_correction, remove_error_correction


def test_ecc_encode_decode_roundtrip():
    """Reed-Solomon encode → decode must return the original data unchanged."""
    original = b"HelixVault Reed-Solomon Error Correction Test"
    encoded = apply_error_correction(original)
    decoded = remove_error_correction(encoded)
    assert decoded == original


def test_ecc_encoded_is_longer_than_original():
    """ECC adds redundant parity bytes, so encoded output must be longer than input."""
    original = b"Some data to protect."
    encoded = apply_error_correction(original)
    assert len(encoded) > len(original), (
        f"ECC encoded length ({len(encoded)}) must be greater than original ({len(original)})."
    )


def test_ecc_corrects_up_to_25_byte_errors():
    """
    Core academic claim: Reed-Solomon with 50 ECC bytes can correct up to 25 byte errors.
    We corrupt exactly 25 bytes and verify perfect recovery.
    """
    original = b"A" * 200  # Use a chunk smaller than RS block size
    encoded = bytearray(apply_error_correction(original))

    # Corrupt exactly 25 bytes at arbitrary positions
    positions = random.sample(range(len(encoded)), 25)
    for pos in positions:
        encoded[pos] = (encoded[pos] + 1) % 256  # Flip the byte

    decoded = remove_error_correction(bytes(encoded))
    assert decoded == original, "Reed-Solomon failed to correct 25 byte errors."


def test_ecc_raises_on_excessive_corruption():
    """
    Beyond the 25-byte threshold, Reed-Solomon should raise ValueError.
    This test confirms the system correctly signals irrecoverable data.
    """
    original = b"X" * 100
    encoded = bytearray(apply_error_correction(original))

    # Corrupt 40 bytes — well beyond the 25-byte correction capacity
    positions = list(range(40))
    for pos in positions:
        encoded[pos] = (encoded[pos] + 127) % 256

    with pytest.raises(ValueError, match="too corrupted"):
        remove_error_correction(bytes(encoded))


def test_ecc_all_zeros_roundtrip():
    """Edge case: a buffer of all zero bytes must survive ECC encoding and decoding."""
    original = bytes(100)
    encoded = apply_error_correction(original)
    decoded = remove_error_correction(encoded)
    assert decoded == original
