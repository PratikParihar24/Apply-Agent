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


    def write(self, company: dict, resume_summary: str, tailored_resume: str, company_description: str = "", custom_instructions: str = None, candidate_name: str = None, writing_style: str = "casual") -> dict:
        """
        Generates application materials (Cover Letter, Email Body, Subject) using an LLM.
        Returns a dict containing the parsed response.
        """
        job_title = company.get("job_title", "Unknown Role")
        company_name = company.get("company", "Unknown Company")
        job_desc = company.get("description", "")
        
        # Cap tailored_resume to 3000 chars, job_description to 800 chars, company_description to 300 chars
        tailored_resume_capped = (tailored_resume or "")[:3000]
        job_desc_capped = (job_desc or "")[:800]
        company_description_val = (company_description or company.get("company_description", ""))[:300]

        STYLE_INSTRUCTIONS = {
            "casual": """
Tone: Write like a smart, confident human — not a robot. Use contractions (I've, I'm, you'll).
Vary sentence length. One short punchy sentence per paragraph minimum.
Avoid: leverage, synergy, passionate, results-driven, detail-oriented, dynamic.
Sound like you're talking to a person, not submitting a form.
""",
            "formal": """
Tone: Professional and structured. Full sentences, no contractions.
Show respect for the company's work. Reference specific aspects of their mission.
Avoid overly casual language but do not be stiff — confident and respectful.
""",
            "assertive": """
Tone: Bold and direct. Lead every paragraph with an achievement, not an intention.
Use active voice exclusively. Numbers and metrics whenever available in the resume.
Do not apologise for gaps or hedge. State what you bring, not what you hope to do.
"""
        }
        style_instructions = STYLE_INSTRUCTIONS.get(writing_style.lower(), STYLE_INSTRUCTIONS["casual"])

        prompt = (
            f"You are a job application writer. Return ONLY a valid JSON object — no markdown, no preamble.\n\n"
            f"STYLE INSTRUCTIONS:\n"
            f"{style_instructions}\n\n"
            f"RULES:\n"
            f"- Use ONLY skills and experiences present in RESUME CONTEXT. Never invent roles, titles, metrics, or companies.\n"
            f"- Cover letter: exactly 3 paragraphs, max 200 words total.\n"
            f"  Para 1: Why this specific company (use COMPANY DESCRIPTION if provided).\n"
            f"  Para 2: One concrete achievement from the resume that directly matches a JD requirement.\n"
            f"  Para 3: Call to action — specific, not generic (\"I'd love to connect\" is banned).\n"
            f"- Address at least 2 specific requirements from the job description.\n"
            f"- Email subject: under 12 words, include role name, make it specific not generic.\n"
            f"- Email body: 4 sentences max. Sentence 1: role + where you found it. Sentence 2: one achievement. Sentence 3: why this company. Sentence 4: next step.\n"
            f"- If COMPANY DESCRIPTION is provided, reference something specific from it in Para 1. Do not make up company info if description is empty.\n"
            f"- Apply the STYLE INSTRUCTIONS strictly — they override default tone.\n"
            f"- Banned phrases (never use): \"I am passionate about\", \"leverage\", \"synergy\", \"I would love the opportunity\", \"please find attached\", \"to whom it may concern\", \"I am writing to express\".\n\n"
            f"FEW-SHOT EXAMPLE (for reference only — do not copy this content):\n"
            f"{{\n"
            f"  \"cover_letter\": \"Dear Team at Finstack,\\n\\nYour focus on making financial infrastructure accessible to Indian SMEs is exactly the problem space I've spent the last two years working in. At my last role, I built a payment reconciliation service in Node.js that processed 50,000 transactions daily with zero downtime — the kind of reliability-at-scale challenge your engineering blog describes tackling.\\n\\nI also noticed you need someone comfortable with both system design and rapid prototyping. I've shipped 4 production features solo in the last 6 months, from schema design to deployment.\\n\\nI'd like to set up a 20-minute call this week or next — Tuesday and Thursday afternoons work well for me.\\n\\nBest,\\nAlex\",\n"
            f"  \"email_subject\": \"Full Stack Application — Alex Kumar, 3 yrs Node.js + React\",\n"
            f"  \"email_body\": \"Hi, I'm applying for the Full Stack Developer role I found on Wellfound. At Finstack's scale, reliability matters — I built a transaction service handling 50K daily requests with 99.9% uptime. Your focus on SME financial access resonates with work I've done in the same space. I'd welcome a quick call — happy to work around your schedule.\"\n"
            f"}}\n\n"
            f"RESUME CONTEXT:\n"
            f"{tailored_resume_capped}\n\n"
            f"COMPANY: {company_name}\n"
            f"ROLE: {job_title}\n"
            f"COMPANY DESCRIPTION: {company_description_val}\n"
            f"JOB DESCRIPTION: {job_desc_capped}\n\n"
            f"Return ONLY this JSON structure:\n"
            f"{{\n"
            f"  \"cover_letter\": \"...\",\n"
            f"  \"email_subject\": \"...\",\n"
            f"  \"email_body\": \"...\"\n"
            f"}}"
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
