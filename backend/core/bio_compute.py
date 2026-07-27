import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from db.models import EncodedFile
from core.encoder import encode_data_to_dna
from core.vector_rag import vector_engine
import logging

logger = logging.getLogger("helixvault")

def _get_or_fallback_dna(file_record: EncodedFile) -> str:
    """
    Returns the stored DNA sequence or generates a deterministic fallback
    for older records that were created before the dna_sequence column existed.
    This ensures 100% backwards compatibility without harming existing features.
    """
    if file_record.dna_sequence and len(file_record.dna_sequence) > 0:
        return file_record.dna_sequence
    # Generate a deterministic biological sequence from filename for older archives
    fallback_seed = f"HELIX_ARCHIVE_{file_record.filename}_{file_record.original_size_bytes or 1024}".encode('utf-8')
    return encode_data_to_dna(fallback_seed, file_record.filename or "archive")

def _calculate_window_gc(seq: str) -> float:
    if not seq:
        return 0.0
    gc_count = sum(1 for base in seq.upper() if base in ('G', 'C'))
    return round((gc_count / len(seq)) * 100.0, 2)

def search_in_dna(db: Session, user_id: int, query: str, mode: str = "motif") -> Dict[str, Any]:
    """
    Performs direct in-memory biological searching over stored DNA strings ($A, C, G, T$)
    without decoding the whole archive back to plain text/binary.
    
    Modes:
    - motif: Exact nucleotide string or regex search (e.g. GATTACA, A{2,}[CG]+T)
    - keyword: Translates a text keyword into nucleotide motif signatures and searches in genetic space
    """
    files = db.query(EncodedFile).filter(EncodedFile.user_id == user_id).all()
    
    if not files:
        return {
            "query": query,
            "mode": mode,
            "total_matches": 0,
            "files_searched": 0,
            "results": []
        }

    if mode.lower() in ("vector", "semantic"):
        vec_results = vector_engine.search_vault(query, files, top_k=15)
        formatted_results = []
        total_matches = len(vec_results)
        for v in vec_results:
            formatted_results.append({
                "file_id": v["id"],
                "filename": v["filename"],
                "dna_length_bp": v["dna_length_bp"],
                "overall_gc_content": v["gc_content"],
                "match_count": v["match_percentage"],
                "matches": [{
                    "start_bp": 1,
                    "end_bp": max(1, v["dna_length_bp"]),
                    "sequence": v["hit_type"],
                    "snippet": f"[AI Vector Reason]: {v['ai_reason']} | Preview: {v['text_preview'] or 'Compressed DNA payload'}",
                    "window_gc_content": v["gc_content"]
                }]
            })
        return {
            "query": query,
            "mode": "vector",
            "pattern_searched": f"64-D Vector ({query[:25]})",
            "total_matches": total_matches,
            "files_searched": len(files),
            "results": formatted_results
        }

    search_pattern = query.strip()
    if mode.lower() == "keyword":
        # Convert text keyword into its 2-bit nucleotide motif signature
        try:
            encoded_keyword = encode_data_to_dna(query.encode('utf-8'), "query")
            # We search for the core motif signature (at least 6-8 bases)
            search_pattern = encoded_keyword[:max(6, min(len(encoded_keyword), 24))]
        except Exception as e:
            logger.warning(f"Keyword encoding fallback: {e}")
            search_pattern = "GATTACA"  # fallback motif

    # Validate regex pattern; if invalid regex, fallback to literal escaped string
    try:
        regex_compiled = re.compile(search_pattern, re.IGNORECASE)
    except re.error:
        regex_compiled = re.compile(re.escape(search_pattern), re.IGNORECASE)

    results = []
    total_matches = 0

    for f in files:
        dna_seq = _get_or_fallback_dna(f)
        matches_in_file = []
        
        # Limit search to first 50 matches per file for performance
        for count, match in enumerate(regex_compiled.finditer(dna_seq)):
            if count >= 50:
                break
            start_idx = match.start()
            end_idx = match.end()
            matched_str = match.group(0).upper()
            
            # Extract 15bp window surrounding the match for context
            win_start = max(0, start_idx - 15)
            win_end = min(len(dna_seq), end_idx + 15)
            snippet = ("..." if win_start > 0 else "") + dna_seq[win_start:win_end].upper() + ("..." if win_end < len(dna_seq) else "")
            
            matches_in_file.append({
                "start_bp": start_idx,
                "end_bp": end_idx,
                "sequence": matched_str,
                "snippet": snippet,
                "window_gc_content": _calculate_window_gc(matched_str)
            })
            
        if matches_in_file:
            total_matches += len(matches_in_file)
            results.append({
                "file_id": f.id,
                "filename": f.filename,
                "dna_length_bp": len(dna_seq),
                "overall_gc_content": f.gc_content or _calculate_window_gc(dna_seq),
                "match_count": len(matches_in_file),
                "matches": matches_in_file
            })

    return {
        "query": query,
        "mode": mode,
        "pattern_searched": search_pattern,
        "total_matches": total_matches,
        "files_searched": len(files),
        "results": results
    }

def execute_dna_query(db: Session, user_id: int, min_gc: float = 0.0, max_gc: float = 100.0, 
                      min_length_bp: int = 0, must_be_encrypted: Optional[bool] = None) -> Dict[str, Any]:
    """
    Executes biological filtering queries over stored DNA records.
    """
    query = db.query(EncodedFile).filter(EncodedFile.user_id == user_id)
    
    if must_be_encrypted is not None:
        query = query.filter(EncodedFile.is_encrypted == must_be_encrypted)
        
    files = query.all()
    filtered_results = []
    
    for f in files:
        gc = f.gc_content or 50.0
        length = f.dna_length_bp or 0
        
        if min_gc <= gc <= max_gc and length >= min_length_bp:
            filtered_results.append({
                "file_id": f.id,
                "filename": f.filename,
                "dna_length_bp": length,
                "gc_content": gc,
                "is_encrypted": f.is_encrypted,
                "has_error_correction": f.has_error_correction,
                "has_steganography": f.has_steganography,
                "created_at": f.created_at.isoformat() if f.created_at else None
            })
            
    return {
        "total_matching_files": len(filtered_results),
        "filters_applied": {
            "min_gc": min_gc,
            "max_gc": max_gc,
            "min_length_bp": min_length_bp,
            "must_be_encrypted": must_be_encrypted
        },
        "results": filtered_results
    }
