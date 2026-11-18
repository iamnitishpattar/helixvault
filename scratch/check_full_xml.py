import docx

doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
print("HEADER P XML:")
print(doc.sections[0].header.paragraphs[0]._p.xml)

print("\nFOOTER P XML:")
print(doc.sections[0].footer.paragraphs[0]._p.xml)

