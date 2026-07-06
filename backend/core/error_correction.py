from reedsolo import RSCodec, ReedSolomonError

# We use 50 bytes of ECC. This can correct up to 25 byte errors per chunk.
# This makes it robust enough to survive 'In Vitro Room Temp' and 'In Vivo' environmental mutations.
rs = RSCodec(50)


def apply_error_correction(data: bytes) -> bytes:
    return bytes(rs.encode(data))


def remove_error_correction(data: bytes) -> bytes:
    try:
        decoded, _, _ = rs.decode(data)
        return bytes(decoded)
    except ReedSolomonError:
        raise ValueError(
            "Data is too corrupted to be recovered by Reed-Solomon error correction.")
