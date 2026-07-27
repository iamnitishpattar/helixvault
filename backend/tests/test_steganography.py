import pytest
from core.steganography import embed_in_host, extract_from_host


def test_embed_extract_roundtrip():
    """Embedding and then extracting a payload must return the original DNA sequence."""
    payload = "ACGTACGTACGTACGT" * 10
    embedded = embed_in_host(payload)
    extracted = extract_from_host(embedded)
    assert extracted == payload


def test_embedded_sequence_is_longer_than_payload():
    """The host sequence wraps the payload, so the result must be larger than the input."""
    payload = "ACGT" * 50
    embedded = embed_in_host(payload)
    assert len(embedded) > len(payload), "Embedded sequence must be longer than the raw payload."


def test_extract_without_markers_returns_input():
    """
    If a sequence has no steganography markers (e.g., a raw FASTA without stego),
    extract_from_host must gracefully return the entire input — not crash.
    """
    raw_sequence = "ACGTACGTACGT"
    result = extract_from_host(raw_sequence)
    assert result == raw_sequence


def test_markers_are_present_in_embedded_sequence():
    """The start marker must be embedded in the host sequence."""
    from core.steganography import _get_stego_markers
    payload = "ACGT" * 20
    embedded = embed_in_host(payload)
    start_v2, _, start_v1, _, legacy_start, _ = _get_stego_markers()
    assert any(marker in embedded for marker in [start_v2, start_v1, legacy_start]), "No valid steganographic start marker found in embedded sequence."
