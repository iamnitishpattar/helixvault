import asyncio
import os
from playwright.async_api import async_playwright

papers_all = [
    {
        "id": 1,
        "title": "Adaptive Sampling for Storage of Progressive Images on DNA",
        "authors": "X. Pic, N. Pinnamaneni, R. Appuswamy",
        "venue": "BioRxiv / IEEE",
        "year": "2024",
        "affil": "EURECOM & Helixworks",
        "method": "Hierarchical wavelet progressive image compression paired with adaptive oligonucleotide physical sampling policy.",
        "findings": "Enables multi-resolution image recovery at low sequencing depth; eliminates full-read sequencing costs for visual preview.",
        "gap": "Tailored exclusively to 2D image matrices.",
        "helix": "Generalizes progressive multi-tier decoding across arbitrary digital formats (documents, audio, video)."
    },
    {
        "id": 2,
        "title": "DNA-MGC+: A Versatile Codec for Reliable and Resource-Efficient Storage",
        "authors": "R. Khabbaz, J. Mateos, M. Antonini, S. Kas Hanna",
        "venue": "Nature Comp. Sci.",
        "year": "2025",
        "affil": "CNRS / Pearcode",
        "method": "Modified Goldman rotating ternary codec (MGC+) targeting simultaneous insertion, deletion, and substitution (IDS) channel noise.",
        "findings": "Achieves 28% higher logical density over baseline Goldman codes; validated in vitro with Illumina and Oxford Nanopore.",
        "gap": "High algorithmic complexity for large batch files.",
        "helix": "Implements optimized Base-3 rotating ternary tables with strict homopolymer suppression (<=3 bp) and 40-60% GC tuning."
    },
    {
        "id": 3,
        "title": "Error-Correcting Codes for Two Bursts of (t1, t2)-DI with Low Complexity",
        "authors": "Y. Liu, T. M. Duman (IEEE Fellow)",
        "venue": "IEEE / SNIA",
        "year": "2026",
        "affil": "Bilkent University",
        "method": "Construction of linear-complexity channel error-correcting codes tailored for multi-burst deletion and insertion occurrences.",
        "findings": "Provides sub-logarithmic redundancy overhead while guaranteeing exact packet alignment and synchronization under burst drops.",
        "gap": "Purely theoretical formulation without software UI.",
        "helix": "Implements packetized oligo headers with Reed-Solomon parity to counter burst synthesis-dropout anomalies."
    },
    {
        "id": 4,
        "title": "Error-Correcting Codes for the Sum Channel",
        "authors": "L. Abboud, E. Yaakobi",
        "venue": "ResearchGate / ISIT",
        "year": "2026",
        "affil": "Technion - Israel Inst. of Tech.",
        "method": "Sum channel matrix algebraic modeling with parity-sum rows for distributed matrix-encoded storage pools.",
        "findings": "Constructs two-deletion-correcting matrix codes with optimal redundancy bounds 2*ceil(log2 log2 n) + log2 l.",
        "gap": "Focuses strictly on matrix channel abstractions.",
        "helix": "Employs horizontal/vertical parity rows to reconstruct missing oligo fragments without re-synthesizing the whole pool."
    },
    {
        "id": 5,
        "title": "Expected Recovery Time in DNA-based Distributed Storage Systems",
        "authors": "A. Levy, R. Con, E. Yaakobi, H. M. Kiah",
        "venue": "RSC Advances / IEEE",
        "year": "2026",
        "affil": "Technion & NTU Singapore",
        "method": "Erasure-coded multi-container biological architecture with statistical sampling distribution analysis.",
        "findings": "Derives exact mathematical expectations for random read sampling needed to rebuild damaged or decayed storage containers.",
        "gap": "Lacks automated physical lab protocols.",
        "helix": "Combines multi-carrier BioDatabase indexing with dynamic freezer S.O.P. generation (Rack/Box/Tube assignments)."
    },
    {
        "id": 6,
        "title": "On the Capacity of Noisy Frequency-based Channels",
        "authors": "Y. Gerzon, I. Shomorony, N. Weinberger",
        "venue": "IEEE Access",
        "year": "2025",
        "affil": "Technion & UIUC",
        "method": "Short-molecule order-free DNA encoding using concentration histograms rather than ordered base sequences.",
        "findings": "Bypasses synthesis length barriers by storing data in relative molecular concentrations; proves non-asymptotic capacity bounds.",
        "gap": "Highly susceptible to chemical pipetting noise.",
        "helix": "Adopts ordered nucleotide oligos with in-silico PCR primer indexing for high-precision Illumina/Nanopore pipelines."
    },
    {
        "id": 7,
        "title": "Random Access Expectation in DNA Storage and Fountain Codes",
        "authors": "C. Hofmeister, R. Bitar, E. Yaakobi",
        "venue": "Precedence / IEEE ITW",
        "year": "2025",
        "affil": "Technical University of Munich",
        "method": "Equivalence mapping between binary fully symmetric linear codes and rateless Luby Transform (LT) Fountain codes.",
        "findings": "Minimizes sequencing read overhead for targeted document queries; provides superior random access without decoding entire pools.",
        "gap": "Evaluated primarily through synthetic simulations.",
        "helix": "Incorporates Fountain parity health checks and BioCompute direct sequence searching without prior binary decoding."
    },
    {
        "id": 8,
        "title": "Robust Composite DNA Storage under Sampling Randomness & IDS Errors",
        "authors": "B. Tegin, T. M. Duman",
        "venue": "Advanced Science",
        "year": "2024",
        "affil": "CentraleSupelec & Bilkent",
        "method": "Composite nucleotide mixtures mapped onto a 3D probability simplex with multinomial channel error-correction.",
        "findings": "Achieves higher per-cycle density than standard 4-base alphabets while maintaining resilience against deletion and substitution noise.",
        "gap": "Requires specialized non-standard synthesis hardware.",
        "helix": "Utilizes standard A,C,G,T chemistry compatible with commercial DNA synthesis providers (Twist, IDT, GenScript)."
    },
    {
        "id": 9,
        "title": "The DNA Coverage Depth Problem: Duality & Weight Distributions",
        "authors": "M. Bertuzzo, A. Ravagnani, E. Yaakobi",
        "venue": "Nat. Sci. Rev.",
        "year": "2024",
        "affil": "Eindhoven & Technion",
        "method": "Combinatorial duality and linear code weight distributions to calculate coverage depth bounds in random sequencing read draws.",
        "findings": "Provides closed-form formulas for expected read coverage needed to guarantee full-rank matrix reconstruction in small finite fields.",
        "gap": "Mathematical proof without practical tool integration.",
        "helix": "Calibrates minimum coverage depth thresholds directly in the HelixVault Decoder recovery pipeline."
    },
    {
        "id": 10,
        "title": "Two Multi-Draw Coupon Collector Models with Retention Rules",
        "authors": "A. V. Doumas, S. Spektor",
        "venue": "DNA Alliance / Appl. Prob.",
        "year": "2026",
        "affil": "Alliance Standard",
        "method": "Multi-draw coupon collector asymptotics modeling strand dropout probabilities during repeated PCR and enzymatic amplification.",
        "findings": "Formulates exact variance Var ~ (pi^2/6)(N^2/d^2) for molecular recovery; establishes non-uniform dropout rates in physical pools.",
        "gap": "Focused strictly on probability theory.",
        "helix": "Drives the environmental degradation simulator and Reed-Solomon oversampling rates (>=20%) in HelixVault synthesis."
    }
]

