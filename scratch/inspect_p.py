import docx

doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
for i in range(124, 136):
    p = doc.paragraphs[i]
    print(f'P{i}: text="{p.text}", style={p.style.name}')

