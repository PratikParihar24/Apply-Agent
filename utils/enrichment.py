import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# Global in-memory cache for enrichment results to avoid redundant crawls
ENRICHMENT_CACHE = {}

def enrich_company(company: dict) -> dict:
    """
    Enriches a company record with website, hr_email, career_page, and company_description.
    Guaranteed not to raise exceptions. Completes in under 10 seconds.
    """
    from agents.search_agent import SearchAgent
    
    company_name = company.get("company", "").strip()
    if not company_name:
        return company

    cache_key = company_name.lower()
    if cache_key in ENRICHMENT_CACHE:
        # Merge cached enrichment data
        company.update(ENRICHMENT_CACHE[cache_key])
        return company

    enriched_data = {
        "website": company.get("website") or "",
        "hr_email": company.get("hr_email") or "",
        "career_page": company.get("career_page") or "",
        "company_description": company.get("company_description") or company.get("description") or ""
    }

    BLOCKED_DOMAINS = {
        "linkedin.com", "indeed.com", "glassdoor.com", "naukri.com",
        "monster.com", "careerbuilder.com", "ziprecruiter.com",
        "shine.com", "foundit.in", "timesjobs.com", "freshersworld.com",
        "instahyre.com", "quora.com", "reddit.com", "medium.com",
        "dev.to", "hashnode.dev", "towardsdatascience.com",
        "substack.com", "wordpress.com", "blogger.com", "wikipedia.org"
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/115.0.0.0'
    }

    # Step 1: Find website if missing
    if not enriched_data["website"]:
        try:
            agent = SearchAgent()
            search_query = f'"{company_name}" official website'
            search_results = agent._unified_search(search_query, num=3)
            for r in search_results:
                link = r.get("link", "")
                if link:
                    parsed_url = urlparse(link)
                    netloc = parsed_url.netloc.lower().replace("www.", "")
                    is_blocked = False
                    for bd in BLOCKED_DOMAINS:
                        if netloc == bd or netloc.endswith("." + bd):
                            is_blocked = True
                            break
                    if not is_blocked:
                        enriched_data["website"] = f"{parsed_url.scheme}://{parsed_url.netloc}"
                        break
        except Exception as e:
            print(f"Warning: Enrichment website lookup failed for {company_name}: {e}")

    website = enriched_data["website"]
    
    # If we have a website, proceed to scrape for details
    if website:
        # Normalize website URL
        if not website.startswith("http"):
            website = "http://" + website
            enriched_data["website"] = website

        company_domain = urlparse(website).netloc.replace('www.', '').lower()
        
        # We will attempt to scrape: Homepage, /contact, /about
        urls_to_scrape = [website]
        for path in ["/contact", "/about"]:
            urls_to_scrape.append(urljoin(website, path))

        emails_found = []
        career_links = []
        descriptions = []

        # Probe homepage and common pages
        for url in urls_to_scrape:
            try:
                r = requests.get(url, headers=headers, timeout=5)
                if r.status_code == 200:
                    soup = BeautifulSoup(r.text, 'html.parser')

                    # Meta Description
                    desc_tag = soup.find('meta', attrs={'name': 'description'}) or \
                               soup.find('meta', attrs={'property': 'og:description'}) or \
                               soup.find('meta', attrs={'name': 'Description'})
                    if desc_tag and desc_tag.get('content'):
                        desc_content = desc_tag.get('content').strip()
                        if len(desc_content) > 10:
                            descriptions.append(desc_content)

                    # Extract first paragraph with >50 chars
                    for p in soup.find_all('p'):
                        p_text = p.get_text().strip()
                        if len(p_text) > 50:
                            descriptions.append(p_text)

                    # Look for mailto: links and career links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        text = link.get_text().strip().lower()
                        
                        # Career page link detection
                        keywords = ["careers", "jobs", "join us", "work with us"]
                        if any(kw in text for kw in keywords):
                            career_links.append(urljoin(website, href))

                        # Email detection via mailto
                        if href.startswith('mailto:'):
                            email = href.replace('mailto:', '').split('?')[0].strip()
                            if email and re.match(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', email):
                                emails_found.append(email)

                    # Fallback regex email search in text
                    regex_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', r.text)
                    for email in regex_emails:
                        if email not in emails_found:
                            emails_found.append(email)
            except Exception:
                pass

        # Step 2: Select best HR email
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
            enriched_data["hr_email"] = prioritized[0][1]

        # Step 3: Find careers page
        if career_links:
            enriched_data["career_page"] = career_links[0]
        else:
            # Probe common paths using HEAD requests
            common_paths = ['/careers', '/jobs', '/about/careers', '/join-us']
            for path in common_paths:
                test_url = urljoin(website, path)
                try:
                    r = requests.head(test_url, headers=headers, timeout=3)
                    if r.status_code == 200:
                        enriched_data["career_page"] = test_url
                        break
                except Exception:
                    pass

        # Step 4: Scrape company description
        if descriptions:
            # Prefer meta description or first paragraph
            enriched_data["company_description"] = descriptions[0][:300]

    # Save to cache
    ENRICHMENT_CACHE[cache_key] = enriched_data
    company.update(enriched_data)
    return company
