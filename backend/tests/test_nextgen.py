import pytest
from core.fountain_codes import apply_fountain_code, create_droplets
from core.bio_validator import validate_sequence_biosecurity, PATHOGEN_MOTIF_DATABASE
from core.steganography import _get_stego_markers

def test_dynamic_fountain_overhead():
    data = b"HelixVault Enterprise Genomic Storage Test Payload"
    droplets_min, chunks_min, _ = create_droplets(data, overhead=1.1)
    droplets_high, chunks_high, _ = create_droplets(data, overhead=2.5)
    assert len(droplets_high) > len(droplets_min), "Higher overhead should produce more recovery droplets"

def test_biosecurity_validator_clean():
    clean_seq = "ATGCGATCGATCGATCGATCGATCGATCGATCGATCGATC"
    clean_report = validate_sequence_biosecurity(clean_seq)
    assert clean_report['passed'] is True
    assert clean_report['score'] == 100.0
    assert clean_report['pathogen_screen_status'] == "CLEARED"

def test_biosecurity_validator_hazardous():
    ebola_motif = PATHOGEN_MOTIF_DATABASE["EBOLA_L_GENE_MOTIF"]
    hazardous_seq = "ATGCGATC" + ebola_motif + "GATCGATC"
    hazard_report = validate_sequence_biosecurity(hazardous_seq)
    assert hazard_report['passed'] is False
    assert hazard_report['score'] < 100.0
    assert "FLAGGED" in hazard_report['pathogen_screen_status']
    assert any("CRITICAL BIOSECURITY WARNING" in flag for flag in hazard_report['flags'])

def test_stego_markers_v2_homopolymer_avoidance():
    start_v2, end_v2, _, _, _, _ = _get_stego_markers()
    for base in "ATCG":
        assert (base * 4) not in start_v2
        assert (base * 4) not in end_v2
