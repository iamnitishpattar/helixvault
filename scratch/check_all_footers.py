import docx

doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
print(f"Total sections: {len(doc.sections)}")
for i, s in enumerate(doc.sections):
    shapes = []
    for p in s.footer.paragraphs:
        if 'pict' in p._p.xml:
            shapes.append('pict')
        if 'drawing' in p._p.xml:
            shapes.append('drawing')
    print(f"Section {i}: shapes in footer = {shapes}")

