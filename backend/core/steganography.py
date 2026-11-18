import os
import re
import io
import time
import socket
import logging
import hashlib
import hmac
from typing import Optional, Tuple, Dict, Any
from dotenv import load_dotenv
from core.ncbi_client import ncbi_client
from Bio import Entrez, SeqIO

# Ensure environment variables are loaded
load_dotenv()
backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=False)

logger = logging.getLogger("helixvault")

# Configure NCBI Entrez credentials
Entrez.email = os.getenv("ENTREZ_EMAIL", "nitishpattar7@gmail.com")
_ncbi_api_key = os.getenv("NCBI_API_KEY", "")
if _ncbi_api_key:
    Entrez.api_key = _ncbi_api_key
Entrez.tool = "HelixVault_DNA_Steganography"

# Directory for persistent on-disk NCBI genome caching
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "ncbi_cache"))
os.makedirs(CACHE_DIR, exist_ok=True)

# In-memory LRU / session cache for rapid access
_HOST_MEMORY_CACHE: Dict[str, str] = {}

# Default accession list for progressive fallback
DEFAULT_CARRIER_ACCESSION = "NC_001416"  # Enterobacteria phage lambda (48,502 bp)
FALLBACK_ACCESSIONS = ["NC_000913", "NC_001422", "M77789"]

# Authentic biological reference segment (E. coli K-12 MG1655, 1,000 bp high-fidelity seed)
# Used if disk cache is completely missing and network is offline
CURATED_E_COLI_SEED = (
    "AGCTTTTCATTCTGACTGCAACGGGCAATATGTCTCTGTGTGGATTAAAAAAAGAGTGTCTGATAGCAGC"
    "TTCTGAACTGGTTACCTGCCGTGAGTAAATTAAAATTTTATTGACTTAGGTCACTAAATACTTTAACCAA"
    "TATAGGCATAGCGCACAGACAGATAAAAATTACAGAGTACACAACATCCATGAAACGCATTAGCACCACC"
    "ATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGACGCGTACAGGAAACACAGAAAAAAG"
    "CCCGCACCTGACAGTGCGGGCTTTTTTTTTCGACCAAAGGTAACGAGGTAACAACCATGCGAGTGTTGAA"
    "GTTCGGCGGTACATCAGTGGCAAATGCAGAACGTTTTCTGCGTGTTGCCGATATTCTGGAAAGCAATGCC"
    "AGGCAGGGGCAGGTGGCCACCGTCCTCTCTGCCCCCGCCAAAATCACCAACCACCTGGTGGCGATGATTG"
    "AAAAAACCATTAGCGGCCAGGATGCTTTACCCAATATCAGCGATGCCGAACGTATTTTTGCCGAACTTTT"
    "GACGGGACTCGCCGCCGCCCAGCCGGGGTTCCCGCTGGCGCAATTGAAAACTTTCGTCGATCAGGAATTT"
    "GCCCAAATAAAACATGTCCTGCATGGCATTAGTTTGTTGGGGCAGTGCCCGGATAGCATCAACGCTGCGC"
    "TGATTTGCCGTGGCGAGAAAATGTCGATCGCCATTATGGCCGGCGTATTAGAAGCGCGCGGTCACAACGT"
    "TACTGTTATCGATCCGGTCGAAAAACTGCTGGCAGTGGGGCATTACCTCGAATCTACCGTCGATATTGCT"
    "GAGTCCACCCGCCGTATTGCGGCAAGCCGCATTCCGGCTGATCACATGGTGCTGATGGCAGGTTTCACCG"
    "CCGGTAATGAAAAAGGCGAACTGGTGGTGCTTGGACGCAACGGTTCCGACTACTCTGCTGCGGTGCTGGC"
    "TGCCTGTTTACGCGCCGATTGTTGCGAGATTTGGACGGACGTTGACGGGGTCTATACCTGCGACCCGCGT"
)


def _clean_dna_sequence(raw_seq: str) -> str:
    """Removes whitespace, digits, and non-ACGT characters from sequence."""
    return re.sub(r"[^ACGT]", "", raw_seq.upper())


def _read_from_disk_cache(accession: str) -> Optional[str]:
    """Reads a previously cached biological sequence from disk if available."""
    clean_acc = re.sub(r"[^A-Za-z0-9_\.]", "", accession)
    cache_path = os.path.join(CACHE_DIR, f"{clean_acc}.fasta")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                lines = f.read().splitlines()
            seq_lines = [line.strip() for line in lines if line and not line.startswith(">")]
            seq = _clean_dna_sequence("".join(seq_lines))
            if len(seq) >= 500:
                return seq
        except Exception as e:
            logger.warning(f"Error reading disk cache for {accession}: {e}")
    return None


