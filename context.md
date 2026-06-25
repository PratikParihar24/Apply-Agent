# Job Application Automation System - Project Context

This document serves as the single source of truth for the current state of the Job Application Automation System. It must be updated whenever any changes, additions, or removals are made to the codebase.

## 📂 Directory Structure Overview

The project is structured under the `Agent-apply/` folder.

```
Agent-apply/
├── .env
├── .gitignore
├── context.md                    <-- You are here
├── requirements.txt
├── start.bat
├── api/
│   └── main.py
├── config/
│   └── settings.py
├── data/
│   ├── .gitkeep
│   └── resume.pdf            (Example input, generated dynamically)
├── agents/
│   ├── __init__.py
│   └── resume_processor.py
├── core/
│   ├── __init__.py
│   ├── llm_router.py
│   └── embedder.py
├── orchestrator/
│   └── __init__.py
├── dashboard/
│   └── __init__.py
├── front-end/
│   └── ...
└── utils/
    └── __init__.py
```

## 📄 File Details and Context

### 1. `config/settings.py`
**Purpose**: Centralized configuration management.
**Variables**:
- **Environment Variables**: Loaded via `python-dotenv`.
  - `GEMINI_API_KEY`: API key for Google Gemini model.
  - `GMAIL_ADDRESS`: Email address for the automation system to use.
  - `GMAIL_APP_PASSWORD`: App password for the Gmail account.
  - `OLLAMA_BASE_URL`: Base URL for local Ollama instances.
- **Hardcoded Defaults**:
  - `EMBEDDING_MODEL` = `'all-MiniLM-L6-v2'`
  - `CHROMA_DB_PATH` = `'./data/resume_db'`
  - `CHUNK_SIZE` = `300`
  - `CHUNK_OVERLAP` = `50`
  - `MAX_SEARCH_RESULTS` = `50`
  - `EMAIL_DELAY_SECONDS` = `30`

### 2. `core/llm_router.py`
**Purpose**: Provides a unified, swappable interface to Language Models using LangChain.
**Functions**:
- `get_llm(prefer='gemini')`: Returns a LangChain-compatible chat model. 
  - Attempts to initialize `ChatGoogleGenerativeAI` using `gemini-1.5-flash`.
  - If the Gemini API key is missing or initialization fails, falls back to `ChatOllama` running the `mistral` model locally.
- `get_active_llm_info() -> dict`: Detects and returns information about the currently active LLM (provider, model name, and type: local vs cloud).

### 2a. `api/main.py`
**Purpose**: Exposes the backend capabilities as REST and SSE streaming endpoints.
**Endpoints**:
- `POST /api/resume/upload`: Parses resume and returns sections/summary.
- `POST /api/hunt/start`: Generates a `job_id`, initializes a background thread for parallel searching/scoring, and returns immediately.
- `GET /api/hunt/stream/{job_id}`: SSE endpoint that streams companies directly to the frontend as soon as they are found and scored.
- `POST /api/generate/{company_id}`: Generates tailored resume, cover letter, and email body.
- `POST /api/send/{company_id}`: Sends the final application via email.
- `GET /api/llm/status`: Returns current LLM status for the frontend UI.

### 3. `core/embedder.py`
**Purpose**: Handles vector embeddings for text chunks using `sentence-transformers`.
**Classes & Functions**:
- `class Embedder`: Initializes the `SentenceTransformer` with the configured model.
  - `embed_text(text: str) -> list[float]`: Embeds a single string.
  - `embed_batch(texts: list[str]) -> list[list[float]]`: Embeds multiple strings for bulk insertion.
- **Global Helper Functions**:
  - `embed_text(text: str)`: Wraps the default `Embedder` instance.
  - `embed_batch(texts: list[str])`: Wraps the default `Embedder` instance.

### 4. `agents/resume_processor.py`
**Purpose**: Parses resumes (PDF), cleans text, chunks into semantic pieces, embeds them, and stores them in ChromaDB for semantic retrieval.
**Classes**:
- `class ResumeProcessor`:
  - **Methods**:
    - `__init__(self)`: Ensures `data/` path exists, connects to ChromaDB at `CHROMA_DB_PATH`, gets/creates `resume_chunks` collection.
    - `_extract_text(self, pdf_path: str) -> str`: Extracts text primarily using `PyPDF2`, with a fallback to `pdfplumber`.
    - `_clean_text_preserve_newlines(self, text: str) -> str`: Cleans text while preserving structure for header detection.
    - `_clean_chunk(self, text: str) -> str`: Strips all extra whitespace for final storage.
    - `_detect_sections(self, text: str) -> dict[str, str]`: Heuristically identifies resume headers (like "EXPERIENCE") and maps them to their respective content.
    - `_chunk_text(self, text: str) -> list[str]`: Splits sections into `~300` word chunks with `50` word overlaps.
    - `_generate_summary(self, sections: dict) -> str`: Creates a 500-word max summary of the resume taking the first 200 words of each section.
    - `process(self, pdf_path: str) -> dict`: Orchestrates the entire pipeline for a given PDF. Returns `{chunks_count, summary, sections_found}`.
    - `query(self, job_description: str, top_k: int = 5) -> list[dict]`: Embeds the provided Job Description and queries the ChromaDB vector database. Returns a list of chunks sorted by similarity.
    - `is_ready(self) -> bool`: Checks if the vector DB has loaded documents.

