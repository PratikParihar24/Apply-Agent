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

    def _search_google(self, query: str, num: int = 10) -> list[dict]:
        from config.settings import GOOGLE_CSE_API_KEY, GOOGLE_CSE_ID
        if not GOOGLE_CSE_API_KEY or not GOOGLE_CSE_ID:
            print("Google CSE API key or ID not configured.")
            return []
        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": GOOGLE_CSE_API_KEY,
                "cx": GOOGLE_CSE_ID,
                "q": query,
                "num": num,
                "gl": "in",
                "hl": "en"
            }
            r = requests.get(url, params=params, timeout=5)
            if r.status_code == 200:
                items = r.json().get("items", [])
                return [
                    {
                        "title": item.get("title", ""),
                        "link": item.get("link", ""),
                        "snippet": item.get("snippet", "")
                    }
                    for item in items
                ]
            else:
                print(f"Warning: Google CSE returned status code {r.status_code}")
        except Exception as e:
            print(f"Warning: Google CSE failed: {e}")
        return []

    def _search_bing(self, query: str, num: int = 10) -> list[dict]:
        from config.settings import BING_SEARCH_API_KEY
        if not BING_SEARCH_API_KEY:
            print("Bing Search API key not configured.")
            return []
        try:
            url = "https://api.bing.microsoft.com/v7.0/search"
            headers = {
                "Ocp-Apim-Subscription-Key": BING_SEARCH_API_KEY
            }
            params = {
                "q": query,
                "count": num,
                "mkt": "en-IN"
            }
            r = requests.get(url, headers=headers, params=params, timeout=5)
            if r.status_code == 200:
                items = r.json().get("webPages", {}).get("value", [])
                return [
                    {
                        "title": item.get("name", ""),
                        "link": item.get("url", ""),
                        "snippet": item.get("snippet", "")
                    }
                    for item in items
                ]
            else:
                print(f"Warning: Bing Search returned status code {r.status_code}")
        except Exception as e:
            print(f"Warning: Bing Search failed: {e}")
        return []

    def _unified_search(self, query: str, num: int = 10, location: str = "") -> list[dict]:
        # Google CSE -> Bing -> DDGS
        results = self._search_google(query, num)
        if results:
            return results
            
        results = self._search_bing(query, num)
        if results:
            return results
            
        print("Falling back to DDGS...")
        ddgs_query = query
        if location:
            ddgs_query += f' site:in OR "{location}"'
        try:
            with DDGS() as ddgs:
                ddgs_res = list(ddgs.text(ddgs_query, max_results=num))
                return [
                    {
                        "title": r.get("title", ""),
                        "link": r.get("href", ""),
                        "snippet": r.get("body", "")
                    }
                    for r in ddgs_res
                ]
        except Exception as e:
            print(f"Warning: DDGS fallback failed: {e}")
        return []

    def search_stream(self, role: str, location: str, resume_summary_text: str, on_result_callback, company_type: str = "any", company_size: str = "any"):
        """
        Runs parallel queries targeting actual companies with Google CSE -> Bing -> DDGS fallback,
        surgical outreach queries, blocklist filtering, and score boosts.
        """
        from agents.shortlister_agent import ShortlisterAgent
        import concurrent.futures
        
        COLD_OUTREACH_QUERIES = [
            'site:careers.* "{role}" "{location}"',
            '"{role}" "{location}" (inurl:careers OR inurl:jobs) -site:linkedin.com -site:indeed.com -site:naukri.com -site:glassdoor.com',
            '"we are hiring" OR "join our team" "{role}" "{location}" -site:linkedin.com -site:indeed.com',
            '"{role}" "{location}" "hr@" OR "careers@" OR "talent@" -site:linkedin.com -site:indeed.com',
            '"{role}" site:wellfound.com OR site:instahyre.com "{location}"',
            '"{role}" "{company_type}" "{location}" careers -site:linkedin.com -site:naukri.com',
        ]

        company_type_str = "" if company_type.lower() == "any" else company_type
        queries = []
        for q_temp in COLD_OUTREACH_QUERIES:
            q = q_temp.format(role=role, location=location, company_type=company_type_str)
            q = re.sub(r'\s+', ' ', q).replace('""', '').strip()
            queries.append(q)

        BLOCKED_DOMAINS = {
            "linkedin.com", "indeed.com", "glassdoor.com", "naukri.com",
            "monster.com", "careerbuilder.com", "ziprecruiter.com",
            "shine.com", "foundit.in", "timesjobs.com", "freshersworld.com",
            "instahyre.com", "quora.com", "reddit.com", "medium.com",
            "dev.to", "hashnode.dev", "towardsdatascience.com",
            "substack.com", "wordpress.com", "blogger.com", "wikipedia.org"
        }

        def check_company_size_match(snippet_or_text: str, filter_size: str) -> bool:
            if not filter_size or filter_size == "any":
                return False
            text = snippet_or_text.lower()
            if filter_size == "startup":
                return "startup" in text or "1-50" in text or "early-stage" in text
            elif filter_size == "mid":
                return "mid-size" in text or "50-500" in text or "growth-stage" in text
            elif filter_size == "enterprise":
                return "enterprise" in text or "500+" in text or "fortune 500" in text
            return False
            
        seen_companies = set()
        shortlister = ShortlisterAgent()
        
        def _run_query(query: str):
            try:
                results = self._unified_search(query, num=10, location=location)
                for r in results:
                    url = r.get("link", "")
                    title = r.get("title", "")
                    body = r.get("snippet", "")
                    
                    if not url:
                        continue
                        
                    parsed_url = urlparse(url)
                    netloc = parsed_url.netloc.lower().replace("www.", "")
                    is_blocked = False
                    for bd in BLOCKED_DOMAINS:
                        if netloc == bd or netloc.endswith("." + bd):
                            is_blocked = True
                            break
                    if is_blocked:
                        continue

                    # Post-filter: Discard .com domains if snippet does not mention location/india/remote
                    # Exception: Keep if careers/jobs is in URL
                    if netloc.endswith(".com") or netloc.endswith(".com/"):
                        is_career_page = "/careers" in url.lower() or "/jobs" in url.lower()
                        if not is_career_page:
                            check_text = f"{title} {body} {location}".lower()
                            if not any(item in check_text for item in [location.lower(), "india", "remote"]):
                                continue
                        
                    job_title, company = self._parse_title(title)
                    
                    # Email extraction
                    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', body)
                    hr_email = email_match.group(0) if email_match else None
                    
                    comp_key = company.lower()
                    if comp_key not in seen_companies and comp_key != "unknown company" and len(comp_key) > 1:
                        seen_companies.add(comp_key)
                        
                        # Bonus scoring
                        bonus = 0
                        if "careers." in parsed_url.netloc.lower():
                            bonus += 3
                        if "/careers" in parsed_url.path.lower() or "/jobs" in parsed_url.path.lower():
                            bonus += 2
                        if hr_email:
                            bonus += 2
                        if check_company_size_match(body, company_size):
                            bonus += 1
                            
                        job_dict = {
                            "company": company,
                            "job_title": job_title,
                            "website": f"{parsed_url.scheme}://{parsed_url.netloc}",
                            "career_page": url if ("/careers" in url or "/jobs" in url) else "",
                            "unverified": False,
                            "description": body,
                            "company_description": "",
                            "hr_email": hr_email or "",
                            "apply_url": url,
                            "source": "cold_outreach",
                            "bonus_score": bonus,
                            "type": "cold_outreach"
                        }
                        
                        for scored_company in shortlister.shortlist_stream([job_dict], resume_summary_text):
                            on_result_callback(scored_company)
            except Exception as e:
                print(f"Exception for search query '{query}': {e}")

        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            futures = [executor.submit(_run_query, q) for q in queries]
            concurrent.futures.wait(futures)

if __name__ == '__main__':
    agent = SearchAgent()
    print("Searching for 'Machine Learning Engineer jobs in Bangalore'...")
    agent.search_stream("Machine Learning Engineer", "Bangalore", "resume details here", print)
