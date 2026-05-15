import os
from dotenv import load_dotenv

load_dotenv()

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "jobboard-dev-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# SMTP
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@jobboard.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.mailtrap.io")
MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
