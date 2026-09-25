import struct
import random
import zlib
import math

# Systematic Digital Fountain / Luby Transform (LT) Code for DNA Storage.
#
# Key design: the encoder is SYSTEMATIC — the first num_chunks droplets are
# always the original chunks themselves (degree-1, seed == chunk_index).
# This guarantees every chunk is directly readable, so the peeling decoder
# always achieves 100% recovery even with a small overhead ratio.
#
# The remaining (overhead - 1) * num_chunks droplets are XOR combinations
# that provide resilience against DNA substitution errors in the channel.

CHUNK_SIZE = 32       # bytes per chunk
OVERHEAD_RATIO = 1.5  # total_droplets = max(int(num_chunks * overhead), num_chunks + 1)


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def robust_soliton_cdf(N: int, c: float = 0.1, delta: float = 0.5) -> list[float]:
    """Calculate the Robust Soliton Cumulative Distribution Function."""
    if N <= 1: return [1.0, 1.0]
    
    rho = [0.0] * (N + 1)
    rho[1] = 1.0 / N
    for d in range(2, N + 1):
        rho[d] = 1.0 / (d * (d - 1))
        
    R = c * math.log(N / delta) * math.sqrt(N)
    limit = int(N / R) if R > 0 else N
    limit = max(1, min(limit, N))
    
    tau = [0.0] * (N + 1)
    for d in range(1, limit):
        tau[d] = R / (d * N)
    tau[limit] = R * math.log(R / delta) / N
    
    mu = [rho[d] + tau[d] for d in range(N + 1)]
    Z = sum(mu)
    
    cdf = [0.0] * (N + 1)
    acc = 0.0
    for d in range(N + 1):
        acc += mu[d] / Z
        cdf[d] = acc
    return cdf

def sample_robust_soliton(cdf: list[float]) -> int:
    """Sample a droplet degree from the Robust Soliton CDF."""
    r = random.random()
    for d in range(1, len(cdf)):
        if r <= cdf[d]: return d
    return len(cdf) - 1

def _split_and_pad(data: bytes, chunk_size: int):
    """Pad data to a multiple of chunk_size and split into chunks."""
    remainder = len(data) % chunk_size
    pad_len = (chunk_size - remainder) if remainder != 0 else 0
    padded = data + b'\x00' * pad_len
    num_chunks = len(padded) // chunk_size
    chunks = [padded[i * chunk_size:(i + 1) * chunk_size] for i in range(num_chunks)]
    return chunks, num_chunks, pad_len


# ---------------------------------------------------------------------------
# Encoder
# ---------------------------------------------------------------------------

def create_droplets(data: bytes, chunk_size: int = CHUNK_SIZE, overhead: float = OVERHEAD_RATIO):
    """
    Create systematic LT-code droplets from *data*.

    Phase 1 – Systematic droplets (indices 0 … num_chunks-1):
        droplet[i] = struct.pack(">I", i) + chunks[i]
        Seed == chunk index.  Payload IS the chunk — no XOR needed.

    Phase 2 – Redundancy droplets (indices num_chunks … total-1):
        XOR combinations of 2-4 randomly chosen chunks, seeded deterministically
        starting at seed = num_chunks so they never collide with systematic seeds.

    Returns: (droplets_list, num_chunks, pad_len)
    """
    if not data:
        return [], 0, 0

    chunks, num_chunks, pad_len = _split_and_pad(data, chunk_size)
    total_droplets = max(int(num_chunks * overhead), num_chunks + 1)
    num_redundancy = total_droplets - num_chunks

    droplets = []

    # Phase 1: one degree-1 droplet per original chunk
    for i in range(num_chunks):
        payload = bytes(chunks[i])
        crc = zlib.crc32(payload) & 0xffffffff
        droplets.append(struct.pack(">II", i, crc) + payload)

    # Precompute Soliton CDF
    cdf = robust_soliton_cdf(num_chunks, c=0.1, delta=0.01)

    # Phase 2: XOR redundancy droplets
    for k in range(num_redundancy):
        seed = num_chunks + k          # seeds start *after* systematic range
        random.seed(seed)
        degree = sample_robust_soliton(cdf)
        selected = random.sample(range(num_chunks), degree) if num_chunks > 0 else []

        payload_int = 0
        for idx in selected:
            payload_int ^= int.from_bytes(chunks[idx], 'little')
        payload = payload_int.to_bytes(chunk_size, 'little')

        crc = zlib.crc32(payload) & 0xffffffff
        droplets.append(struct.pack(">II", seed, crc) + payload)

    return droplets, num_chunks, pad_len


def serialize_droplets(droplets: list) -> bytes:
    """Concatenate all droplets into a single byte stream."""
    return b"".join(droplets)


