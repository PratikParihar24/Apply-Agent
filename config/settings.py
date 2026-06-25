import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")

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


