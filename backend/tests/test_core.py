import pytest
from core.encoder import encode_data_to_dna, decode_dna_to_data


def test_encode_decode_roundtrip():
    """Basic encode → decode roundtrip must return identical data."""
    original_data = b"Hello, DNA Storage!"
    filename = "test.txt"
    dna_seq = encode_data_to_dna(original_data, filename)
    decoded_data, decoded_filename = decode_dna_to_data(dna_seq)
    assert decoded_data == original_data
    assert decoded_filename == filename


def test_no_homopolymers_in_encoded_sequence():
    """The homopolymer-free guarantee: no two adjacent identical bases."""
    data = b"HelixVault Academic Project - Testing Homopolymer Constraint"
    dna_seq = encode_data_to_dna(data, "test.txt")
    for i in range(len(dna_seq) - 1):
        assert dna_seq[i] != dna_seq[i + 1], f"Homopolymer found at position {i}: '{dna_seq[i]}'"


def test_all_256_byte_values_encode_correctly():
    """Every possible byte value (0-255) must survive the encode → decode pipeline."""
    all_bytes = bytes(range(256))
    dna_seq = encode_data_to_dna(all_bytes, "all_bytes.bin")
    decoded, _ = decode_dna_to_data(dna_seq)
    assert decoded == all_bytes


def test_encoded_sequence_uses_only_valid_bases():
    """DNA sequence must only contain the four canonical bases: A, C, G, T."""
    data = b"Validate DNA alphabet compliance."
    dna_seq = encode_data_to_dna(data, "alphabet_check.txt")
    invalid = set(dna_seq) - {'A', 'C', 'G', 'T'}
    assert not invalid, f"Invalid bases found in sequence: {invalid}"


def test_different_files_produce_different_sequences():
    """Two different files must produce different DNA sequences."""
    seq1 = encode_data_to_dna(b"File A content", "a.txt")
    seq2 = encode_data_to_dna(b"File B content different", "b.txt")
    assert seq1 != seq2


def test_filename_is_preserved_in_roundtrip():
    """The original filename must be embedded in and recovered from the DNA sequence."""
    data = b"some data"
    filename = "my_important_document.pdf"
    dna_seq = encode_data_to_dna(data, filename)
    _, recovered_filename = decode_dna_to_data(dna_seq)
    assert recovered_filename == filename


def test_empty_data_encodes_and_decodes():
    """Edge case: empty byte string must not raise an exception."""
    dna_seq = encode_data_to_dna(b"", "empty.txt")
    decoded, fname = decode_dna_to_data(dna_seq)
    assert decoded == b""
    assert fname == "empty.txt"