### 5. `agents/search_agent.py`
**Purpose**: Uses DuckDuckGo search (DDGS) to find job postings online based on role and location.
**Classes**:
- `class SearchAgent`:
  - **Methods**:
    - `search(self, role: str, location: str) -> list[dict]`: Executes 4 specialized queries in parallel using `ThreadPoolExecutor`. Extracts company names directly from LinkedIn URLs or falls back to title parsing, then deduplicates.
    - `search_stream(self, role, location, resume_summary_text, on_result_callback)`: Calls `search()`, iterates through results, scores them using the ShortlisterAgent instantly, and triggers the callback to stream them out via `api/main.py`.

### 6. `agents/shortlister_agent.py`
**Purpose**: Evaluates and scores the fit between the parsed resume summary and the scraped job descriptions.
**Classes**:
- `class ShortlisterAgent`:
  - **Methods**:
    - `shortlist(self, companies: list[dict], resume_summary: str, top_n: int) -> list[dict]`: Uses the LLM Router to prompt for a 1-10 match score between the candidate and the job description. Returns the top `n` companies sorted by score.

### 7. `agents/tailor_agent.py`
**Purpose**: Retrieves relevant resume chunks using `resume_processor` and dynamically organizes them to fit a specific job description. Can optionally use an LLM to rewrite bullet points.
**Classes**:
- `class TailorAgent`:
  - **Methods**:
    - `tailor(self, company: dict, resume_processor, rewrite: bool = False) -> str`: Sorts chunks into summary, experience, skills, projects, and other. Rephrases bullet points if `rewrite=True`.

### 8. `agents/writer_agent.py`
**Purpose**: Uses the LLM Router to author the final job application materials (Cover Letter, Email Body, Email Subject).
**Classes**:
- `class WriterAgent`:
  - **Methods**:
    - `write(self, company: dict, resume_summary: str, tailored_resume: str) -> dict`: Prompts the LLM for a strict JSON response. Safely strips markdown fences and returns a dictionary with the final text content.

### 9. Utilities and Placeholder Modules
**Purpose**: Set up for the next stages of development.
- `orchestrator/__init__.py`: Will contain workflow logic combining agents (e.g., LangGraph workflow).
- `dashboard/__init__.py`: Will contain the Streamlit UI code.
- `utils/__init__.py`: Will contain generic helpers (e.g., email sending, PDF generation).
- `agents/__init__.py`: Makes agents importable.

### 10. Supporting Files
- `requirements.txt`: Defines all pip dependencies (`chromadb`, `langchain`, `streamlit`, `sentence-transformers`, etc.).
- `.gitignore`: Ensures `__pycache__`, `.env`, and `data/*` (except `.gitkeep`) are ignored by Git.

## 🔄 Current Application Flow (Resume Parsing & Streaming Hunt)
1. **User/System** invokes `ResumeProcessor.process('data/resume.pdf')`.
2. Text is extracted via `PyPDF2` (fallback to `pdfplumber`).
3. The parser breaks the text into sections and chunks them into `ChromaDB`.
4. A summary is generated for shortlisting.
5. **Hunt Initiation**: The user posts to `/api/hunt/start`. The API returns a `job_id` and kicks off a background thread.
6. The frontend immediately transitions to the dashboard and connects to `GET /api/hunt/stream/{job_id}`.
7. The backend runs 4 parallel search queries, then scores each job one by one using the LLM, pushing them into a queue.
8. The SSE endpoint streams these jobs to the frontend in real-time, displaying them in the "Searching" column.
9. **Review & Application**: The user can "Review" a job (generating materials), edit the resulting application in the "Ready" column, and click "Send Application" to dispatch the email and move it to the "Sent" column.

## 📌 Development Notes
- The modules are kept **strictly decoupled**. For instance, `agents/resume_processor.py` relies ONLY on `core/` and `config/`.
