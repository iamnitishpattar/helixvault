import docx

doc = docx.Document('C:/Users/Nitish Pattar/Desktop/HelixVault_Project_Report_Nitish_Updated.docx')
for i, p in enumerate(doc.paragraphs):
    if '1.3 Literature Survey' in p.text:
        print(f"P{i}: {p.text}")
        print(f"P{i+1}: {doc.paragraphs[i+1].text[:80]}...")
        break

# Verify table
for t in doc.tables:
    if len(t.rows) == 11 and len(t.columns) == 6:
        print("Found Table 2.1 in document!")
        print("Row 0 headers:", [c.text.strip() for c in t.rows[0].cells])
        print("Row 1 sample:", [c.text.strip()[:25] for c in t.rows[1].cells])
        break

