import docx

doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
print("Section 0 footer paragraphs count:", len(doc.sections[0].footer.paragraphs))
for p in doc.sections[0].footer.paragraphs:
    print("P text:", repr(p.text))
    print("P XML:", p._p.xml[:500])

print("\nSection 0 different_first_page_header_footer:", doc.sections[0].different_first_page_header_footer)
print("Section 0 first_page_footer paragraphs count:", len(doc.sections[0].first_page_footer.paragraphs))
for p in doc.sections[0].first_page_footer.paragraphs:
    print("First Page Footer P text:", repr(p.text))
    print("First Page Footer P XML:", p._p.xml[:500])

