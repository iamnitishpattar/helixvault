import pytest
from core.encoder import encode_data_to_dna, decode_dna_to_data

def test_encode_decode():
    original_data = b"Hello, DNA Storage!"
    filename = "test.txt"
    
    dna_seq = encode_data_to_dna(original_data, filename)
    
    # Ensure there are no homopolymers
    for i in range(len(dna_seq) - 1):
        assert dna_seq[i] != dna_seq[i+1], f"Homopolymer found at {i}"
        
    decoded_data, decoded_filename = decode_dna_to_data(dna_seq)
    
    assert decoded_data == original_data
    assert decoded_filename == filename
