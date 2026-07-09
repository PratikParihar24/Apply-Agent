import os
import sys

# Ensure the parent directory is in sys.path so we can import from core and config when running as a script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.llm_router import get_llm

class TailorAgent:
    def __init__(self, user_settings:dict = None):
        self.llm, self.provider = get_llm(user_settings)

    def tailor(self, company: dict, resume_processor, rewrite: bool = False) -> str:
        """
        Retrieves relevant resume chunks for a given job and organizes them.
        If rewrite=True, it rephrases the bullet points to match the JD keywords.
        """
        job_desc = company.get("description", "")
        
        # Get top chunks using multi-query strategy
        chunks = resume_processor.query_multi(job_desc, top_k=5)
        
        # Deduplicate chunks
        unique_chunks = []
        seen_texts = set()
        for c in chunks:
            if c['text'] not in seen_texts:
                seen_texts.add(c['text'])
                unique_chunks.append(c)
        chunks = unique_chunks
        
        # Categorize chunks
        categories = {
            "summary": [],
            "experience": [],
            "skills": [],
            "projects": [],
            "other": []
        }
        
        for c in chunks:
            sec = c.get("section", "").lower()
            if "summary" in sec or "objective" in sec or "profile" in sec:
                categories["summary"].append(c)
            elif "experience" in sec or "work" in sec or "employment" in sec:
                categories["experience"].append(c)
            elif "skill" in sec or "techn" in sec:
                categories["skills"].append(c)
            elif "project" in sec:
                categories["projects"].append(c)
            else:
                categories["other"].append(c)
                
        # Optional rewriting
        if rewrite:
            for cat, items in categories.items():
                for item in items:
                    prompt = (
                        f"You are a resume bullet-point editor. Slightly rephrase the snippet below so it highlights skills relevant to the Job Description.\n\n"
                        f"RULES:\n"
                        f"- Output ONLY the rewritten snippet. Nothing else.\n"
                        f"- Keep it approximately the same length as the original (±10 words).\n"
                        f"- Preserve the original format — if it starts with a dash or bullet, keep it.\n"
                        f"- Do NOT write a letter, greeting, or sign-off.\n"
                        f"- Do NOT add conversational filler like 'Sure!' or 'Here you go'.\n"
                        f"- Stay truthful — rephrase, don't fabricate.\n\n"
                        f"Job Description: {job_desc}\n\n"
                        f"Resume Snippet: {item['text']}"
                    )
                    try:
                        response = self.llm.invoke(prompt)
                        item['text'] = response.content.strip()
                    except Exception as e:
                        print(f"Failed to rewrite snippet: {e}")
        
        # Assemble in order
        order = ["summary", "experience", "skills", "projects", "other"]
        final_lines = []
        for cat in order:
            if categories[cat]:
                for item in categories[cat]:
                    header = item['section'].upper()
                    text = item['text']
                    final_lines.append(f"{header}\n{text}\n")
                    
        return "\n".join(final_lines)

if __name__ == '__main__':
    from agents.resume_processor import ResumeProcessor
    
    rp = ResumeProcessor()
    if not rp.is_ready():
        print("Vector DB is empty. Run resume_processor.py first.")
    else:
        agent = TailorAgent()
        dummy_company = {
            "company": "Test Co",
            "job_title": "Python Developer",
            "description": "Looking for strong Python, backend skills, and REST APIs.",
            "url": "http://example.com"
        }
        
        print("Tailoring resume... (Rewrite=False)")
        result = agent.tailor(dummy_company, rp, rewrite=False)
        print("\n--- Tailored Resume ---")
        print(result)
