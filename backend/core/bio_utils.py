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

    seq_len = len(dna_seq)
    
    # Fast GC count
    gc_count = dna_seq.count('G') + dna_seq.count('C') + dna_seq.count('g') + dna_seq.count('c')
    gc = (gc_count / seq_len) * 100 if seq_len > 0 else 0.0
    
    mt = 0.0
    if seq_len < 100000: # Only calc melting temp for small sequences
        try:
            seq_obj = Seq(dna_seq)
            mt = MeltingTemp.Tm_Wallace(seq_obj)
        except Exception:
            pass

    import math
    
    # Fast entropy using string counts
    entropy = 0.0
    for base in ['A', 'C', 'G', 'T', 'a', 'c', 'g', 't']:
        c = dna_seq.count(base)
        if c > 0:
            p = c / seq_len
            entropy -= p * math.log2(p)

    # Fast homopolymer checking using regex
    import re
    homopolymer_count = sum(len(m.group(0)) - 1 for m in re.finditer(r'(A{2,}|C{2,}|G{2,}|T{2,})', dna_seq, re.IGNORECASE))

    synthesis_cost_usd = round(seq_len * 0.10, 2)
    physical_weight_pg = round(seq_len * 330 * 1.6605e-12, 6)

    return {
        "gc_content": round(gc, 2),
        "length": seq_len,
        "melting_temp": round(mt, 2),
        "shannon_entropy": round(entropy, 4),
        "homopolymer_count": homopolymer_count,
        "synthesis_cost_usd": synthesis_cost_usd,
        "physical_weight_pg": physical_weight_pg,
        "storage_density_pb_per_gram": 215.0,
    }


def generate_fasta(dna_seq: str, sequence_id: str = "HelixVault_Seq", description: str = "Synthetic DNA Data") -> str:
    # High performance FASTA generator (wraps at 80 chars)
    lines = [f">{sequence_id} {description}"]
    lines.extend(dna_seq[i:i+80] for i in range(0, len(dna_seq), 80))
    return "\n".join(lines) + "\n"


import re

def generate_genbank(dna_seq: str, sequence_id: str = "HV_001", description: str = "Synthetic DNA Data") -> str:
    clean_id = re.sub(r'[^a-zA-Z0-9_]', '', sequence_id)[:16] or "HV_001"
    
    # High performance custom GenBank generator to bypass Biopython's slow formatter
    lines = [
        f"LOCUS       {clean_id.ljust(16)} {len(dna_seq)} bp    DNA     linear   UNK 01-JAN-2026",
        f"DEFINITION  {description}",
        "FEATURES             Location/Qualifiers",
        f"     source          1..{len(dna_seq)}",
        '                     /organism="synthetic DNA construct"',
        '                     /mol_type="other DNA"',
        "ORIGIN      "
    ]
    
    dna_seq = dna_seq.lower()
    for i in range(0, len(dna_seq), 60):
        chunk = dna_seq[i:i+60]
        blocks = [chunk[j:j+10] for j in range(0, len(chunk), 10)]
        line = f"{i+1:9} " + " ".join(blocks)
        lines.append(line)
        
    lines.append("//")
    return "\n".join(lines) + "\n"


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
