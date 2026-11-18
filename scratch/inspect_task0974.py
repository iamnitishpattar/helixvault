import requests
import hashlib
import base64

res = requests.get('http://localhost:8000/api/dna/status/0974f830-b466-46a2-86a0-370e77029e8b')
data = res.json()
print("Task 0974 status:", data.get("status"))
fn_bytes = data.get("filename", "").encode('utf-8', errors='replace')
print("Filename (bytes):", fn_bytes[:60])
b64 = data.get("file_data_b64", "")
print("B64 len:", len(b64))
raw = base64.b64decode(b64)
print("Raw len:", len(raw))
sha = hashlib.sha256(raw).hexdigest()
print("Raw sha256:", sha)