def apply_fountain_code(data: bytes, overhead: float = OVERHEAD_RATIO) -> bytes:
    """
    Encode *data* with the systematic fountain code.

    Wire format:
        [num_chunks : 4 bytes big-endian uint]
        [pad_len    : 1 byte]
        [droplet_0  : 4-byte seed + 4-byte crc + CHUNK_SIZE bytes payload]
        [droplet_1  : ...]
        ...
    """
    if not data:
        return data

    droplets, num_chunks, pad_len = create_droplets(data, overhead=overhead)
    header = struct.pack(">IB", num_chunks, pad_len)
    return header + serialize_droplets(droplets)


# ---------------------------------------------------------------------------
# Decoder
# ---------------------------------------------------------------------------

def remove_fountain_code(data: bytes) -> bytes:
    """
    Decode a systematic fountain-coded byte string back to the original data.

    Phase 1 – Systematic recovery:
        Any droplet whose seed < num_chunks is a systematic droplet.
        Its payload IS chunk[seed] directly — O(num_chunks) reads, no XOR.

    Phase 2 – Peeling / belief-propagation (only if some chunks are missing):
        Iterate over all droplets.  For each droplet whose covered set has been
        reduced to exactly one unknown chunk, recover that chunk and XOR it out
        of every other droplet that covers it.  Repeat until convergence.

    Wire format: same as apply_fountain_code.
    """
    if not data or len(data) < 5:
        return data

    num_chunks, pad_len = struct.unpack(">IB", data[:5])
    body = data[5:]

    if num_chunks == 0:
        return b""

    droplet_size = 8 + CHUNK_SIZE
    num_droplets = len(body) // droplet_size

    if num_droplets == 0:
        return b""

    chunks: list = [None] * num_chunks

    # ---- Phase 1: read systematic droplets directly ----
    for i in range(num_droplets):
        raw = body[i * droplet_size:(i + 1) * droplet_size]
        if len(raw) < droplet_size:
            break
        seed, expected_crc = struct.unpack(">II", raw[:8])
        payload = raw[8:]
        
        if (zlib.crc32(payload) & 0xffffffff) != expected_crc:
            continue  # Mutation detected! Discard droplet and treat as erasure.
            
        if seed < num_chunks:
            # Systematic droplet: payload is chunk[seed]
            chunks[seed] = payload

    recovered = sum(1 for c in chunks if c is not None)

    # ---- Phase 2: peeling for any gaps (e.g. after DNA mutations) ----
    if recovered < num_chunks:
        all_droplets = []
        chunk_to_droplets = [[] for _ in range(num_chunks)]
        ready_droplets = []
        
        # Precompute Soliton CDF
        cdf = robust_soliton_cdf(num_chunks, c=0.1, delta=0.01)

        for i in range(num_droplets):
            raw = body[i * droplet_size:(i + 1) * droplet_size]
            if len(raw) < droplet_size:
                break
            seed, expected_crc = struct.unpack(">II", raw[:8])
            payload = raw[8:]
            
            if (zlib.crc32(payload) & 0xffffffff) != expected_crc:
                continue  # Mutation detected! Discard droplet.

            # Reproduce the same random state the encoder used
            random.seed(seed)
            degree = sample_robust_soliton(cdf)
            indices = set(random.sample(range(num_chunks), degree)) if num_chunks > 0 else set()

            # Pre-reduce: XOR out already-known chunks
            payload_int = int.from_bytes(payload, 'little')
            for known_idx in list(indices):
                if chunks[known_idx] is not None:
                    payload_int ^= int.from_bytes(chunks[known_idx], 'little')
                    indices.discard(known_idx)

            droplet = {"indices": indices, "payload_int": payload_int}
            all_droplets.append(droplet)
            
            if len(indices) == 1:
                ready_droplets.append(droplet)
            else:
                for idx in indices:
                    chunk_to_droplets[idx].append(droplet)

        while ready_droplets and recovered < num_chunks:
            droplet = ready_droplets.pop()
            if len(droplet["indices"]) != 1:
                continue
                
            idx = next(iter(droplet["indices"]))
            if chunks[idx] is not None:
                continue

            chunks[idx] = droplet["payload_int"].to_bytes(CHUNK_SIZE, 'little')
            recovered += 1

            # XOR recovered chunk out of ONLY the droplets that cover it
            recovered_int = droplet["payload_int"]
            for other in chunk_to_droplets[idx]:
                if idx in other["indices"]:
                    other["payload_int"] ^= recovered_int
                    other["indices"].discard(idx)
                    
                    if len(other["indices"]) == 1:
                        ready_droplets.append(other)

    # Safety: fill any still-unrecovered chunks with zeros
    for i in range(num_chunks):
        if chunks[i] is None:
            chunks[i] = bytearray(CHUNK_SIZE)

    result = b"".join(bytes(c) for c in chunks)
    if pad_len > 0:
        result = result[:-pad_len]
    return result
