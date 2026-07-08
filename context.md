# Job Application Automation System - Project Context

This document serves as the single source of truth for the current state of the Job Application Automation System. It must be updated whenever any changes, additions, or removals are made to the codebase.

## 📂 Directory Structure Overview

The project is structured under the `Agent-apply/` folder.

```
Agent-apply/
├── .env
├── .env.example
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
│       ├── resume.py
│       └── settings.py
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
│   ├── vercel.json
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
│       │   ├── register.tsx
│       │   └── settings.tsx
│       ├── styles.css
│       ├── router.tsx
│       └── routeTree.gen.ts
└── utils/
    ├── __init__.py
    └── encryption.py
```

## 📄 File Details and Context

### 1. `config/settings.py`
**Purpose**: Centralized configuration management.
**Variables**:
- **Environment Variables**: Loaded via `python-dotenv`.
  - `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`: API keys for cloud LLMs.
  - `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `RESEND_WEBHOOK_SECRET`: Resend email API configuration.
  - `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD`: Used for IMAP reply detection.
  - `OLLAMA_BASE_URL`: Base URL for local Ollama instances.
  - `MONGODB_URI`: URI for the MongoDB server.
  - `MONGODB_DB`: MongoDB database name.
  - `SECRET_KEY`, `JWT_SECRET`: Security keys for encryption and JWT.

### 2. `core/llm_router.py`
**Purpose**: Provides a unified, swappable interface to Language Models using LangChain with a resilient fallback chain.
**Functions**:
- `get_llm(user_settings: dict = None)`: Returns a tuple `(llm_instance, provider_name: str)`. 
  - Respects the user's `preferred_llm` if provided in `user_settings`.
  - Fallback chain: `Ollama` -> `Gemini` -> `Groq` -> `OpenRouter`.
  - Automatically times out (5s for cloud, 2s ping for Ollama) to prevent hanging.
- `get_active_llm_info() -> dict`: Returns active model metadata.

### 3. `core/auth.py`
**Purpose**: Authentication utility functions.

### 4. `core/database.py`
**Purpose**: Manages MongoDB connection lifecycle and indexes.
**Functions**:
- `init_db()`: Initializes asynchronous MongoDB connection using Motor and builds database indexes for `users`, `resumes`, `hunt_sessions`, `companies`, `community_posts`, and `applications`. Specifically includes an index on `users.gmail_address` for efficient IMAP polling lookups.

### 5. `core/embedder.py`
**Purpose**: Handles vector embeddings for text chunks using `sentence-transformers`.

### 6. `api/main.py`
**Purpose**: Entrypoint of the FastAPI backend application. Checks for required environment variables on startup and hooks up the modular routers.

### 7. `api/routes/`
- **`auth.py`**: Authentication routes (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/update`).
- **`resume.py`**: Resume management routes.
- **`hunt.py`**: SSE hunting streams, tailored application materials generation (`POST /api/generate/{company_id}`), and mail delivery dispatch (`POST /api/send/{company_id}`). Also handles the Resend Webhook callback (`POST /api/webhooks/resend`) for open/click tracking.
- **`community.py`**: Post feeds and social interaction.
- **`settings.py`**: User configuration routes to get and update encrypted API keys and LLM preferences (`GET /api/settings`, `PUT /api/settings`, `DELETE /api/settings/field/{field_name}`).

### 8. `agents/resume_processor.py`
**Purpose**: Parses resumes (PDF), cleans text, chunks into semantic pieces, embeds them, and stores them in ChromaDB.

### 9. `agents/search_agent.py`
**Purpose**: Uses DuckDuckGo search (DDGS) to find target companies directly online based on role and location.

### 10. `agents/shortlister_agent.py`
**Purpose**: Evaluates and scores the fit between the parsed resume summary and scraped job descriptions.

### 11. `agents/tailor_agent.py`
**Purpose**: Retrieves relevant resume chunks using `resume_processor` and dynamically organizes them. Accepts `user_settings` on initialization to pass to the LLM router.

### 12. `agents/writer_agent.py`
**Purpose**: Uses the LLM Router to author the final job application materials (Cover Letter, Email Body, Email Subject). Accepts `user_settings` and injects `llm_provider` into the returned response payload so the UI knows which AI was used.

### 13. `agents/sending_agent.py`
**Purpose**: Assembles PDFs on-the-fly for cover letters and tailored resumes using `fpdf`, then dispatches them via the **Resend API**. Expects a `user_resend_key` for overriding the system default.

### 14. Utilities
- **`utils/encryption.py`**: Uses `cryptography.fernet` to symmetrically encrypt and decrypt sensitive API keys before they are saved to MongoDB.

## 🔄 Current Application Flow (Resume Parsing & Streaming Hunt)

1. **Authentication**: Users sign up or log in. Valid credentials generate a JWT token stored on the client.
2. **Settings**: Users can optionally configure their own API keys (Gemini, Resend) and preferred LLM in the settings page. These are stored encrypted in the database.
3. **Resume Upload**: User uploads a PDF; `ResumeProcessor` parses, embeds, and stores chunks in ChromaDB.
4. **Hunt Initiation**: The user posts target parameters, launching a background worker thread.
5. **Scraping and Stream Feed**: `SearchAgent` finds companies, `ShortlisterAgent` scores them, and SSE streams the results to the front-end dashboard instantly.
6. **Tailoring and Generation**:
   - The user clicks on a company profile to trigger `POST /api/generate/{company_id}`.
   - The backend fetches `user_settings` (decrypting keys) and passes them to `TailorAgent` and `WriterAgent`.
   - The resilient LLM chain generates a Cover Letter and Email, returning the generated content along with the `llm_provider` name.
   - The UI displays an `LLMBanner` indicating which AI model was used.
7. **Dispatch and Tracking**:
   - The user clicks "Send Application" (`POST /api/send/{company_id}`).
   - `SendingAgent` converts content to PDF attachments and dispatches via the **Resend SDK**.
   - Resend returns a `message_id`, which is saved to the `applications` collection.
   - When the employer opens the email, Resend triggers a webhook to `POST /api/webhooks/resend` (verified securely using `svix`), updating the application status to `viewed`.
