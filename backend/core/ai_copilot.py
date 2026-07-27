import os
import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from db.models import EncodedFile
from core.bio_compute import search_in_dna, execute_dna_query
from core.vector_rag import vector_engine
import logging

logger = logging.getLogger("helixvault")

def _calculate_biophysical_metrics(files: List[EncodedFile]) -> Dict[str, Any]:
    total_bp = sum(f.dna_length_bp or 0 for f in files)
    total_bytes = sum(f.original_size_bytes or 0 for f in files)
    
    # 1 base pair ~ 650 Daltons ~ 1.079e-21 grams = 1.079e-6 femtograms (fg)
    weight_fg = round(total_bp * 1.079e-6, 4)
    weight_pg = round(weight_fg / 1000.0, 6)
    
    # Theoretical DNA storage density is ~215 Zettabytes per gram
    density_zb_per_gram = 215.0
    
    # Synthesis cost estimate ($0.08 - $0.10 per base pair in modern oligo pools)
    synthesis_cost_usd = round(total_bp * 0.08, 2)
    
    avg_gc = round(sum(f.gc_content or 50.0 for f in files) / max(1, len(files)), 2)
    
    return {
        "total_files": len(files),
        "total_bp": total_bp,
        "total_bytes": total_bytes,
        "weight_femtograms": weight_fg,
        "weight_picograms": weight_pg,
        "synthesis_cost_usd": synthesis_cost_usd,
        "avg_gc_content": avg_gc,
        "density_limit": f"{density_zb_per_gram} ZB/gram"
    }

