import pypdf
import re

reader = pypdf.PdfReader('C:/Users/Nitish Pattar/Desktop/HelixVault_Project_Report_N_1.pdf')
pages_with_397 = []
for idx, page in enumerate(reader.pages):
    contents = page.get_contents()
    data = b"".join([c.get_data() for c in contents]) if isinstance(contents, list) else contents.get_data()
    text = data.decode('latin1', errors='ignore')
    rects = re.findall(r'([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+re', text)
    for r in rects:
        x, y, w, h = [float(v) for v in r]
        if abs(w - 397.65) < 0.1:
            pages_with_397.append((idx + 1, x, y, w, h))

print(f"Total rects with width=397.65: {len(pages_with_397)}")
for item in pages_with_397[:20]:
    print(" ", item)

