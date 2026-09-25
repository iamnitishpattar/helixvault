import struct
from typing import Tuple

# Mapping of previous base to the available next bases to avoid homopolymers
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
    return digits[::-1]

def base3_to_byte(digits: list[int]) -> int:
    b = 0
    for d in digits:
        b = b * 3 + d
    return b

# Precompute lookup tables for blistering fast O(1) translation
ENCODE_TABLE = {'A': [], 'C': [], 'G': [], 'T': []}
DECODE_TABLE = {}

for start_base in ['A', 'C', 'G', 'T']:
    for b in range(256):
        b3 = byte_to_base3(b)
        dna_chunk = []
        curr = start_base
        for digit in b3:
            nxt = NEXT_BASE_MAP[curr][digit]
            dna_chunk.append(nxt)
            curr = nxt
        chunk_str = "".join(dna_chunk)
        ENCODE_TABLE[start_base].append((curr, chunk_str))
        DECODE_TABLE[(start_base, chunk_str)] = (curr, b)


def encode_data_to_dna(data: bytes, filename: str) -> str:
    """
    Encode file data and metadata into a DNA sequence.
    Header format: [Filename Length (1 byte)] [Filename] [Data Length (4 bytes)] [Data]
    """
    filename_bytes = filename.encode('utf-8')
    filename_len = min(len(filename_bytes), 255)
    filename_bytes = filename_bytes[:filename_len]

    # Construct the full payload
    payload = bytearray()
    payload.append(filename_len)
    payload.extend(filename_bytes)
    payload.extend(struct.pack('>I', len(data)))
    payload.extend(data)

    # Fast encoding using precomputed lookup table
    dna_chunks = []
    current_base = 'A'
    
    # Using list comprehension or map is even faster, but standard loop over lookup table is enough for 100MB
    for b in payload:
        current_base, chunk = ENCODE_TABLE[current_base][b]
        dna_chunks.append(chunk)

    return "".join(dna_chunks)


def decode_dna_to_data(dna_seq: str) -> Tuple[bytes, str]:
    """
    Decode a DNA sequence back to file data and filename.
    Includes a fast path for perfect sequences, and a heuristic fallback for mutated bases.
    """
    if not dna_seq:
        raise ValueError("Empty DNA sequence")

    payload_bytes = bytearray()
    current_base = 'A'
    
    i = 0
    seq_len = len(dna_seq)
    
    while i < seq_len:
        chunk = dna_seq[i:i+6]
        if len(chunk) < 6:
            break
            
        # Fast Path: Perfect un-mutated 6-base chunk
        match = DECODE_TABLE.get((current_base, chunk))
        if match is not None:
            current_base, val = match
            payload_bytes.append(val)
            i += 6
        else:
            # Slow Path: Chunk has biological mutations. Fall back to heuristic alignment.
            b3_buffer = []
            c_base = current_base
            for _ in range(6):
                if i >= seq_len: break
                base = dna_seq[i]
                if base not in REV_BASE_MAP.get(c_base, {}):
                    digit = 0 # Assume substitution error, Reed-Solomon will fix it later
                else:
                    digit = REV_BASE_MAP[c_base][base]
                b3_buffer.append(digit)
                c_base = base
                i += 1
                
            if len(b3_buffer) == 6:
                payload_bytes.append(base3_to_byte(b3_buffer) % 256)
            current_base = c_base

    # Parse the header
    if len(payload_bytes) < 1:
        raise ValueError("Invalid DNA payload")

    filename_len = payload_bytes[0]
    if len(payload_bytes) < 1 + filename_len + 4:
        raise ValueError("Invalid DNA payload (too short for header)")

    filename = payload_bytes[1:1+filename_len].decode('utf-8', errors='ignore')

    data_len_start = 1 + filename_len
    data_len = struct.unpack('>I', payload_bytes[data_len_start:data_len_start+4])[0]

    data_start = data_len_start + 4
    data = payload_bytes[data_start:data_start+data_len]

    return bytes(data), filename

