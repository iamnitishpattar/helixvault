from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio import SeqIO
from Bio.SeqUtils import gc_fraction, MeltingTemp
import io


def calculate_metrics(dna_seq: str) -> dict:
    if not dna_seq:
        return {
            "gc_content": 0, "length": 0, "melting_temp": 0,
            "shannon_entropy": 0.0, "homopolymer_count": 0,
            "synthesis_cost_usd": 0.0, "physical_weight_pg": 0.0,
            "storage_density_pb_per_gram": 215.0
        }

    seq_obj = Seq(dna_seq)
    gc = gc_fraction(seq_obj) * 100
    try:
        mt = MeltingTemp.Tm_Wallace(seq_obj)
    except Exception:
        mt = 0.0

    # Shannon entropy: measures information density of the DNA sequence
    # A perfectly random sequence → entropy = 2.0 bits/symbol (log2 of 4 bases)
    from collections import Counter
    import math
    counts = Counter(dna_seq)
    total = len(dna_seq)
    entropy = -sum((c / total) * math.log2(c / total) for c in counts.values() if c > 0)

    # Homopolymer count: number of consecutive identical bases (proof our algorithm works → should be 0)
    homopolymer_count = sum(1 for i in range(len(dna_seq) - 1) if dna_seq[i] == dna_seq[i + 1])

    # Synthesis cost: $0.10 per base pair (industry standard Chemical synthesis rate)
    synthesis_cost_usd = round(total * 0.10, 2)

    # Physical weight: 330 Da per nucleotide, converted to picograms
    # 1 Da = 1.6605e-24 g = 1.6605e-12 pg
    physical_weight_pg = round(total * 330 * 1.6605e-12, 6)

    # DNA storage density: theoretical 215 petabytes per gram of DNA (Church et al., Nature 2012)
    storage_density_pb_per_gram = 215.0

    return {
        "gc_content": round(gc, 2),
        "length": len(dna_seq),
        "melting_temp": round(mt, 2),
        "shannon_entropy": round(entropy, 4),
        "homopolymer_count": homopolymer_count,
        "synthesis_cost_usd": synthesis_cost_usd,
        "physical_weight_pg": physical_weight_pg,
        "storage_density_pb_per_gram": storage_density_pb_per_gram,
    }


def generate_fasta(dna_seq: str, sequence_id: str = "HelixVault_Seq", description: str = "Synthetic DNA Data") -> str:
    record = SeqRecord(
        Seq(dna_seq),
        id=sequence_id,
        description=description
    )
    handle = io.StringIO()
    SeqIO.write(record, handle, "fasta")
    return handle.getvalue()


import re

def generate_genbank(dna_seq: str, sequence_id: str = "HV_001", description: str = "Synthetic DNA Data") -> str:
    # GenBank format has specific requirements for the ID and name
    clean_id = re.sub(r'[^a-zA-Z0-9_]', '', sequence_id)[:16]
    if not clean_id:
        clean_id = "HV_001"
        
    record = SeqRecord(
        Seq(dna_seq),
        id=clean_id,  # GenBank locus names have max length and strict character limits
        name=clean_id,
        description=description,
        annotations={"molecule_type": "DNA"}
    )
    handle = io.StringIO()
    SeqIO.write(record, handle, "genbank")
    return handle.getvalue()


def extract_sequence_from_file(file_content: bytes, filename: str) -> str:
    handle = io.StringIO(file_content.decode('utf-8'))
    
    # Auto-detect format by peeking at the content
    # GenBank files start with 'LOCUS', FASTA files start with '>'
    content_start = file_content.decode('utf-8')[:20].strip()
    
    if content_start.startswith("LOCUS"):
        fmt = "genbank"
    elif filename.endswith(".gb") or filename.endswith(".genbank"):
        fmt = "genbank"
    else:
        fmt = "fasta"

    try:
        records = list(SeqIO.parse(handle, fmt))
    except Exception as e:
        # Fallback to fasta-blast for commented FASTA files
        if fmt == "fasta":
            handle.seek(0)
            records = list(SeqIO.parse(handle, "fasta-blast"))
        else:
            raise e

    if not records:
        raise ValueError("No sequence found in file")

    return str(records[0].seq)
