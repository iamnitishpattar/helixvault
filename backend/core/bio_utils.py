from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio import SeqIO
from Bio.SeqUtils import gc_fraction, MeltingTemp
import io


def calculate_metrics(dna_seq: str) -> dict:
    if not dna_seq:
        return {"gc_content": 0, "length": 0, "melting_temp": 0}

    seq_obj = Seq(dna_seq)
    gc = gc_fraction(seq_obj) * 100
    try:
        mt = MeltingTemp.Tm_Wallace(seq_obj)
    except Exception:
        mt = 0.0

    return {
        "gc_content": round(gc, 2),
        "length": len(dna_seq),
        "melting_temp": round(mt, 2)
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


def generate_genbank(dna_seq: str, sequence_id: str = "HV_001", description: str = "Synthetic DNA Data") -> str:
    # GenBank format has specific requirements for the ID and name
    record = SeqRecord(
        Seq(dna_seq),
        id=sequence_id[:16],  # GenBank locus names have max length
        name=sequence_id[:16],
        description=description,
        annotations={"molecule_type": "DNA"}
    )
    handle = io.StringIO()
    SeqIO.write(record, handle, "genbank")
    return handle.getvalue()


def extract_sequence_from_file(file_content: bytes, filename: str) -> str:
    handle = io.StringIO(file_content.decode('utf-8'))
    fmt = "fasta"
    if filename.endswith(".gb") or filename.endswith(".genbank"):
        fmt = "genbank"

    records = list(SeqIO.parse(handle, fmt))
    if not records:
        raise ValueError("No sequence found in file")

    return str(records[0].seq)
