"""
Verification test script for HelixVault NextGen enhancements:
1. Dynamic Fountain Code Redundancy Overhead (1.1x vs 2.5x)
2. Enterprise Biosecurity Screening (Clean sequence vs Regulated Pathogen Motif)
3. Steganographic V2 Markers (Homopolymer & restriction site avoidance)
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.fountain_codes import apply_fountain_code, create_droplets
from core.bio_validator import validate_sequence_biosecurity, PATHOGEN_MOTIF_DATABASE
from core.steganography import _get_stego_markers

def test_dynamic_fountain_overhead():
    print("--- Testing Dynamic Fountain Code Redundancy Overhead ---")
    data = b"HelixVault Enterprise Genomic Storage Test Payload"
    
    droplets_min, chunks_min, _ = create_droplets(data, overhead=1.1)
    droplets_high, chunks_high, _ = create_droplets(data, overhead=2.5)
    
    print(f"Original Chunks: {chunks_min}")
    print(f"Droplets at 1.1x overhead: {len(droplets_min)}")
    print(f"Droplets at 2.5x overhead: {len(droplets_high)}")
    
    assert len(droplets_high) > len(droplets_min), "Higher overhead should produce more recovery droplets!"
    print("[PASS] Dynamic Fountain overhead test passed!\n")

def test_biosecurity_validator():
    print("--- Testing Enterprise Biosecurity Validator ---")
    clean_seq = "ATGCGATCGATCGATCGATCGATCGATCGATCGATCGATC"
    clean_report = validate_sequence_biosecurity(clean_seq)
    print(f"Clean Sequence Status: {clean_report['pathogen_screen_status']} | Score: {clean_report['score']}")
    assert clean_report['passed'] is True, "Clean sequence should pass validation"
    
    # Inject Ebola L-gene motif
    ebola_motif = PATHOGEN_MOTIF_DATABASE["EBOLA_L_GENE_MOTIF"]
    hazardous_seq = "ATGCGATC" + ebola_motif + "GATCGATC"
    hazard_report = validate_sequence_biosecurity(hazardous_seq)
    print(f"Hazardous Sequence Status: {hazard_report['pathogen_screen_status']} | Score: {hazard_report['score']}")
    print(f"Flags triggered: {hazard_report['flags']}")
    assert hazard_report['passed'] is False, "Hazardous sequence with Ebola motif must be flagged and rejected!"
    print("[PASS] Biosecurity validator test passed!\n")

def test_stego_markers_v2():
    print("--- Testing Steganographic V2 Markers ---")
    start_v2, end_v2, start_v1, end_v1, _, _ = _get_stego_markers()
    print(f"V2 Start Marker: {start_v2}")
    print(f"V2 End Marker:   {end_v2}")
    
    # Check for homopolymers > 3 in V2 markers
    for base in "ATCG":
        assert (base * 4) not in start_v2, f"V2 marker contains homopolymer {base*4}!"
        assert (base * 4) not in end_v2, f"V2 marker contains homopolymer {base*4}!"
    print("[PASS] V2 Stego markers homopolymer avoidance test passed!\n")

if __name__ == "__main__":
    print("Running HelixVault NextGen Feature Verification...\n")
    test_dynamic_fountain_overhead()
    test_biosecurity_validator()
    test_stego_markers_v2()
    print("ALL NEXTGEN FEATURE TESTS PASSED SUCCESSFULLY!")
