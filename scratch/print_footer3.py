import zipfile

with zipfile.ZipFile('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx', 'r') as z:
    print("=== word/footer3.xml ===")
    print(z.read('word/footer3.xml').decode('utf-8'))

