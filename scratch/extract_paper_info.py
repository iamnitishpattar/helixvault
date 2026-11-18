import os
import json
import pypdf

pdf_dir = os.path.join(os.path.expanduser('~'), 'Desktop', 'DNA_Storage_Papers')
files = sorted([f for f in os.listdir(pdf_dir) if f.endswith('.pdf')], 
               key=lambda x: int(x.split('.')[0]) if x.split('.')[0].isdigit() else 999)

papers_data = []

for f in files:
    path = os.path.join(pdf_dir, f)
    try:
        reader = pypdf.PdfReader(path)
        full_text = ""
        for p in reader.pages[:3]:
            full_text += (p.extract_text() or "") + "\n"
        
        lines = [line.strip() for line in full_text.split("\n") if line.strip()]
        
        # Try to locate abstract
        abstract = ""
        lower_text = full_text.lower()
        if "abstract" in lower_text:
            idx = lower_text.find("abstract")
            abstract = full_text[idx:idx+1200].replace("\n", " ").strip()
        else:
            abstract = " ".join(lines[2:8])
            
        papers_data.append({
            "file": f,
            "page_count": len(reader.pages),
            "lines": lines[:12],
            "abstract": abstract[:500]
        })
    except Exception as e:
        papers_data.append({
            "file": f,
            "error": str(e)
        })

out_json = "e:/new_project_main/scratch/extracted_papers.json"
with open(out_json, "w", encoding="utf-8") as out:
    json.dump(papers_data, out, indent=2, ensure_ascii=False)

print(f"Extracted info for {len(papers_data)} papers into {out_json}")
