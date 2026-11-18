import zipfile
import re

input_path = 'C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx'
output_path = 'C:/Users/Nitish Pattar/Desktop/HelixVault_Project_Report_Fixed_Borders.docx'

with zipfile.ZipFile(input_path, 'r') as zin, zipfile.ZipFile(output_path, 'w') as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if 'footer' in item.filename:
            text = data.decode('utf-8')
            # Check if z-index is negative and replace with positive foreground z-index
            # e.g. z-index:-18210304 -> z-index:251658240
            text_fixed = re.sub(r'z-index:-(\d+)', r'z-index:251658240', text)
            data = text_fixed.encode('utf-8')
        zout.writestr(item, data)

print("Saved fixed borders docx to Desktop!")

