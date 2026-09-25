import os
import re
import logging
from typing import Dict, Any, List, Optional

from sqlalchemy.orm import Session
from db.models import EncodedFile
from core.bio_compute import search_in_dna, execute_dna_query
from core.vector_rag import vector_engine

logger = logging.getLogger("helixvault")

# ---------------------------------------------------------------------------
# Groq client — lazy-initialised so missing key surfaces as a clear error
# ---------------------------------------------------------------------------
_groq_client = None

def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        try:
            from groq import Groq
            api_key = os.getenv("GROQ_API_KEY", "").strip()
            if not api_key:
                raise ValueError("GROQ_API_KEY not set in environment")
            _groq_client = Groq(api_key=api_key)
        except ImportError:
            raise RuntimeError("groq package not installed. Run: pip install groq>=0.9.0")
    return _groq_client


# ---------------------------------------------------------------------------
# Biophysical metrics calculator
# ---------------------------------------------------------------------------
def _calculate_biophysical_metrics(files: List[EncodedFile]) -> Dict[str, Any]:
    total_bp = sum(f.dna_length_bp or 0 for f in files)
    total_bytes = sum(f.original_size_bytes or 0 for f in files)

    # 1 base pair ~ 650 Daltons ~ 1.079e-21 grams = 1.079e-6 femtograms (fg)
    weight_fg = round(total_bp * 1.079e-6, 6)
    weight_pg = round(weight_fg / 1000.0, 9)

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
        "density_limit": "215 ZB/gram",
    }


# ---------------------------------------------------------------------------
# Build system prompt — full vault context injected for true RAG
# ---------------------------------------------------------------------------
def _build_system_prompt(
    metrics: Dict[str, Any],
    files: List[EncodedFile],
    tool_name: Optional[str] = None,
    tool_output: Optional[str] = None,
) -> str:
    vault_lines = []
    for f in files[:20]:  # cap at 20 to stay within context limits
        flags = []
        if getattr(f, "is_encrypted", False):
            flags.append("AES-256 encrypted")
        if getattr(f, "has_error_correction", False):
            flags.append("Reed-Solomon ECC")
        if getattr(f, "has_steganography", False):
            flags.append("steganography host")
        flag_str = ", ".join(flags) if flags else "no special flags"
        preview = (getattr(f, "text_preview", "") or "")[:120]
        vault_lines.append(
            f"  - [{f.id}] {f.filename} | "
            f"{f.dna_length_bp or 0:,} bp | "
            f"GC: {f.gc_content or 0:.1f}% | "
            f"{f.original_size_bytes or 0:,} bytes | "
            f"{flag_str}"
            + (f' | preview: "{preview}"' if preview else "")
        )

    vault_section = "\n".join(vault_lines) if vault_lines else "  (vault is empty — no files encoded yet)"

    tool_section = ""
    if tool_name and tool_output:
        tool_section = f"""
## Specialised Tool Output
Tool used: {tool_name}
Results:
{tool_output}
"""

    return f"""You are HelixVault Co-Pilot, an expert AI assistant specialised in biological data storage,
DNA synthesis, oligonucleotide engineering, error correction codes, and bioinformatics.

You have real-time access to the user's encrypted DNA vault. Here is the current vault state:

## Vault Summary
- Total files: {metrics['total_files']}
- Total nucleotide bases: {metrics['total_bp']:,} bp
- Total original payload: {metrics['total_bytes']:,} bytes
- Physical DNA weight: {metrics['weight_femtograms']} fg ({metrics['weight_picograms']} pg)
- Estimated synthesis cost: ${metrics['synthesis_cost_usd']:,} USD (at $0.08/bp)
- Average GC stability: {metrics['avg_gc_content']}%
- Storage density ceiling: {metrics['density_limit']}

## Archived Files
{vault_section}
{tool_section}
## Instructions
- Answer the user's question concisely and accurately using the vault data above.
- Use markdown formatting: **bold** key metrics, use tables where helpful.
- When vault is empty, say so clearly and explain what the numbers mean (zero weight, zero cost).
- Keep responses focused — aim for 3-8 sentences or a clean table.
- Do NOT invent file names or data not present in the vault above.
- If a specialised tool ran and produced output, interpret that output for the user in plain English.
- You may give scientific explanations about DNA storage technology when relevant.
- Use fg (femtograms) and pg (picograms) correctly: 1 fg = 1e-15 g, 1 pg = 1e-12 g.
"""


