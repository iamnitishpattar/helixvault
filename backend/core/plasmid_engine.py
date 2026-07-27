"""
plasmid_engine.py
Synthetic Biology Circular Plasmid Cloning Workbench & SnapGene Exporter.
Models standard cloning vectors (pUC19, pBR322), inserts synthetic DNA payloads into
Multiple Cloning Sites (MCS), calculates shifted feature annotations, and exports
circular GenBank (.gb) files compatible with SnapGene, Benchling, and NCBI.
"""

import io
import re
import datetime
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio import SeqIO
from Bio.SeqFeature import SeqFeature, FeatureLocation
from Bio.SeqUtils import gc_fraction

# Define Standard Vector Backbones with exact biological features
VECTORS = {
    "pUC19": {
        "name": "pUC19",
        "description": "High-copy E. coli cloning vector with Ampicillin resistance and lacZ alpha peptide.",
        "default_length": 2686,
        "antibiotic": "Ampicillin (100 µg/mL)",
        "copy_number": "High (~500-700 copies/cell)",
        "mcs_insertion_index": 410,  # Exact EcoRI restriction site insertion point in MCS
        "base_sequence": (
            "TCGCGCGTTTCGGTGATGACGGTGAAAACCTCTGACACATGCAGCTCCCGGAGACGGTCACAGCTTGTCTGT"
            "AAGCGGATGCCGGGAGCAGACAAGCCCGTCAGGGCGCGTCAGCGGGTGTTGGCGGGTGTCGGGGCTGGCTTA"
            "ACTATGCGGCATCAGAGCAGATTGTACTGAGAGTGCACCATATGCGGTGTGAAATACCGCACAGATGCGTAA"
            "GGAGAAAATACCGCATCAGGCGCCATTCGCCATTCAGGCTGCGCAACTGTTGGGAAGGGCGATCGGTGCGGG"
            "CCTCTTCGCTATTACGCCAGCTGGCGAAAGGGGGATGTGCTGCAAGGCGATTAAGTTGGGTAACGCCAGGGT"
            "TTTCCCAGTCACGACGTTGTAAAACGACGGCCAGTGAATTCGAGCTCGGTACCCGGGGATCCTCTAGAGTCG"
            "ACCTGCAGGCATGCAAGCTTGGCGTAATCATGGTCATAGCTGTTTCCTGTGTGAAATTGTTATCCGCTCACA"
            "ATTCCACACAACATACGAGCCGGAAGCATAAAGTGTAAAGCCTGGGGTGCCTAATGAGTGAGCTAACTCACA"
            "TTAATTGCGTTGCGCTCACTGCCCGCTTTCCAGTCGGGAAACCTGTCGTGCCAGCTGCATTAATGAATCGGC"
            "CAACGCGCGGGGAGAGGCGGTTTGCGTATTGGGCGCTCTTCCGCTTCCTCGCTCACTGACTCGCTGCGCTCG"
            "GTCGTTCGGCTGCGGCGAGCGGTATCAGCTCACTCAAAGGCGGTAATACGGTTATCCACAGAATCAGGGGAT"
            "AACGCAGGAAAGAACATGTGAGCAAAAGGCCAGCAAAAGGCCAGGAACCGTAAAAAGGCCGCGTTGCTGGCG"
            "TTTTTCCATAGGCTCCGCCCCCCTGACGAGCATCACAAAAATCGACGCTCAAGTCAGAGGTGGCGAAACCCG"
            "ACAGGACTATAAAGATACCAGGCGTTTCCCCCTGGAAGCTCCCTCGTGCGCTCTCCTGTTCCGACCCTGCCG"
            "CTTACCGGATACCTGTCCGCCTTTCTCCCTTCGGGAAGCGTGGCGCTTTCTCATAGCTCACGCTGTAGGTAT"
            "CTCAGTTCGGTGTAGGTCGTTCGCTCCAAGCTGGGCTGTGTGCACGAACCCCCCGTTCAGCCCGACCGCTGC"
            "GCCTTATCCGGTAACTATCGTCTTGAGTCCAACCCGGTAAGACACGACTTATCGCCACTGGCAGCAGCCACT"
            "GGTAACAGGATTAGCAGAGCGAGGTATGTAGGCGGTGCTACAGAGTTCTTGAAGTGGTGGCCTAACTACGGC"
            "TACACTAGAAGAACAGTATTTGGTATCTGCGCTCTGCTGAAGCCAGTTACCTTCGGAAAAAGAGTTGGTAGC"
            "TCTTGATCCGGCAAACAAACCACCGCTGGTAGCGGTGGTTTTTTTGTTTGCAAGCAGCAGATTACGCGCAGA"
            "AAAAAAGGATCTCAAGAAGATCCTTTGATCTTTTCTACGGGGTCTGACGCTCAGTGGAACGAAAACTCACGT"
            "TAAGGGATTTTGGTCATGAGATTATCAAAAAGGATCTTCACCTAGATCCTTTTAAATTAAAAATGAAGTTTT"
            "AAATCAATCTAAAGTATATATGAGTAAACTTGGTCTGACAGTTACCAATGCTTAATCAGTGAGGCACCTATC"
            "TCAGCGATCTGTCTATTTCGTTCATCCATAGTTGCCTGACTCCCCGTCGTGTAGATAACTACGATACGGGAG"
            "GGCTTACCATCTGGCCCCAGTGCTGCAATGATACCGCGAGACCCACGCTCACCGGCTCCAGATTTATCAGCA"
            "ATAAACCAGCCAGCCGGAAGGGCCGAGCGCAGAAGTGGTCCTGCAACTTTATCCGCCTCCATCCAGTCTATT"
            "AATTGTTGCCGGGAAGCTAGAGTAAGTAGTTCGCCAGTTAATAGTTTGCGCAACGTTGTTGCCATTGCTACA"
            "GGCATCGTGGTGTCACGCTCGTCGTTTGGTATGGCTTCATTCAGCTCCGGTTCCCAACGATCAAGGCGAGTT"
            "ACATGATCCCCCATGTTGTGCAAAAAAGCGGTTAGCTCCTTCGGTCCTCCGATCGTTGTCAGAAGTAAGTTG"
            "GCCGCAGTGTTATCACTCATGGTTATGGCAGCACTGCATAATTCTCTTACTGTCATGCCATCCGTAAGATGC"
            "TTTTCTGTGACTGGTGAGTACTCAACCAAGTCATTCTGAGAATAGTGTATGCGGCGACCGAGTTGCTCTTGC"
            "CCGGCGTCAATACGGGATAATACCGCGCCACATAGCAGAACTTTAAAAGTGCTCATCATTGGAAAACGTTCT"
            "TCGGGGCGAAAACTCTCAAGGATCTTACCGCTGTTGAGATCCAGTTCGATGTAACCCACTCGTGCACCCAAC"
            "TGATCTTCAGCATCTTTTACTTTCACCAGCGTTTCTGGGTGAGCAAAAACAGGAAGGCAAAATGCCGCAAAA"
            "AGGGAATAAGGGCGACACGGAAATGTTGAATACTCATACTCTTCCTTTTTCAATATTATTGAAGCATTTATC"
            "AGGGTTATTGTCTCATGAGCGGATACATATTTGAATGTATTTAGAAAAATAAACAAATAGGGGTTCCGCGCA"
            "CATTTCCCCGAAAAGTGCCACCTGACGTCTAAGAAACCATTATTATCATGACATTAACCTATAAAAATAGGC"
            "GTATCACGAGGCCCTTTCGTC"
        ),
        "features": [
            {"name": "lacZ promoter", "type": "promoter", "start": 200, "end": 350, "color": "#EAB308", "strand": 1, "description": "Promoter for the lacZ alpha reporter gene"},
            {"name": "MCS (Multiple Cloning Site)", "type": "misc_feature", "start": 396, "end": 452, "color": "#A855F7", "strand": 1, "description": "Contains EcoRI, BamHI, HindIII, XbaI, PstI restriction sites"},
            {"name": "pMB1 (ColE1) ori", "type": "rep_origin", "start": 866, "end": 1454, "color": "#F97316", "strand": -1, "description": "High-copy origin of replication"},
            {"name": "AmpR (Beta-lactamase)", "type": "CDS", "start": 1629, "end": 2489, "color": "#EF4444", "strand": -1, "description": "Confers resistance to Ampicillin and penicillin antibiotics"}
        ]
    },
    "pBR322": {
        "name": "pBR322",
        "description": "Medium-copy E. coli cloning plasmid with Ampicillin and Tetracycline dual resistance markers.",
        "default_length": 4361,
        "antibiotic": "Ampicillin & Tetracycline (50 µg/mL)",
        "copy_number": "Medium (~15-20 copies/cell)",
        "mcs_insertion_index": 190,  # EcoRI insertion site
        "base_sequence": (
            "TTCTCATGTTTGACAGCTTATCATCGATAAGCTTTAATGCGGTAGTTTATCACAGTTAAATTGCTAACGCAG"
            "TCAGGCACCGTGTATGAAATCTAACAATGCGCTCATCGTCATCCTCGGCACCGTCACCCTGGATGCTGTAGG"
            "CATAGGCTTGGTTATGCCGGTACTGCCGGGCCTCTTGCGGGATATCGTCCATTCCGACAGCATCGCCAGTCA"
            "CTATGGCGTGCTGCTAGCGCTATATGCGTTGATGCAATTTCTATGCGCACCCGTTCTCGGAGCACTGTCCGA"
            "CCGCTTTGGCCGCCGCCCAGTCCTGCTCGCTTCGCTACTTGGAGCCACTATCGACTACGCGATCATGGCGAC"
            "CACACCCGTCCTGTGGATCCTCTACGCCGGACGCATCGTGGCCGGCATCACCGGCGCCACAGGTGCGGTTGC"
            "TGGCGCCTATATCGCCGACATCACCGATGGGGAAGATCGGGCTCGCCACTTCGGGCTCATGAGCGCTTGTTT"
            "CGGCGTGGGTATGGTGGCAGGCCCCGTGGCCGGGGGACTGTTGGGCGCCATCTCCTTGCATGCACCATTCCT"
            "TGCGGCGGCGGTGCTCAACGGCCTCAACCTACTACTGGGCTGCTTCCTAATGCAGGAGTCGCATAAGGGAGA"
            "GCGTCGACCGATGCCCTTGAGAGCCTTCAACCCAGTCAGCTCCTTCCGGTGGGCGCGGGGCATGACTATCGT"
            "CGCCGCACTTATGACTGTCTTCTTTATCATGCAACTCGTAGGACAGGTGCCGGCAGCGCTCTGGGTCATTTT"
            "CGGCGAGGACCGCTTTCGCTGGAGCGCGACGATGATCGGCCTGTCGCTTGCGGTATTCGGAATCTTGCACGC"
            "CCTCGCTCAAGCCTTCGTCACTGGTCCCGCCACCAAACGTTTCGGCGAGAAGCAGGCCATTATCGCCGGCAT"
            "GGCGGCCGACGCGCTGGGCTACGTCTTGCTGGCGTTCGCGACGCGAGGCTGGATGGCCTTCCCCATTATGAT"
            "TCTTCTCGCTTCCGGCGGCATCGGGATGCCCGCGTTGCAGGCCATGCTGTCCAGGCAGGTAGATGACGACCA"
            "TCAGGGACAGCTTCAAGGATCGCTCGCGGCTCTTACCAGCCTAACTTCGATCACTGGACCGCTGATCGTCAC"
            "GGCGATTTATGCCGCCTCGGCGAGCACATGGAACGGGTTGGCATGGATTGTAGGCGCCGCCCTATACCTTGT"
            "CTGCCTCCCCGCGTTGCGTCGCGGTGCATGGAGCCGGGCCACCTCGACCTGAATGGAAGCCGGCGGCACCTC"
            "GCTAACGGATTCACCACTCCAAGAATTGGAGCCAATCAATTCTTGCGGAGAACTGTGAATGCGCAAACCAAC"
            "CCTTGGCAGAACATATCCATCGCGTCCGCCATCTCCAGCAGCCGCACGCGGCGCATCTCGGGCAGCGTTGGG"
            "TCCTGGCCACGGGTGCGCATGATCGTGCTCCTGTCGTTGAGGACCCGGCTAGGCTGGCGGGGTTGCCTTACT"
            "GGTTAGCAGAATGAATCACCGATACGCGAGCGAACGTGAAGCGACTGCTGCTGCAAAACGTCTGCGACCTGA"
            "GCAACAACATGAATGGTCTTCGGTTTCCGTGTTTCGTAAAGTCTGGAAACGCGGAAGTCAGCGCCCTGCACC"
            "ATTATGTTCCGGATCTGCATCGCAGGATGCTGCTGGCTACCCTGTGGAACACCTACATCTGTATTAACGAAG"
            "CGCTGGCATTGACCCTGAGTGATTTTTCTCTGGTCCCGCCGCATCCATACCGCCAGTTGTTTACCCTCACAA"
            "CGTTCCAGTAACCGGGCATGTTCATCATCAGTAACCCGTATCGTGAGCATCCTCTCTCGTTTCATCGGTATC"
            "ATTACCCCCATGAACAGAAATCCCCCTTACACGGAGGCATCAGTGACCAAACAGGAAAAAACCGCCCTTAAC"
            "ATGGCCCGCTTTATCAGAAGCCAGACATTAACGCTTCTGGAGAAACTCAACGAGCTGGACGCGGATGAACAG"
            "GCAGACATCTGTGAATCGCTTCACGACCACGCTGATGAGCTTTACCGCAGCTGCCTCGCGCGTTTCGGTGAT"
            "GACGGTGAAAACCTCTGACACATGCAGCTCCCGGAGACGGTCACAGCTTGTCTGTAAGCGGATGCCGGGAGC"
            "AGACAAGCCCGTCAGGGCGCGTCAGCGGGTGTTGGCGGGTGTCGGGGCTGGCTTAACTATGCGGCATCAGAG"
            "CAGATTGTACTGAGAGTGCACCATATGCGGTGTGAAATACCGCACAGATGCGTAAGGAGAAAATACCGCATC"
            "AGGCGCCATTCGCCATTCAGGCTGCGCAACTGTTGGGAAGGGCGATCGGTGCGGGCCTCTTCGCTATTACGC"
            "CAGCTGGCGAAAGGGGGATGTGCTGCAAGGCGATTAAGTTGGGTAACGCCAGGGTTTTCCCAGTCACGACGT"
            "TGTAAAACGACGGCCAGTGAATTCGAGCTCGGTACCCGGGGATCCTCTAGAGTCGACCTGCAGGCATGCAAG"
            "CTTGGCGTAATCATGGTCATAGCTGTTTCCTGTGTGAAATTGTTATCCGCTCACAATTCCACACAACATACG"
            "AGCCGGAAGCATAAAGTGTAAAGCCTGGGGTGCCTAATGAGTGAGCTAACTCACATTAATTGCGTTGCGCTC"
            "ACTGCCCGCTTTCCAGTCGGGAAACCTGTCGTGCCAGCTGCATTAATGAATCGGCCAACGCGCGGGGAGAGG"
            "CGGTTTGCGTATTGGGCGCTCTTCCGCTTCCTCGCTCACTGACTCGCTGCGCTCGGTCGTTCGGCTGCGGCG"
            "AGCGGTATCAGCTCACTCAAAGGCGGTAATACGGTTATCCACAGAATCAGGGGATAACGCAGGAAAGAACAT"
            "GTGAGCAAAAGGCCAGCAAAAGGCCAGGAACCGTAAAAAGGCCGCGTTGCTGGCGTTTTTCCATAGGCTCCG"
            "CCCCCCTGACGAGCATCACAAAAATCGACGCTCAAGTCAGAGGTGGCGAAACCCGACAGGACTATAAAGATA"
            "CCAGGCGTTTCCCCCTGGAAGCTCCCTCGTGCGCTCTCCTGTTCCGACCCTGCCGCTTACCGGATACCTGTC"
            "CGCCTTTCTCCCTTCGGGAAGCGTGGCGCTTTCTCATAGCTCACGCTGTAGGTATCTCAGTTCGGTGTAGGT"
            "CGTTCGCTCCAAGCTGGGCTGTGTGCACGAACCCCCCGTTCAGCCCGACCGCTGCGCCTTATCCGGTAACTA"
            "TCGTCTTGAGTCCAACCCGGTAAGACACGACTTATCGCCACTGGCAGCAGCCACTGGTAACAGGATTAGCAG"
            "AGCGAGGTATGTAGGCGGTGCTACAGAGTTCTTGAAGTGGTGGCCTAACTACGGCTACACTAGAAGAACAGT"
            "ATTTGGTATCTGCGCTCTGCTGAAGCCAGTTACCTTCGGAAAAAGAGTTGGTAGCTCTTGATCCGGCAAACA"
            "AACCACCGCTGGTAGCGGTGGTTTTTTTGTTTGCAAGCAGCAGATTACGCGCAGAAAAAAAGGATCTCAAGA"
            "AGATCCTTTGATCTTTTCTACGGGGTCTGACGCTCAGTGGAACGAAAACTCACGTTAAGGGATTTTGGTCAT"
            "GAGATTATCAAAAAGGATCTTCACCTAGATCCTTTTAAATTAAAAATGAAGTTTTAAATCAATCTAAAGTAT"
            "ATATGAGTAAACTTGGTCTGACAGTTACCAATGCTTAATCAGTGAGGCACCTATCTCAGCGATCTGTCTATT"
            "TCGTTCATCCATAGTTGCCTGACTCCCCGTCGTGTAGATAACTACGATACGGGAGGGCTTACCATCTGGCCC"
            "CAGTGCTGCAATGATACCGCGAGACCCACGCTCACCGGCTCCAGATTTATCAGCAATAAACCAGCCAGCCGG"
            "AAGGGCCGAGCGCAGAAGTGGTCCTGCAACTTTATCCGCCTCCATCCAGTCTATTAATTGTTGCCGGGAAGC"
            "TAGAGTAAGTAGTTCGCCAGTTAATAGTTTGCGCAACGTTGTTGCCATTGCTACAGGCATCGTGGTGTCACG"
            "CTCGTCGTTTGGTATGGCTTCATTCAGCTCCGGTTCCCAACGATCAAGGCGAGTTACATGATCCCCCATGTT"
            "GTGCAAAAAAGCGGTTAGCTCCTTCGGTCCTCCGATCGTTGTCAGAAGTAAGTTGGCCGCAGTGTTATCACT"
            "CATGGTTATGGCAGCACTGCATAATTCTCTTACTGTCATGCCATCCGTAAGATGCTTTTCTGTGACTGGTGA"
            "GTACTCAACCAAGTCATTCTGAGAATAGTGTATGCGGCGACCGAGTTGCTCTTGCCCGGCGTCAATACGGGA"
            "TAATACCGCGCCACATAGCAGAACTTTAAAAGTGCTCATCATTGGAAAACGTTCTTCGGGGCGAAAACTCTC"
            "AAGGATCTTACCGCTGTTGAGATCCAGTTCGATGTAACCCACTCGTGCACCCAACTGATCTTCAGCATCTTT"
            "TACTTTCACCAGCGTTTCTGGGTGAGCAAAAACAGGAAGGCAAAATGCCGCAAAAAGGGAATAAGGGCGACA"
            "CGGAAATGTTGAATACTCATACTCTTCCTTTTTCAATATTATTGAAGCATTTATCAGGGTTATTGTCTCATG"
            "AGCGGATACATATTTGAATGTATTTAGAAAAATAAACAAATAGGGGTTCCGCGCACATTTCCCCGAAAAGTG"
            "CCACCTGACGTCTAAGAAACCATTATTATCATGACATTAACCTATAAAAATAGGCGTATCACGAGGCCCTTT"
            "CGTCTTCAAG"
        ),
        "features": [
            {"name": "TetR (Tetracycline Resistance)", "type": "CDS", "start": 86, "end": 1276, "color": "#3B82F6", "strand": 1, "description": "Confers resistance to Tetracycline antibiotic"},
            {"name": "MCS (Multiple Cloning Site)", "type": "misc_feature", "start": 185, "end": 235, "color": "#A855F7", "strand": 1, "description": "Contains EcoRI, BamHI, HindIII restriction cut sites"},
            {"name": "pMB1 (ColE1) ori", "type": "rep_origin", "start": 2519, "end": 3133, "color": "#F97316", "strand": -1, "description": "Medium-copy origin of replication"},
            {"name": "AmpR (Beta-lactamase)", "type": "CDS", "start": 3293, "end": 4153, "color": "#EF4444", "strand": -1, "description": "Confers resistance to Ampicillin antibiotic"}
        ]
    }
}

