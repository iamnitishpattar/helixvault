import docx

doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
body = doc._body._element
p128_elem = doc.paragraphs[128]._p
p134_elem = doc.paragraphs[134]._p

# Find child elements between p128 and p134
found = False
for child in body:
    if child == p128_elem:
        found = True
    if found:
        print(child.tag)
        if child == p134_elem:
            break

