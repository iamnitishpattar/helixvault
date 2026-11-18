import asyncio
import os
from playwright.async_api import async_playwright

HTML_LIGHT_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Literature Survey Table - Academic Print</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Times+New+Roman&family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Times New Roman', serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      width: 1750px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 36px 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #0f172a;
    }
    .title-group h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
    }
    .title-group p {
      font-size: 13px;
      color: #475569;
      margin-top: 3px;
    }
    .meta-tag {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      line-height: 1.45;
    }
    thead th {
      background: #f1f5f9;
      color: #0f172a;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 12px;
      text-align: left;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    tbody td {
      padding: 11px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      color: #334155;
    }
    .col-id {
      font-weight: 700;
      color: #0f172a;
      text-align: center;
      width: 40px;
    }
    .col-title { width: 320px; }
    .paper-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 12.5px;
      margin-bottom: 3px;
    }
    .paper-authors { color: #64748b; font-size: 11.5px; font-style: italic; }
    .col-venue { width: 170px; }
    .venue-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      background: #e2e8f0;
      color: #1e293b;
      margin-bottom: 3px;
    }
    .venue-year { color: #64748b; font-size: 11px; }
    .col-method { width: 330px; color: #1e293b; }
    .col-findings { width: 380px; color: #334155; }
    .col-relevance { width: 360px; color: #1e3a8a; }
    .relevance-highlight { font-weight: 700; color: #b45309; }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      font-size: 11.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-group">
        <h1>Table 2.1: Literature Survey of Existing DNA Data Storage Works</h1>
        <p>Comprehensive comparative summary of peer-reviewed benchmarks, error-correcting codecs, and archival architectures</p>
      </div>
      <div class="meta-tag">10 Research Papers (2024–2026)</div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="col-id">#</th>
          <th class="col-title">Paper Title & Authors</th>
          <th class="col-venue">Journal / Source</th>
          <th class="col-method">Core Methodology</th>
          <th class="col-findings">Key Findings & Advantages</th>
          <th class="col-relevance">Research Gap & HelixVault Relevance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="col-id">1</td>
          <td class="col-title">
            <div class="paper-title">Adaptive Sampling for Storage of Progressive Images on DNA</div>
            <div class="paper-authors">X. Pic, N. Pinnamaneni, R. Appuswamy</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">BioRxiv / IEEE</span>
            <div class="venue-year">2024 | EURECOM</div>
          </td>
          <td class="col-method">Hierarchical wavelet progressive image compression paired with an adaptive oligonucleotide sampling policy.</td>
          <td class="col-findings">Multi-resolution visual reconstruction at lower sequencing depth; avoids full-read sequencing costs for visual preview.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Tailored exclusively to 2D image matrices.<br><span class="relevance-highlight">HelixVault Impact:</span> Generalizes progressive multi-tier decoding across arbitrary file formats (documents, audio, video).</td>
        </tr>
        <tr>
          <td class="col-id">2</td>
          <td class="col-title">
            <div class="paper-title">DNA-MGC+: A Versatile Codec for Reliable and Resource-Efficient Storage</div>
            <div class="paper-authors">R. Khabbaz, J. Mateos, M. Antonini, S. Kas Hanna</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">Nature Comp. Sci.</span>
            <div class="venue-year">2025 | CNRS / Pearcode</div>
          </td>
          <td class="col-method">Modified Goldman rotating ternary codec (MGC+) targeting simultaneous insertion, deletion, and substitution (IDS) channel noise.</td>
          <td class="col-findings">Achieves 28% higher logical density over baseline Goldman codes; successfully validated in vitro with Illumina and Oxford Nanopore.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> High algorithmic complexity for large batch files.<br><span class="relevance-highlight">HelixVault Impact:</span> Implements optimized Base-3 rotating ternary tables with strict homopolymer suppression (&le;3 bp) and 40–60% GC tuning.</td>
        </tr>
        <tr>
          <td class="col-id">3</td>
          <td class="col-title">
            <div class="paper-title">Error-Correcting Codes for Two Bursts of (t1, t2)-DI with Low Complexity</div>
            <div class="paper-authors">Y. Liu, T. M. Duman</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">IEEE / SNIA</span>
            <div class="venue-year">2026 | Bilkent University</div>
          </td>
          <td class="col-method">Construction of linear-complexity channel error-correcting codes tailored for multi-burst deletion and insertion occurrences in sequencing.</td>
          <td class="col-findings">Provides sub-logarithmic redundancy overhead while guaranteeing exact packet alignment and synchronization under localized burst drops.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Theoretical formulation without software UI.<br><span class="relevance-highlight">HelixVault Impact:</span> Implements packetized oligo headers with Reed-Solomon parity to counter burst synthesis-dropout anomalies.</td>
        </tr>
        <tr>
          <td class="col-id">4</td>
          <td class="col-title">
            <div class="paper-title">Error-Correcting Codes for the Sum Channel</div>
            <div class="paper-authors">L. Abboud, E. Yaakobi</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">ResearchGate / ISIT</span>
            <div class="venue-year">2026 | Technion</div>
          </td>
          <td class="col-method">Sum channel matrix algebraic modeling with parity-sum rows for distributed matrix-encoded storage pools.</td>
          <td class="col-findings">Constructs two-deletion-correcting matrix codes with optimal redundancy bounds 2&lceil;log<sub>2</sub> log<sub>2</sub> n&rceil; + log<sub>2</sub> &ell;.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Focuses on matrix channel abstractions.<br><span class="relevance-highlight">HelixVault Impact:</span> Employs horizontal/vertical parity rows to reconstruct missing oligo fragments without re-synthesizing the whole pool.</td>
        </tr>
        <tr>
          <td class="col-id">5</td>
          <td class="col-title">
            <div class="paper-title">Expected Recovery Time in DNA-based Distributed Storage Systems</div>
            <div class="paper-authors">A. Levy, R. Con, E. Yaakobi, H. M. Kiah</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">RSC Advances / IEEE</span>
            <div class="venue-year">2026 | Technion / NTU</div>
          </td>
          <td class="col-method">Erasure-coded multi-container biological architecture with statistical sampling distribution analysis.</td>
          <td class="col-findings">Derives exact mathematical expectations for random read sampling needed to rebuild damaged or decayed storage containers.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Lacks automated physical lab protocols.<br><span class="relevance-highlight">HelixVault Impact:</span> Combines multi-carrier BioDatabase indexing with dynamic freezer S.O.P. generation (Rack/Box/Tube assignments).</td>
        </tr>
        <tr>
          <td class="col-id">6</td>
          <td class="col-title">
            <div class="paper-title">On the Capacity of Noisy Frequency-based Channels</div>
            <div class="paper-authors">Y. Gerzon, I. Shomorony, N. Weinberger</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">IEEE Access</span>
            <div class="venue-year">2025 | Technion / UIUC</div>
          </td>
          <td class="col-method">Short-molecule order-free DNA encoding using concentration histograms rather than ordered base sequences.</td>
          <td class="col-findings">Bypasses synthesis length barriers by storing data in relative molecular concentrations; proves non-asymptotic capacity bounds.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Susceptible to chemical pipetting noise.<br><span class="relevance-highlight">HelixVault Impact:</span> Adopts ordered nucleotide oligos with in-silico PCR primer indexing for high-precision Illumina/Nanopore pipelines.</td>
        </tr>
        <tr>
          <td class="col-id">7</td>
          <td class="col-title">
            <div class="paper-title">Random Access Expectation in DNA Storage and Fountain Codes</div>
            <div class="paper-authors">C. Hofmeister, R. Bitar, E. Yaakobi</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">Precedence / ITW</span>
            <div class="venue-year">2025 | TU Munich</div>
          </td>
          <td class="col-method">Equivalence mapping between binary fully symmetric linear codes and rateless Luby Transform (LT) Fountain codes.</td>
          <td class="col-findings">Minimizes sequencing read overhead for targeted document queries; provides superior random access without decoding entire pools.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Evaluated primarily through synthetic simulations.<br><span class="relevance-highlight">HelixVault Impact:</span> Incorporates Fountain parity health checks and BioCompute direct sequence searching without prior binary decoding.</td>
        </tr>
        <tr>
          <td class="col-id">8</td>
          <td class="col-title">
            <div class="paper-title">Robust Composite DNA Storage under Sampling Randomness &amp; IDS Errors</div>
            <div class="paper-authors">B. Tegin, T. M. Duman</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">Advanced Science</span>
            <div class="venue-year">2024 | CentraleSup&eacute;lec</div>
          </td>
          <td class="col-method">Composite nucleotide mixtures mapped onto a 3D probability simplex with multinomial channel error-correction.</td>
          <td class="col-findings">Achieves higher per-cycle density than standard 4-base alphabets while maintaining resilience against deletion and substitution noise.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Requires specialized non-standard synthesis hardware.<br><span class="relevance-highlight">HelixVault Impact:</span> Utilizes standard A,C,G,T chemistry compatible with commercial DNA synthesis providers (Twist, IDT, GenScript).</td>
        </tr>
        <tr>
          <td class="col-id">9</td>
          <td class="col-title">
            <div class="paper-title">The DNA Coverage Depth Problem: Duality &amp; Weight Distributions</div>
            <div class="paper-authors">M. Bertuzzo, A. Ravagnani, E. Yaakobi</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">Nat. Sci. Rev.</span>
            <div class="venue-year">2024 | Eindhoven / Technion</div>
          </td>
          <td class="col-method">Combinatorial duality and linear code weight distributions to calculate coverage depth bounds in random sequencing read draws.</td>
          <td class="col-findings">Provides closed-form formulas for expected read coverage needed to guarantee full-rank matrix reconstruction in small finite fields.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Mathematical proof without practical tool integration.<br><span class="relevance-highlight">HelixVault Impact:</span> Calibrates minimum coverage depth thresholds directly in the HelixVault Decoder recovery pipeline.</td>
        </tr>
        <tr>
          <td class="col-id">10</td>
          <td class="col-title">
            <div class="paper-title">Two Multi-Draw Coupon Collector Models with Retention Rules</div>
            <div class="paper-authors">A. V. Doumas, S. Spektor</div>
          </td>
          <td class="col-venue">
            <span class="venue-badge">DNA Alliance / Appl. Prob.</span>
            <div class="venue-year">2026 | Alliance Standard</div>
          </td>
          <td class="col-method">Multi-draw coupon collector asymptotics modeling strand dropout probabilities during repeated PCR and enzymatic amplification.</td>
          <td class="col-findings">Formulates exact variance Var ~ (&pi;&sup2;/6)(N&sup2;/d&sup2;) for molecular recovery; establishes non-uniform dropout rates in physical pools.</td>
          <td class="col-relevance"><span class="relevance-highlight">Gap:</span> Focused strictly on probability theory.<br><span class="relevance-highlight">HelixVault Impact:</span> Drives the environmental degradation simulator and Reed-Solomon oversampling rates (&ge;20%) in HelixVault synthesis.</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <span>HelixVault Project Report &mdash; Chapter 2: Literature Survey</span>
      <span>Documented for Academic Submission</span>
    </div>
  </div>
</body>
</html>
"""

async def generate_print_table():
    html_path = "e:/new_project_main/scratch/literature_survey_print.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_LIGHT_CONTENT)

    out_image_path = "e:/new_project_main/assets/literature_survey_table_print.png"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1850, "height": 1300}, device_scale_factor=2.0)
        page = await context.new_page()

        await page.goto(f"file:///{html_path.replace(os.sep, '/')}")
        await page.wait_for_selector(".container")
        await asyncio.sleep(1)

        container = await page.query_selector(".container")
        if container:
            await container.screenshot(path=out_image_path)
        else:
            await page.screenshot(path=out_image_path, full_page=True)

        await browser.close()
        print(f"SUCCESS: Generated {out_image_path}")

if __name__ == "__main__":
    asyncio.run(generate_print_table())
