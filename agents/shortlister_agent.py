import os
import sys
import re
import time

# Ensure the parent directory is in sys.path so we can import from core and config when running as a script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.llm_router import get_llm

class ShortlisterAgent:
    def __init__(self):
        self.llm = get_llm()

    def shortlist(self, companies: list[dict], resume_summary: str, top_n: int, progress_callback=None) -> list[dict]:
        """
        Takes a list of company dicts (from SearchAgent) and scores them
        based on how well the job description matches the resume summary.
        Returns the top N companies.
        """
        print("Shortlisting companies...")
        
        scored_companies = []
        for idx, comp in enumerate(companies):
            job_title = comp.get("job_title", "")
            company_name = comp.get("company", "")
            description = comp.get("description", "")
            
            if progress_callback:
                progress_callback(idx + 1, len(companies), company_name)
            
            score = self._quick_score(comp, resume_summary)
                
            comp_copy = comp.copy()
            comp_copy["score"] = score
            scored_companies.append(comp_copy)
            
        # Sort descending by score
        scored_companies.sort(key=lambda x: x["score"], reverse=True)
        return scored_companies[:top_n]

    def _quick_score(self, company: dict, resume_summary: str) -> int:
        text = (company.get('description', '') + ' ' + company.get('job_title', '')).lower()
        keywords = resume_summary.lower().split()[:50]  # first 50 words
        matches = sum(1 for k in keywords if k in text and len(k) > 4)
        return min(10, max(4, matches))

    def shortlist_stream(self, companies: list[dict], resume_summary: str):
        """
        Yields each company dict immediately after it has been scored.
        """
        print("Shortlisting companies (streaming)...")
        for idx, comp in enumerate(companies):
            score = self._quick_score(comp, resume_summary)
            comp_copy = comp.copy()
            comp_copy["score"] = score
            yield comp_copy


if __name__ == '__main__':
    agent = ShortlisterAgent()
    dummy_companies = [
        {
            "company": "Tech Corp", 
            "job_title": "Machine Learning Engineer", 
            "description": "Looking for an expert in deep learning, neural networks, and Python scaling."
        },
        {
            "company": "Local Bakery", 
            "job_title": "Baker", 
            "description": "Need someone to bake bread and pastries daily. Early morning shifts."
        },
    ]
    resume = "Experienced AI developer with 5 years of Python, deep learning frameworks, and predictive modeling expertise."
    
    print("Shortlisting companies...")
    results = agent.shortlist(dummy_companies, resume, top_n=2)
    
    print("\n--- Shortlist Results ---")
    for r in results:
        print(f"Company: {r['company']} | Score: {r['score']} | Title: {r['job_title']}")
