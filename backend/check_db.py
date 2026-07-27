import sqlite3

conn = sqlite3.connect('e:/new_project_main/backend/helixvault.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

try:
    cursor.execute("SELECT * FROM api_keys LIMIT 1;")
    print("api_keys table exists!")
except Exception as e:
    print("Error querying api_keys:", e)
