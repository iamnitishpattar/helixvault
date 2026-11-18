import docx
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def inspect_all_docshapes():
    doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
    for s_idx, s in enumerate(doc.sections[:3]):
        for p_idx, p in enumerate(s.footer.paragraphs):
            for r in p.runs:
                if 'rect' in r._r.xml:
                    print(f"Sec {s_idx} P {p_idx} rect XML:\n{r._r.xml}")

inspect_all_docshapes()

