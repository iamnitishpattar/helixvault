from Bio import Entrez
import random
import os
import logging

logger = logging.getLogger("helixvault")

# Read NCBI credentials from environment (set in .env)
Entrez.email = os.getenv("ENTREZ_EMAIL", "hello@helixvault.com")
_ncbi_api_key = os.getenv("NCBI_API_KEY", "")
if _ncbi_api_key:
    Entrez.api_key = _ncbi_api_key

# Default sequence (E. coli K-12 partial genome) in case API fails
DEFAULT_HOST_DNA = ""


def embed_in_host(dna_payload: str) -> str:
    """
    Simulates embedding our synthetic DNA payload into a host DNA sequence.
    Fetches a real biological sequence from NCBI if possible.
    """
    host_seq = DEFAULT_HOST_DNA

    try:
        # Try fetching a small nucleotide sequence from NCBI
        # Using a fixed ID for stability (e.g., a small plasmid or region)
        handle = Entrez.efetch(
            db="nucleotide", id="NC_001416", rettype="fasta", retmode="text")
        lines = handle.read().splitlines()
        host_seq = "".join(lines[1:])  # Skip the first header line

        # Limit host sequence length to prevent huge files
        if len(host_seq) > len(dna_payload) * 5:
            host_seq = host_seq[:len(dna_payload) * 5]

    except Exception as e:
        logger.warning(f"Failed to fetch host sequence from NCBI, falling back to random host: {e}", exc_info=True)
        # Fallback to generating a random host sequence if offline
        host_seq = "".join(random.choices(
            ['A', 'C', 'G', 'T'], k=len(dna_payload) * 3))

    if not host_seq:
        host_seq = "".join(random.choices(
            ['A', 'C', 'G', 'T'], k=len(dna_payload) * 3))

def _get_stego_markers() -> tuple[str, str, str, str, str, str]:
    """
    Returns (secure_start_v2, secure_end_v2, secure_start_v1, secure_end_v1, legacy_start, legacy_end).
    v2 markers are GC-balanced, homopolymer-free, and restriction-site free.
    """
    import hashlib
    import hmac
    from core.encoder import NEXT_BASE_MAP
    
    secret_key = os.getenv("STEGO_SECRET_KEY", "helixvault-default-secret").encode()
    
    # V1 Legacy HMAC hex mapping
    h_v1 = hmac.new(secret_key, b"stego-markers", hashlib.sha256).hexdigest()
    mapping = {'0':'A', '1':'C', '2':'G', '3':'T', '4':'A', '5':'C', '6':'G', '7':'T',
               '8':'A', '9':'C', 'a':'G', 'b':'T', 'c':'A', 'd':'C', 'e':'G', 'f':'T'}
    secure_start_v1 = "".join(mapping[c] for c in h_v1[:16])
    secure_end_v1 = "".join(mapping[c] for c in h_v1[16:32])
    
    # V2 Homopolymer-free & Restriction-site-free Base-3 rotation
    h_v2 = hmac.new(secret_key, b"stego-markers-v2", hashlib.sha256).digest()
    
    def bytes_to_marker(data: bytes, length: int = 16) -> str:
        marker = ['A']
        curr = 'A'
        for b in data:
            for _ in range(4):
                digit = b % 3
                b //= 3
                next_base = NEXT_BASE_MAP[curr][digit]
                marker.append(next_base)
                curr = next_base
                if len(marker) - 1 >= length:
                    break
            if len(marker) - 1 >= length:
                break
        res = "".join(marker[1:length + 1])
        # Avoid dangerous restriction enzyme cleavage sites (EcoRI, BamHI, HindIII, SalI, PstI)
        for site in ["GAATTC", "GGATCC", "AAGCTT", "GTCGAC", "CTGCAG"]:
            while site in res:
                res = res.replace(site, "ACGTAC"[:len(site)])
        return res

    secure_start_v2 = bytes_to_marker(h_v2[:16], 16)
    secure_end_v2 = bytes_to_marker(h_v2[16:32], 16)
    
    legacy_start = "ATAACCGG"
    legacy_end = "GGCCAATA"
    
    return secure_start_v2, secure_end_v2, secure_start_v1, secure_end_v1, legacy_start, legacy_end


def embed_in_host(dna_payload: str) -> str:
    """
    Simulates embedding our synthetic DNA payload into a host DNA sequence.
    Fetches a real biological sequence from NCBI if possible.
    """
    host_seq = DEFAULT_HOST_DNA

    try:
        # Try fetching a small nucleotide sequence from NCBI
        # Using a fixed ID for stability (e.g., a small plasmid or region)
        handle = Entrez.efetch(
            db="nucleotide", id="NC_001416", rettype="fasta", retmode="text")
        lines = handle.read().splitlines()
        host_seq = "".join(lines[1:])  # Skip the first header line

        # Limit host sequence length to prevent huge files
        if len(host_seq) > len(dna_payload) * 5:
            host_seq = host_seq[:len(dna_payload) * 5]

    except Exception as e:
        logger.warning(f"Failed to fetch host sequence from NCBI, falling back to random host: {e}", exc_info=True)
        # Fallback to generating a random host sequence if offline
        host_seq = "".join(random.choices(
            ['A', 'C', 'G', 'T'], k=len(dna_payload) * 3))

    if not host_seq:
        host_seq = "".join(random.choices(
            ['A', 'C', 'G', 'T'], k=len(dna_payload) * 3))

    # Steganography: Embed the payload in the middle of the host sequence
    start_marker, end_marker, _, _, _, _ = _get_stego_markers()

    insertion_index = len(host_seq) // 2

    embedded_sequence = host_seq[:insertion_index] + start_marker + \
        dna_payload + end_marker + host_seq[insertion_index:]
    return embedded_sequence


def extract_from_host(embedded_sequence: str) -> str:
    """
    Extracts the DNA payload from the steganographic host sequence.
    """
    start_v2, end_v2, start_v1, end_v1, legacy_start, legacy_end = _get_stego_markers()

    # Try v2 secure markers first
    start_idx = embedded_sequence.find(start_v2)
    if start_idx != -1:
        start_marker = start_v2
        end_marker = end_v2
    else:
        # Fall back to v1 secure markers
        start_idx = embedded_sequence.find(start_v1)
        if start_idx != -1:
            start_marker = start_v1
            end_marker = end_v1
        else:
            # Fall back to legacy markers
            start_idx = embedded_sequence.find(legacy_start)
            if start_idx != -1:
                start_marker = legacy_start
                end_marker = legacy_end
            else:
                # If no marker is found, assume it's just a raw payload
                return embedded_sequence

    start_idx += len(start_marker)

    end_idx = embedded_sequence.find(end_marker, start_idx)
    if end_idx == -1:
        return embedded_sequence[start_idx:]

    return embedded_sequence[start_idx:end_idx]
