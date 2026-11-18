import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_literature_survey_docx():
    doc = docx.Document()
    
    # Page setup - Standard portrait margins (0.7 in)
    section = doc.sections[0]
    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.7)
    section.right_margin = Inches(0.7)

    # Heading
    h = doc.add_heading('Table 2.1: Literature Survey of Existing DNA Data Storage Works', level=2)
    h.runs[0].font.size = Pt(13)
    h.runs[0].font.name = 'Calibri'
    h.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph('Comprehensive comparative summary of peer-reviewed benchmarks, error-correcting codecs, and archival architectures (2024–2026).')
    p_sub.runs[0].font.size = Pt(9.5)
    p_sub.runs[0].font.italic = True
    p_sub.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    table_data = [
        (
            '1',
            'Adaptive Sampling for Storage of Progressive Images on DNA',
            'X. Pic, N. Pinnamaneni, R. Appuswamy',
            'BioRxiv / IEEE (2024)\nEURECOM & Helixworks',
            'Hierarchical wavelet progressive image compression paired with an adaptive oligonucleotide physical sampling policy.',
            'Enables multi-resolution visual reconstruction at lower sequencing depth; avoids full-read sequencing costs for visual preview.',
            'Tailored exclusively to 2D image matrices.',
            'Generalizes progressive multi-tier decoding across arbitrary digital formats (documents, audio, video).'
        ),
        (
            '2',
            'DNA-MGC+: A Versatile Codec for Reliable and Resource-Efficient Storage',
            'R. Khabbaz, J. Mateos, M. Antonini, S. Kas Hanna',
            'Nature Comp. Sci. (2025)\nCNRS / Pearcode',
            'Modified Goldman rotating ternary codec (MGC+) targeting simultaneous insertion, deletion, and substitution (IDS) channel noise.',
            'Achieves 28% higher logical density over baseline Goldman codes; successfully validated in vitro with Illumina and Oxford Nanopore.',
            'High algorithmic complexity for large batch files.',
            'Implements optimized Base-3 rotating ternary tables with strict homopolymer suppression (<=3 bp) and 40–60% GC tuning.'
        ),
        (
            '3',
            'Error-Correcting Codes for Two Bursts of (t1, t2)-DI with Low Complexity',
            'Y. Liu, T. M. Duman (IEEE Fellow)',
            'IEEE / SNIA (2026)\nBilkent University',
            'Construction of linear-complexity channel error-correcting codes tailored for multi-burst deletion and insertion occurrences in sequencing.',
            'Provides sub-logarithmic redundancy overhead while guaranteeing exact packet alignment and synchronization under localized burst drops.',
            'Theoretical formulation without software UI.',
            'Implements packetized oligo headers with Reed-Solomon parity to counter burst synthesis-dropout anomalies.'
        ),
        (
            '4',
            'Error-Correcting Codes for the Sum Channel',
            'L. Abboud, E. Yaakobi',
            'ResearchGate / ISIT (2026)\nTechnion',
            'Sum channel matrix algebraic modeling with parity-sum rows for distributed matrix-encoded storage pools.',
            'Constructs two-deletion-correcting matrix codes with optimal redundancy bounds 2·ceil(log2 log2 n) + log2 l.',
            'Focuses on matrix channel abstractions.',
            'Employs horizontal/vertical parity rows to reconstruct missing oligo fragments without re-synthesizing the whole pool.'
        ),
        (
            '5',
            'Expected Recovery Time in DNA-based Distributed Storage Systems',
            'A. Levy, R. Con, E. Yaakobi, H. M. Kiah',
            'RSC Advances / IEEE (2026)\nTechnion / NTU',
            'Erasure-coded multi-container biological architecture with statistical sampling distribution analysis.',
            'Derives exact mathematical expectations for random read sampling needed to rebuild damaged or decayed storage containers.',
            'Lacks automated physical lab protocols.',
            'Combines multi-carrier BioDatabase indexing with dynamic freezer S.O.P. generation (Rack/Box/Tube assignments).'
        ),
        (
            '6',
            'On the Capacity of Noisy Frequency-based Channels',
            'Y. Gerzon, I. Shomorony, N. Weinberger',
            'IEEE Access (2025)\nTechnion / UIUC',
            'Short-molecule order-free DNA encoding using concentration histograms rather than ordered base sequences.',
            'Bypasses synthesis length barriers by storing data in relative molecular concentrations; proves non-asymptotic capacity bounds.',
            'Highly susceptible to chemical pipetting noise.',
            'Adopts ordered nucleotide oligos with in-silico PCR primer indexing for high-precision Illumina/Nanopore pipelines.'
        ),
        (
            '7',
            'Random Access Expectation in DNA Storage and Fountain Codes',
            'C. Hofmeister, R. Bitar, E. Yaakobi',
            'Precedence / IEEE ITW (2025)\nTU Munich',
            'Equivalence mapping between binary fully symmetric linear codes and rateless Luby Transform (LT) Fountain codes.',
            'Minimizes sequencing read overhead for targeted document queries; provides superior random access without decoding entire pools.',
            'Evaluated primarily through synthetic simulations.',
            'Incorporates Fountain parity health checks and BioCompute direct sequence searching without prior binary decoding.'
        ),
        (
            '8',
            'Robust Composite DNA Storage under Sampling Randomness & IDS Errors',
            'B. Tegin, T. M. Duman',
            'Advanced Science (2024)\nCentraleSupélec',
            'Composite nucleotide mixtures mapped onto a 3D probability simplex with multinomial channel error-correction.',
            'Achieves higher per-cycle density than standard 4-base alphabets while maintaining resilience against deletion and substitution noise.',
            'Requires specialized non-standard synthesis hardware.',
            'Utilizes standard A,C,G,T chemistry compatible with commercial DNA synthesis providers (Twist, IDT, GenScript).'
        ),
        (
            '9',
            'The DNA Coverage Depth Problem: Duality & Weight Distributions',
            'M. Bertuzzo, A. Ravagnani, E. Yaakobi',
            'Nat. Sci. Rev. (2024)\nEindhoven / Technion',
            'Combinatorial duality and linear code weight distributions to calculate coverage depth bounds in random sequencing read draws.',
            'Provides closed-form formulas for expected read coverage needed to guarantee full-rank matrix reconstruction in small finite fields.',
            'Mathematical proof without practical tool integration.',
            'Calibrates minimum coverage depth thresholds directly in the HelixVault Decoder recovery pipeline.'
        ),
        (
            '10',
            'Two Multi-Draw Coupon Collector Models with Retention Rules',
            'A. V. Doumas, S. Spektor',
            'DNA Alliance / Appl. Prob. (2026)\nAlliance Standard',
            'Multi-draw coupon collector asymptotics modeling strand dropout probabilities during repeated PCR and enzymatic amplification.',
            'Formulates exact variance Var ~ (pi^2/6)(N^2/d^2) for molecular recovery; establishes non-uniform dropout rates in physical pools.',
            'Focused strictly on probability theory.',
            'Drives the environmental degradation simulator and Reed-Solomon oversampling rates (>=20%) in HelixVault synthesis.'
        )
    ]

    table = doc.add_table(rows=1, cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(0.35), Inches(1.5), Inches(1.05), Inches(1.3), Inches(1.35), Inches(1.55)]

    headers = ['#', 'Paper Title & Authors', 'Journal / Source', 'Core Methodology', 'Key Findings & Advantages', 'Research Gap & HelixVault Relevance']

    hdr_cells = table.rows[0].cells
    for idx, text in enumerate(headers):
        hdr_cells[idx].text = text
        p = hdr_cells[idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(8.5)
            r.font.name = 'Calibri'
            r.font.color.rgb = RGBColor(255, 255, 255)
        
        # Header cell shading: Dark Slate / Navy #0F172A
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="0F172A"/>')
        hdr_cells[idx]._tc.get_or_add_tcPr().append(shd)

    # Repeating header row and prevent split
    trPr = table.rows[0]._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

    for row_idx, data in enumerate(table_data):
        num, title, authors, source, method, findings, gap, helix = data
        row_cells = table.add_row().cells
        
        # cantSplit on all rows
        r_trPr = table.rows[row_idx + 1]._tr.get_or_add_trPr()
        r_trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        
        # Zebra shading
        bg_fill = 'F8FAFC' if row_idx % 2 == 1 else 'FFFFFF'
        for c in row_cells:
            c_tcPr = c._tc.get_or_add_tcPr()
            c_tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_fill}"/>'))
        
        # Col 0: Number
        p0 = row_cells[0].paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r0 = p0.add_run(num)
        r0.font.bold = True
        r0.font.size = Pt(8.5)
        r0.font.name = 'Calibri'
        
        # Col 1: Title & Authors
        p1 = row_cells[1].paragraphs[0]
        r1_title = p1.add_run(title + '\n')
        r1_title.font.bold = True
        r1_title.font.size = Pt(8.5)
        r1_title.font.name = 'Calibri'
        r1_auth = p1.add_run(authors)
        r1_auth.font.italic = True
        r1_auth.font.size = Pt(7.5)
        r1_auth.font.name = 'Calibri'
        r1_auth.font.color.rgb = RGBColor(71, 85, 105)
        
        # Col 2: Source
        p2 = row_cells[2].paragraphs[0]
        r2 = p2.add_run(source)
        r2.font.size = Pt(8.0)
        r2.font.name = 'Calibri'
        
        # Col 3: Method
        p3 = row_cells[3].paragraphs[0]
        r3 = p3.add_run(method)
        r3.font.size = Pt(8.0)
        r3.font.name = 'Calibri'
        
        # Col 4: Findings
        p4 = row_cells[4].paragraphs[0]
        r4 = p4.add_run(findings)
        r4.font.size = Pt(8.0)
        r4.font.name = 'Calibri'
        
        # Col 5: Gap & HelixVault
        p5 = row_cells[5].paragraphs[0]
        r5_gap_tag = p5.add_run('[GAP] ')
        r5_gap_tag.font.bold = True
        r5_gap_tag.font.size = Pt(8.0)
        r5_gap_tag.font.color.rgb = RGBColor(220, 38, 38)
        r5_gap_text = p5.add_run(gap + '\n\n')
        r5_gap_text.font.size = Pt(8.0)
        
        r5_hx_tag = p5.add_run('[HELIXVAULT] ')
        r5_hx_tag.font.bold = True
        r5_hx_tag.font.size = Pt(8.0)
        r5_hx_tag.font.color.rgb = RGBColor(37, 99, 235)
        r5_hx_text = p5.add_run(helix)
        r5_hx_text.font.size = Pt(8.0)

    # Set column widths
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # Set borders: clean slate borders
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        '<w:top w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>'
        '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>'
        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        '</w:tblBorders>'
    )
    tblPr.append(tblBorders)

    doc.save('E:/new_project_main/assets/Table_2_1_Literature_Survey.docx')
    print('Successfully saved clean docx to E:/new_project_main/assets/Table_2_1_Literature_Survey.docx')

if __name__ == '__main__':
    create_literature_survey_docx()

