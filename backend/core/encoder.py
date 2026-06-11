import struct

from typing import Tuple

# Mapping of previous base to the available next bases to avoid homopolymers
# 0, 1, 2 map to the 3 available bases
NEXT_BASE_MAP = {
    'A': ['C', 'G', 'T'],
    'C': ['A', 'G', 'T'],
    'G': ['A', 'C', 'T'],
    'T': ['A', 'C', 'G']
}

# Reverse mapping: given previous base and current base, get the base-3 value
REV_BASE_MAP = {
    'A': {'C': 0, 'G': 1, 'T': 2},
    'C': {'A': 0, 'G': 1, 'T': 2},
    'G': {'A': 0, 'C': 1, 'T': 2},
    'T': {'A': 0, 'C': 1, 'G': 2}
}


def byte_to_base3(b: int) -> list[int]:
    """Convert a byte (0-255) to a list of 6 base-3 digits (0, 1, 2)."""
    digits = []
    for _ in range(6):
        digits.append(b % 3)
        b = b // 3
    # Reverse to keep it big-endian like
    return digits[::-1]


def base3_to_byte(digits: list[int]) -> int:
    """Convert a list of 6 base-3 digits back to a byte."""
    b = 0
    for d in digits:
        b = b * 3 + d
    return b


def encode_data_to_dna(data: bytes, filename: str) -> str:
    """
    Encode file data and metadata into a DNA sequence.
    Header format: [Filename Length (1 byte)] [Filename] [Data Length (4 bytes)] [Data]
    """
    filename_bytes = filename.encode('utf-8')
    filename_len = len(filename_bytes)
    if filename_len > 255:
        filename_bytes = filename_bytes[:255]
        filename_len = 255

    data_len = len(data)

    # Construct the full payload
    payload = bytearray()
    payload.append(filename_len)
    payload.extend(filename_bytes)
    payload.extend(struct.pack('>I', data_len))  # 4 bytes unsigned int
    payload.extend(data)

    # Encode payload to DNA
    dna = ['A']  # Starting base to bootstrap the process
    current_base = 'A'

    for b in payload:
        b3_digits = byte_to_base3(b)
        for digit in b3_digits:
            next_base = NEXT_BASE_MAP[current_base][digit]
            dna.append(next_base)
            current_base = next_base

    # Remove the bootstrap base for the final string
    return "".join(dna[1:])


def decode_dna_to_data(dna_seq: str) -> Tuple[bytes, str]:
    """
    Decode a DNA sequence back to file data and filename.
    """
    if not dna_seq:
        raise ValueError("Empty DNA sequence")

    current_base = 'A'  # Bootstrap base
    payload_bytes = bytearray()

    b3_buffer = []
    for base in dna_seq:
        digit = REV_BASE_MAP[current_base][base]
        b3_buffer.append(digit)
        current_base = base

        if len(b3_buffer) == 6:
            b = base3_to_byte(b3_buffer)
            payload_bytes.append(b)
            b3_buffer = []

    # Parse the header
    if len(payload_bytes) < 1:
        raise ValueError("Invalid DNA payload")

    filename_len = payload_bytes[0]

    if len(payload_bytes) < 1 + filename_len + 4:
        raise ValueError("Invalid DNA payload (too short for header)")

    filename = payload_bytes[1:1+filename_len].decode('utf-8')

    data_len_start = 1 + filename_len
    data_len = struct.unpack(
        '>I', payload_bytes[data_len_start:data_len_start+4])[0]

    data_start = data_len_start + 4
    data = payload_bytes[data_start:data_start+data_len]

    return bytes(data), filename
