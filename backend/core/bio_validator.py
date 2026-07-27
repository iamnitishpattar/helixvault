import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger("helixvault")

# Enterprise Biosecurity Exclusion Motifs (based on IGSC & commercial synthesis screening guidelines)
# These represent conserved sequence motifs from regulated viral pathogens, bacterial toxins, and hazardous agents.
PATHOGEN_MOTIF_DATABASE = {
    "INFLUENZA_A_PB1_CONSERVED": "ACGGATACGCTGACATTG",
    "SARBECOVIRUS_REP_MOTIF": "TTAATGGTTCGATGGCAC",
    "RICIN_TOXIN_A_CHAIN_FRAGMENT": "ATCTAGCAACATTACAGG",
    "ANTHRAX_LETHAL_FACTOR_MOTIF": "GAACAGTATGGGACTGTC",
    "SMALLPOX_VACCINIA_CONSERVED": "GTAGATATCCTGCTATTA",
    "EBOLA_L_GENE_MOTIF": "TTCGGCATTGAGGACTAC",
    "BOTULINUM_TOXIN_HEAVY_CHAIN": "AATGTTAACTTTAATTTT"
}

# Standard Restriction Enzyme Cleavage Sites (that complicate synthesis and cloning)
RESTRICTION_ENZYME_SITES = {
    "EcoRI": "GAATTC",
    "BamHI": "GGATCC",
    "HindIII": "AAGCTT",
    "NotI": "GCGGCCGC",
    "SalI": "GTCGAC",
    "PstI": "CTGCAG",
    "XhoI": "CTCGAG"
}

def check_gc_content(dna_seq: str) -> float:
    """Calculates GC percentage in the sequence."""
    if not dna_seq:
        return 0.0
    gc_count = sum(1 for b in dna_seq.upper() if b in ('G', 'C'))
    return round((gc_count / len(dna_seq)) * 100.0, 2)

def find_longest_homopolymer(dna_seq: str) -> int:
    """Finds the length of the longest repeating nucleotide stretch (homopolymer)."""
    if not dna_seq:
        return 0
    max_len = 1
    curr_len = 1
    for i in range(1, len(dna_seq)):
        if dna_seq[i].upper() == dna_seq[i-1].upper() and dna_seq[i].upper() in 'ATCG':
            curr_len += 1
            if curr_len > max_len:
                max_len = curr_len
        else:
            curr_len = 1
    return max_len

def validate_sequence_biosecurity(dna_seq: str, strict_mode: bool = False) -> Dict[str, Any]:
    """
    Scans a synthetic DNA sequence against enterprise biosecurity databases,
    pathogen motif libraries, and biochemical synthesis limits.
    
    Returns a structured validation report.
    """
    if not dna_seq:
        return {
            "passed": False,
            "score": 0.0,
            "gc_content": 0.0,
            "homopolymer_max_len": 0,
            "flags": ["Empty DNA sequence submitted for screening."],
            "pathogen_screen_status": "FAILED",
            "checked_motifs": len(PATHOGEN_MOTIF_DATABASE)
        }

    seq_upper = dna_seq.upper()
    flags: List[str] = []
    score = 100.0
    
    # 1. Pathogen Motif Screening
    pathogen_hits = []
    for name, motif in PATHOGEN_MOTIF_DATABASE.items():
        if motif in seq_upper:
            pathogen_hits.append(name)
            flags.append(f"CRITICAL BIOSECURITY WARNING: Sequence contains conserved pathogen motif ({name}: {motif}).")
            score -= 50.0

    # 2. Homopolymer Analysis
    max_homo = find_longest_homopolymer(seq_upper)
    if max_homo >= 8:
        flags.append(f"SYNTHESIS WARNING: Long homopolymer detected ({max_homo} bp). May cause synthesis or sequencing dropout.")
        score -= 20.0
    elif max_homo >= 6 and strict_mode:
        flags.append(f"STRICT MODE: Moderate homopolymer detected ({max_homo} bp).")
        score -= 10.0

    # 3. Restriction Enzyme Cleavage Site Check
    enzyme_hits = []
    for enzyme, site in RESTRICTION_ENZYME_SITES.items():
        if site in seq_upper:
            enzyme_hits.append(enzyme)
            
    if enzyme_hits:
        msg = f"CLONING NOTICE: Contains restriction enzyme cleavage sites: {', '.join(enzyme_hits)}."
        if strict_mode:
            flags.append(f"STRICT MODE: {msg}")
            score -= (5.0 * len(enzyme_hits))
        else:
            # In standard mode, restriction sites are informational unless frequent
            if len(enzyme_hits) > 3:
                flags.append(msg)
                score -= 5.0

    # 4. GC Content Assessment
    gc = check_gc_content(seq_upper)
    if gc < 25.0 or gc > 75.0:
        flags.append(f"STABILITY WARNING: Extreme GC content ({gc:.1f}%). Optimal synthesis range is 30% - 70%.")
        score -= 15.0

    score = max(0.0, min(100.0, round(score, 1)))
    passed = len(pathogen_hits) == 0 and score >= 60.0

    pathogen_status = "CLEARED" if len(pathogen_hits) == 0 else "FLAGGED - REGULATED PATHOGEN MOTIF DETECTED"
    if not passed and len(pathogen_hits) == 0:
        pathogen_status = "REVIEW REQUIRED - SYNTHESIS COMPLEXITY HIGH"

    report = {
        "passed": passed,
        "score": score,
        "gc_content": gc,
        "homopolymer_max_len": max_homo,
        "flags": flags,
        "pathogen_screen_status": pathogen_status,
        "checked_motifs": len(PATHOGEN_MOTIF_DATABASE),
        "restriction_sites_found": enzyme_hits
    }
    
    if not passed:
        logger.warning(f"Biosecurity screening failed or flagged: {report['pathogen_screen_status']} | Score: {score}")
    else:
        logger.debug(f"Biosecurity screening cleared. Score: {score}")

    return report
