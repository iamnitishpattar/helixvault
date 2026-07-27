import numpy as np
import re
from typing import List, Dict, Any, Optional

class DnaVectorEngine:
    """
    HelixVault Autonomous DNA-RAG & Genomic Vector Engine.
    Uses pure NumPy to generate 64-dimensional semantic & genomic k-mer embeddings
    for oligonucleotide archives and natural language queries, enabling high-precision
    cosine similarity search without heavy GPU dependencies.
    """
    def __init__(self):
        # 16 Dimer motifs for genomic k-mer frequency profiling
        self.dimers = ['AA', 'AT', 'AC', 'AG', 'TA', 'TT', 'TC', 'TG', 
                       'CA', 'CT', 'CC', 'CG', 'GA', 'GT', 'GC', 'GG']
        
        # 20 Core semantic concepts / keywords for vault indexing
        self.semantic_keywords = [
            'report', 'secret', 'project', 'financial', 'backup', 'image', 
            'video', 'data', 'test', 'demo', 'code', 'archive', 'key', 
            'genome', 'matrix', 'vault', 'log', 'user', 'stego', 'defense',
            'encrypt', 'error', 'correction', 'fountain', 'motif', 'oligo',
            'config', 'password', 'token', 'access', 'private', 'secure'
        ]

    def _normalize(self, vec: np.ndarray) -> np.ndarray:
        """L2 Vector normalization."""
        norm = np.linalg.norm(vec)
        if norm == 0:
            return vec
        return vec / norm

    def _get_kmer_features(self, sequence: Optional[str]) -> np.ndarray:
        """Extract 16-D normalized dimer frequency profile from DNA sequence."""
        vec = np.zeros(16, dtype=np.float32)
        if not sequence or len(sequence) < 2:
            return vec
            
        seq_upper = sequence.upper()
        total_pairs = len(seq_upper) - 1
        for i, dimer in enumerate(self.dimers):
            count = seq_upper.count(dimer)
            vec[i] = count / max(1, total_pairs)
        return self._normalize(vec)

    def _get_bio_features(self, file_obj: Any) -> np.ndarray:
        """Extract 16-D biological stability and metadata features."""
        vec = np.zeros(16, dtype=np.float32)
        
        # GC content normalized (ideal around 50% = 0.5)
        gc = getattr(file_obj, 'gc_content', 50.0) or 50.0
        vec[0] = float(gc) / 100.0
        
        # DNA Length log normalized
        length = getattr(file_obj, 'dna_length_bp', 100) or 100
        vec[1] = min(1.0, np.log10(max(10, length)) / 6.0)
        
        # Flags
        vec[2] = 1.0 if getattr(file_obj, 'is_encrypted', False) else 0.0
        vec[3] = 1.0 if getattr(file_obj, 'has_error_correction', False) else 0.0
        vec[4] = 1.0 if getattr(file_obj, 'has_steganography', False) else 0.0
        
        # Motif presence in sequence
        seq = getattr(file_obj, 'dna_sequence', '') or ''
        seq_upper = seq.upper() if seq else ''
        vec[5] = 1.0 if 'GATTACA' in seq_upper else 0.0
        vec[6] = 1.0 if 'TATA' in seq_upper else 0.0
        vec[7] = 1.0 if 'CG' in seq_upper else 0.0 # CpG islands
        
        # Homopolymer penalty feature
        has_homopolymer = 1.0 if any(base * 4 in seq_upper for base in 'ATCG') else 0.0
        vec[8] = 1.0 - has_homopolymer # 1.0 is stable (no homopolymer)
        
        return self._normalize(vec)

    def _get_semantic_features(self, text: str) -> np.ndarray:
        """Extract 32-D semantic keyword and word-hash embedding."""
        vec = np.zeros(32, dtype=np.float32)
        if not text:
            return vec
            
        words = re.findall(r'\w+', text.lower())
        word_set = set(words)
        
        # Exact keyword dimensions (first 32 semantic words)
        for i, kw in enumerate(self.semantic_keywords[:32]):
            if kw in word_set or any(kw in w for w in words):
                vec[i] = 1.0
                
        # Word hashing fallback for vocabulary coverage
        for word in words:
            idx = hash(word) % 32
            vec[idx] += 0.2
            
        return self._normalize(vec)

    def embed_file(self, file_obj: Any) -> np.ndarray:
        """
        Generate complete 64-dimensional embedding vector for an EncodedFile.
        [0:16]   = K-mer Genomic Profile
        [16:32]  = Biological Stability & Metadata Flags
        [32:64]  = Semantic Text Embeddings (filename + preview)
        """
        kmer_vec = self._get_kmer_features(getattr(file_obj, 'dna_sequence', None))
        bio_vec = self._get_bio_features(file_obj)
        
        filename = getattr(file_obj, 'filename', '') or ''
        preview = getattr(file_obj, 'text_preview', '') or ''
        semantic_vec = self._get_semantic_features(f"{filename} {preview}")
        
        # Combine into 64-D vector and normalize
        full_vec = np.concatenate([kmer_vec, bio_vec, semantic_vec])
        return self._normalize(full_vec)

    def embed_query(self, query: str) -> np.ndarray:
        """
        Generate 64-dimensional query embedding from search prompt or sequence motif.
        """
        query_upper = query.upper().strip()
        is_dna_query = all(c in 'ATCG ' for c in query_upper) and len(query_upper) >= 3
        
        if is_dna_query:
            # Query is a DNA motif / sequence search
            kmer_vec = self._get_kmer_features(query_upper)
            bio_vec = np.zeros(16, dtype=np.float32)
            if 'GATTACA' in query_upper: bio_vec[5] = 1.0
            if 'TATA' in query_upper: bio_vec[6] = 1.0
            if 'CG' in query_upper: bio_vec[7] = 1.0
            semantic_vec = np.zeros(32, dtype=np.float32)
        else:
            # Natural language query
            kmer_vec = np.zeros(16, dtype=np.float32)
            bio_vec = np.zeros(16, dtype=np.float32)
            
            # Check for concept keywords in query
            q_lower = query.lower()
            if 'encrypt' in q_lower or 'security' in q_lower or 'secret' in q_lower:
                bio_vec[2] = 1.0
            if 'error' in q_lower or 'correction' in q_lower or 'reed' in q_lower or 'solomon' in q_lower:
                bio_vec[3] = 1.0
            if 'stego' in q_lower or 'hidden' in q_lower:
                bio_vec[4] = 1.0
            if 'gc' in q_lower or 'stable' in q_lower or 'stability' in q_lower:
                bio_vec[0] = 0.5
                bio_vec[8] = 1.0
                
            semantic_vec = self._get_semantic_features(query)
            
        full_vec = np.concatenate([kmer_vec, bio_vec, semantic_vec])
        return self._normalize(full_vec)

    def search_vault(self, query: str, files: List[Any], top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Perform vector cosine similarity search over a list of encoded files.
        Returns ranked results with AI explanations and confidence scores.
        """
        if not files or not query.trim() if hasattr(query, 'trim') else not str(query).strip():
            return []
            
        query_str = str(query).strip()
        q_vec = self.embed_query(query_str)
        q_lower = query_str.lower()
        q_upper = query_str.upper()
        
        results = []
        for f in files:
            f_vec = self.embed_file(f)
            
            # Cosine similarity dot product
            sim = float(np.dot(q_vec, f_vec))
            
            # Boost exact keyword or motif substring hits
            filename = getattr(f, 'filename', '') or ''
            preview = getattr(f, 'text_preview', '') or ''
            seq = getattr(f, 'dna_sequence', '') or ''
            
            exact_hit = False
            hit_type = "Semantic Vector Match"
            reason = "High multi-dimensional semantic and biological vector correlation."
            
            if q_lower in filename.lower():
                sim = max(sim, 0.98)
                exact_hit = True
                hit_type = "Exact Filename Match"
                reason = f"Exact keyword match in filename '{filename}'."
            elif q_lower in preview.lower():
                sim = max(sim, 0.94)
                exact_hit = True
                hit_type = "Content Preview Match"
                reason = f"Keyword detected within document text preview."
            elif len(q_upper) >= 4 and all(c in 'ATCG' for c in q_upper) and q_upper in (seq.upper() if seq else ''):
                sim = max(sim, 0.99)
                exact_hit = True
                hit_type = "Genomic Motif Match"
                reason = f"Exact biological sub-sequence motif ({q_upper}) located in encoded DNA."
            elif sim > 0.75:
                hit_type = "High Semantic Similarity"
                gc = getattr(f, 'gc_content', 50.0) or 50.0
                reason = f"Strong conceptual relevance (GC: {gc:.1f}%, 64-D Vector Sim: {sim*100:.1f}%)."
            elif sim > 0.50:
                hit_type = "Partial Vector Match"
                reason = f"Shared k-mer profile or metadata properties (Sim: {sim*100:.1f}%)."
                
            # Filter out very low relevance items unless vault is very small
            if sim >= 0.25 or exact_hit or len(files) <= 5:
                results.append({
                    "id": getattr(f, 'id', None),
                    "filename": filename,
                    "original_size_bytes": getattr(f, 'original_size_bytes', 0),
                    "dna_length_bp": getattr(f, 'dna_length_bp', 0),
                    "gc_content": getattr(f, 'gc_content', 0.0),
                    "is_encrypted": getattr(f, 'is_encrypted', False),
                    "has_error_correction": getattr(f, 'has_error_correction', False),
                    "has_steganography": getattr(f, 'has_steganography', False),
                    "text_preview": preview,
                    "similarity_score": round(min(1.0, max(0.01, sim)), 3),
                    "match_percentage": f"{min(100.0, max(1.0, sim * 100.0)):.1f}%",
                    "hit_type": hit_type,
                    "ai_reason": reason,
                    "created_at": getattr(f, 'created_at', None).isoformat() if getattr(f, 'created_at', None) else None
                })
                
        # Sort descending by similarity score
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:top_k]

# Global singleton instance
vector_engine = DnaVectorEngine()
