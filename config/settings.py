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
