import random
from typing import Tuple, Dict, Any

BASES = ['A', 'C', 'G', 'T']

# Empirical transition vs transversion matrix for sequencing noise
# Transitions (A <-> G, C <-> T) are biochemically 2-3x more frequent than transversions
TRANSITION_MAP = {
    'A': 'G',
    'G': 'A',
    'C': 'T',
    'T': 'C'
}

TRANSVERSION_MAP = {
    'A': ['C', 'T'],
    'G': ['C', 'T'],
    'C': ['A', 'G'],
    'T': ['A', 'G']
}


def mutate_base_substitution(base: str, transition_bias: float = 0.70) -> str:
    """Substitutes a nucleotide with realistic transition/transversion bias."""
    u_base = base.upper()
    if u_base not in BASES:
        return base
    if random.random() < transition_bias:
        return TRANSITION_MAP[u_base]
    return random.choice(TRANSVERSION_MAP[u_base])


def simulate_sequencer_noise(sequence: str, model: str = "illumina_miseq") -> Tuple[str, Dict[str, Any]]:
    """
    Simulates realistic experimental noise profiles from next-generation sequencing platforms.
    
    Models:
      1. 'illumina_miseq':
         - Dominated by substitution errors (~99% of all errors).
         - Very low indel rate (< 1e-4).
         - High transition-to-transversion ratio (Ti/Tv ~ 2.0).
         - Error rate: ~0.15% - 0.3%.
         
      2. 'oxford_nanopore_r10':
         - Dominated by homopolymer insertion and deletion (indel) slips (~70% of errors).
         - Substitution rate ~0.8%.
         - Indel rate ~2.2% (especially in runs of identical bases).
         
      3. 'deep_freeze_archival':
         - Simulates baseline millennia-scale cold storage (-80°C) with slow cosmic rays.
         - Substitution rate: 0.01%, 0 indels.
         
      4. 'thermal_degradation':
         - Simulates accelerated room temperature hydrolytic deamination (C -> U -> T).
         - Substitution rate: 0.8%, small indels: 0.1%.
    """
    model_key = model.lower()
    chars = list(sequence)
    substitutions = 0
    deletions = 0
    insertions = 0
    
    if model_key == "illumina_miseq":
        sub_rate = 0.0025  # 0.25%
        indel_rate = 0.00005 # Almost zero indels in Illumina
        ti_bias = 0.75
    elif model_key == "oxford_nanopore_r10":
        sub_rate = 0.006   # 0.6% substitutions
        indel_rate = 0.022 # 2.2% indels (ONT pore slip)
        ti_bias = 0.55
    elif model_key == "thermal_degradation":
        sub_rate = 0.008   # 0.8%
        indel_rate = 0.001
        ti_bias = 0.85     # Cytosine deamination bias
    else:  # deep_freeze_archival
        sub_rate = 0.0001
        indel_rate = 0.0
        ti_bias = 0.50

    i = 0
    while i < len(chars):
        curr = chars[i].upper()
        if curr not in BASES:
            i += 1
            continue

        # Check for Oxford Nanopore homopolymer slip
        is_homopolymer = False
        if i > 0 and chars[i-1].upper() == curr:
            is_homopolymer = True
        
        # Increase indel chance inside homopolymers for ONT
        effective_indel_rate = indel_rate * (2.5 if (is_homopolymer and model_key == "oxford_nanopore_r10") else 1.0)
        
        r = random.random()
        if r < sub_rate:
            chars[i] = mutate_base_substitution(curr, transition_bias=ti_bias)
            substitutions += 1
            i += 1
        elif r < sub_rate + effective_indel_rate:
            # Indel event: 60% deletion, 40% insertion
            if random.random() < 0.60:
                # Deletion
                del chars[i]
                deletions += 1
                # don't increment i
            else:
                # Insertion
                inserted_base = curr if (is_homopolymer and random.random() < 0.8) else random.choice(BASES)
                chars.insert(i, inserted_base)
                insertions += 1
                i += 2
        else:
            i += 1

    mutated_seq = "".join(chars)
    total_corrupted = substitutions + deletions + insertions
    corruption_rate = (total_corrupted / max(len(sequence), 1)) * 100

    return mutated_seq, {
        "model": model_key,
        "original_length": len(sequence),
        "mutated_length": len(mutated_seq),
        "substitutions": substitutions,
        "deletions": deletions,
        "insertions": insertions,
        "total_corrupted_bases": total_corrupted,
        "corruption_percentage": round(corruption_rate, 4)
    }
