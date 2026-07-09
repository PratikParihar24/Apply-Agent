import os
import sys
import time
import random
import re
import urllib.parse
import requests
from bs4 import BeautifulSoup
import feedparser
import concurrent.futures

# Ensure the parent directory is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.shortlister_agent import ShortlisterAgent

class JobListingAgent:
    def __init__(self):
        self.seen_links = set()
        self.shortlister = ShortlisterAgent()

    def _slugify(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'[^a-z0-9\s-]', '', text)
        text = re.sub(r'[\s-]+', '-', text)
        return text

    def _parse_html_summary(self, html_content: str) -> str:
        if not html_content:
            return ""
        soup = BeautifulSoup(html_content, "html.parser")
        text = soup.get_text(separator=" ")
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:500]

    def _extract_company_from_title(self, title: str) -> tuple[str, str]:
        if " at " in title:
            parts = title.split(" at ")
            return parts[0].strip(), parts[1].strip()
        elif " - " in title:
            parts = title.split(" - ")
            if len(parts) >= 2:
                return parts[0].strip(), parts[1].strip()
        return title, ""

    def _get_expanded_locations(self, location: str) -> list[str]:
        loc_lower = location.lower()
        locations = [location]
        near_map = {
            "ahmedabad": ["gujarat", "mumbai", "india"],
            "gandhinagar": ["ahmedabad", "gujarat", "india"],
            "noida": ["delhi ncr", "delhi", "gurgaon", "india"],
            "gurgaon": ["delhi ncr", "delhi", "noida", "india"],
            "gurugram": ["delhi ncr", "delhi", "noida", "india"],
            "ghaziabad": ["delhi ncr", "delhi", "india"],
            "pune": ["mumbai", "maharashtra", "india"],
            "navi mumbai": ["mumbai", "india"],
            "secunderabad": ["hyderabad", "india"],
        }
        for key, fallbacks in near_map.items():
            if key in loc_lower:
                for f in fallbacks:
                    if f.lower() not in [l.lower() for l in locations]:
                        locations.append(f)
                break
        else:
            if "india" not in loc_lower and "remote" not in loc_lower:
                locations.append("india")
        return locations

    def search_rss(self, role: str, location: str, resume_summary_text: str, on_result_callback) -> None:
        role_encoded = urllib.parse.quote(role)
        loc_encoded = urllib.parse.quote(location)
        role_slug = self._slugify(role)
        loc_slug = self._slugify(location)

        is_india_city = any(c in location.lower() for c in ["mumbai", "bangalore", "bengaluru", "delhi", "hyderabad", "pune", "chennai", "kolkata", "noida", "gurgaon", "gurugram", "india"])

        # Indeed India subdomain fallback, LinkedIn geoID append, Wellfound country append
        indeed_url = f"https://in.indeed.com/rss?q={role_encoded}&l={loc_encoded}&sort=date" if is_india_city else f"https://www.indeed.com/rss?q={role_encoded}&l={loc_encoded}&sort=date"
        linkedin_url = f"https://www.linkedin.com/jobs/search/?keywords={role_encoded}&location={loc_encoded}&f_TPR=r86400&format=rss"
        if is_india_city:
            linkedin_url += "&geoId=102713980"

        wellfound_url = f"https://wellfound.com/jobs/rss?role={role_encoded}&location={loc_encoded}"
        if is_india_city:
            wellfound_url += "&country=india"

        feeds = {
            "indeed_rss": indeed_url,
            "linkedin_rss": linkedin_url,
            "wellfound_rss": wellfound_url,
            # Naukri India RSS
            "naukri_rss": f"https://www.naukri.com/rss/{role_slug}-jobs-in-{loc_slug}.rss"
        }

        def fetch_feed(source_name, feed_url):
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/115.0.0.0'
                }
                response = requests.get(feed_url, headers=headers, timeout=8)
                if response.status_code == 200:
                    feed = feedparser.parse(response.content)
                    return source_name, feed.entries
            except Exception as e:
                print(f"Warning: RSS feed fetch failed for {source_name}: {e}")
            return source_name, []

        with concurrent.futures.ThreadPoolExecutor(max_workers=len(feeds)) as executor:
            future_to_feed = {executor.submit(fetch_feed, name, url): name for name, url in feeds.items()}
            for future in concurrent.futures.as_completed(future_to_feed):
                source, entries = future.result()
                for entry in entries:
                    link = entry.get("link", "")
                    if not link or link in self.seen_links:
                        continue

                    # Post-filter on location
                    raw_title = entry.get("title", "")
                    job_title, parsed_company = self._extract_company_from_title(raw_title)
                    company = entry.get("author") or entry.get("company") or parsed_company or "Unknown Company"
                    
                    raw_summary = entry.get("summary") or entry.get("description") or ""
                    summary = self._parse_html_summary(raw_summary)

                    published = entry.get("published", "")

                    result = {
                        "source": source,
                        "type": "job_listing",
                        "job_title": job_title,
                        "company": company,
                        "location": location,
                        "apply_url": link,
                        "description": summary,
                        "hr_email": "",
                        "website": "",
                        "published": published
                    }

                    # Filter: check if location string, "india", or "remote" is in title, summary or location
                    check_text = f"{raw_title} {summary} {location}".lower()
                    if not any(item in check_text for item in [location.lower(), "india", "remote"]):
                        continue

                    self.seen_links.add(link)
                    result["score"] = self.shortlister._quick_score(result, resume_summary_text)
                    on_result_callback(result)

    def search_scrape(self, role: str, location: str, resume_summary_text: str, on_result_callback) -> None:
        role_slug = self._slugify(role)
        loc_slug = self._slugify(location)

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/115.0.0.0'
        }

        # 1. Naukri Scrape
        try:
            naukri_url = f"https://www.naukri.com/{role_slug}-jobs-in-{loc_slug}"
            response = requests.get(naukri_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                job_elements = soup.find_all("article", class_=lambda x: x and "jobTuple" in x) or \
                               soup.find_all("div", class_=lambda x: x and "job-container" in x)
                for job in job_elements[:10]:
                    title_elem = job.find(class_=lambda x: x and ("title" in x or "job-title" in x))
                    company_elem = job.find(class_=lambda x: x and ("company" in x or "org" in x))
                    desc_elem = job.find(class_=lambda x: x and ("desc" in x or "job-description" in x))
                    
                    job_title = title_elem.get_text().strip() if title_elem else role
                    company = company_elem.get_text().strip() if company_elem else "Unknown Company"
                    description = desc_elem.get_text().strip() if desc_elem else ""
                    
                    apply_elem = job.find("a", href=True)
                    apply_url = apply_elem["href"] if apply_elem else naukri_url
                    if not apply_url.startswith("http"):
                        apply_url = urllib.parse.urljoin("https://www.naukri.com", apply_url)

                    if apply_url in self.seen_links:
                        continue
                    
                    result = {
                        "source": "naukri_scrape",
                        "type": "job_listing",
                        "job_title": job_title,
                        "company": company,
                        "location": location,
                        "apply_url": apply_url,
                        "description": description[:500],
                        "hr_email": "",
                        "website": "",
                        "published": ""
                    }
                    self.seen_links.add(apply_url)
                    result["score"] = self.shortlister._quick_score(result, resume_summary_text)
                    on_result_callback(result)
                    time.sleep(0.5)
        except Exception as e:
            print(f"Warning: Naukri scrape failed: {e}")

        # 2. Shine Scraper
        try:
            shine_url = f"https://www.shine.com/job-search/{role_slug}-jobs-in-{loc_slug}/"
            response = requests.get(shine_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                job_elements = soup.find_all("div", class_=lambda x: x and ("jobCard" in x or "parentClass" in x))
                for job in job_elements[:10]:
                    title_elem = job.find("h2") or job.find(class_=lambda x: x and "job_title" in x)
                    company_elem = job.find(class_=lambda x: x and ("company" in x or "org" in x))
                    
                    job_title = title_elem.get_text().strip() if title_elem else role
                    company = company_elem.get_text().strip() if company_elem else "Unknown Company"
                    
                    apply_elem = job.find("a", href=True)
                    apply_url = apply_elem["href"] if apply_elem else shine_url
                    if not apply_url.startswith("http"):
                        apply_url = urllib.parse.urljoin("https://www.shine.com", apply_url)
                        
                    if apply_url in self.seen_links:
                        continue
                    
                    result = {
                        "source": "shine_scrape",
                        "type": "job_listing",
                        "job_title": job_title,
                        "company": company,
                        "location": location,
                        "apply_url": apply_url,
                        "description": f"Job opening for {job_title} at {company} on Shine.",
                        "hr_email": "",
                        "website": "",
                        "published": ""
                    }
                    self.seen_links.add(apply_url)
                    result["score"] = self.shortlister._quick_score(result, resume_summary_text)
                    on_result_callback(result)
                    time.sleep(0.5)
        except Exception as e:
            print(f"Warning: Shine scrape failed: {e}")

        # 3. Foundit Scraper
        try:
            foundit_url = f"https://www.foundit.in/srp/results?query={urllib.parse.quote(role)}&location={urllib.parse.quote(location)}"
            response = requests.get(foundit_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                job_elements = soup.find_all("div", class_=lambda x: x and ("card" in x or "job-apply" in x))
                for job in job_elements[:10]:
                    title_elem = job.find(class_=lambda x: x and "title" in x)
                    company_elem = job.find(class_=lambda x: x and "company" in x)
                    
                    job_title = title_elem.get_text().strip() if title_elem else role
                    company = company_elem.get_text().strip() if company_elem else "Unknown Company"
                    
                    apply_elem = job.find("a", href=True)
                    apply_url = apply_elem["href"] if apply_elem else foundit_url
                    if not apply_url.startswith("http"):
                        apply_url = urllib.parse.urljoin("https://www.foundit.in", apply_url)
                        
                    if apply_url in self.seen_links:
                        continue
                    
                    result = {
                        "source": "foundit_scrape",
                        "type": "job_listing",
                        "job_title": job_title,
                        "company": company,
                        "location": location,
                        "apply_url": apply_url,
                        "description": f"Job opening for {job_title} at {company} on Foundit.",
                        "hr_email": "",
                        "website": "",
                        "published": ""
                    }
                    self.seen_links.add(apply_url)
                    result["score"] = self.shortlister._quick_score(result, resume_summary_text)
                    on_result_callback(result)
                    time.sleep(0.5)
        except Exception as e:
            print(f"Warning: Foundit scrape failed: {e}")

        # 4. Internshala Scraper
        try:
            internshala_url = f"https://internshala.com/jobs/{role_slug}-jobs-in-{loc_slug}/"
            response = requests.get(internshala_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                job_elements = soup.find_all("div", class_=lambda x: x and ("container-fluid" in x or "individual_internship" in x))
                for job in job_elements[:10]:
                    title_elem = job.find("h3", class_=lambda x: x and "job-internship-title" in x)
                    company_elem = job.find("a", class_=lambda x: x and "company-name" in x)
                    
                    job_title = title_elem.get_text().strip() if title_elem else role
                    company = company_elem.get_text().strip() if company_elem else "Unknown Company"
                    
                    apply_elem = job.find("a", href=True)
                    apply_url = apply_elem["href"] if apply_elem else internshala_url
                    if not apply_url.startswith("http"):
                        apply_url = urllib.parse.urljoin("https://internshala.com", apply_url)
                        
                    if apply_url in self.seen_links:
                        continue
                    
                    result = {
                        "source": "internshala_scrape",
                        "type": "job_listing",
                        "job_title": job_title,
                        "company": company,
                        "location": location,
                        "apply_url": apply_url,
                        "description": f"Job opening for {job_title} at {company} on Internshala.",
                        "hr_email": "",
                        "website": "",
                        "published": ""
                    }
                    self.seen_links.add(apply_url)
                    result["score"] = self.shortlister._quick_score(result, resume_summary_text)
                    on_result_callback(result)
                    time.sleep(0.5)
        except Exception as e:
            print(f"Warning: Internshala scrape failed: {e}")

    def search_stream(self, role: str, location: str, resume_summary_text: str, on_result_callback) -> None:
        """Unified method that runs RSS then scrape, buffers, prioritizes Indian sources, and streams."""
        results_buffer = []

        def local_callback(res):
            results_buffer.append(res)

        locations_to_try = self._get_expanded_locations(location)
        for loc in locations_to_try:
            results_buffer.clear()
            self.search_rss(role, loc, resume_summary_text, local_callback)
            self.search_scrape(role, loc, resume_summary_text, local_callback)
            if len(results_buffer) >= 3:
                break

        indian_sources = ["naukri_rss", "naukri_scrape", "shine_rss", "shine_scrape", "foundit_scrape", "internshala_scrape"]
        def get_priority(item):
            src = item.get("source", "")
            if any(isrc in src for isrc in indian_sources):
                return 0
            return 1

        results_buffer.sort(key=get_priority)
        for r in results_buffer:
            on_result_callback(r)
