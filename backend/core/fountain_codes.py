import struct
import random

# A simplified implementation of a Digital Fountain / Luby Transform (LT) Code
# adapted for DNA Storage.

CHUNK_SIZE = 32  # bytes per chunk
OVERHEAD_RATIO = 1.5  # Generate 1.5x droplets to ensure recovery

def create_droplets(data: bytes, chunk_size=CHUNK_SIZE, overhead=OVERHEAD_RATIO):
    """
    Splits data into chunks and creates XOR'd droplets (Fountain Code).
    Returns a list of droplets, where each droplet is: [seed (4 bytes)] + [xor_payload (chunk_size)]
    """
    # Padding data to be a multiple of chunk_size
    pad_len = chunk_size - (len(data) % chunk_size)
    if pad_len != chunk_size:
        data += b'\x00' * pad_len
    else:
        pad_len = 0
        
    num_chunks = len(data) // chunk_size
    chunks = [data[i*chunk_size:(i+1)*chunk_size] for i in range(num_chunks)]
    
    num_droplets = int(num_chunks * overhead)
    droplets = []
    
    for i in range(num_droplets):
        # We use 'i' as the seed to generate the deterministic degree and selection
        random.seed(i)
        
        # Simplified degree distribution (normally Robust Soliton is used)
        degree = random.randint(1, min(num_chunks, 4) if num_chunks > 0 else 1)
        selected_indices = random.sample(range(num_chunks), degree) if num_chunks > 0 else []
        
        # XOR the selected chunks together
        payload = bytearray(chunk_size)
        for idx in selected_indices:
            for j in range(chunk_size):
                payload[j] ^= chunks[idx][j]
                
        # Droplet format: 4-byte seed (unsigned int) + payload
        seed_bytes = struct.pack(">I", i)
        droplets.append(seed_bytes + bytes(payload))
        
    return droplets, num_chunks, pad_len

def serialize_droplets(droplets: list) -> bytes:
    """Concatenates all droplets into a single byte stream"""
    return b"".join(droplets)

def apply_fountain_code(data: bytes, overhead: float = OVERHEAD_RATIO) -> bytes:
    """
    Wraps the data in a Fountain Code scheme.
    Prepend a header so the decoder knows num_chunks and pad_len.
    Header: [num_chunks (4 bytes)] + [pad_len (1 byte)]
    """
    if not data:
        return data
        
    droplets, num_chunks, pad_len = create_droplets(data, overhead=overhead)
    
    header = struct.pack(">IB", num_chunks, pad_len)
    body = serialize_droplets(droplets)
    
    return header + body

def remove_fountain_code(data: bytes) -> bytes:
    """
    Decodes the Fountain Code scheme.
    (Simplified inverse operation for demonstration purposes)
    """
    if not data or len(data) < 5:
        return data
        
    num_chunks, pad_len = struct.unpack(">IB", data[:5])
    body = data[5:]
    
    # In a real LT code, we would run belief propagation.
    # For this simplified prototype, we just extract the first num_chunks droplets
    # since we know the deterministic sequence. (This is a mock decoder).
    
    chunk_size = CHUNK_SIZE + 4 # 4 bytes seed + payload
    
    # This is a stub for the decoder. Since it's a demonstration, 
    # we simulate successful decoding if the size is roughly correct.
    # A true decoder would XOR back the droplets to find the original chunks.
    # For demonstration, we'll return a mock byte array of the correct original length.
    
    # We don't have the original data trivially in this mock, so we return a placeholder.
    # In a full implementation, we'd recover the exact bytes.
    # For the scope of this project without altering existing Reed-Solomon,
    # we just provide the signature.
    return b"Fountain decoded data placeholder (LT belief propagation required)"
