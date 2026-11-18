import pypdf
import re

reader = pypdf.PdfReader('C:/Users/Nitish Pattar/Desktop/HelixVault_Project_Report_N_1.pdf')
found_y_low = []
for idx, page in enumerate(reader.pages):
    contents = page.get_contents()
    data = b"".join([c.get_data() for c in contents]) if isinstance(contents, list) else contents.get_data()
    text = data.decode('latin1', errors='ignore')
    rects = re.findall(r'([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+re', text)
    for r in rects:
        x, y, w, h = [float(v) for v in r]
        if y < 100:
            found_y_low.append((idx + 1, x, y, w, h))

print(f"Total rects with y < 100 in entire PDF (across {len(reader.pages)} pages): {len(found_y_low)}")
for item in found_y_low[:10]:
    print(" ", item)