# ---------------------------------------------------------------------------
# Detect intent & run domain tools BEFORE calling the LLM
# ---------------------------------------------------------------------------
def _run_domain_tool(
    db: Session,
    user_id: int,
    question: str,
    files: List[EncodedFile],
) -> tuple:
    """
    Runs the best matching domain tool.
    Returns (tool_name, tool_output_str) or (None, None).
    """
    q_lower = question.lower()

    # Tool 1: In-DNA motif / pattern search
    is_motif_query = any(k in q_lower for k in ["motif", "gattaca", "pattern", "search for"])
    # Also check if there's a raw DNA sequence in the question
    words = re.findall(r"\b[A-Za-z0-9]+\b", question)
    acgt_words = [w.upper() for w in words if len(w) >= 4 and all(c.upper() in "ACGT" for c in w)]

    if is_motif_query or (acgt_words and "search" in q_lower):
        target = acgt_words[0] if acgt_words else "GATTACA"
        mode = "motif" if all(c in "ACGT" for c in target) else "keyword"
        try:
            res = search_in_dna(db, user_id, target, mode=mode)
            rows = []
            for r in res.get("results", [])[:5]:
                rows.append(
                    f"  - File #{r['file_id']} ({r['filename']}): "
                    f"{r['match_count']} matches, GC {r['overall_gc_content']}%"
                )
            summary = (
                f"Pattern searched: `{res['pattern_searched']}` (mode: {mode})\n"
                f"Files scanned: {res['files_searched']}\n"
                f"Total hits: {res['total_matches']}\n"
                + ("\n".join(rows) if rows else "  No matches found.")
            )
            return "motif_search", summary
        except Exception as e:
            logger.warning(f"Motif search tool failed: {e}")

    # Tool 2: Vector semantic search
    elif any(k in q_lower for k in ["find", "similar", "semantic", "vector", "ai search", "confidential", "backup", "which file", "what file", "where is"]):
        try:
            results = vector_engine.search_vault(question, files, top_k=5)
            rows = []
            for r in results:
                rows.append(
                    f"  - #{r['id']} {r['filename']}: "
                    f"{r['match_percentage']} ({r['hit_type']})"
                )
            summary = (
                f"Cosine similarity search across {len(files)} files.\n"
                + ("\n".join(rows) if rows else "  No significant matches found.")
            )
            return "vector_rag_search", summary
        except Exception as e:
            logger.warning(f"Vector search tool failed: {e}")

    return None, None


# ---------------------------------------------------------------------------
# Main entry point — called by the API
# ---------------------------------------------------------------------------
def ask_copilot(db: Session, user_id: int, question: str) -> Dict[str, Any]:
    """
    Groq-powered RAG Co-Pilot.
    1. Fetches vault files + computes biophysical metrics.
    2. Optionally runs a specialised domain tool (motif search / vector RAG).
    3. Builds a rich system prompt with full vault context injected.
    4. Calls Groq llama-3.3-70b-versatile for the final natural-language answer.
    """
    # 1. Load vault data
    files: List[EncodedFile] = (
        db.query(EncodedFile).filter(EncodedFile.user_id == user_id).all()
    )
    metrics = _calculate_biophysical_metrics(files)

    # 2. Run specialised domain tool (provides structured RAG context)
    tool_name, tool_output = _run_domain_tool(db, user_id, question, files)

    # 3. Build system prompt with full vault context
    system_prompt = _build_system_prompt(metrics, files, tool_name, tool_output)

    # 4. Call Groq LLM
    try:
        client = _get_groq_client()
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.35,
            max_tokens=1024,
        )
        response_text = completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq API call failed: {e}")
        raise RuntimeError(f"Groq LLM error: {e}")

    return {
        "question": question,
        "response": response_text,
        "tool_used": tool_name or "groq_llm_direct",
        "tool_results": {"raw": tool_output} if tool_output else {},
        "vault_metrics": metrics,
    }