# Standard Restriction Enzyme Cut Sites to scan in cloned plasmid
RESTRICTION_ENZYMES = {
    "EcoRI": "GAATTC",
    "BamHI": "GGATCC",
    "HindIII": "AAGCTT",
    "NotI": "GCGGCCGC",
    "XbaI": "TCTAGA",
    "PstI": "CTGCAG"
}


def get_available_vectors() -> list:
    """Returns metadata for all available cloning vectors."""
    vectors_info = []
    for k, v in VECTORS.items():
        vectors_info.append({
            "name": v["name"],
            "description": v["description"],
            "default_length": len(v["base_sequence"]),
            "antibiotic": v["antibiotic"],
            "copy_number": v["copy_number"],
            "feature_count": len(v["features"])
        })
    return vectors_info


def clone_payload_into_vector(payload_dna: str, vector_name: str = "pUC19", payload_name: str = "Synthetic_Data_Payload") -> dict:
    """
    Clones a synthetic DNA payload into the specified bacterial plasmid vector.
    Inserts at the Multiple Cloning Site (MCS) and shifts coordinates of downstream features.
    """
    if vector_name not in VECTORS:
        raise ValueError(f"Unknown cloning vector: {vector_name}. Available: {list(VECTORS.keys())}")

    vector = VECTORS[vector_name]
    clean_payload = re.sub(r'[^ACGTacgt]', '', payload_dna).upper()
    if not clean_payload:
        clean_payload = "GAATTCGGATCCAAGCTT"  # Default fallback MCS placeholder

    insert_idx = vector["mcs_insertion_index"]
    vec_seq = vector["base_sequence"]

    # Slice and insert payload
    cloned_seq = vec_seq[:insert_idx] + clean_payload + vec_seq[insert_idx:]
    payload_len = len(clean_payload)
    total_len = len(cloned_seq)

    # Calculate shifted feature annotations
    shifted_features = []
    for f in vector["features"]:
        f_start = f["start"]
        f_end = f["end"]

        # If feature is after or encompasses insertion index, shift appropriately
        if f_start >= insert_idx:
            f_start += payload_len
            f_end += payload_len
        elif f_end >= insert_idx:
            f_end += payload_len

        shifted_features.append({
            "name": f["name"],
            "type": f["type"],
            "start": f_start,
            "end": f_end,
            "color": f["color"],
            "strand": f["strand"],
            "description": f["description"]
        })

    # Insert the user's data payload as a new highlighted feature
    shifted_features.insert(1, {
        "name": payload_name,
        "type": "subclone",
        "start": insert_idx,
        "end": insert_idx + payload_len,
        "color": "#06B6D4",  # Glowing Neon Cyan
        "strand": 1,
        "description": f"HelixVault Synthetic DNA Archival Payload ({payload_len} bp)"
    })

    # Scan for restriction cut sites in the cloned sequence
    cut_sites = {}
    for r_name, r_motif in RESTRICTION_ENZYMES.items():
        matches = [m.start() + 1 for m in re.finditer(r_motif, cloned_seq)]
        if matches:
            cut_sites[r_name] = {
                "motif": r_motif,
                "count": len(matches),
                "positions": matches
            }

    # Calculate GC content
    gc_pct = round(gc_fraction(Seq(cloned_seq)) * 100, 2)

    return {
        "status": "success",
        "vector_name": vector_name,
        "payload_name": payload_name,
        "payload_length_bp": payload_len,
        "total_length_bp": total_len,
        "gc_content_pct": gc_pct,
        "antibiotic_resistance": vector["antibiotic"],
        "copy_number": vector["copy_number"],
        "circular_sequence": cloned_seq,
        "features": shifted_features,
        "restriction_sites": cut_sites,
        "cloned_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


def export_circular_genbank(cloned_data: dict, locus_name: str = "pHV_CLONE", description: str = "HelixVault Synthetic Biology Circular Plasmid Clone") -> str:
    """
    Exports a cloned plasmid object as a fully annotated, circular GenBank (.gb) string
    compatible with professional tools like SnapGene, Benchling, and NCBI.
    """
    seq_str = cloned_data.get("circular_sequence", "")
    if not seq_str:
        raise ValueError("Cannot export GenBank: empty circular sequence")

    clean_locus = re.sub(r'[^a-zA-Z0-9_]', '', locus_name)[:16]
    if not clean_locus:
        clean_locus = "pHV_CLONE"

    record = SeqRecord(
        Seq(seq_str),
        id=clean_locus,
        name=clean_locus,
        description=f"{description} ({cloned_data.get('vector_name', 'Vector')})",
        annotations={
            "molecule_type": "DNA",
            "topology": "circular",
            "data_file_division": "SYN",
            "date": datetime.datetime.now().strftime("%d-%b-%Y").upper()
        }
    )

    # Attach all annotated features
    for f in cloned_data.get("features", []):
        try:
            start_idx = max(0, int(f["start"]) - 1)  # 0-indexed for BioPython
            end_idx = min(len(seq_str), int(f["end"]))
            location = FeatureLocation(start_idx, end_idx, strand=int(f.get("strand", 1)))
            
            feature = SeqFeature(
                location=location,
                type=f.get("type", "misc_feature"),
                qualifiers={
                    "label": [f.get("name", "Feature")],
                    "note": [f.get("description", "")],
                    "color": [f.get("color", "#CCCCCC")]
                }
            )
            record.features.append(feature)
        except Exception:
            continue

    # Attach restriction enzyme sites as misc_difference or site features
    for r_name, r_info in cloned_data.get("restriction_sites", {}).items():
        for pos in r_info.get("positions", []):
            try:
                start_idx = max(0, int(pos) - 1)
                end_idx = min(len(seq_str), start_idx + len(r_info["motif"]))
                loc = FeatureLocation(start_idx, end_idx, strand=1)
                site_feat = SeqFeature(
                    location=loc,
                    type="misc_feature",
                    qualifiers={
                        "label": [f"{r_name} cut site"],
                        "note": [f"Restriction site motif {r_info['motif']}"]
                    }
                )
                record.features.append(site_feat)
            except Exception:
                continue

    handle = io.StringIO()
    SeqIO.write(record, handle, "genbank")
    return handle.getvalue()
