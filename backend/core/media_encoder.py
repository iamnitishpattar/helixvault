import io

def is_multimedia(filename: str) -> bool:
    """Checks if the file is an image or video."""
    ext = filename.split('.')[-1].lower()
    return ext in ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm']

def apply_media_compression(data: bytes, filename: str) -> bytes:
    """
    Applies multimedia-specific quaternary compression (e.g., JPEG DCT to DNA logic).
    For the current MVP, this applies a simulated structural compression header.
    In production, this would reduce payload size by ~30% over standard binary.
    """
    if not is_multimedia(filename):
        return data
        
    # Simulated compression: Prepend a magic header indicating optimized media
    # Since we can't do actual wavelet compression here in the MVP without dropping data,
    # we just mark it as optimized. A true implementation would map pixel logic to ACGT.
    magic_header = b'MEDIA_OPT:'
    
    # Returning original data with header for lossless recovery in this prototype
    return magic_header + data

def remove_media_compression(data: bytes) -> bytes:
    """
    Reverses the multimedia compression to recover the original binary.
    """
    if data.startswith(b'MEDIA_OPT:'):
        return data[len(b'MEDIA_OPT:'):]
    return data
