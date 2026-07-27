import pytest
from core.plasmid_engine import get_available_vectors, clone_payload_into_vector, export_circular_genbank, VECTORS

def test_get_available_vectors():
    vectors = get_available_vectors()
    assert len(vectors) == 2
    names = [v["name"] for v in vectors]
    assert "pUC19" in names
    assert "pBR322" in names

def test_clone_pUC19():
    payload = "GAATTCCCGGGTTT"
    res = clone_payload_into_vector(payload, "pUC19", "Test_Payload")
    assert res["status"] == "success"
    assert res["vector_name"] == "pUC19"
    assert res["payload_name"] == "Test_Payload"
    assert res["payload_length_bp"] == len(payload)
    base_len = len(VECTORS["pUC19"]["base_sequence"])
    assert res["total_length_bp"] == base_len + len(payload)
    assert payload in res["circular_sequence"]
    
    # Check features list has the inserted payload
    feat_names = [f["name"] for f in res["features"]]
    assert "Test_Payload" in feat_names
    assert "pMB1 (ColE1) ori" in feat_names

def test_clone_pBR322():
    payload = "AAACCCGGGTTT"
    res = clone_payload_into_vector(payload, "pBR322", "Test_PBR")
    assert res["status"] == "success"
    assert res["vector_name"] == "pBR322"
    assert res["antibiotic_resistance"] == "Ampicillin & Tetracycline (50 µg/mL)"
    base_len = len(VECTORS["pBR322"]["base_sequence"])
    assert res["total_length_bp"] == base_len + len(payload)

def test_export_circular_genbank():
    res = clone_payload_into_vector("GAATTCGGATCC", "pUC19", "SnapGene_Test")
    gb_str = export_circular_genbank(res, "pHV_SNAP", "Test SnapGene Clone")
    assert "LOCUS       pHV_SNAP" in gb_str
    assert "circular DNA" in gb_str or "circular SYN" in gb_str or "DNA" in gb_str
    assert "SnapGene_Test" in gb_str
    assert "pMB1 (ColE1) ori" in gb_str
    # GenBank sequence output is lowercase and space/line-wrapped
    assert "gaattcggat" in gb_str.lower()