def ask_copilot(db: Session, user_id: int, question: str) -> Dict[str, Any]:
    """
    Autonomous 'DNA-RAG' AI Co-Pilot engine.
    Analyzes user queries, automatically retrieves biological vault records,
    invokes in-DNA search tools, calculates physical metrics, and formulates
    intelligent conversational responses with markdown formatting.
    """
    files = db.query(EncodedFile).filter(EncodedFile.user_id == user_id).all()
    metrics = _calculate_biophysical_metrics(files)
    q_lower = question.lower()

    # Tool Trigger 1: In-DNA Motif / Sequence Searching
    if not any(k in q_lower for k in ["vector", "semantic", "similar", "embed", "ai search", "ai vector", "confidential", "secret", "backup"]) and any(k in q_lower for k in ["motif", "sequence", "search", "find", "pattern", "gattaca", "regex"]):
        # Extract possible motif or keyword from quotes or common terms
        words = re.findall(r'\b[A-Za-z0-9]+\b', question)
        acgt_words = [w.upper() for w in words if len(w) >= 3 and all(c.upper() in "ACGT" for c in w)]
        
        if acgt_words:
            target_query = acgt_words[0]
            mode = "motif"
        else:
            motif_match = re.search(r'["\']([^"\']+)["\']|keyword\s+([A-Za-z0-9]+)|search\s+(?:for\s+)?([A-Za-z0-9]+)', question, re.IGNORECASE)
            target_query = "GATTACA"
            mode = "keyword"
            if motif_match:
                target_query = motif_match.group(1) or motif_match.group(2) or motif_match.group(3) or "GATTACA"
            if all(c.upper() in "ACGT" for c in target_query) and len(target_query) >= 3:
                mode = "motif"
            
        search_res = search_in_dna(db, user_id, target_query, mode=mode)
        
        match_table = "| File ID | Filename | Matches | Overall GC % |\n| :--- | :--- | :--- | :--- |\n"
        for r in search_res.get("results", [])[:5]:
            match_table += f"| #{r['file_id']} | `{r['filename']}` | **{r['match_count']}** | {r['overall_gc_content']}% |\n"
            
        if not search_res.get("results"):
            match_table = "*No exact sequence matches found in your active vault archives.*"

        response_md = f"### 🧬 Autonomous RAG Search Report\n\n"
        response_md += f"I executed a **Live In-Memory Biological {mode.upper()} Search** across your vault for the pattern `{target_query}` (searched as nucleotide signature `{search_res['pattern_searched']}`).\n\n"
        response_md += f"**Search Summary**:\n- **Files Scanned**: {search_res['files_searched']}\n- **Total Nucleotide Hits**: {search_res['total_matches']}\n\n"
        response_md += f"#### Match Breakdown\n{match_table}\n\n"
        if search_res.get("results"):
            first_hit = search_res["results"][0]["matches"][0]
            response_md += f"> [!TIP]\n> **Sequence Highlight**: Found match at coordinate range **[{first_hit['start_bp']}bp - {first_hit['end_bp']}bp]** with local GC content of **{first_hit['window_gc_content']}%**.\n> Snippet: `{first_hit['snippet']}`"
            
        return {
            "question": question,
            "response": response_md,
            "tool_used": "search_in_dna",
            "tool_results": search_res,
            "vault_metrics": metrics
        }

    # Tool Trigger 2: Physical Metrics, Weight, Cost, or Density
    elif any(k in q_lower for k in ["weight", "femtogram", "picogram", "cost", "density", "physical", "synthes", "how much", "size"]):
        response_md = f"### 🔬 Biophysical Vault Analysis\n\n"
        response_md += f"Here is the physical wet-lab profile of your current **HelixVault** repository if synthesized into real oligonucleotides:\n\n"
        response_md += f"| Biophysical Metric | Calculated Value | Scientific Interpretation |\n"
        response_md += f"| :--- | :--- | :--- |\n"
        response_md += f"| **Total Stored Files** | `{metrics['total_files']}` | Active digital archives |\n"
        response_md += f"| **Total Nucleotide Bases** | `{metrics['total_bp']:,} bp` | Total length of encoded DNA strands |\n"
        response_md += f"| **Physical DNA Weight** | `{metrics['weight_femtograms']} fg` (`{metrics['weight_picograms']} pg`) | Calculated at ~650 Daltons per base pair |\n"
        response_md += f"| **Estimated Synthesis Cost** | `${metrics['synthesis_cost_usd']:,} USD` | Based on modern commercial oligo pool pricing (~$0.08/bp) |\n"
        response_md += f"| **Average GC Stability** | `{metrics['avg_gc_content']}%` | Ideal biochemical stability zone (40% - 60%) |\n"
        response_md += f"| **Storage Density Limit** | `{metrics['density_limit']}` | Millions of times denser than SSD/Flash memory |\n\n"
        response_md += f"> [!IMPORTANT]\n> Your entire vault weighing just **{metrics['weight_femtograms']} femtograms** would be completely invisible to the naked human eye and could fit on the tip of a single needle while lasting over **1,000 years** in cold storage without degradation!"
        
        return {
            "question": question,
            "response": response_md,
            "tool_used": "biophysical_calculator",
            "vault_metrics": metrics
        }

    # Tool Trigger 3: Fountain Codes, Error Correction, or Encryption
    elif any(k in q_lower for k in ["fountain", "error", "ecc", "reed", "solomon", "encrypt", "security", "protect", "explain"]):
        response_md = f"### 🛡️ Cyber-Biological Defense Architecture\n\n"
        response_md += f"Your vault utilizes a multi-layered cryptographic and error-correcting stack designed specifically for biological mediums:\n\n"
        response_md += f"1. **Reed-Solomon Error Correction (ECC)**:\n   - Adds mathematical parity bytes to your data before mapping to nucleotide bases. If sequencing errors, mutations, or strand breakage occur, Reed-Solomon automatically reconstructs corrupted codons.\n"
        response_md += f"2. **Luby Transform (Fountain Codes)**:\n   - Converts file payloads into a limitless stream of redundant DNA droplets. Even if up to 30% of the DNA pool is lost during physical sampling or pipetting, the original file can be recovered from any sufficient subset of droplets.\n"
        response_md += f"3. **AES-256-GCM Encryption**:\n   - Ensures zero-trust data confidentiality before biological translation. Even if someone sequences your physical DNA tube, they cannot read the underlying plaintext without your 256-bit cryptographic key.\n\n"
        response_md += f"**Current Vault Protection Stats**:\n- **Total Protected Archives**: `{metrics['total_files']}` files\n- **Average Biochemical Stability (GC %)**: `{metrics['avg_gc_content']}%`"
        
        return {
            "question": question,
            "response": response_md,
            "tool_used": "architecture_knowledgebase",
            "vault_metrics": metrics
        }

    # Tool Trigger 4: Semantic Vector RAG & AI Embedding Search
    elif any(k in q_lower for k in ["vector", "semantic", "similar", "embed", "ai search", "ai vector", "find file", "what file", "which archive", "where is", "query", "report", "image", "secret", "backup", "data", "confidential"]):
        vec_results = vector_engine.search_vault(question, files, top_k=5)
        
        match_table = "| File ID | Filename | Cosine Sim | Match Type |\n| :--- | :--- | :--- | :--- |\n"
        for r in vec_results:
            match_table += f"| #{r['id']} | `{r['filename']}` | **{r['match_percentage']}** | {r['hit_type']} |\n"
            
        if not vec_results:
            match_table = "*No semantic vector matches exceeded the confidence threshold.*"

        response_md = f"### 🧠 Neural Vector RAG Discovery\n\n"
        response_md += f"I performed a **64-Dimensional Cosine Similarity Search** across your oligonucleotide archives using our pure-NumPy Genomic Vector Engine.\n\n"
        response_md += f"#### Ranked Semantic Matches\n{match_table}\n\n"
        if vec_results:
            top_hit = vec_results[0]
            response_md += f"> [!TIP]\n> **AI Vector Insight**: For top match `{top_hit['filename']}` (Sim: **{top_hit['match_percentage']}**), {top_hit['ai_reason']}\n> Preview: `{top_hit['text_preview'] or 'Compressed DNA payload'}`"
            
        return {
            "question": question,
            "response": response_md,
            "tool_used": "vector_rag_search",
            "tool_results": {"results": vec_results},
            "vault_metrics": metrics
        }

    # Default / General Vault Summary Response (with fallback vector search)
    else:
        vec_results = vector_engine.search_vault(question, files, top_k=3)
        if vec_results and vec_results[0]["similarity_score"] > 0.35:
            match_table = "| File ID | Filename | Cosine Sim | Match Type |\n| :--- | :--- | :--- | :--- |\n"
            for r in vec_results:
                match_table += f"| #{r['id']} | `{r['filename']}` | **{r['match_percentage']}** | {r['hit_type']} |\n"
            
            response_md = f"### 🧠 Neural Vector RAG Discovery\n\n"
            response_md += f"I performed a **64-Dimensional Cosine Similarity Search** across your oligonucleotide archives using our pure-NumPy Genomic Vector Engine.\n\n"
            response_md += f"#### Ranked Semantic Matches\n{match_table}\n\n"
            top_hit = vec_results[0]
            response_md += f"> [!TIP]\n> **AI Vector Insight**: For top match `{top_hit['filename']}` (Sim: **{top_hit['match_percentage']}**), {top_hit['ai_reason']}\n> Preview: `{top_hit['text_preview'] or 'Compressed DNA payload'}`"
            
            return {
                "question": question,
                "response": response_md,
                "tool_used": "vector_rag_search",
                "tool_results": {"results": vec_results},
                "vault_metrics": metrics
            }

        response_md = f"### 🤖 HelixVault AI Co-Pilot Online\n\n"
        response_md += f"Hello! I am your **Autonomous Biological Data Co-Pilot**. I monitor your sequence vault, execute in-memory genetic searches, and model physical oligonucleotide properties.\n\n"
        response_md += f"#### 📊 Current Vault Status\n"
        response_md += f"- **Active Archives**: `{metrics['total_files']}` files\n"
        response_md += f"- **Total Sequence Length**: `{metrics['total_bp']:,} bp`\n"
        response_md += f"- **Average GC Stability**: `{metrics['avg_gc_content']}%`\n"
        response_md += f"- **Physical Weight**: `{metrics['weight_femtograms']} fg`\n\n"
        response_md += f"#### 💡 How can I assist you today?\n"
        response_md += f"You can ask me to:\n"
        response_md += f"- *\"Search my vault for nucleotide motif GATTACA\"*\n"
        response_md += f"- *\"Find files related to confidential backups using AI vector search\"*\n"
        response_md += f"- *\"How much would it cost to synthesize my vault into physical DNA?\"*\n"
        response_md += f"- *\"Explain how Fountain Codes protect against sequencing errors\"*"
        
        return {
            "question": question,
            "response": response_md,
            "tool_used": "vault_overview",
            "vault_metrics": metrics
        }
