import os
from cryptography.fernet import Fernet
from config.settings import SECRET_KEY

# Ensure we have a valid key, otherwise create a fallback for development to avoid crashes
_fernet = None
if SECRET_KEY:
    try:
        _fernet = Fernet(SECRET_KEY.encode())
    except Exception as e:
        print(f"WARNING: Invalid SECRET_KEY provided: {e}")

def encrypt(value: str) -> str:
    if not value or not _fernet:
        return None
    try:
        return _fernet.encrypt(value.encode()).decode()
    except Exception:
        return None

def decrypt(value: str) -> str:
    if not value or not _fernet:
        return None
    try:
        return _fernet.decrypt(value.encode()).decode()
    except Exception:
        return None
