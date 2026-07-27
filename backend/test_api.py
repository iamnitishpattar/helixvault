import requests

url = "http://localhost:8000"

# Register a test user
test_email = "test1234@helixvault.app"
test_password = "password123"

# Mock login using the old method is gone, so let's hit login
session = requests.Session()
data = {"username": test_email, "password": test_password}
# We need to register first, but we might not have the OTP logic bypassed
# Let's bypass OTP logic temporarily in the DB or see if the demo user works
