from reedsolo import RSCodec, ReedSolomonError

# We use 10 bytes of ECC. This can correct up to 5 byte errors per chunk.
# You can increase this for more robustness but it increases the size.
rs = RSCodec(10)


def apply_error_correction(data: bytes) -> bytes:
    return bytes(rs.encode(data))


def remove_error_correction(data: bytes) -> bytes:
    try:
        decoded, _, _ = rs.decode(data)
        return bytes(decoded)
    except ReedSolomonError:
        raise ValueError(
            "Data is too corrupted to be recovered by Reed-Solomon error correction.")
