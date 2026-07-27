import pytest
from core.security import encrypt_data, decrypt_data


def test_encrypt_decrypt_roundtrip():
    """AES-256 encrypt → decrypt must return the original plaintext."""
    original = b"HelixVault AES-256 Security Test Payload"
    password = "StrongPassword123!"
    ciphertext = encrypt_data(original, password)
    plaintext = decrypt_data(ciphertext, password)
    assert plaintext == original


def test_wrong_password_raises_value_error():
    """Decrypting with the wrong password must raise ValueError, not silently corrupt."""
    original = b"Sensitive Data"
    correct_password = "CorrectPassword"
    wrong_password = "WrongPassword"
    ciphertext = encrypt_data(original, correct_password)
    with pytest.raises(ValueError, match="Decryption failed"):
        decrypt_data(ciphertext, wrong_password)


def test_ciphertext_is_not_plaintext():
    """Encrypted output must differ from the original input (basic sanity check)."""
    original = b"Plaintext that must not appear in ciphertext"
    password = "password"
    ciphertext = encrypt_data(original, password)
    assert original not in ciphertext


def test_same_data_produces_different_ciphertext_each_time():
    """
    AES-256-CBC uses a random salt and IV on each call.
    Two encryptions of the same plaintext must produce different ciphertexts.
    This proves we are NOT using ECB mode (a common security mistake).
    """
    original = b"Same plaintext"
    password = "same_password"
    ct1 = encrypt_data(original, password)
    ct2 = encrypt_data(original, password)
    assert ct1 != ct2, "Two encryptions of the same data returned identical ciphertext (IV/salt reuse bug!)"


def test_encrypted_payload_contains_salt_and_iv():
    """
    Our encrypted format is: [16-byte salt] + [16-byte IV] + [ciphertext].
    The output must be at least 32 bytes even for empty input.
    """
    ciphertext = encrypt_data(b"", "password")
    assert len(ciphertext) >= 32, "Ciphertext is too short to contain salt and IV."
