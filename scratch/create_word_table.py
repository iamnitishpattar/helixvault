import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

papers_all = [
    {
        "id": "1",
        "title": "Adaptive Sampling for Storage of Progressive Images on DNA",
        "authors": "X. Pic, N. Pinnamaneni, R. Appuswamy",
        "venue": "BioRxiv / IEEE (2024)\nEURECOM & Helixworks",
        "method": "Hierarchical wavelet progressive image compression paired with an adaptive oligonucleotide physical sampling policy.",
        "findings": "Enables multi-resolution visual reconstruction at lower sequencing depth; avoids full-read sequencing costs for visual preview.",
        "gap": "Tailored exclusively to 2D image matrices.",
        "helix": "Generalizes progressive multi-tier decoding across arbitrary digital formats (documents, audio, video)."
    },
    {
        "id": "2",
        "title": "DNA-MGC+: A Versatile Codec for Reliable and Resource-Efficient Storage",
        "authors": "R. Khabbaz, J. Mateos, M. Antonini, S. Kas Hanna",
        "venue": "Nature Comp. Sci. (2025)\nCNRS / Pearcode",
        "method": "Modified Goldman rotating ternary codec (MGC+) targeting simultaneous insertion, deletion, and substitution (IDS) channel noise.",
        "findings": "Achieves 28% higher logical density over baseline Goldman codes; successfully validated in vitro with Illumina and Oxford Nanopore.",
        "gap": "High algorithmic complexity for large batch files.",
        "helix": "Implements optimized Base-3 rotating ternary tables with strict homopolymer suppression (<=3 bp) and 40-60% GC tuning."
    },
    {
        "id": "3",
        "title": "Error-Correcting Codes for Two Bursts of (t1, t2)-DI with Low Complexity",
        "authors": "Y. Liu, T. M. Duman (IEEE Fellow)",
        "venue": "IEEE / SNIA (2026)\nBilkent University",
        "method": "Construction of linear-complexity channel error-correcting codes tailored for multi-burst deletion and insertion occurrences.",
        "findings": "Provides sub-logarithmic redundancy overhead while guaranteeing exact packet alignment and synchronization under localized burst drops.",
        "gap": "Purely theoretical formulation without software UI.",
        "helix": "Implements packetized oligo headers with Reed-Solomon parity to counter burst synthesis-dropout anomalies."
    },
    {
        "id": "4",
        "title": "Error-Correcting Codes for the Sum Channel",
        "authors": "L. Abboud, E. Yaakobi",
        "venue": "ResearchGate / ISIT (2026)\nTechnion",
        "method": "Sum channel matrix algebraic modeling with parity-sum rows for distributed matrix-encoded storage pools.",
        "findings": "Constructs two-deletion-correcting matrix codes with optimal redundancy bounds 2*ceil(log2 log2 n) + log2 l.",
        "gap": "Focuses strictly on matrix channel abstractions.",
        "helix": "Employs horizontal/vertical parity rows to reconstruct missing oligo fragments without re-synthesizing the whole pool."
    },
    {
        "id": "5",
        "title": "Expected Recovery Time in DNA-based Distributed Storage Systems",
        "authors": "A. Levy, R. Con, E. Yaakobi, H. M. Kiah",
        "venue": "RSC Advances / IEEE (2026)\nTechnion & NTU Singapore",
        "method": "Erasure-coded multi-container biological architecture with statistical sampling distribution analysis.",
        "findings": "Derives exact mathematical expectations for random read sampling needed to rebuild damaged or decayed storage containers.",
        "gap": "Lacks automated physical lab protocols.",
        "helix": "Combines multi-carrier BioDatabase indexing with dynamic freezer S.O.P. generation (Rack/Box/Tube assignments)."
    },
    {
        "id": "6",
        "title": "On the Capacity of Noisy Frequency-based Channels",
        "authors": "Y. Gerzon, I. Shomorony, N. Weinberger",
        "venue": "IEEE Access (2025)\nTechnion & UIUC",
        "method": "Short-molecule order-free DNA encoding using concentration histograms rather than ordered base sequences.",
        "findings": "Bypasses synthesis length barriers by storing data in relative molecular concentrations; proves non-asymptotic capacity bounds.",
        "gap": "Highly susceptible to chemical pipetting noise.",
        "helix": "Adopts ordered nucleotide oligos with in-silico PCR primer indexing for high-precision Illumina/Nanopore pipelines."
    },
    {
        "id": "7",
        "title": "Random Access Expectation in DNA Storage and Fountain Codes",
        "authors": "C. Hofmeister, R. Bitar, E. Yaakobi",
        "venue": "Precedence / IEEE ITW (2025)\nTU Munich",
        "method": "Equivalence mapping between binary fully symmetric linear codes and rateless Luby Transform (LT) Fountain codes.",
        "findings": "Minimizes sequencing read overhead for targeted document queries; provides superior random access without decoding entire pools.",
        "gap": "Evaluated primarily through synthetic simulations.",
        "helix": "Incorporates Fountain parity health checks and BioCompute direct sequence searching without prior binary decoding."
    },
    {
        "id": "8",
        "title": "Robust Composite DNA Storage under Sampling Randomness & IDS Errors",
        "authors": "B. Tegin, T. M. Duman",
        "venue": "Advanced Science (2024)\nCentraleSupelec & Bilkent",
        "method": "Composite nucleotide mixtures mapped onto a 3D probability simplex with multinomial channel error-correction.",
        "findings": "Achieves higher per-cycle density than standard 4-base alphabets while maintaining resilience against deletion and substitution noise.",
        "gap": "Requires specialized non-standard synthesis hardware.",
        "helix": "Utilizes standard A,C,G,T chemistry compatible with commercial DNA synthesis providers (Twist, IDT, GenScript)."
    },
    {
        "id": "9",
        "title": "The DNA Coverage Depth Problem: Duality & Weight Distributions",
        "authors": "M. Bertuzzo, A. Ravagnani, E. Yaakobi",
        "venue": "Nat. Sci. Rev. (2024)\nEindhoven & Technion",
        "method": "Combinatorial duality and linear code weight distributions to calculate coverage depth bounds in random sequencing read draws.",
        "findings": "Provides closed-form formulas for expected read coverage needed to guarantee full-rank matrix reconstruction in small finite fields.",
        "gap": "Mathematical proof without practical tool integration.",
        "helix": "Calibrates minimum coverage depth thresholds directly in the HelixVault Decoder recovery pipeline."
    },
    {
        "id": "10",
        "title": "Two Multi-Draw Coupon Collector Models with Retention Rules",
        "authors": "A. V. Doumas, S. Spektor",
        "venue": "DNA Alliance / Appl. Prob. (2026)\nAlliance Standard",
        "method": "Multi-draw coupon collector asymptotics modeling strand dropout probabilities during repeated PCR and enzymatic amplification.",
        "findings": "Formulates exact variance Var ~ (pi^2/6)(N^2/d^2) for molecular recovery; establishes non-uniform dropout rates in physical pools.",
        "gap": "Focused strictly on probability theory.",
        "helix": "Drives the environmental degradation simulator and Reed-Solomon oversampling rates (>=20%) in HelixVault synthesis."
    }
]

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()

    # Set page orientation to Landscape for spacious display
    for section in doc.sections:
        section.orientation = docx.enum.section.WD_ORIENT.LANDSCAPE
        section.page_width = Inches(11.0)
        section.page_height = Inches(8.5)
        section.top_margin = Inches(0.6)
        section.bottom_margin = Inches(0.6)
        section.left_margin = Inches(0.6)
        section.right_margin = Inches(0.6)

    # Title
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Table 2.1: Comprehensive Literature Survey & Comparative Analysis")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
    p_title.paragraph_format.space_after = Pt(2)

    # Subtitle
    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Systematic review of foundational & recent benchmark research in synthetic DNA data storage, error-correcting codecs, and archival architectures (2024–2026) in comparison with HelixVault.")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(10)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)
    p_sub.paragraph_format.space_after = Pt(12)

    # Table: 11 rows (1 header + 10 papers), 6 columns
    table = doc.add_table(rows=11, cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Column widths (Total ~9.8 inches)
    col_widths = [Inches(0.4), Inches(2.2), Inches(1.3), Inches(2.0), Inches(2.0), Inches(2.1)]

    headers = [
        "#", 
        "Paper Title & Authors", 
        "Journal / Source", 
        "Core Methodology", 
        "Key Findings & Advantages", 
        "Research Gap & HelixVault Relevance"
    ]

    # Format Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "0F172A") # Dark navy
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i == 0 else WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(title)
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    # Format Data Rows
    for row_idx, p_data in enumerate(papers_all, start=1):
        row_cells = table.rows[row_idx].cells
        bg_color = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"

        for col_idx in range(6):
            row_cells[col_idx].width = col_widths[col_idx]
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], top=100, bottom=100, left=120, right=120)

        # Col 0: Index
        p0 = row_cells[0].paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r0 = p0.add_run(p_data["id"])
        r0.font.name = "Calibri"
        r0.font.size = Pt(10)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(15, 23, 42)

        # Col 1: Title & Authors
        p1 = row_cells[1].paragraphs[0]
        r1_title = p1.add_run(p_data["title"] + "\n")
        r1_title.font.name = "Calibri"
        r1_title.font.size = Pt(9.5)
        r1_title.font.bold = True
        r1_title.font.color.rgb = RGBColor(15, 23, 42)

        r1_authors = p1.add_run(p_data["authors"])
        r1_authors.font.name = "Calibri"
        r1_authors.font.size = Pt(8.5)
        r1_authors.font.italic = True
        r1_authors.font.color.rgb = RGBColor(71, 85, 105)

        # Col 2: Venue
        p2 = row_cells[2].paragraphs[0]
        r2 = p2.add_run(p_data["venue"])
        r2.font.name = "Calibri"
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = RGBColor(51, 65, 85)

        # Col 3: Methodology
        p3 = row_cells[3].paragraphs[0]
        r3 = p3.add_run(p_data["method"])
        r3.font.name = "Calibri"
        r3.font.size = Pt(8.5)
        r3.font.color.rgb = RGBColor(51, 65, 85)

        # Col 4: Findings
        p4 = row_cells[4].paragraphs[0]
        r4 = p4.add_run(p_data["findings"])
        r4.font.name = "Calibri"
        r4.font.size = Pt(8.5)
        r4.font.color.rgb = RGBColor(15, 23, 42)

        # Col 5: Gap & HelixVault
        p5 = row_cells[5].paragraphs[0]
        
        # Gap
        r5_gap_lbl = p5.add_run("[GAP] ")
        r5_gap_lbl.font.name = "Calibri"
        r5_gap_lbl.font.size = Pt(8)
        r5_gap_lbl.font.bold = True
        r5_gap_lbl.font.color.rgb = RGBColor(220, 38, 38) # Red

        r5_gap_text = p5.add_run(p_data["gap"] + "\n\n")
        r5_gap_text.font.name = "Calibri"
        r5_gap_text.font.size = Pt(8.5)
        r5_gap_text.font.color.rgb = RGBColor(71, 85, 105)

        # HelixVault
        r5_hx_lbl = p5.add_run("[HELIXVAULT] ")
        r5_hx_lbl.font.name = "Calibri"
        r5_hx_lbl.font.size = Pt(8)
        r5_hx_lbl.font.bold = True
        r5_hx_lbl.font.color.rgb = RGBColor(37, 99, 235) # Blue

        r5_hx_text = p5.add_run(p_data["helix"])
        r5_hx_text.font.name = "Calibri"
        r5_hx_text.font.size = Pt(8.5)
        r5_hx_text.font.color.rgb = RGBColor(30, 64, 175)

    out_docx = "e:/new_project_main/assets/Table_2_1_Literature_Survey.docx"
    doc.save(out_docx)
    print("Word document generated successfully at:", out_docx)

if __name__ == "__main__":
    create_document()
