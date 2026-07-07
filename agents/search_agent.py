import os
import sys
import time
import random
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from ddgs import DDGS

# Ensure the parent directory is in sys.path so we can import from core and config when running as a script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config.settings import MAX_SEARCH_RESULTS

class SearchAgent:
    def __init__(self):
        self._company_cache = {}

    def _find_career_page(self, company_name: str) -> dict:
        """
        Finds the company website and career page using DDGS and scraping.
        Caches results in self._company_cache.
        """
        company_key = company_name.lower().strip()
        if company_key in self._company_cache:
            return self._company_cache[company_key]

        blocklist = [
            'linkedin.com', 'indeed.com', 'glassdoor.com', 'naukri.com', 'monster.com',
            'careerbuilder.com', 'ziprecruiter.com', 'simplyhired.com', 'dice.com',
            'wellfound.com', 'angel.co', 'shine.com', 'foundit.in', 'timesjobs.com',
            'freshersworld.com', 'instahyre.com', 'quora.com', 'reddit.com', 'medium.com'
        ]

        queries = [
            f'"{company_name}" official website',
            f'"{company_name}" careers page',
            f'"{company_name}" jobs apply'
        ]

        website = ""
        career_page = ""
        hr_email = ""

        # Step 1: Run DDGS queries sequentially to find main website
        for q in queries:
            try:
                with DDGS() as ddgs:
                    for r in ddgs.text(q, max_results=3):
                        href = r.get("href", "")
                        if href:
                            parsed_url = urlparse(href)
                            netloc = parsed_url.netloc.lower()
                            if not any(blocked in netloc for blocked in blocklist):
                                website = f"{parsed_url.scheme}://{parsed_url.netloc}"
                                break
                if website:
                    break
                time.sleep(1)
            except Exception as e:
                print(f"Warning: DDGS error for query '{q}': {e}")

        if not website:
            res = {"website": "", "career_page": "", "hr_email": ""}
            self._company_cache[company_key] = res
            return res

        career_page = website

        # Step 2: Scrape website homepage to find career link
        soup = None
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/115.0.0.0'
        }
        try:
            response = requests.get(website, timeout=5, headers=headers)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for careers link
                keywords = ["careers", "jobs", "join us", "work with us"]
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    text = link.get_text().strip().lower()
                    if any(kw in text for kw in keywords):
                        career_page = urljoin(website, href)
                        break
        except (requests.Timeout, requests.ConnectionError) as e:
            print(f"Warning: Network timeout/error scraping website homepage for {company_name}: {e}")
        except Exception as e:
            print(f"Warning: Unexpected error scraping website homepage for {company_name}: {e}")

        # Step 3: Fallback to path probing if no career link was found
        if career_page == website:
            common_paths = ['/careers', '/jobs', '/about/careers', '/join-us']
            for path in common_paths:
                test_url = urljoin(website, path)
                try:
                    r = requests.head(test_url, timeout=3, headers=headers)
                    if r.status_code == 200:
                        career_page = test_url
                        break
                except (requests.Timeout, requests.ConnectionError):
                    pass
                except Exception:
                    pass

        # Step 4: Extract emails
        emails_found = []
        company_domain = urlparse(website).netloc.replace('www.', '').lower() if website else ""

        # Prioritize mailto hrefs first
        if soup:
            for link in soup.find_all('a', href=True):
                href = link['href']
                if href.startswith('mailto:'):
                    email = href.replace('mailto:', '').split('?')[0].strip()
                    if email and re.match(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', email):
                        emails_found.append(email)

        # Fallback to regex
        if soup:
            text_to_search = soup.get_text()
            regex_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text_to_search)
            for email in regex_emails:
                if email not in emails_found:
                    emails_found.append(email)

        # Sort and select best email
        if emails_found:
            prioritized = []
            keywords = ['hr', 'career', 'recruit', 'talent', 'jobs']
            for email in emails_found:
                email_lower = email.lower()
                has_keyword = any(kw in email_lower for kw in keywords)
                has_domain = company_domain and (company_domain in email_lower)
                
                score = 0
                if has_domain:
                    score += 10
                if has_keyword:
                    score += 5
                
                prioritized.append((score, email))
            prioritized.sort(key=lambda x: x[0], reverse=True)
            hr_email = prioritized[0][1]

        res = {
            "website": website,
            "career_page": career_page,
            "hr_email": hr_email
        }
        self._company_cache[company_key] = res
        return res

    def _scrape_company_description(self, url: str) -> str:
        """
        Scrapes company description/mission from About page or meta tags.
        """
        if not url:
            return ""

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/115.0.0.0'
        }

        # Try to GET About page
        target_url = url
        if "about" not in url.lower():
            target_url = urljoin(url, "/about")

        try:
            response = requests.get(target_url, timeout=5, headers=headers)
            # If /about returns 404, fallback to main url
            if response.status_code != 200 and target_url != url:
                response = requests.get(url, timeout=5, headers=headers)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Check meta tag description
                desc_tag = soup.find('meta', attrs={'name': 'description'}) or \
                           soup.find('meta', attrs={'property': 'og:description'}) or \
                           soup.find('meta', attrs={'name': 'Description'})
                if desc_tag and desc_tag.get('content'):
                    desc_content = desc_tag.get('content').strip()
                    if len(desc_content) > 10:
                        return desc_content[:300]
                
                # Try finding a paragraph with >50 characters
                for p in soup.find_all('p'):
                    p_text = p.get_text().strip()
                    if len(p_text) > 50:
                        return p_text[:300]
        except (requests.Timeout, requests.ConnectionError) as e:
            print(f"Warning: Network timeout/error fetching description from {url}: {e}")
        except Exception as e:
            print(f"Warning: Error fetching description from {url}: {e}")

        return ""

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
                            
                            job_boards = ['naukri.com', 'glassdoor.com', 'indeed.com', 'linkedin.com', 'internshala.com', 'wellfound.com', 'monster.com', 'ziprecruiter.com', 'careerbuilder.com']
                            
                            comp_key = company.lower()
                            if comp_key not in seen_companies and comp_key != "unknown company":
                                seen_companies.add(comp_key)
                                
                                # Find website and career page using helper
                                res_find = self._find_career_page(company)
                                website_val = res_find.get("career_page") or res_find.get("website") or ""
                                hr_email_val = res_find.get("hr_email") or hr_email
                                
                                job_dict = {
                                    "company": company,
                                    "job_title": job_title,
                                    "website": website_val,
                                    "career_page": res_find.get("career_page", ""),
                                    "unverified": not bool(website_val),
                                    "description": body,
                                    "company_description": "",  # Exclude from stream loop for performance
                                    "hr_email": hr_email_val,
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
