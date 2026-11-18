import zipfile

with zipfile.ZipFile('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx', 'r') as z:
    for name in z.namelist():
        if 'header' in name or 'footer' in name:
            xml = z.read(name).decode('utf-8', errors='ignore')
            print(f"File {name}: length={len(xml)}, has docshape4={'docshape4' in xml}, has docshape5={'docshape5' in xml}")

