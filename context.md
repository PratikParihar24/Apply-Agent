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
│   ├── main.py
│   └── routes/
│       ├── __init__.py
│       ├── auth.py
│       ├── community.py
│       ├── hunt.py
│       └── resume.py
├── config/
│   └── settings.py
├── data/
│   └── (Dynamic PDF files and collections)
├── core/
│   ├── __init__.py
│   ├── auth.py
│   ├── database.py
│   ├── embedder.py
│   └── llm_router.py
├── agents/
│   ├── __init__.py
│   ├── resume_processor.py
│   ├── search_agent.py
│   ├── sending_agent.py
│   ├── shortlister_agent.py
│   ├── tailor_agent.py
│   └── writer_agent.py
├── orchestrator/
│   └── __init__.py
├── dashboard/
│   └── __init__.py
├── front-end/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── api/
│       ├── components/
│       │   ├── ui/
│       │   ├── MobileMenu.tsx
│       │   ├── ProtectedRoute.tsx
│       │   └── ThemeToggle.tsx
│       ├── context/
│       ├── hooks/
│       ├── routes/
│       │   ├── __root.tsx
│       │   ├── community.tsx
│       │   ├── feedback.tsx
│       │   ├── hunt.tsx
│       │   ├── index.tsx
│       │   ├── login.tsx
│       │   ├── profile.tsx
│       │   └── register.tsx
│       ├── styles.css
│       ├── router.tsx
│       └── routeTree.gen.ts
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
  - `MONGODB_URI`: URI for the MongoDB server.
  - `MONGODB_DB`: MongoDB database name.
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

### 3. `core/auth.py`
**Purpose**: Authentication utility functions.
**Functions**:
- `hash_password(password: str) -> str`: Hashes plain text passwords with bcrypt.
- `verify_password(plain: str, hashed: str) -> bool`: Verifies plain text password against hashed password.
- `create_jwt(user_id: str) -> str`: Creates a JWT token encoded with HS256 for a given user.
- `decode_jwt(token: str) -> dict`: Decodes and validates JWT token.
- `get_current_user(request: Request) -> str`: FastAPI dependency extracting user ID from authorization headers or query parameters.

### 4. `core/database.py`
**Purpose**: Manages MongoDB connection lifecycle and indexes.
**Functions**:
- `get_db()`: Retrieves the initialized database instance.
- `init_db()`: Initializes asynchronous MongoDB connection using Motor and builds database indexes for `users`, `resumes`, `hunt_sessions`, `companies`, `community_posts`, and `applications`.

### 5. `core/embedder.py`
**Purpose**: Handles vector embeddings for text chunks using `sentence-transformers`.
**Classes & Functions**:
- `class Embedder`: Initializes the `SentenceTransformer` with the configured model.
  - `embed_text(text: str) -> list[float]`: Embeds a single string.
  - `embed_batch(texts: list[str]) -> list[list[float]]`: Embeds multiple strings for bulk insertion.
- **Global Helper Functions**:
  - `embed_text(text: str)`: Wraps the default `Embedder` instance.
  - `embed_batch(texts: list[str])`: Wraps the default `Embedder` instance.

### 6. `api/main.py`
**Purpose**: Entrypoint of the FastAPI backend application. Includes CORS middleware, startup database initialization, and hooks up the modular routers.

