import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class SendingAgent:
    def __init__(self):
        pass

    def send(self, company: dict, resume_path: str, cover_letter: str, email_body: str, subject: str) -> bool:
        """
        Stub for SendingAgent. Returns True on success.
        """
        print(f"Mock sending email to {company.get('company', 'Unknown')} with subject: {subject}")
        return True
