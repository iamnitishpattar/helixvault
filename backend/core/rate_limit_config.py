import os
from dotenv import load_dotenv

load_dotenv()

class RateLimitSettings:
    RATE_LIMIT_PUBLIC = os.getenv("RATE_LIMIT_PUBLIC", "100/minute")
    RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "500/minute")
    AUTH_BACKOFF_BASE_DELAY = int(os.getenv("AUTH_BACKOFF_BASE_DELAY", "2"))
    AUTH_BACKOFF_MAX_ATTEMPTS = int(os.getenv("AUTH_BACKOFF_MAX_ATTEMPTS", "3"))
    AUTH_BACKOFF_RESET_WINDOW = int(os.getenv("AUTH_BACKOFF_RESET_WINDOW", "3600"))

rate_limit_settings = RateLimitSettings()
