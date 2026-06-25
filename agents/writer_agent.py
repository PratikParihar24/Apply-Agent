import os
import sys
import json
import re

# Ensure the parent directory is in sys.path so we can import from core and config when running as a script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.llm_router import get_llm

class WriterAgent:
    def __init__(self):
        self.llm = get_llm()

    def write(self, company: dict, resume_summary: str, tailored_resume: str) -> dict:
        """
        Generates application materials (Cover Letter, Email Body, Subject) using an LLM.
        Returns a dict containing the parsed response.
        """
        job_title = company.get("job_title", "Unknown Role")
        company_name = company.get("company", "Unknown Company")
        job_desc = company.get("description", "")
        
        prompt = (
            f"Respond with ONLY a JSON object, no explanation, no markdown, no extra text. "
            f"The JSON must have exactly three keys: cover_letter, email_body, subject.\n\n"
            f"You are an expert career coach writing job application materials.\n"
            f"Write a cover letter, an email body, and an email subject for the following job.\n\n"
            f"Company: {company_name}\n"
            f"Job Title: {job_title}\n"
            f"Job Description Snippet: {job_desc}\n\n"
            f"Resume Summary: {resume_summary}\n\n"
            f"Tailored Resume Chunks: {tailored_resume}\n\n"
            f"Requirements:\n"
            f"1. The cover_letter must be 200-250 words, professional, specific to the company and role, ending with a call-to-action.\n"
            f"2. The email_body must be 100-150 words and mention the attached resume and cover letter.\n"
            f"3. The subject must be a single line.\n\n"
            f"Output STRICTLY as a JSON object with exactly these keys: \"cover_letter\", \"email_body\", \"subject\".\n"
            f"Do not include any formatting or other text, just the raw JSON."
        )
        
        raw_response = ""
        try:
            response = self.llm.invoke(prompt)
            raw_response = response.content.strip()
            
            # Safely slice everything before the first '{' and after the last '}'
            cleaned = raw_response[raw_response.index('{'):raw_response.rindex('}')+1]
            
            data = json.loads(cleaned)
            
            # Validate keys
            for key in ['cover_letter', 'email_body', 'subject']:
                if key not in data:
                    data[key] = ""
                    
            return data
            
        except Exception as e:
            print(f"Failed to generate or parse JSON: {e}")
            return {
                "cover_letter": raw_response,
                "email_body": f"Please find my resume attached for the {job_title} position at {company_name}. I look forward to hearing from you.",
                "subject": f"Application for {job_title} at {company_name}"
            }

if __name__ == '__main__':
    agent = WriterAgent()
    dummy_company = {
        "company": "Tech Innovations",
        "job_title": "AI Engineer",
        "description": "Looking for an expert in building autonomous agents and LLM applications.",
        "url": "http://example.com"
    }
    resume_sum = "AI Engineer with experience building Python backends and LLM tools."
    tailored = "EXPERIENCE\nBuilt LLM-powered agents.\nSKILLS\nPython, LLM, RAG"
    
    print("Writing application materials...")
    result = agent.write(dummy_company, resume_sum, tailored)
    
    print(f"\n--- Subject ---\n{result.get('subject')}")
    print(f"\n--- Email Body ---\n{result.get('email_body')}")
    print(f"\n--- Cover Letter ---\n{result.get('cover_letter')}")
