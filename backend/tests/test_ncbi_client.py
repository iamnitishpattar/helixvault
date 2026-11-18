import pytest
import os
from core.ncbi_client import ncbi_client, CURATED_CATALOG, CACHE_DIR

def test_curated_catalog_integrity():
    assert len(CURATED_CATALOG) >= 5
    for acc, meta in CURATED_CATALOG.items():
        assert "accession" in meta
        assert "title" in meta
        assert meta["length"] > 0

def test_fetch_curated_reference():
    # Should resolve immediately from disk cache or curated catalog without network timeout
    seq, meta = ncbi_client.fetch_sequence("pUC19")
    assert len(seq) > 500
    assert all(c in "ACGT" for c in seq)
    assert meta["status"] in ["verified", "curated_reference", "disk_cache", "fallback_reference"]

def test_fetch_unknown_accession_fallback():
    # An unknown or invalid accession should gracefully fall back to authentic E. coli biological seed
    seq, meta = ncbi_client.fetch_sequence("NON_EXISTENT_ACCESSION_99999999")
    assert len(seq) >= 1000
    assert all(c in "ACGT" for c in seq)
    assert meta["source"] in ["curated_biological_seed", "disk_cache", "curated_catalog", "disk_cache_fallback"]

def test_search_nucleotides_fallback():
    # Should return results even offline by matching curated catalog
    count, pages, results = ncbi_client.search_nucleotides("plasmid", max_results=3, page=1)
    assert count > 0
    assert pages >= 1
    assert len(results) <= 3
    assert any("pUC19" in r["title"] or "plasmid" in r["title"].lower() or "plasmid" in r.get("source", "").lower() for r in results)

def test_check_health():
    health = ncbi_client.check_health()
    assert "status" in health
    assert "is_online" in health
    assert "cached_genomes_count" in health
    assert health["cached_genomes_count"] >= 5
    assert health["api_key_configured"] is True
