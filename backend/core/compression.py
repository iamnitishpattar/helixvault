import zlib
import logging
from typing import Tuple, Dict, Any

logger = logging.getLogger("helixvault")

# Try to import zstandard and brotli with graceful fallbacks
try:
    import zstandard as zstd
    HAS_ZSTD = True
except ImportError:
    HAS_ZSTD = False

try:
    import brotli
    HAS_BROTLI = True
except ImportError:
    HAS_BROTLI = False

# Magic prefix signatures for self-identifying compressed streams
MAGIC_ZSTD = b"HV_ZSTD:\x00"
MAGIC_BROTLI = b"HV_BROT:\x00"
MAGIC_GZIP = b"HV_GZIP:\x00"
MAGIC_HEADER_LEN = 9


def compress_payload(data: bytes, algorithm: str = "zstd") -> Tuple[bytes, Dict[str, Any]]:
    """
    Compress binary payload before DNA encoding.
    Reduces physical synthesis length and lab printing costs by 40-70%.
    
    If compression does not decrease size (e.g. for already compressed files like JPEG/MP4),
    it automatically returns the uncompressed original to avoid byte inflation.
    
    Supported algorithms:
      - 'zstd': Zstandard (Facebook) - ultra-fast, high compression ratio
      - 'brotli': Brotli (Google) - excellent for documents, text, JSON
      - 'gzip': Universal standard zlib compression
      - 'none': Bypass compression
    """
    original_size = len(data)
    if not data or algorithm == "none":
        return data, {
            "algorithm": "none",
            "original_size": original_size,
            "compressed_size": original_size,
            "saved_bytes": 0,
            "ratio": 1.0,
            "cost_saving_pct": 0.0
        }

    compressed = None
    chosen_algo = algorithm.lower()

    if chosen_algo == "zstd" and HAS_ZSTD:
        try:
            cctx = zstd.ZstdCompressor(level=3, write_content_size=True)
            compressed = MAGIC_ZSTD + cctx.compress(data)
        except Exception as e:
            logger.warning(f"Zstandard compression failed, falling back to gzip: {e}")
            chosen_algo = "gzip"

    elif chosen_algo == "brotli" and HAS_BROTLI:
        try:
            compressed = MAGIC_BROTLI + brotli.compress(data, quality=5)
        except Exception as e:
            logger.warning(f"Brotli compression failed, falling back to gzip: {e}")
            chosen_algo = "gzip"

    if compressed is None:
        # Fallback or explicit gzip
        compressed = MAGIC_GZIP + zlib.compress(data, level=6)
        chosen_algo = "gzip"

    # Auto-fallback: don't use compression if it inflated the file
    if len(compressed) >= original_size:
        return data, {
            "algorithm": "none (incompressible)",
            "original_size": original_size,
            "compressed_size": original_size,
            "saved_bytes": 0,
            "ratio": 1.0,
            "cost_saving_pct": 0.0
        }

    compressed_size = len(compressed)
    saved_bytes = original_size - compressed_size
    ratio = compressed_size / original_size
    cost_saving_pct = round((1.0 - ratio) * 100, 2)

    return compressed, {
        "algorithm": chosen_algo,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "saved_bytes": saved_bytes,
        "ratio": round(ratio, 4),
        "cost_saving_pct": cost_saving_pct
    }


def decompress_payload(data: bytes) -> bytes:
    """
    Decompresses binary payload if a HelixVault compression magic header is present.
    If no header is detected, returns original data unchanged (100% backward compatible).
    """
    if len(data) <= MAGIC_HEADER_LEN:
        return data

    if data.startswith(MAGIC_ZSTD):
        if not HAS_ZSTD:
            raise RuntimeError("Zstandard decompression requested but 'zstandard' is not installed.")
        dctx = zstd.ZstdDecompressor()
        raw_body = data[MAGIC_HEADER_LEN:]
        try:
            return dctx.decompress(raw_body, max_output_size=100 * 1024 * 1024)
        except Exception as e:
            logger.error(f"Zstd decompression failed: {e}")
            raise ValueError("Corrupted Zstandard compressed payload")

    elif data.startswith(MAGIC_BROTLI):
        if not HAS_BROTLI:
            raise RuntimeError("Brotli decompression requested but 'brotli' is not installed.")
        raw_body = data[MAGIC_HEADER_LEN:]
        try:
            return brotli.decompress(raw_body)
        except Exception as e:
            logger.error(f"Brotli decompression failed: {e}")
            raise ValueError("Corrupted Brotli compressed payload")

    elif data.startswith(MAGIC_GZIP):
        raw_body = data[MAGIC_HEADER_LEN:]
        try:
            return zlib.decompress(raw_body)
        except Exception as e:
            logger.error(f"Gzip decompression failed: {e}")
            raise ValueError("Corrupted Gzip compressed payload")

    return data
