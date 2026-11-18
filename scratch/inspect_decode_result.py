import requests

res = requests.get('http://localhost:8000/api/dna/status/a61ba45d-db64-4999-9fc5-d256589fd70f')
data = res.json()
print("Status:", data.get("status"))
print("Filename:", repr(data.get("filename")))
b64 = data.get("file_data_b64", "")
print("B64 len:", len(b64))
import base64
raw = base64.b64decode(b64)
print("Raw len:", len(raw))
print("Raw starts with:", raw[:40])

