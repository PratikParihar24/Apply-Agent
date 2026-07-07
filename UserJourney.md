# Agent Apply - User & Data Journey Handbook

This document explains exactly how the Agent Apply project works from end to end. It breaks down the system in both simple English and technical details, tracing the path of the user's data from start to finish.

## High-Level Overview
**Agent Apply** is an autonomous pipeline that helps a user find relevant job postings, evaluates how well the user fits those jobs, and then automatically writes a highly tailored resume, cover letter, and email for each job. 

It does this by passing data through a chain of specialized "Agents" (small, focused AI modules).

---

## 1. The Setup Phase (Resume Processing)

### English Journey
The user opens the dashboard and uploads their Resume (PDF). The system reads the PDF, cleans up the text, and breaks it down into small, meaningful pieces (like individual projects or jobs). It then converts these pieces into a mathematical format so the AI can "search" them later based on meaning, rather than just exact keywords.

### Technical Data Flow
1. **Trigger**: User hits "Process Resume & Search" in `dashboard/app.py`.
2. **Execution**: `ResumeProcessor.process()` is called.
3. **Extraction**: The PDF is parsed using `PyPDF2`. If it fails, it falls back to `pdfplumber`, and then finally `pymupdf (fitz)` to guarantee text extraction.
4. **Chunking & Detection**: The text is cleaned and split into sections based on dynamic header detection (filtering out false positives like dates). The sections are chunked into 300-word pieces with 50-word overlaps to maintain context.
5. **Embedding**: `core/embedder.py` uses `sentence-transformers` to convert these text chunks into dense vector embeddings.
6. **Storage**: The vectors and metadata (section names) are saved locally into a **ChromaDB** vector database. 
7. **Output**: A short summary of the entire resume is returned and saved to `st.session_state`.

---

## 2. The Search Phase (Finding Jobs)

### English Journey
While the resume is being processed, the system goes out to the internet to find open job postings. The user provides a target role (e.g., "Software Engineer") and a location (e.g., "Remote"). The system searches search engines, grabs the job postings, cleans up the company names, and removes duplicates.

### Technical Data Flow
1. **Execution**: `SearchAgent.search()` is called with `target_role` and `location`.
2. **Scraping**: It uses the `duckduckgo-search` (`ddgs`) library to run a query like: `"Software Engineer jobs in Remote"`.
3. **Parsing**: For each search result, it parses the title by splitting on characters like `-`, `|`, or `at` to extract the `company_name` and the `job_title`.
4. **Deduplication**: It stores the results in a list, ensuring that each company only appears once (case-insensitive deduplication). It includes a random `time.sleep()` between requests to avoid rate limits.
5. **Output**: A clean list of dictionaries containing `company`, `job_title`, `url`, and `description`.

---

## 3. The Shortlisting Phase (Evaluating Fit)

### English Journey
Now the system has a summary of the user's resume and a big list of jobs. It gives both to an AI judge. The judge reads the user's resume and the job description, and assigns a score from 1 to 10 on how well they match. It then sorts the jobs so the best matches are at the top.

### Technical Data Flow
1. **Execution**: `ShortlisterAgent.shortlist()` is called.
2. **LLM Routing**: `core/llm_router.py` initializes the LLM. It intelligently checks if the local Ollama model (`llama3.2:1b`) is running. If not, it falls back to the cloud model (`Gemini 2.0 Flash`).
3. **Prompting**: For every single company in the list, the agent constructs a prompt containing the Job Description and the Resume Summary, asking the LLM to return a single integer from 1 to 10.
4. **Parsing**: The response is parsed using a Regular Expression (`re.search(r'\b([1-9]|10)\b', content)`) to safely extract the number, even if the LLM hallucinated extra text.
5. **Sorting**: The list of companies is sorted descending by the `score` key.
6. **Output**: The top N best-matching companies are returned and displayed in the UI for the user to "Approve" or "Skip".

---

## 4. The Generation Phase (Tailoring & Writing)

### English Journey
Once the user approves a few jobs, the system writes the applications. First, it searches the user's resume database for the most relevant experiences for *that specific job* and reorganizes them. Then, it writes a custom cover letter and email that highlights exactly why the user is a perfect fit.

### Technical Data Flow
1. **Trigger**: User clicks "Generate Materials" in the UI.
2. **TailorAgent Execution**: `TailorAgent.tailor()` is called.
   - It runs a semantic search (`resume_processor.query()`) against ChromaDB using the Job Description as the query.
   - It retrieves the top 5 most relevant resume chunks and categorizes them (Summary -> Experience -> Skills -> Projects).
   - If `rewrite=True`, it asks the LLM to rewrite the bullet points to better match the JD keywords.
   - It returns a plain string of the highly tailored resume.
3. **WriterAgent Execution**: `WriterAgent.write()` is called.
   - It constructs a massive prompt containing the tailored resume, job description, and strict rules to output a JSON object with `cover_letter`, `email_subject`, and `email_body`.
   - **JSON Fallback**: Because small local models (like 1B parameters) struggle with JSON formatting, the output is passed through a robust slicer (`response[response.index('{'):response.rindex('}')+1]`). 
   - If parsing completely fails, it catches the error and returns a safe, pre-written fallback template.
4. **Output**: The generated materials are saved to `st.session_state` and rendered in editable text boxes in View 3.

---

## 5. The Sending Phase (Action)

### English Journey
The user reviews the generated materials, makes any manual edits if needed, and clicks "Send". The system dispatches the emails with the tailored resume attached.

### Technical Data Flow
1. **Execution**: `SendingAgent.send()` is called.
2. **Logic**: Currently implemented as a stub. In the future, this will connect to an SMTP server (like Gmail or SendGrid) to construct an email payload, attach the `data/resume.pdf`, and send it to the company's contact email.