def _write_to_disk_cache(accession: str, fasta_content: str) -> None:
    """Persists a successfully fetched biological FASTA sequence to disk."""
    clean_acc = re.sub(r"[^A-Za-z0-9_\.]", "", accession)
    cache_path = os.path.join(CACHE_DIR, f"{clean_acc}.fasta")
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            f.write(fasta_content)
        logger.info(f"Cached biological sequence for {accession} -> {cache_path}")
    except Exception as e:
        logger.warning(f"Failed to write disk cache for {accession}: {e}")


def fetch_biological_host(accession: Optional[str] = None, timeout: float = 3.0) -> Tuple[str, Dict[str, Any]]:
    """
    Robust multi-tier biological host retriever powered by NCBIClient:
      Tier 1: In-memory session cache (0.001 ms)
      Tier 2: Persistent on-disk biological FASTA cache (0.1 ms)
      Tier 3: Live NCBI Entrez REST E-fetch with authenticated API Key (10 req/s)
      Tier 4: Progressive fallback to alternative reference genomes
      Tier 5: Pre-bundled authentic biological reference seed (offline guarantee)
    """
    return ncbi_client.fetch_sequence(accession, timeout=timeout)


def embed_in_host(dna_payload: str, carrier_accession: Optional[str] = None) -> str:
    """
    Embeds synthetic DNA payload into a real biological host sequence.
    Guarantees authentic biological DNA camouflage, homopolymer-safe V2 markers,
    and balanced flanking regions.
    """
    if not dna_payload:
        return ""

    # Fetch biological host sequence via robust multi-tier manager
    host_seq, meta = fetch_biological_host(carrier_accession, timeout=3.0)

    # Dimension host sequence: ensure host is long enough to camouflage the payload
    # (Payload should ideally occupy at most 30-50% of the total sequence)
    min_flank = max(500, len(dna_payload))
    needed_host_len = min_flank * 2
    if len(host_seq) < needed_host_len:
        multiplier = (needed_host_len // len(host_seq)) + 1
        host_seq = (host_seq * multiplier)[:needed_host_len]
    elif len(host_seq) > len(dna_payload) * 6:
        # Cap excessive length for reasonable transmission size
        host_seq = host_seq[:len(dna_payload) * 6]

    # Get V2 secure markers (restriction-site free, homopolymer-free, HMAC authenticated)
    start_marker, end_marker, _, _, _, _ = _get_stego_markers()

    # Insert payload into the midpoint of the biological host sequence
    insertion_index = len(host_seq) // 2
    embedded_sequence = (
        host_seq[:insertion_index]
        + start_marker
        + dna_payload
        + end_marker
        + host_seq[insertion_index:]
    )

    logger.info(
        f"Embedded {len(dna_payload)} bp payload into {len(host_seq)} bp biological host "
        f"[{meta.get('accession')}] via source '{meta.get('source')}'. Total: {len(embedded_sequence)} bp"
    )

    return embedded_sequence


def _get_stego_markers() -> Tuple[str, str, str, str, str, str]:
    """
    Returns (secure_start_v2, secure_end_v2, secure_start_v1, secure_end_v1, legacy_start, legacy_end).
    v2 markers are GC-balanced, homopolymer-free, and restriction-site free.
    """
    from core.encoder import NEXT_BASE_MAP

    secret_key = os.getenv("STEGO_SECRET_KEY", "helixvault-default-secret").encode()

    # V1 Legacy HMAC hex mapping
    h_v1 = hmac.new(secret_key, b"stego-markers", hashlib.sha256).hexdigest()
    mapping = {
        '0': 'A', '1': 'C', '2': 'G', '3': 'T', '4': 'A', '5': 'C', '6': 'G', '7': 'T',
        '8': 'A', '9': 'C', 'a': 'G', 'b': 'T', 'c': 'A', 'd': 'C', 'e': 'G', 'f': 'T'
    }
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


def extract_from_host(embedded_sequence: str) -> str:
    """
    Extracts the DNA payload from the steganographic host sequence.
    Gracefully handles V2, V1, and legacy markers.
    """
    if not embedded_sequence:
        return ""

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
