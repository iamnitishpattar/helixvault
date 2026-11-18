import pypdf
import re

reader = pypdf.PdfReader('C:/Users/Nitish Pattar/Desktop/HelixVault_Project_Report_N_1.pdf')

for page_idx in [0, 1, 2]:
    page = reader.pages[page_idx]
    contents = page.get_contents()
    data = b"".join([c.get_data() for c in contents]) if isinstance(contents, list) else contents.get_data()
    text = data.decode('latin1', errors='ignore')
    
    print(f"=== PAGE {page_idx + 1} ===")
    rects = re.findall(r'([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+re', text)
    for r in rects:
        x, y, w, h = [float(v) for v in r]
        print(f"  Rect at x={x:.2f}, y={y:.2f}, width={w:.2f}, height={h:.2f}")

