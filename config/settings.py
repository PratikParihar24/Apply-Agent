import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")

# Search API Configuration
GOOGLE_CSE_API_KEY = os.getenv("GOOGLE_CSE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")
BING_SEARCH_API_KEY = os.getenv("BING_SEARCH_API_KEY")

# Resend Email Configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_ADDRESS = os.getenv("RESEND_FROM_ADDRESS")
RESEND_WEBHOOK_SECRET = os.getenv("RESEND_WEBHOOK_SECRET")

# Encryption Key
SECRET_KEY = os.getenv("SECRET_KEY")

# Hardcoded defaults
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
CHROMA_DB_PATH = './data/resume_db'
CHUNK_SIZE = 300
CHUNK_OVERLAP = 50
MAX_SEARCH_RESULTS = 50
EMAIL_DELAY_SECONDS = 30

# MongoDB Configuration
# Add these to your .env file:
# MONGODB_URI=mongodb://localhost:27017
# MONGODB_DB=agentapply
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DB = os.getenv('MONGODB_DB', 'agentapply')

# JWT Authentication
# Add this to your .env file:
# JWT_SECRET=your-secret-key-here
JWT_SECRET = os.getenv('JWT_SECRET', 'changethisinproduction')
JWT_EXPIRE_HOURS = 24


