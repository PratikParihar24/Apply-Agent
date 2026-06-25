import os
import sys
import time
import random
import re
from ddgs import DDGS

# Ensure the parent directory is in sys.path so we can import from core and config when running as a script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config.settings import MAX_SEARCH_RESULTS

class SearchAgent:
    def __init__(self):
        pass

    def _parse_title(self, title: str) -> tuple[str, str]:
        """
        Parses title into job_title and company.
        Splits on ' at ', '|', '-', '–'.
        The job_title is the first chunk, and company is the last meaningful chunk.
        """
        delimiters = r'(?i)\s+at\s+|\||-|–'
        chunks = re.split(delimiters, title)
        chunks = [c.strip() for c in chunks if c.strip()]
        
        if not chunks:
            return "Unknown Title", "Unknown Company"
        if len(chunks) == 1:
            return chunks[0], "Unknown Company"
            
        job_title = chunks[0]
        company = chunks[-1]
        
        return job_title, company

    def search(self, role: str, location: str) -> list[dict]:
        """
        Queries DDGS using 4 parallel queries.
        Returns a list of deduplicated job dictionaries.
        """
        queries = [
            f'{role} internship {location} site:linkedin.com/jobs',
            f'{role} hiring {location} site:instahyre.com OR site:naukri.com OR site:wellfound.com',
            f'"{role}" job opening {location} -site:glassdoor.com -site:indeed.com',
            f'{role} we are hiring {location} 2025 2026',
        ]
        
        results = []
        seen_companies = set()
        
        import concurrent.futures
        
        def _run_query(query: str):
            query_results = []
            attempts = 0
            max_attempts = 2
            while attempts < max_attempts:
                try:
                    with DDGS() as ddgs:
                        for r in ddgs.text(query, max_results=5):
                            query_results.append(r)
                            time.sleep(random.uniform(0.5, 1.5))
                    break
                except Exception as e:
                    print(f"DDGS Search Exception for '{query}': {e}")
                    attempts += 1
                    if attempts < max_attempts:
                        time.sleep(2)
            return query_results

        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_query = {executor.submit(_run_query, q): q for q in queries}
            for future in concurrent.futures.as_completed(future_to_query):
                for r in future.result():
                    url = r.get("href", "")
                    title = r.get("title", "")
                    
                    # Extract company name more accurately
                    if "linkedin.com/company/" in url:
                        # e.g. https://www.linkedin.com/company/some-company/jobs/
                        slug_match = re.search(r"linkedin\.com/company/([^/]+)", url)
                        if slug_match:
                            company = slug_match.group(1).replace("-", " ").title()
                            job_title, _ = self._parse_title(title)
                        else:
                            job_title, company = self._parse_title(title)
                    else:
                        job_title, company = self._parse_title(title)
                        
                    comp_key = company.lower()
                    if comp_key not in seen_companies:
                        seen_companies.add(comp_key)
                        results.append({
                            "company": company,
                            "job_title": job_title,
                            "url": url,
                            "description": r.get("body", ""),
                            "source": "duckduckgo"
                        })
                        
        return results

    def search_stream(self, role: str, location: str, resume_summary_text: str, on_result_callback):
        """
        Runs 6 parallel queries targeting actual companies.
        As each query yields results, it scores them instantly and calls on_result_callback.
        """
        from agents.shortlister_agent import ShortlisterAgent
        import concurrent.futures
        
        queries = [
            f'{role} internship {location} company hiring 2025 -site:naukri.com -site:glassdoor.com -site:indeed.com',
            f'"{role}" opening {location} "apply" OR "careers" OR "we are hiring" -job board',
            f'startups {location} hiring {role} 2025 site:wellfound.com OR site:linkedin.com/company',
            f'{role} {location} "send your resume" OR "email your cv" OR "careers@" OR "hr@"',
            f'"{location}" tech companies hiring "{role}" internship filetype:html',
            f'{role} fresher internship {location} "contact us" OR "apply now" site:*.in OR site:*.com',
        ]
        
        seen_companies = set()
        shortlister = ShortlisterAgent()
        
        def _run_query(query: str):
            attempts = 0
            max_attempts = 2
            while attempts < max_attempts:
                try:
                    with DDGS() as ddgs:
                        for r in ddgs.text(query, max_results=5):
                            url = r.get("href", "")
                            title = r.get("title", "")
                            body = r.get("body", "")
                            
                            job_title, company = self._parse_title(title)
                            
                            # Email extraction
                            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', body)
                            hr_email = email_match.group(0) if email_match else None
                            
                            # Website extraction
                            job_boards = ['naukri.com', 'glassdoor.com', 'indeed.com', 'linkedin.com', 'internshala.com', 'wellfound.com']
                            is_job_board = any(jb in url.lower() for jb in job_boards)
                            website = None if is_job_board else url
                                
                            comp_key = company.lower()
                            if comp_key not in seen_companies:
                                seen_companies.add(comp_key)
                                job_dict = {
                                    "company": company,
                                    "job_title": job_title,
                                    "website": website,
                                    "description": body,
                                    "hr_email": hr_email,
                                    "apply_url": url,
                                    "source": query
                                }
                                
                                # Score instantly
                                for scored_company in shortlister.shortlist_stream([job_dict], resume_summary_text):
                                    on_result_callback(scored_company)
                                    
                            time.sleep(random.uniform(0.5, 1.5))
                    break
                except Exception as e:
                    print(f"DDGS Search Exception for '{query}': {e}")
                    attempts += 1
                    if attempts < max_attempts:
                        time.sleep(2)

        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            futures = [executor.submit(_run_query, q) for q in queries]
            concurrent.futures.wait(futures)

if __name__ == '__main__':
    agent = SearchAgent()
    print("Searching for 'Machine Learning Engineer jobs in Bangalore India'...")
    jobs = agent.search("Machine Learning Engineer", "Bangalore India")
    
    print(f"\n--- Found {len(jobs)} unique companies ---")
    for idx, job in enumerate(jobs):
        print(f"{idx+1}. {job['company']} - {job['job_title']}")
        print(f"   URL: {job['url']}")
        print(f"   Desc: {job['description'][:100]}...\n")
