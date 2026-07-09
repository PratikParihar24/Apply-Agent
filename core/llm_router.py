import os
import requests
import time
from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from config.settings import GEMINI_API_KEY, OLLAMA_BASE_URL, GROQ_API_KEY, OPENROUTER_API_KEY
from utils.encryption import decrypt

_ollama_status_cache = {}

def check_ollama_cached(url: str, timeout: float = 2.0) -> bool:
    global _ollama_status_cache
    now = time.time()
    cache_entry = _ollama_status_cache.get(url)
    if cache_entry and (now - cache_entry["last_checked"] < 15.0):
        return cache_entry["available"]
        
    available = False
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code == 200:
            available = True
    except:
        pass
        
    _ollama_status_cache[url] = {"available": available, "last_checked": now}
    return available

def get_llm(user_settings: dict = None):
    """
    Returns a tuple: (llm_instance, provider_name: str)
    Fallback chain: Ollama -> Gemini -> Groq -> OpenRouter
    """
    settings = user_settings or {}
    
    preferred_llm = settings.get("preferred_llm", "auto")
    
    def try_ollama():
        base_url = settings.get("ollama_url") or OLLAMA_BASE_URL or "http://localhost:11434"
        if base_url and not base_url.startswith("http"):
            base_url = "http://" + base_url
            
        # Skip checking localhost Ollama when deployed to the cloud (Render) to prevent blocking timeouts
        if "RENDER" in os.environ and ("localhost" in base_url or "127.0.0.1" in base_url):
            return None
            
        if check_ollama_cached(base_url):
            return ChatOllama(model="llama3.2:1b", base_url=base_url)
        return None

    def try_gemini():
        # Use user's personal key if it exists, otherwise fallback to server key
        encrypted_key = settings.get("gemini_api_key")
        user_key = decrypt(encrypted_key) if encrypted_key else None
        api_key = user_key or GEMINI_API_KEY
        
        if not api_key: return None
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            google_api_key=api_key, 
            temperature=0.4, 
            max_output_tokens=2048,
            timeout=5
        )

    def try_groq():
        encrypted_key = settings.get("groq_api_key")
        user_key = decrypt(encrypted_key) if encrypted_key else None
        api_key = user_key or GROQ_API_KEY
        if not api_key: return None
        return ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=api_key,
            temperature=0.4,
            max_tokens=2048,
            timeout=5
        )

    def try_openrouter():
        encrypted_key = settings.get("openrouter_api_key")
        user_key = decrypt(encrypted_key) if encrypted_key else None
        api_key = user_key or OPENROUTER_API_KEY
        if not api_key: return None
        return ChatOpenAI(
            model="mistralai/mistral-7b-instruct:free",
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0.4,
            max_tokens=2048,
            timeout=5
        )

    # 2. Check user preference first
    if preferred_llm == "ollama":
        llm = try_ollama()
        if llm: return llm, "ollama"
    elif preferred_llm == "gemini":
        llm = try_gemini()
        if llm: return llm, "gemini"
    elif preferred_llm == "groq":
        llm = try_groq()
        if llm: return llm, "groq"
    elif preferred_llm == "openrouter":
        llm = try_openrouter()
        if llm: return llm, "openrouter"

    # 3. Automatic Fallback Chain (if preference failed or 'auto' is selected)
    llm = try_ollama()
    if llm: return llm, "ollama"
    
    llm = try_gemini()
    if llm: return llm, "gemini"
    
    llm = try_groq()
    if llm: return llm, "groq"
    
    llm = try_openrouter()
    if llm: return llm, "openrouter"

    # If everything fails, return None and let the caller handle it safely
    return None, "none"

def get_active_llm_info(user_settings: dict = None) -> dict:
    settings = user_settings or {}
    
    # Check Ollama
    ollama_url = settings.get("ollama_url") or OLLAMA_BASE_URL or "http://localhost:11434"
    if ollama_url and not ollama_url.startswith("http"):
        ollama_url = "http://" + ollama_url
    
    ollama_available = False
    ollama_models = []
    
    # Skip checking localhost Ollama when deployed to the cloud (Render) to prevent blocking timeouts
    if not ("RENDER" in os.environ and ("localhost" in ollama_url or "127.0.0.1" in ollama_url)):
        if check_ollama_cached(ollama_url):
            try:
                r = requests.get(f"{ollama_url}/api/tags", timeout=2)
                if r.status_code == 200:
                    ollama_available = True
                    data = r.json()
                    ollama_models = [m["name"] for m in data.get("models", [])]
            except:
                pass
        
    # Check Gemini
    gemini_key = decrypt(settings.get("gemini_api_key")) if settings.get("gemini_api_key") else None
    has_gemini = bool(gemini_key or GEMINI_API_KEY)
    
    # Check Groq
    groq_key = decrypt(settings.get("groq_api_key")) if settings.get("groq_api_key") else None
    has_groq = bool(groq_key or GROQ_API_KEY)
    
    # Check OpenRouter
    or_key = decrypt(settings.get("openrouter_api_key")) if settings.get("openrouter_api_key") else None
    has_or = bool(or_key or OPENROUTER_API_KEY)
    
    # Evaluate Active Provider
    llm, active_provider = get_llm(user_settings)
    
    active_model = "unknown"
    if active_provider == "ollama":
        active_model = getattr(llm, "model", "llama3.2:1b")
    elif active_provider == "gemini":
        active_model = "gemini-1.5-flash"
    elif active_provider == "groq":
        active_model = "llama-3.1-8b"
    elif active_provider == "openrouter":
        active_model = "mistral-7b"
        
    return {
        "active_provider": active_provider,
        "active_model": active_model,
        "providers": {
            "ollama": {
                "available": ollama_available,
                "models": ollama_models,
                "url": ollama_url
            },
            "gemini": {
                "available": has_gemini,
                "using_own_key": bool(gemini_key)
            },
            "groq": {
                "available": has_groq,
                "using_own_key": bool(groq_key)
            },
            "openrouter": {
                "available": has_or,
                "using_own_key": bool(or_key)
            }
        }
    }
