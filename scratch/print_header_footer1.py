import zipfile

with zipfile.ZipFile('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx', 'r') as z:
    print("=== word/header1.xml ===")
    print(z.read('word/header1.xml').decode('utf-8'))
    print("\n=== word/footer1.xml ===")
    print(z.read('word/footer1.xml').decode('utf-8'))

