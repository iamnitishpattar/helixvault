from Bio import Entrez
import random

# Use a generic email for NCBI
Entrez.email = "hello@helixvault.com"

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

    except Exception:
        # Fallback to generating a random host sequence if offline
        host_seq = "".join(random.choices(
            ['A', 'C', 'G', 'T'], k=len(dna_payload) * 3))

    if not host_seq:
        host_seq = "".join(random.choices(
            ['A', 'C', 'G', 'T'], k=len(dna_payload) * 3))

    # Steganography: Embed the payload in the middle of the host sequence
    # For simplicity of decoding, we will add a start and end marker
    # "ATAACCGG" and "GGCCAATA"

    start_marker = "ATAACCGG"
    end_marker = "GGCCAATA"

    insertion_index = len(host_seq) // 2

    embedded_sequence = host_seq[:insertion_index] + start_marker + \
        dna_payload + end_marker + host_seq[insertion_index:]
    return embedded_sequence


def extract_from_host(embedded_sequence: str) -> str:
    """
    Extracts the DNA payload from the steganographic host sequence.
    """
    start_marker = "ATAACCGG"
    end_marker = "GGCCAATA"

    start_idx = embedded_sequence.find(start_marker)
    if start_idx == -1:
        # If no marker is found, assume it's just a raw payload
        return embedded_sequence

    start_idx += len(start_marker)

    end_idx = embedded_sequence.find(end_marker, start_idx)
    if end_idx == -1:
        return embedded_sequence[start_idx:]

    return embedded_sequence[start_idx:end_idx]
