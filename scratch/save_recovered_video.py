import requests
import base64

res = requests.get('http://localhost:8000/api/dna/status/a61ba45d-db64-4999-9fc5-d256589fd70f')
data = res.json()
print("Task a61b status:", data.get("status"))
print("Filename:", data.get("filename"))
b64 = data.get("file_data_b64", "")
print("B64 len:", len(b64))

raw = base64.b64decode(b64)
print("Decoded bytes length:", len(raw))
print("Header:", raw[:32])

# Write to test_recovered_video.mp4
with open('E:/new_project_main/scratch/test_recovered_video.mp4', 'wb') as f:
    f.write(raw)
print("Saved to scratch/test_recovered_video.mp4 successfully!")