### 7. `api/routes/`
- **`auth.py`**: Authentication routes (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/update`).
- **`resume.py`**: Resume management routes (`POST /api/resume/upload` for saving and processing PDF; `GET /api/resume/active` to query active resume metadata).
- **`hunt.py`**: SSE hunting streams, tailored application materials generation (`POST /api/generate/{company_id}`), and SMTP mail delivery dispatch (`POST /api/send/{company_id}`).
- **`community.py`**: Post feeds and social interaction (`GET /api/community/posts`, `POST /api/community/posts`, `POST /api/community/posts/{post_id}/like`).

### 8. `agents/resume_processor.py`
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

### 9. `agents/search_agent.py`
**Purpose**: Uses DuckDuckGo search (DDGS) to find target companies directly online based on role and location, bypassing generic job boards.
**Classes**:
- `class SearchAgent`:
  - **Methods**:
    - `search_stream(self, role, location, resume_summary_text, on_result_callback)`: Executes 6 highly targeted queries in parallel using `ThreadPoolExecutor` to find actual companies hiring. Extracts `hr_email` using regex, and smartly sets `website` if the source is not a generic job board. Scores them instantly and triggers the callback to stream them out via `api/main.py`.

### 10. `agents/shortlister_agent.py`
**Purpose**: Evaluates and scores the fit between the parsed resume summary and the scraped job descriptions.
**Classes**:
- `class ShortlisterAgent`:
  - **Methods**:
    - `shortlist_stream(self, companies: list[dict], resume_summary: str) -> list[dict]`: Uses a fast, non-blocking keyword match heuristic (`_quick_score`) to instantly score the fit between the candidate and the job description (1-10 scale), skipping LLM overhead for performance.

### 11. `agents/tailor_agent.py`
**Purpose**: Retrieves relevant resume chunks using `resume_processor` and dynamically organizes them to fit a specific job description. Can optionally use an LLM to rewrite bullet points.
**Classes**:
- `class TailorAgent`:
  - **Methods**:
    - `tailor(self, company: dict, resume_processor, rewrite: bool = False) -> str`: Sorts chunks into summary, experience, skills, projects, and other. Rephrases bullet points if `rewrite=True`.

### 12. `agents/writer_agent.py`
**Purpose**: Uses the LLM Router to author the final job application materials (Cover Letter, Email Body, Email Subject).
**Classes**:
- `class WriterAgent`:
  - **Methods**:
    - `write(self, company: dict, resume_summary: str, tailored_resume: str) -> dict`: Prompts the LLM for a strict JSON response. Safely strips markdown fences and returns a dictionary with the final text content.

### 13. `agents/sending_agent.py`
**Purpose**: Assembles PDFs on-the-fly for cover letters and tailored resumes using `fpdf`, then dispatches them via SMTP (using `GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` parameters from the environmental config).
**Classes**:
- `class SendingAgent`:
  - **Methods**:
    - `send_application(self, company: dict, cover_letter: str, email_body: str, subject: str, tailored_resume: str) -> dict`: Dynamically generates Resume and Cover Letter attachments and mails them using SMTP SSL.

### 14. Utilities and Placeholder Modules
- `orchestrator/__init__.py`: Will contain workflow logic combining agents.
- `dashboard/__init__.py`: Will contain the Streamlit UI code.
- `utils/__init__.py`: Will contain generic helpers.
- `agents/__init__.py`: Makes agents importable.

### 15. Supporting Files
- `requirements.txt`: Defines all pip dependencies (`chromadb`, `langchain`, `streamlit`, `sentence-transformers`, `motor`, `bcrypt`, `pyjwt`, `fpdf`, etc.).
- `.gitignore`: Ensures `__pycache__`, `.env`, and `data/*` (except `.gitkeep`) are ignored by Git.

## 🔄 Current Application Flow (Resume Parsing & Streaming Hunt)

1. **Authentication**: Users sign up or log in. Valid credentials generate a JWT token stored on the client.
2. **Resume Upload**: 
   - User uploads a PDF to `POST /api/resume/upload`.
   - The file is saved locally (`data/resume_{user_id}.pdf`).
   - `ResumeProcessor` parses it, creates sections, chunks them, embeds them, and persists chunks in ChromaDB.
   - A summary is generated, and resume metadata is stored under the user's document in MongoDB `resumes` collection.
3. **Hunt Initiation**:
   - The user posts target parameters (`role`, `location`, `max_results`) to `POST /api/hunt/start`.
   - The API generates a `job_id`, updates a MongoDB `hunt_sessions` record, and launches a background worker thread.
   - The UI establishes connection to the SSE stream: `GET /api/hunt/stream/{job_id}`.
4. **Scraping and Stream Feed**:
   - `SearchAgent` issues parallel queries via DuckDuckGo, extracts company websites, searches for email formats/contacts, scores them with `ShortlisterAgent`, and queues the results.
   - The SSE stream pushes the updates to the front-end dashboard instantly.
5. **Tailoring and Dispatch**:
   - The user clicks on a company profile to trigger `POST /api/generate/{company_id}`.
   - `TailorAgent` extracts context-relevant ChromaDB embeddings to reconstruct a tailored resume.
   - `WriterAgent` prompts the LLM to write a personalized Cover Letter and Email.
   - After review, user selects "Send Application" (`POST /api/send/{company_id}`). `SendingAgent` converts content to PDF attachments, connects to SMTP server, fires the email, and updates MongoDB collections (`companies` and `applications`) to reflect application completion status.

## 📌 Development Notes
- Decoupling is maintained. Modules rely strictly on config settings and database core services, avoiding cross-module imports.
- Authentication tokens are validated via FastAPI dependencies, supporting SSE connection parameters.
