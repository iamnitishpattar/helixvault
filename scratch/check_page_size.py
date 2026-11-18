import docx

doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
for i, s in enumerate(doc.sections[:5]):
    print(f"Section {i}: page_width={s.page_width.pt if s.page_width else None} pt, page_height={s.page_height.pt if s.page_height else None} pt")

