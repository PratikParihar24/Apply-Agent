import os
import sys
import json
import re

# Ensure the parent directory is in sys.path so we can import from core and config when running as a script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.llm_router import get_llm

class WriterAgent:
    def __init__(self, user_settings: dict = None):
        self.llm, self.provider = get_llm(user_settings)


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
            f"You are a sharp, no-nonsense job application ghostwriter. "
            f"Return ONLY a valid JSON object with keys: cover_letter, email_subject, email_body. "
            f"No markdown fences, no explanation, no preamble.\n\n"

            f"COVER LETTER RULES:\n"
            f"- 3 short paragraphs. Total 150–220 words. No fluff.\n"
            f"- Paragraph 1: Open with something specific about the COMPANY — a product, mission, or recent news from the company description. Show you did your homework. Transition into why this role caught your eye.\n"
            f"- Paragraph 2: Pick ONE concrete achievement from the RESUME that directly maps to a requirement in the JOB DESCRIPTION. Use numbers if the resume has them. Then briefly connect a second JD requirement to another resume skill.\n"
            f"- Paragraph 3: A confident but not arrogant call to action. Suggest a brief call. Sign off with the applicant's real name (extract it from the resume context — look for the first line or a name-like string).\n"
            f"- Format: Use '\\n\\n' between paragraphs. Start with 'Dear [Company] Team,' or 'Dear Hiring Team at [Company],'. End with 'Best,\\n[Name]'.\n"
            f"- NEVER invent roles, companies, metrics, or skills not in the resume.\n"
            f"- NEVER use these words: leverage, passionate, synergy, dynamic, results-driven, cutting-edge, innovative, thrilled, excited, eager, utilize, spearhead, rockstar, ninja, guru, go-getter.\n"
            f"- Write like a real human — short sentences, active voice, no corporate jargon.\n\n"

            f"EMAIL SUBJECT RULES:\n"
            f"- Under 10 words. Include the role name. No emojis.\n"
            f"- Pattern: 'Application: [Role] — [Name]' or '[Name] — [Role] Application'\n\n"

            f"EMAIL BODY RULES:\n"
            f"- 3 sentences max. This is the cold-open above the cover letter in the email.\n"
            f"- Sentence 1: State you are applying for [Role].\n"
            f"- Sentence 2: One specific achievement from the resume.\n"
            f"- Sentence 3: 'My resume is attached. Happy to connect at your convenience.'\n"
            f"- Do NOT mention a cover letter attachment — the cover letter IS the email body.\n\n"

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

            data["llm_provider"] = self.provider
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
                "cover_letter": raw_response if 'raw_response' in locals() and raw_response else fallback_cl,
                "email_body": f"Please find my resume attached for the {job_title} position at {company_name}. I look forward to hearing from you.",
                "subject": fallback_subject,
                "email_subject": fallback_subject,
                "llm_provider": getattr(self, 'provider', 'none')
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
