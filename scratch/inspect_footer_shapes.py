import zipfile
import xml.etree.ElementTree as ET

input_path = 'C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx'

with zipfile.ZipFile(input_path, 'r') as z:
    for name in z.namelist():
        if 'footer' in name and name.endswith('.xml'):
            content = z.read(name).decode('utf-8')
            print(f"=== {name} ===")
            print("Contains <v:rect>:", '<v:rect' in content)
            print("Contains <v:shape>:", '<v:shape' in content)
            print("Contains <w:drawing>:", '<w:drawing' in content)
            print("Contains <w:pict>:", '<w:pict' in content)
