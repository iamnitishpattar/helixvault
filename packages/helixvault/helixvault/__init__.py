"""
HelixVault: DNA data storage engine.
"""

from .codec import encode_data_to_dna, decode_dna_to_data
from .ecc import apply_error_correction, remove_error_correction
from .compression import compress_payload, decompress_payload
from .vendor import generate_twist_order_csv, generate_idt_plate_csv
from .noise import simulate_sequencer_noise
from .security import encrypt_data, decrypt_data

__version__ = "0.1.0"
__author__ = "Nitish Pattar"

def encode(data: bytes, filename: str = "payload.bin", compress: str = "zstd", 
           ecc: bool = True, password: str = None) -> str:
    """High-level one-step encoder."""
    payload = data
    if compress and compress != "none":
        payload, _ = compress_payload(payload, algorithm=compress)
    if password:
        payload = encrypt_data(payload, password)
    if ecc:
        payload = apply_error_correction(payload)
    return encode_data_to_dna(payload, filename)

def decode(dna_seq: str, ecc: bool = True, password: str = None) -> tuple:
    """High-level one-step decoder."""
    raw_payload, filename = decode_dna_to_data(dna_seq)
    if ecc:
        raw_payload = remove_error_correction(raw_payload)
    if password:
        raw_payload = decrypt_data(raw_payload, password)
    raw_payload = decompress_payload(raw_payload)
    return raw_payload, filename
