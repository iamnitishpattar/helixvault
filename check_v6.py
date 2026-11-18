import subprocess
import pypdf

vbs = '''
Set w = CreateObject("Word.Application")
w.Visible = False
Set doc = w.Documents.Open("e:\\new_project_main\\HelixVault_IEEE_Paper_v6.docx", False, True)
doc.SaveAs "e:\\new_project_main\\HelixVault_IEEE_Paper_v6.pdf", 17
WScript.Echo "Total pages: " & doc.ComputeStatistics(2)
doc.Close False
w.Quit
'''
with open('e:\\new_project_main\\export_v6.vbs', 'w', encoding='utf-8') as f:
    f.write(vbs)

subprocess.run(['cscript', '//nologo', 'e:\\new_project_main\\export_v6.vbs'], capture_output=True)

reader = pypdf.PdfReader(r'e:\new_project_main\HelixVault_IEEE_Paper_v6.pdf')
print("Total pages in v6 PDF:", len(reader.pages))

for idx, page in enumerate(reader.pages):
    txt = page.extract_text()
    bad = txt.count('\ufffd')
    print(f"Page {idx+1}: length={len(txt)} chars, bad_chars={bad}")
