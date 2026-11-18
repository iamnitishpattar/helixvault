import docx

doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
print("Section 0 header:")
for p in doc.sections[0].header.paragraphs:
    print("Header P:", repr(p.text))
    print("Header XML:", p._p.xml[:500])

