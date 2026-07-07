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

    def write(self, company: dict, resume_summary: str, tailored_resume: str, company_description: str = "") -> dict:
        """
        Generates application materials (Cover Letter, Email Body, Subject) using an LLM.
        Returns a dict containing the parsed response.
        """
        job_title = company.get("job_title", "Unknown Role")
        company_name = company.get("company", "Unknown Company")
        job_desc = company.get("description", "")
        
        # Cap tailored_resume to 3000 chars and job_description to 600 chars
        tailored_resume_capped = (tailored_resume or "")[:3000]
        job_desc_capped = (job_desc or "")[:600]
        company_description_val = (company_description or company.get("company_description", ""))[:300]
        
        prompt = (
            f"You are a professional job application writer. Return ONLY a valid JSON object with keys: cover_letter, email_subject, email_body. No markdown, no explanation.\n\n"
            f"RULES:\n"
            f"- Use ONLY skills and experiences present in RESUME CONTEXT. Never invent roles or achievements.\n"
            f"- Cover letter: exactly 3 paragraphs, max 200 words. Structure: (1) why this company specifically, (2) one concrete achievement from the resume that matches the role, (3) call to action.\n"
            f"- Mention the company description naturally in paragraph 1 if provided.\n"
            f"- Address at least two specific requirements from the job description.\n"
            f"- Email subject: under 12 words, include the role name.\n"
            f"- Email body: 4 sentences max. One sentence must reference a specific achievement from the resume.\n"
            f"- Tone: direct, human, no buzzwords (do not use: leverage, passionate, synergy, dynamic, results-driven).\n\n"
            f"EXAMPLE OUTPUT (for reference only, do not copy):\n"
            f"{{\"cover_letter\": \"Dear Hiring Team at Acme,\\n\\nYour focus on [X from company description] is exactly the kind of problem I've spent the last 3 years solving. At [Previous Company] I built a [specific thing from resume] that [concrete measurable outcome]. I'd bring that same approach to [specific requirement from JD].\\n\\nI also noticed you need [second JD requirement] — my experience with [relevant resume skill] maps directly to this.\\n\\nI'd love to set up a 20-minute call to discuss. I'm available [flexible timing].\\n\\nBest,\\n[Name]\", \"email_subject\": \"Application for [Role] – [Name]\", \"email_body\": \"Hi, I'm applying for the [Role] position. At [company] I [specific achievement]. I've attached my resume and cover letter. Happy to connect at your convenience.\"}}\n\n"
            f"RESUME CONTEXT:\n"
            f"{tailored_resume_capped}\n\n"
            f"COMPANY: {company_name}\n"
            f"ROLE: {job_title}\n"
            f"COMPANY DESCRIPTION: {company_description_val}\n"
            f"JOB DESCRIPTION: {job_desc_capped}"
        )
        
        raw_response = ""
        try:
            response = self.llm.invoke(prompt)
            raw_response = response.content.strip()
            
            # strip markdown fences with regex
            cleaned = re.sub(r'^```[a-zA-Z]*\n', '', raw_response)
            cleaned = re.sub(r'\n```$', '', cleaned)
            cleaned = cleaned.strip()
            
            # extract JSON block
            match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if match:
                cleaned = match.group(0)
                
            data = json.loads(cleaned)
            
            # map keys and validate
            if "email_subject" in data:
                data["subject"] = data["email_subject"]
            elif "subject" in data:
                data["email_subject"] = data["subject"]
                
            for key in ['cover_letter', 'email_body', 'subject', 'email_subject']:
                if key not in data:
                    data[key] = ""
                    
            return data
            
        except Exception as e:
            print(f"Failed to generate or parse JSON: {e}")
            fallback_subject = f"Application for {job_title} at {company_name}"
            fallback_cl = (
                f"Dear Hiring Team,\n\n"
                f"I am writing to express my strong interest in the {job_title} position at {company_name}. "
                f"My background in software engineering aligns well with the requirements of this role. "
                f"I have attached my resume for your review and look forward to discussing my qualifications in detail.\n\n"
                f"Sincerely,\nApplicant"
            )
            return {
                "cover_letter": raw_response if raw_response else fallback_cl,
                "email_body": f"Please find my resume attached for the {job_title} position at {company_name}. I look forward to hearing from you.",
                "subject": fallback_subject,
                "email_subject": fallback_subject
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
