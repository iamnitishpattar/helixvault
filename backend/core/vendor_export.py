import io
import csv
from typing import List, Dict, Any

def chunk_sequence(sequence: str, chunk_size: int = 180, overlap: int = 20) -> List[Dict[str, Any]]:
    """
    Splits long synthesized DNA sequence into standardized overlapping oligonucleotides
    suitable for commercial solid-phase DNA synthesis (e.g., Twist Bioscience or IDT).
    
    Standard oligo length: 150-200 bp.
    Overlap (homology arms for PCA/Gibson assembly): 20 bp.
    """
    oligos = []
    step = chunk_size - overlap
    seq_len = len(sequence)
    index = 1
    
    for start in range(0, seq_len, step):
        end = min(start + chunk_size, seq_len)
        chunk = sequence[start:end]
        oligos.append({
            "index": index,
            "name": f"HV_Oligo_{index:03d}",
            "start": start,
            "end": end,
            "length": len(chunk),
            "sequence": chunk
        })
        index += 1
        if end >= seq_len:
            break
            
    return oligos


def get_well_position(index: int) -> str:
    """
    Maps 1-based index to standard 96-well plate coordinate (A01 - H12).
    """
    row_idx = (index - 1) // 12
    col_idx = ((index - 1) % 12) + 1
    row_letter = chr(ord('A') + (row_idx % 8))
    plate_num = ((index - 1) // 96) + 1
    prefix = f"P{plate_num}_" if plate_num > 1 else ""
    return f"{prefix}{row_letter}{col_idx:02d}"


def generate_twist_order_csv(sequence: str, payload_name: str = "HelixVault_Payload", 
                             oligo_size: int = 180, overlap: int = 20) -> str:
    """
    Generates ready-to-upload CSV formatted strictly according to Twist Bioscience 
    Oligonucleotide Pool / 96-Well Plate order specification.
    """
    oligos = chunk_sequence(sequence, chunk_size=oligo_size, overlap=overlap)
    output = io.StringIO()
    writer = csv.writer(output, lineterminator='\n')
    
    # Twist Bioscience Standard Columns
    writer.writerow([
        "Well Position",
        "Sequence Name",
        "Sequence (5' -> 3')",
        "Length (bp)",
        "Scale",
        "Purification",
        "Yield Target (pmol)",
        "Notes"
    ])
    
    for o in oligos:
        well = get_well_position(o["index"])
        writer.writerow([
            well,
            f"{payload_name}_{o['name']}",
            o["sequence"],
            o["length"],
            "100pmol",
            "Standard Desalt",
            "100",
            f"Coordinates: {o['start']}..{o['end']} bp"
        ])
        
    return output.getvalue()


def generate_idt_plate_csv(sequence: str, payload_name: str = "HelixVault_Payload",
                           oligo_size: int = 180, overlap: int = 20) -> str:
    """
    Generates ready-to-upload CSV formatted strictly according to Integrated DNA Technologies (IDT)
    Standard 96-Well Plate ordering specification.
    """
    oligos = chunk_sequence(sequence, chunk_size=oligo_size, overlap=overlap)
    output = io.StringIO()
    writer = csv.writer(output, lineterminator='\n')
    
    # IDT Standard Plate Order Columns
    writer.writerow([
        "WellPosition",
        "Name",
        "Sequence",
        "Scale",
        "Purification",
        "Concentration"
    ])
    
    for o in oligos:
        well = get_well_position(o["index"])
        writer.writerow([
            well,
            f"{payload_name}_{o['name']}",
            o["sequence"],
            "25nm",
            "STD",
            "100uM in IDTE pH 8.0"
        ])
        
    return output.getvalue()
