from reedsolo import RSCodec, ReedSolomonError
import logging

logger = logging.getLogger("helixvault")

# We use 50 bytes of ECC. This can correct up to 25 byte errors per chunk.
# This makes it robust enough to survive 'In Vitro Room Temp' and 'In Vivo' environmental mutations.
rs = RSCodec(50)


def get_ecc_info() -> dict:
    return {
        "algorithm": "Reed-Solomon",
        "ecc_bytes": 50,
        "correction_capability_bytes": 25,
        "description": "Corrects up to 25 byte errors per chunk using 50 ECC bytes."
    }


def apply_error_correction(data: bytes) -> bytes:
    return bytes(rs.encode(data))


def remove_error_correction(data: bytes) -> bytes:
    try:
        decoded, _, _ = rs.decode(data)
        return bytes(decoded)
    except ReedSolomonError as e:
        logger.warning(f"Reed-Solomon decoding failed: {e}", exc_info=True)
        raise ValueError(
            "Data is too corrupted to be recovered by Reed-Solomon error correction.")
