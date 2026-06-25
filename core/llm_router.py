import os
import requests
from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import GEMINI_API_KEY, OLLAMA_BASE_URL

def get_llm(prefer='ollama'):
    """
    Returns a LangChain-compatible LLM based on preference.
    Safely checks if local model is available; if not, falls back to Cloud.
    """
    base_url = OLLAMA_BASE_URL or "http://localhost:11434"
    
    if prefer == 'ollama':
        try:
            # Check if Ollama is running and has the model
            response = requests.get(f"{base_url}/api/tags", timeout=2)
            if response.status_code == 200:
                models = [m['name'] for m in response.json().get('models', [])]
                if any(m.startswith("phi3:mini") for m in models):
                    print("Using Local Model (phi3:mini).")
                    return ChatOllama(model="phi3:mini", base_url=base_url)
                else:
                    print("Local model 'phi3:mini' not found in Ollama. Falling back to Cloud.")
            else:
                print("Ollama server returned an error. Falling back to Cloud.")
        except requests.exceptions.RequestException:
            print("Ollama server is not running or unreachable. Falling back to Cloud.")
            
        # Fallback to Gemini if Ollama fails
        if GEMINI_API_KEY:
            return ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GEMINI_API_KEY)

    # If preference is Gemini
    if prefer == 'gemini' and GEMINI_API_KEY:
        print("Using Cloud Model (Gemini).")
        return ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GEMINI_API_KEY)
            
    # Absolute fallback to Ollama (even if it might error on invoke, it's the last resort)
    return ChatOllama(model="phi3:mini", base_url=base_url)
