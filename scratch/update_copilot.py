import os, sys

with open('backend/core/ai_copilot.py', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('# Main entry point')
if idx == -1:
    print('Target not found')
    sys.exit(1)

header_idx = content.rfind('# -----', 0, idx)

new_code = '''PREFERRED_MODELS = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


def _generate_local_fallback_response(
    question: str,
    metrics: Dict[str, Any],
    files: List[EncodedFile],
    tool_name: Optional[str] = None,
    tool_output: Optional[str] = None,
) -> str:
    """Deterministic local response engine when cloud LLM is unavailable or offline."""
    q_lower = question.lower()

    # Weight queries
    if any(w in q_lower for w in ["weight", "femtogram", "picogram", "mass", "fg", "pg"]):
        if metrics["total_files"] == 0:
            return (
                "### 🧬 Vault Physical DNA Weight\\n\\n"
                "Your vault is currently **empty**. There are no synthesized DNA archives registered to your account.\\n\\n"
                "- **Total Weight:** `0.00 fg` (0 picograms)\\n"
                "- **Synthesized Bases:** `0 bp`\\n\\n"
                "Encode files via the **Encoder** tab to provision them into physical oligonucleotide storage."
            )
        return (
            "### 🧬 Vault Physical DNA Weight\\n\\n"
            f"Your synthesized DNA archives currently weigh **{metrics['weight_femtograms']:,.4f} femtograms** "
            f"(**{metrics['weight_picograms']:,.7f} picograms**).\\n\\n"
            f"| Metric | Measured Value |\\n"
            f"| :--- | :--- |\\n"
            f"| **Physical Mass (fg)** | **{metrics['weight_femtograms']:,.4f} fg** |\\n"
            f"| **Physical Mass (pg)** | **{metrics['weight_picograms']:,.7f} pg** |\\n"
            f"| **Total Synthesized Bases** | **{metrics['total_bp']:,} bp** |\\n"
            f"| **Archived Payload Size** | **{metrics['total_bytes']:,} bytes** |\\n"
            f"| **Average GC Content** | **{metrics['avg_gc_content']}%** |\\n"
            f"| **Estimated Synthesis Cost** | **${metrics['synthesis_cost_usd']:,.2f} USD** |\\n"
            f"| **Theoretical Storage Density** | 215 ZB/gram |\\n\\n"
            "*Calculation basis: 1 nucleotide base pair ≈ 650 Daltons ≈ 1.079 × 10⁻⁶ femtograms.*"
        )

    # Tool output queries (motif search, vector search)
    if tool_name and tool_output:
        return (
            f"### 🔍 Biological Search Results ({tool_name})\\n\\n"
            f"{tool_output}\\n\\n"
            f"*Scanned across {metrics['total_files']} files in your encrypted vault.*"
        )

    # File count / status / summary queries
    if any(w in q_lower for w in ["how many", "count", "summary", "list", "status", "files", "cost"]):
        files_list = "\\n".join(
            f"- **{f.filename}** ({f.dna_length_bp or 0:,} bp, {f.original_size_bytes or 0:,} bytes)"
            for f in files[:10]
        )
        return (
            "### 📁 DNA Vault Inventory Summary\\n\\n"
            f"Your vault currently holds **{metrics['total_files']} encoded files** encompassing "
            f"**{metrics['total_bp']:,} base pairs**.\\n\\n"
            f"**Archived Payloads:**\\n{files_list if files_list else '- (None)'}\\n\\n"
            f"- **Total Synthesis Mass:** {metrics['weight_femtograms']:,.4f} fg ({metrics['weight_picograms']:,.7f} pg)\\n"
            f"- **Estimated Synthesis Cost:** ${metrics['synthesis_cost_usd']:,.2f} USD\\n"
            f"- **Average GC Stability:** {metrics['avg_gc_content']}%"
        )

    # General fallback
    return (
        "### 🧬 HelixVault Autonomous Co-Pilot\\n\\n"
        f"I have analyzed your encrypted DNA vault containing **{metrics['total_files']} files** "
        f"({metrics['total_bp']:,} nucleotide base pairs, physical mass of **{metrics['weight_femtograms']:,.4f} fg**).\\n\\n"
        "You can ask me to:\\n"
        "- **Calculate physical synthesis weight** in femtograms or picograms\\n"
        "- **Search for genetic motifs** like `GATTACA` across your archives\\n"
        "- **Inspect file biophysical properties** (GC content, primer sequences, error correction)\\n"
        "- **Estimate biological synthesis costs** and storage longevity"
    )


# ---------------------------------------------------------------------------
# Main entry point — called by the API
# ---------------------------------------------------------------------------
def ask_copilot(db: Session, user_id: int, question: str) -> Dict[str, Any]:
    """
    Groq-powered RAG Co-Pilot with automatic multi-model fallback and local deterministic engine.
    1. Fetches vault files + computes biophysical metrics.
    2. Optionally runs a specialised domain tool (motif search / vector RAG).
    3. Builds a rich system prompt with full vault context injected.
    4. Calls Groq with prioritized model fallback; gracefully degrades to local engine if needed.
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

    # 4. Call Groq LLM with multi-model fallback
    response_text = None
    used_model = None

    try:
        client = _get_groq_client()
        last_err = None
        for model_name in PREFERRED_MODELS:
            try:
                completion = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question},
                    ],
                    temperature=0.35,
                    max_tokens=1024,
                )
                response_text = completion.choices[0].message.content.strip()
                used_model = model_name
                logger.info(f"Groq Co-Pilot answered using model '{model_name}'")
                break
            except Exception as model_err:
                last_err = model_err
                logger.warning(f"Groq model '{model_name}' failed: {model_err}. Trying next fallback...")
                continue

        if not response_text and last_err:
            logger.error(f"All Groq models failed. Engaging local deterministic fallback: {last_err}")
            response_text = _generate_local_fallback_response(
                question, metrics, files, tool_name, tool_output
            )
            used_model = "local_deterministic_rag"

    except Exception as e:
        logger.warning(f"Groq initialization or client error: {e}. Using local deterministic engine.")
        response_text = _generate_local_fallback_response(
            question, metrics, files, tool_name, tool_output
        )
        used_model = "local_deterministic_rag"

    return {
        "question": question,
        "response": response_text,
        "tool_used": tool_name or used_model or "groq_llm_direct",
        "tool_results": {"raw": tool_output} if tool_output else {},
        "vault_metrics": metrics,
    }
'''

content = content[:header_idx] + new_code
with open('backend/core/ai_copilot.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated ai_copilot.py successfully!')
