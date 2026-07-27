import requests

# We need a valid JWT token cookie to make the request to /keys.
# Let's log in to get the cookie.
test_email = "test1234@helixvault.app"
test_password = "password123"
session = requests.Session()

# 1. Register
res = session.post("http://localhost:8000/api/auth/register", json={"email": test_email, "password": test_password})
print("Register:", res.status_code, res.text)

# We bypass OTP logic manually in the DB for the test user to make them active.
import sqlite3
conn = sqlite3.connect('e:/new_project_main/backend/db/helixvault.db')
conn.execute("UPDATE users SET is_active=1 WHERE email=?", (test_email,))
conn.commit()
conn.close()

# 2. Login
res = session.post("http://localhost:8000/api/auth/login", data={"username": test_email, "password": test_password})
print("Login:", res.status_code, res.text)

# 3. Generate key
res = session.post("http://localhost:8000/api/developer/keys?name=Test+Key")
print("Generate:", res.status_code, res.text)