def make_html(papers, part_title, part_subtitle):
    rows_html = ""
    for p in papers:
        rows_html += f"""
        <tr>
          <td class="col-num">{p['id']}</td>
          <td class="col-title">
            <div class="title-text">{p['title']}</div>
            <div class="author-text">{p['authors']}</div>
            <div class="venue-tag"><b>{p['venue']}</b> &bull; {p['year']} &bull; <i>{p['affil']}</i></div>
          </td>
          <td class="col-method">{p['method']}</td>
          <td class="col-findings">{p['findings']}</td>
          <td class="col-relevance">
            <div class="gap-block"><span class="badge-gap">GAP</span> {p['gap']}</div>
            <div class="helix-block"><span class="badge-helix">HELIXVAULT</span> {p['helix']}</div>
          </td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 30px;
      display: flex;
      justify-content: center;
    }}
    .table-card {{
      width: 1200px;
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 32px 36px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
    }}
    .table-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 18px;
      border-bottom: 3px solid #0f172a;
    }}
    .table-header h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 23px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }}
    .table-header p {{
      font-size: 15px;
      color: #475569;
      margin-top: 4px;
      font-weight: 500;
    }}
    .badge-header {{
      background: #0f172a;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 15px;
      line-height: 1.55;
    }}
    thead th {{
      background: #f1f5f9;
      color: #0f172a;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 14.5px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 14px 16px;
      text-align: left;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }}
    tbody tr {{
      border-bottom: 1.5px solid #cbd5e1;
    }}
    tbody tr:nth-child(even) {{
      background: #f8fafc;
    }}
    tbody td {{
      padding: 18px 16px;
      vertical-align: top;
      color: #1e293b;
    }}
    .col-num {{
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-align: center;
      width: 50px;
    }}
    .col-title {{
      width: 290px;
    }}
    .title-text {{
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.35;
      margin-bottom: 6px;
    }}
    .author-text {{
      font-size: 13.5px;
      color: #475569;
      font-weight: 600;
      margin-bottom: 6px;
    }}
    .venue-tag {{
      display: inline-block;
      background: #e2e8f0;
      color: #0f172a;
      font-size: 12.5px;
      padding: 4px 8px;
      border-radius: 6px;
      line-height: 1.4;
    }}
    .col-method {{
      width: 260px;
      font-size: 14.5px;
      color: #334155;
    }}
    .col-findings {{
      width: 280px;
      font-size: 14.5px;
      color: #0f172a;
      font-weight: 500;
    }}
    .col-relevance {{
      width: 320px;
      font-size: 14px;
    }}
    .gap-block {{
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      padding: 8px 10px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 8px;
      color: #991b1b;
      line-height: 1.4;
    }}
    .helix-block {{
      background: #eff6ff;
      border-left: 3px solid #2563eb;
      padding: 8px 10px;
      border-radius: 0 6px 6px 0;
      color: #1e40af;
      line-height: 1.4;
    }}
    .badge-gap {{
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      background: #ef4444;
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 4px;
      vertical-align: middle;
    }}
    .badge-helix {{
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      background: #2563eb;
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 4px;
      vertical-align: middle;
    }}
    .table-footer {{
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }}
  </style>
</head>
<body>
  <div class="table-card">
    <div class="table-header">
      <div>
        <h2>Table 2.1: Literature Survey of DNA Data Storage Works &mdash; {part_title}</h2>
        <p>{part_subtitle}</p>
      </div>
      <div class="badge-header">HelixVault Project Report</div>
    </div>
    <table>
      <thead>
        <tr>
          <th class="col-num">#</th>
          <th class="col-title">Paper Title & Authors</th>
          <th class="col-method">Methodology & Technique</th>
          <th class="col-findings">Key Findings & Advantages</th>
          <th class="col-relevance">Research Gap & HelixVault Relevance</th>
        </tr>
      </thead>
      <tbody>
        {rows_html}
      </tbody>
    </table>
    <div class="table-footer">
      <span>HelixVault Biological Data Preservation &mdash; Literature Review</span>
      <span>Peer-Reviewed Benchmark Analysis</span>
    </div>
  </div>
</body>
</html>
"""

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1300, "height": 1400}, device_scale_factor=2.0)
        page = await context.new_page()

        # Part 1 (Papers 1-5)
        html_p1 = make_html(papers_all[:5], "Part 1 (Papers 1–5)", "Progressive Wavelet Encoding, Codec Optimization, Burst Indel Correction & Distributed Matrix Channels")
        p1_file = "e:/new_project_main/scratch/table_part1.html"
        with open(p1_file, "w", encoding="utf-8") as f:
            f.write(html_p1)
        
        await page.goto(f"file:///{p1_file}")
        await page.wait_for_selector(".table-card")
        await asyncio.sleep(1)
        card1 = await page.query_selector(".table-card")
        out1 = "e:/new_project_main/assets/literature_survey_part1.png"
        await card1.screenshot(path=out1)
        print("Generated Part 1:", out1)

        # Part 2 (Papers 6-10)
        html_p2 = make_html(papers_all[5:], "Part 2 (Papers 6–10)", "Frequency Channels, Fountain Codes, Composite Alphabets, Coverage Depth & Physical Dropout Models")
        p2_file = "e:/new_project_main/scratch/table_part2.html"
        with open(p2_file, "w", encoding="utf-8") as f:
            f.write(html_p2)

        await page.goto(f"file:///{p2_file}")
        await page.wait_for_selector(".table-card")
        await asyncio.sleep(1)
        card2 = await page.query_selector(".table-card")
        out2 = "e:/new_project_main/assets/literature_survey_part2.png"
        await card2.screenshot(path=out2)
        print("Generated Part 2:", out2)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
