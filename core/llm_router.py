import os
import requests
from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import GEMINI_API_KEY, OLLAMA_BASE_URL

def get_llm(prefer=None):
    """
    Returns a LangChain-compatible LLM with priority on Gemini:
    1. gemini-2.0-flash-exp (temp=0.4, max_output_tokens=2048)
    2. gemini-1.5-flash (temp=0.4, max_output_tokens=2048)
    3. Ollama mistral (last resort)
    """
    if GEMINI_API_KEY:
        try:
            print("Using Cloud Model (gemini-2.0-flash-exp).")
            return ChatGoogleGenerativeAI(
                model="gemini-2.0-flash-exp",
                google_api_key=GEMINI_API_KEY,
                temperature=0.4,
                max_output_tokens=2048
            )
        except Exception as e:
            print(f"Failed to load gemini-2.0-flash-exp: {e}. Falling back to gemini-1.5-flash.")
            
        try:
            print("Using Cloud Model (gemini-1.5-flash).")
            return ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=GEMINI_API_KEY,
                temperature=0.4,
                max_output_tokens=2048
            )
        except Exception as e:
            print(f"Failed to load gemini-1.5-flash: {e}. Falling back to local Ollama.")

    # Fallback to local Ollama mistral
    base_url = OLLAMA_BASE_URL or "http://localhost:11434"
    print("Using Local Model (mistral).")
    return ChatOllama(model="mistral", base_url=base_url)

def get_active_llm_info() -> dict:
    """
    Returns information about the currently active LLM.
    """
    base_url = OLLAMA_BASE_URL or "http://localhost:11434"
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=2)
        if response.status_code == 200:
            models = [m['name'] for m in response.json().get('models', [])]
            if models:
                model_name = next((m for m in models if m.startswith("phi3:mini")), models[0])
                return {"provider": "ollama", "model": model_name, "type": "local"}
    except requests.exceptions.RequestException:
        pass
    
    return {"provider": "gemini", "model": "gemini-2.0-flash", "type": "cloud"}
