import pytest
from core.bio_utils import calculate_metrics


def test_metrics_returns_all_required_keys():
    """calculate_metrics must return every expected key for downstream consumers."""
    dna = "ACGTACGT" * 50
    metrics = calculate_metrics(dna)
    required_keys = {
        "gc_content", "length", "melting_temp",
        "shannon_entropy", "homopolymer_count",
        "synthesis_cost_usd", "physical_weight_pg",
        "storage_density_pb_per_gram",
    }
    assert required_keys.issubset(metrics.keys()), f"Missing keys: {required_keys - metrics.keys()}"


def test_gc_content_within_biological_range():
    """
    GC content for a homopolymer-free Base-3 encoded sequence should be
    close to 50% (balanced encoding). We check it's within 30-70% — a wide
    but biologically meaningful range.
    """
    from core.encoder import encode_data_to_dna
    data = b"HelixVault GC Content Validation Test Case - long enough to sample well"
    dna_seq = encode_data_to_dna(data, "gc_test.txt")
    metrics = calculate_metrics(dna_seq)
    assert 30.0 <= metrics["gc_content"] <= 70.0, (
        f"GC content {metrics['gc_content']}% is outside the expected biological range."
    )


def test_homopolymer_count_is_zero_for_encoded_sequence():
    """
    Proof of algorithm correctness: an encoded sequence has ZERO homopolymers.
    This is a core guarantee of the Base-3 encoding scheme.
    """
    from core.encoder import encode_data_to_dna
    data = b"Homopolymer-free encoding proof for HelixVault academic review."
    dna_seq = encode_data_to_dna(data, "homo_test.txt")
    metrics = calculate_metrics(dna_seq)
    assert metrics["homopolymer_count"] == 0, (
        f"Expected 0 homopolymers, found {metrics['homopolymer_count']}."
    )


def test_shannon_entropy_within_theoretical_bounds():
    """
    Shannon entropy for DNA must be between 0 and 2.0 bits/symbol.
    (log2(4 bases) = 2.0 is the theoretical maximum for a perfectly random sequence.)
    """
    dna = "ACGTACGT" * 100
    metrics = calculate_metrics(dna)
    assert 0.0 <= metrics["shannon_entropy"] <= 2.0, (
        f"Shannon entropy {metrics['shannon_entropy']} is outside [0, 2.0] theoretical bounds."
    )


def test_synthesis_cost_calculation():
    """synthesis_cost_usd should equal length * $0.10 (industry standard rate)."""
    dna = "ACGT" * 250  # 1000 bp
    metrics = calculate_metrics(dna)
    assert metrics["length"] == 1000
    assert abs(metrics["synthesis_cost_usd"] - 100.0) < 0.01, (
        f"Expected $100.00 for 1000 bp, got ${metrics['synthesis_cost_usd']}"
    )


def test_metrics_empty_sequence_does_not_raise():
    """Empty sequence must return safe defaults, not crash."""
    metrics = calculate_metrics("")
    assert metrics["length"] == 0
    assert metrics["gc_content"] == 0
    assert metrics["homopolymer_count"] == 0
