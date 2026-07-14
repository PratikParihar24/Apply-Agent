# ApplyAgent — The Complete Project Handbook

> **Purpose**: This document is the single source of truth for understanding how ApplyAgent works — from the user's first click to the final email sent. Every screen, every API call, every data transformation is mapped here with code-level references.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [The Full User Journey](#3-the-full-user-journey)
   - [3.1 Landing Page (Unauthenticated)](#31-landing-page-unauthenticated)
   - [3.2 Registration & Login](#32-registration--login)
   - [3.3 Dashboard (Authenticated Home)](#33-dashboard-authenticated-home)
   - [3.4 The Hunt — Setup Form](#34-the-hunt--setup-form)
   - [3.5 Resume Upload & Processing](#35-resume-upload--processing)
   - [3.6 Starting the Hunt](#36-starting-the-hunt)
   - [3.7 Real-Time Company Discovery (SSE Stream)](#37-real-time-company-discovery-sse-stream)
   - [3.8 The 4-Column Hunt Dashboard](#38-the-4-column-hunt-dashboard)
   - [3.9 Generate — Tailoring + Writing](#39-generate--tailoring--writing)
   - [3.10 Review & Edit](#310-review--edit)
   - [3.11 Send Application](#311-send-application)
   - [3.12 Applications Tracker](#312-applications-tracker)
   - [3.13 Community Feed](#313-community-feed)
   - [3.14 Settings Page](#314-settings-page)
   - [3.15 Analytics Dashboard](#315-analytics-dashboard)
4. [The Full Data Journey](#4-the-full-data-journey)
   - [4.1 Resume Data Pipeline](#41-resume-data-pipeline)
   - [4.2 Hunt & Search Data Pipeline](#42-hunt--search-data-pipeline)
   - [4.3 Generation Pipeline (RAG)](#43-generation-pipeline-rag)
   - [4.4 Email Dispatch Pipeline](#44-email-dispatch-pipeline)
   - [4.5 Reply Detection Pipeline](#45-reply-detection-pipeline)
5. [Component & Module Reference](#5-component--module-reference)
   - [5.1 Backend — Core Layer](#51-backend--core-layer)
   - [5.2 Backend — Agent Layer](#52-backend--agent-layer)
   - [5.3 Backend — API Routes](#53-backend--api-routes)
   - [5.4 Backend — Utilities](#54-backend--utilities)
   - [5.5 Frontend — Pages & Routes](#55-frontend--pages--routes)
   - [5.6 Frontend — Shared Components](#56-frontend--shared-components)
   - [5.7 Frontend — Context & State](#57-frontend--context--state)
   - [5.8 Frontend — API Client Layer](#58-frontend--api-client-layer)
6. [Database Schema Map](#6-database-schema-map)
7. [API Reference (Complete)](#7-api-reference-complete)
8. [Configuration & Environment](#8-configuration--environment)

---

## 1. Project Overview

**ApplyAgent** is an AI-powered job application automation platform. A user uploads their resume once, defines their target role and location, and the system:

1. **Discovers** companies with active job openings via web scraping and search APIs.
2. **Scores** each company against the user's resume using keyword matching.
3. **Tailors** the resume for each specific company using RAG (Retrieval-Augmented Generation) over the user's resume chunks stored in a vector database.
4. **Generates** a personalized cover letter, email subject, and email body using an LLM.
5. **Dispatches** the full application package (HTML email + resume PDF attachment) via the Resend email API.
6. **Tracks** application status with automated reply detection via IMAP monitoring and Resend webhooks.

**In plain English**: You upload your resume, tell the app what job you want, and it finds companies, writes custom applications for each one, and sends them — all while you watch in real time.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                       │
│   TanStack Router · TanStack Query · Tailwind CSS · Sonner Toasts   │
│                                                                      │
│   Pages: / (Home/Dashboard) · /hunt · /applications · /community     │
│          /settings · /profile · /login · /register · /feedback       │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ REST (JSON) + SSE (text/event-stream)
                              │ Auth: Bearer JWT in headers (or ?token= for SSE)
┌─────────────────────────────▼────────────────────────────────────────┐
│                      BACKEND (FastAPI + Uvicorn)                     │
│                                                                      │
│   Routers:  /api/auth · /api/resume · /api/hunt · /api/community     │
│             /api/settings · /api/analytics · /api/webhooks/resend     │
│             /api/llm/status · /api/feedback · /api/applications       │
└──┬─────────────────┬──────────────────┬──────────────────────────────┘
   │                 │                  │
   ▼                 ▼                  ▼
┌──────────┐  ┌────────────┐  ┌─────────────────────────────────────┐
│ MongoDB  │  │  ChromaDB   │  │          AGENT LAYER                │
│ (Motor)  │  │ (Persistent │  │                                     │
│          │  │  Vector DB) │  │  ResumeProcessor  (PDF→chunks→vecs) │
│ users    │  │             │  │  SearchAgent      (DDGS/Google/Bing)│
│ resumes  │  │ Collection: │  │  JobListingAgent  (RSS + scraping)  │
│ hunts    │  │ resume_     │  │  ShortlisterAgent (keyword scoring) │
│ companies│  │ chunks      │  │  TailorAgent      (RAG retrieval)   │
│ apps     │  │             │  │  WriterAgent      (LLM generation)  │
│ posts    │  │ cosine      │  │  SendingAgent     (Resend API)      │
│          │  │ similarity  │  │                                     │
└──────────┘  └────────────┘  └──────────┬──────────────────────────┘
                                         │
                              ┌──────────▼──────────────────┐
                              │    EXTERNAL SERVICES         │
                              │                              │
                              │  Gemini / Groq / OpenRouter  │
                              │  Ollama (local LLM)          │
                              │  DuckDuckGo Search (DDGS)    │
                              │  Google CSE / Bing Search     │
                              │  Resend (email dispatch)     │
                              │  Gmail IMAP (reply detect)   │
                              └──────────────────────────────┘
```

---

## 3. The Full User Journey

### 3.1 Landing Page (Unauthenticated)

**What the user sees**: A bold hero section with the tagline "FINDING CREATIVE OPPORTUNITIES, HUMANISED", three feature cards (Smart Matching, Live Dashboard, Human-Centred), and a prominent "Start Your Hunt →" CTA button.

**What happens in code**:
- **File**: `front-end/src/routes/index.tsx` → `Home()` component
- The `useAuth()` hook checks if a user is logged in. If `user` is `null`, the landing page renders.
- The CTA links to `/hunt`, which is wrapped in `<ProtectedRoute>` — so clicking it redirects to `/login` if not authenticated.

**Data flow**: None — this is a static marketing page. No API calls are made.

---

### 3.2 Registration & Login

#### Registration Flow

**What the user sees**: A form with Name, Email, and Password fields.

**What happens step by step**:

1. **User fills form → clicks "Register"**
   - **File**: `front-end/src/routes/register.tsx` → calls `useAuth().register(name, email, password)`
   - **File**: `front-end/src/context/AuthContext.tsx` → `register()` calls `apiCall("/api/auth/register", { method: "POST", body: { name, email, password } })`

2. **Backend processes registration**
   - **File**: `api/routes/auth.py` → `register()` endpoint
   - Email is normalized to lowercase: `email_clean = request.email.strip().lower()`
   - Checks for duplicate email: `db.users.find_one({"email": email_clean})`
   - Password is hashed: `hash_password(request.password)` → uses **bcrypt** with 10 rounds (`core/auth.py` line 10)
   - User document inserted into MongoDB `users` collection
   - JWT is created: `create_jwt(user_id)` → HS256 algorithm, 24-hour expiry (`core/auth.py` line 23–29)

3. **Token returned → stored in localStorage**
   - Response: `{ token, user: { id, email, name } }`
   - Frontend stores `access_token` and `user` in `localStorage`
   - React state updated → user is now authenticated → redirect to `/hunt`

#### Login Flow

**Nearly identical**, except:
- **Endpoint**: `POST /api/auth/login`
- Password is **verified** instead of hashed: `verify_password(plain, hashed)` → `bcrypt.checkpw()`
- **Background task triggered on login**: `background_tasks.add_task(check_replies_for_user, user_id)` — this runs IMAP reply detection asynchronously (`api/routes/auth.py` line 65)

#### JWT Authentication for Subsequent Requests

- Every API call from the frontend attaches the token: `Authorization: Bearer <token>` (set in `front-end/src/utils/apiClient.ts` line 8)
- Backend extracts and validates via `get_current_user()` in `core/auth.py`:
  - Checks `Authorization` header first
  - Falls back to `?token=` query parameter (needed for SSE EventSource which can't set custom headers)
  - Decodes JWT using `python-jose` library
  - Returns the `user_id` string from the `sub` claim

---

### 3.3 Dashboard (Authenticated Home)

**What the user sees**: An analytics dashboard with:
- 4 stat cards: Applications Sent, Reply Rate, Interview Rate, Active Pipeline
- Pipeline Distribution bar chart (stacked horizontal bar showing applied/viewed/replied/interview/rejected/failed)
- Top Targets sidebar (top 5 roles applied to)
- Model Distribution sidebar (which LLM providers were used)

**What happens in code**:
- **File**: `front-end/src/routes/index.tsx` → `Home()` (authenticated branch, line 89)
- Calls `getAnalytics()` → `GET /api/analytics`
- **Backend**: `api/routes/analytics.py` → runs 6 MongoDB aggregation queries **in parallel** using `asyncio.gather()`:
  1. `count_documents` for total applications
  2. Aggregation pipeline grouping by `status`
  3. Aggregation pipeline for most recent application
  4. `count_documents` for applications in the last 30 days
  5. Aggregation pipeline for top 5 job titles
  6. Aggregation pipeline for LLM provider usage distribution
- Returns computed `reply_rate` and `interview_rate` as decimals

---

### 3.4 The Hunt — Setup Form

**What the user sees**: A multi-field form titled "Tell the agents what you're hunting for" with:
- Resume upload (drag-and-drop)
- Hunt Mode toggle: "Find Job Listings" vs "Cold Outreach"
- Target Role, Seniority, Location, Work Mode
- Company Size, Company Type
- Writing Style (Casual / Formal / Assertive)
- Keywords, Salary, Notes

**What happens in code**:
- **File**: `front-end/src/routes/hunt.tsx` → `SetupForm()` component (line 508)
- On mount, it loads:
  - Active resume: `getActiveResume()` → `GET /api/resume/active`
  - Saved preferences: `getHuntPreferences()` → `GET /api/hunt/preferences` (fetches from `user.hunt_preferences` in MongoDB)
- Form state is maintained in a `HuntBrief` object
- Role and location are also persisted in `localStorage` for instant recall

---

### 3.5 Resume Upload & Processing

**What the user sees**: Clicks "Choose file" → selects a PDF → sees "Uploading..." → success toast "Resume uploaded: filename.pdf"

**What happens step by step** (this is a critical data pipeline):

```
User's PDF file
    │
    ▼ (multipart upload)
POST /api/resume/upload
    │
    ▼
[1] Save file to disk: data/resume_{user_id}.pdf
    │
    ▼
[2] ResumeProcessor.process(file_path)
    │
    ├─── [2a] _extract_text(pdf_path)
    │         ├── Try pypdf first
    │         ├── Fallback to pdfplumber if < 100 chars extracted
    │         └── Fallback to pymupdf (fitz) if still < 100 chars
    │
    ├─── [2b] _clean_text_preserve_newlines(raw_text)
    │         ├── Strip non-ASCII characters
    │         ├── Collapse horizontal whitespace
    │         └── Reduce triple+ newlines to double
    │
    ├─── [2c] _detect_sections(text)
    │         ├── Iterates through lines
    │         ├── Heuristic: line is a header if:
    │         │   - ≤ 5 words AND ≤ 40 chars
    │         │   - Is UPPER or Title case
    │         │   - No trailing punctuation
    │         │   - No digits, no -ing verbs, no list chars
    │         └── Outputs: {"Experience": "...", "Skills": "...", ...}
    │
    ├─── [2d] For each section → _chunk_text(content)
    │         ├── Splits into words
    │         ├── Creates chunks of CHUNK_SIZE (300) words
    │         └── With CHUNK_OVERLAP (50) words between chunks
    │
    ├─── [2e] embed_batch(all_chunks)
    │         ├── Loads SentenceTransformer('all-MiniLM-L6-v2') [lazy]
    │         └── Produces 384-dimensional vectors for each chunk
    │
    └─── [2f] ChromaDB collection.add(documents, embeddings, metadatas, ids)
              ├── Collection: "resume_chunks" with cosine similarity
              ├── Each chunk gets a UUID
              └── Metadata includes: {section: "Experience", chunk_index: 0}
```

**After embedding**:
- All previous resumes for this user are deactivated: `db.resumes.update_many({user_id}, {is_active: False})`
- Resume metadata saved to MongoDB: `{ user_id, filename, summary, sections_found, chunks_count, is_active: True, uploaded_at }`
- The `summary` is generated by `_generate_summary()`: takes first 200 words from each section, concatenates, caps at 500 words total

**Files involved**:
- `api/routes/resume.py` — API endpoint
- `agents/resume_processor.py` — all processing logic
- `core/embedder.py` — SentenceTransformer wrapper
- `config/settings.py` — CHUNK_SIZE=300, CHUNK_OVERLAP=50, EMBEDDING_MODEL='all-MiniLM-L6-v2'

---

### 3.6 Starting the Hunt

**What the user sees**: Clicks "Start the Hunt →" → redirected to the 4-column dashboard → company cards start appearing in real time.

**What happens step by step**:

1. **Frontend calls `startHunt()`** (`front-end/src/api/client.ts` line 25)
   - `POST /api/hunt/start` with body: `{ role, location, max_results: 10, mode, company_size, company_type, writing_style }`

2. **Backend creates a hunt session** (`api/routes/hunt.py` line 59)
   - Saves hunt preferences to user document in MongoDB: `db.users.update_one({_id}, {$set: {hunt_preferences: ...}})`
   - Fetches active resume summary from MongoDB
   - Generates a `job_id` (UUID) and creates an in-memory `Queue()` at `hunt_queues[job_id]`
   - Creates a `hunt_sessions` document in MongoDB with status "started"
   - **Spawns a background thread** `threading.Thread(target=background_search)` (line 202)
   - Returns `{ job_id, hunt_id, status: "started" }` immediately

3. **Frontend opens SSE connection** (`front-end/src/api/client.ts` line 52)
   - `new EventSource(\`http://localhost:8000/api/hunt/stream/${job_id}?token=${token}\`)`
   - Listens for `onmessage` events
   - Each message is a JSON company object → added to the `cards` state array

---

### 3.7 Real-Time Company Discovery (SSE Stream)

The background thread runs one of two search strategies based on `mode`:

#### Mode: "job_listings" (default)
Uses `JobListingAgent` (`agents/job_listing_agent.py`):

```
JobListingAgent.search_stream()
    │
    ├── _get_expanded_locations(location)
    │   └── Maps nearby cities (e.g., "Noida" → ["Delhi NCR", "Delhi", "India"])
    │
    ├── search_rss(role, location, resume_summary, callback)
    │   ├── Indeed RSS (india subdomain for Indian cities)
    │   ├── LinkedIn RSS
    │   ├── Wellfound RSS
    │   └── Naukri RSS
    │   → All fetched in parallel with ThreadPoolExecutor(max_workers=4)
    │   → Each entry: parse title → extract company → quick_score → callback
    │
    ├── search_scrape(role, location, resume_summary, callback)
    │   ├── Naukri HTML scraper
    │   ├── Shine HTML scraper
    │   ├── Foundit HTML scraper
    │   └── Internshala HTML scraper
    │   → Sequential with 0.5s delays between results
    │
    └── Priority sort: Indian sources first, then international
```

#### Mode: "cold_outreach"
Uses `SearchAgent` (`agents/search_agent.py`):

```
SearchAgent.search_stream()
    │
    ├── 6 targeted cold outreach queries:
    │   ├── site:careers.* "{role}" "{location}"
    │   ├── "{role}" "{location}" (inurl:careers OR inurl:jobs) -blocked_sites
    │   ├── "we are hiring" OR "join our team" "{role}" "{location}"
    │   ├── "{role}" "{location}" "hr@" OR "careers@" OR "talent@"
    │   ├── "{role}" site:wellfound.com OR site:instahyre.com
    │   └── "{role}" "{company_type}" "{location}" careers
    │
    ├── _unified_search() fallback chain per query:
    │   ├── Try Google CSE first
    │   ├── Fallback to Bing Search API
    │   └── Fallback to DuckDuckGo (DDGS)
    │
    ├── Blocklist filtering (LinkedIn, Indeed, Glassdoor, etc.)
    ├── Location relevance post-filter
    ├── Bonus scoring:
    │   ├── +3 if URL contains careers. subdomain
    │   ├── +2 if URL path contains /careers or /jobs
    │   ├── +2 if HR email found in snippet
    │   └── +1 if company size matches filter
    │
    └── ShortlisterAgent.shortlist_stream() → yields scored companies
```

**For each discovered company**, the `on_result` callback in `hunt.py`:
1. Assigns a UUID `company_id`
2. Saves to MongoDB `companies` collection
3. Pushes to the in-memory queue → SSE stream picks it up
4. **Spawns a background enrichment thread** (`threading.Thread`) that:
   - Calls `enrich_company()` from `utils/enrichment.py`
   - Finds the company website, career page, HR email, and description via scraping
   - Updates MongoDB with enriched data
   - Pushes a `company_enriched` SSE event so the frontend updates the card in-place

**SSE endpoint** (`api/routes/hunt.py` line 208):
- `GET /api/hunt/stream/{job_id}`
- Returns `StreamingResponse` with `media_type="text/event-stream"`
- Polls the in-memory queue every 200ms
- Sends `data: {json}\n\n` for each company
- Sends `data: {"status": "done"}\n\n` when the search thread completes

---

### 3.8 The 4-Column Hunt Dashboard

**What the user sees**: A Kanban-style board with 4 columns:

| Column | Status | Cards show | Actions |
|---|---|---|---|
| **Searching** | `searching` | Company name, job title, score, source, description snippet | "Review" → opens detail popup; "Skip" → removes card |
| **Generating** | `generating` | Company name with loading spinner | "Skip" to cancel |
| **Ready to Send** | `ready` | Full generated content: cover letter, email body, subject | "Send" → dispatches email; inline editing of all fields |
| **Sent** | `sent` | Company name + timestamp | None (final state) |

**What happens in code**:
- **File**: `front-end/src/routes/hunt.tsx` → `HuntPage()` (line 114)
- Cards are stored in a `cards: Card[]` state array, persisted in `localStorage` key `agentapply_hunt_state`
- Cards are sorted into columns by filtering on `card.status`
- `updateCard(id, patch)` merges partial updates into a specific card

---

### 3.9 Generate — Tailoring + Writing

**What the user sees**: Clicks "Review" on a company card → popup shows company details → clicks "Generate" → optional custom AI instructions modal → card moves to "Generating" column → after ~5-15 seconds, moves to "Ready to Send" with full generated content.

**What happens step by step** (this is the RAG pipeline):

```
POST /api/generate/{company_id}
    │
    ▼
[1] Fetch company from MongoDB
[2] Fetch active resume summary
[3] Fetch user settings (preferred LLM, API keys)
[4] Scrape company description from their website
    └── SearchAgent._scrape_company_description(website)
        ├── Try /about page
        ├── Fallback to homepage
        └── Extract: meta description → or first <p> > 50 chars
    │
    ▼
[5] TailorAgent.tailor(company, resume_processor, rewrite=True)
    │
    ├── [5a] resume_processor.query_multi(job_description, top_k=5)
    │         ├── LLM extracts 3-5 key requirements from JD as JSON array
    │         ├── Each requirement is embedded separately
    │         ├── ChromaDB queried per requirement (top 3 each)
    │         ├── Results merged, deduplicated by exact text
    │         └── Sorted by cosine distance, return top 5 unique chunks
    │
    ├── [5b] Categorize chunks into: summary, experience, skills, projects, other
    │
    ├── [5c] Rewrite each chunk via LLM (rewrite=True)
    │         └── Prompt: "Slightly rephrase to highlight skills relevant to JD"
    │             with strict rules: same length, no fabrication, no filler
    │
    └── [5d] Assemble: summary → experience → skills → projects → other
             with section headers in UPPERCASE
    │
    ▼
[6] WriterAgent.write(company, resume_summary, tailored_resume, ...)
    │
    ├── Caps inputs: tailored_resume ≤ 3000 chars, JD ≤ 800, description ≤ 300
    │
    ├── Selects writing style instructions:
    │   ├── "casual" → contractions, varied sentences, no corporate jargon
    │   ├── "formal" → full sentences, structured, respectful
    │   └── "assertive" → bold, metrics-first, active voice only
    │
    ├── Constructs a detailed LLM prompt with:
    │   ├── Style instructions
    │   ├── Strict rules (no hallucination, exact format, banned phrases)
    │   ├── Few-shot example (full JSON)
    │   ├── Resume context (tailored chunks)
    │   ├── Company info
    │   └── Required JSON output format
    │
    ├── LLM generates response → strip markdown fences → extract JSON
    │
    └── Returns: { cover_letter, email_subject, email_body, llm_provider }
    │
    ▼
[7] Save generated content to MongoDB companies collection
    └── status updated to "generated"
    │
    ▼
[8] Return to frontend → card moves to "Ready to Send" column
```

**Files involved**:
- `api/routes/hunt.py` → `generate_materials()` (line 232)
- `agents/tailor_agent.py` → `TailorAgent.tailor()`
- `agents/resume_processor.py` → `query_multi()` (multi-query RAG)
- `agents/writer_agent.py` → `WriterAgent.write()`
- `core/llm_router.py` → `get_llm()` (selects which LLM to use)

---

### 3.10 Review & Edit

**What the user sees**: In the "Ready to Send" column, each card shows:
- Email subject (editable)
- Cover letter (editable via rich text editor)
- Email body (editable)
- Tailored resume preview
- LLM provider badge (e.g., "gemini", "groq")
- "Send" and "Skip" buttons

**What happens in code**:
- `ReadyCard` component in `hunt.tsx` renders editable fields
- `RichTextEditor` component (`front-end/src/components/RichTextEditor.tsx`) provides formatting
- `updateCard(id, { coverLetter: newText })` updates the local state
- All edits are local — nothing is saved to the backend until the user explicitly sends

---

### 3.11 Send Application

**What the user sees**: Clicks "Send" → card shows "Sending..." → moves to "Sent" column → toast "Application sent to CompanyName!"

**What happens step by step**:

```
POST /api/send/{company_id}
Body: { cover_letter, email_body, subject, tailored_resume, recipient_email }
    │
    ▼
[1] Fetch company from MongoDB
[2] Fetch user's personal Resend API key (decrypted from MongoDB)
    │
    ▼
[3] SendingAgent.send_application(...)
    │
    ├── Determine recipient:
    │   ├── Use hr_email from company record
    │   ├── Fallback: careers@{domain} extracted from website
    │   └── Last resort: careers@{company_name_slug}.com
    │
    ├── Read original resume PDF from disk:
    │   └── data/resume_{user_id}.pdf
    │
    ├── Build HTML email body:
    │   ├── Use cover_letter as primary content
    │   ├── Fallback to email_body
    │   └── Wrap paragraphs in <p> tags with Arial/Georgia font
    │
    ├── Detect file type via magic bytes:
    │   ├── %PDF → "Resume.pdf"
    │   └── PK\x03\x04 → "Resume.docx"
    │
    ├── Encode resume as base64 attachment
    │
    └── resend.Emails.send({
            from: RESEND_FROM_ADDRESS,
            to: recipient,
            subject: subject,
            html: html_body,
            attachments: [{ filename, content }]
        })
    │
    ▼
[4] Save to MongoDB applications collection:
    └── { user_id, company_id, company_name, job_title, applied_at,
          status: "applied", status_history: [...], message_id,
          llm_provider, cover_letter, email_body, subject, ... }
    │
    ▼
[5] Update company status to "applied" in companies collection
```

**Files involved**:
- `api/routes/hunt.py` → `send_application()` (line 324)
- `agents/sending_agent.py` → `SendingAgent.send_application()`
- `utils/encryption.py` → `decrypt()` for user's Resend API key

---

### 3.12 Applications Tracker

**What the user sees**: A table/list of all sent applications with:
- Company name, job title, date applied
- Status badge (Applied → Viewed → Replied → Interview → Rejected)
- Status history timeline
- Actions: change status, delete, view details (cover letter, email, resume)
- "Check for Replies" button → triggers IMAP scan

**What happens in code**:
- **File**: `front-end/src/routes/applications.tsx`
- Calls `getApplications()` → `GET /api/applications` (returns last 100 sorted by date descending)
- Status updates: `PUT /api/applications/{company_id}/status` → validates against allowed statuses
- Delete: `DELETE /api/applications/{application_id}`
- Reply check: `POST /api/applications/check-replies` → triggers `check_replies_for_user()`

---

### 3.13 Community Feed

**What the user sees**: A social feed where users post tips, wins, and rants. Each post has a tag (Win 🏆, Tip 💡, Rant 😤), text content, username, timestamp, and a like button.

**What happens in code**:
- **File**: `front-end/src/routes/community.tsx`
- **File**: `api/routes/community.py`
- `GET /api/community/posts` → returns last 50 posts sorted by `created_at` descending
- `POST /api/community/posts` → creates a post with `{ user_id, username, text, tag, likes_count: 0, likes: [] }`
- `POST /api/community/posts/{post_id}/like` → toggles like:
  - If user already liked → `$pull` from likes array + `$inc: {likes_count: -1}`
  - If not liked → `$addToSet` to likes array + `$inc: {likes_count: 1}`

---

### 3.14 Settings Page

**What the user sees**: A form to configure:
- Preferred LLM provider (Auto / Ollama / Gemini / Groq / OpenRouter)
- API keys for each provider
- Resend API key and From address
- Gmail address and App Password (for IMAP reply detection)

**What happens in code**:
- **File**: `front-end/src/routes/settings.tsx`
- **File**: `api/routes/settings.py`
- `GET /api/settings` → returns settings with **masked API keys** (shows last 4 chars only)
- `PUT /api/settings` → **encrypts** sensitive fields before saving:
  - Uses Fernet symmetric encryption (`utils/encryption.py`)
  - `encrypt(value)` → `Fernet(SECRET_KEY).encrypt(value.encode())`
  - Encrypted values stored in user document in MongoDB
- `DELETE /api/settings/field/{field_name}` → removes a specific field with `$unset`

---

### 3.15 Analytics Dashboard

Covered in [Section 3.3](#33-dashboard-authenticated-home). The analytics endpoint uses MongoDB aggregation pipelines running in parallel for performance.

---

## 4. The Full Data Journey

### 4.1 Resume Data Pipeline

```
User's PDF → disk (data/resume_{user_id}.pdf)
           → pypdf/pdfplumber/pymupdf (text extraction)
           → ASCII cleaning + whitespace normalization
           → Header detection (heuristic line analysis)
           → Sections: { "Experience": "...", "Skills": "...", ... }
           → Per-section chunking (300 words, 50 overlap)
           → SentenceTransformer('all-MiniLM-L6-v2') → 384-dim vectors
           → ChromaDB PersistentClient → collection "resume_chunks"
           → MongoDB resumes collection (metadata only)
```

### 4.2 Hunt & Search Data Pipeline

```
User's brief (role, location, mode) 
    → POST /api/hunt/start 
    → MongoDB hunt_sessions (status: "started")
    → Background thread spawned
    │
    ├─ [job_listings mode]
    │   JobListingAgent:
    │   → RSS feeds (Indeed, LinkedIn, Wellfound, Naukri) via feedparser
    │   → HTML scrapers (Naukri, Shine, Foundit, Internshala) via BeautifulSoup
    │   → ShortlisterAgent._quick_score() for keyword matching
    │   → Scored results pushed to in-memory Queue
    │
    └─ [cold_outreach mode]
        SearchAgent:
        → Google CSE → Bing → DDGS (fallback chain)
        → Blocklist filtering
        → Title parsing → company + job_title extraction
        → Bonus scoring (career page, HR email, size match)
        → ShortlisterAgent.shortlist_stream()
        → Scored results pushed to in-memory Queue
    │
    ▼
Queue → SSE StreamingResponse → EventSource in browser
     → MongoDB companies collection (per-company document)
     → Background enrichment thread per company
        → enrich_company() → website/email/career/description
        → MongoDB update + SSE "company_enriched" event
```

### 4.3 Generation Pipeline (RAG)

```
POST /api/generate/{company_id}
    │
    ├─ Company data from MongoDB
    ├─ Resume summary from MongoDB
    ├─ User settings from MongoDB
    │
    ▼
TailorAgent:
    ├─ query_multi(job_description):
    │   ├─ LLM → extract 3-5 requirements as JSON array
    │   ├─ embed_text(requirement) × 3-5 times
    │   ├─ ChromaDB.query(embedding, n=3) × 3-5 times
    │   ├─ Deduplicate by text
    │   └─ Sort by cosine distance → top 5 chunks
    │
    ├─ Categorize: summary / experience / skills / projects / other
    ├─ Rewrite each chunk via LLM (rephrase for JD relevance)
    └─ Assemble ordered sections → tailored_resume string
    │
    ▼
WriterAgent:
    ├─ LLM prompt with: style rules, resume context, company info
    ├─ Parse JSON response: { cover_letter, email_subject, email_body }
    └─ Fallback template if JSON parse fails
    │
    ▼
Save to MongoDB companies: cover_letter, email_body, subject, tailored_resume
Return to frontend
```

### 4.4 Email Dispatch Pipeline

```
POST /api/send/{company_id}
    │
    ├─ Company doc from MongoDB
    ├─ User's encrypted Resend key → decrypt()
    ├─ Resume PDF from disk (data/resume_{user_id}.pdf)
    │
    ▼
SendingAgent:
    ├─ Determine recipient (hr_email → fallback to careers@domain)
    ├─ Read PDF → detect type (PDF vs DOCX) via magic bytes
    ├─ Base64 encode attachment
    ├─ Build HTML body from cover_letter/email_body
    └─ resend.Emails.send() → returns message_id
    │
    ▼
MongoDB applications: { status: "applied", message_id, status_history: [...] }
MongoDB companies: { status: "applied" }
```

### 4.5 Reply Detection Pipeline

There are **two** mechanisms for detecting replies:

#### Mechanism 1: Resend Webhooks (Automatic)
```
Resend event (email.opened / email.clicked)
    → POST /api/webhooks/resend
    → Verify signature with svix
    → Extract message_id from event data
    → MongoDB: update applications where message_id matches
       → status: "viewed", push to status_history
```

#### Mechanism 2: IMAP Monitoring (Manual + On-Login)
```
User clicks "Check for Replies" → POST /api/applications/check-replies
    OR
User logs in → background_tasks.add_task(check_replies_for_user)
    │
    ▼
check_replies_for_user(user_id):
    ├─ Fetch user's gmail_address + gmail_app_password from MongoDB
    ├─ Decrypt password
    ├─ Fetch all "applied"/"viewed" applications with message_id
    ├─ Connect to imap.gmail.com:993 via SSL
    ├─ Search inbox for emails from last 30 days
    ├─ For each email: check In-Reply-To and References headers
    ├─ Match against stored Resend message_ids
    └─ If match found: update status to "replied" + push to status_history
```

---

## 5. Component & Module Reference

### 5.1 Backend — Core Layer

| File | Purpose | Key Functions |
|---|---|---|
| `core/auth.py` | JWT authentication & password hashing | `hash_password()`, `verify_password()`, `create_jwt()`, `decode_jwt()`, `get_current_user()`, `get_current_user_optional()` |
| `core/database.py` | MongoDB connection via Motor async driver | `init_db()` creates indexes on startup, `get_db()` returns the db handle |
| `core/embedder.py` | Wrapper around `sentence-transformers` | `Embedder` class with `embed_text()` and `embed_batch()`. Lazy-loaded singleton via `get_embedder()` |
| `core/llm_router.py` | Multi-provider LLM fallback chain | `get_llm(user_settings)` returns `(llm, provider)`. Chain: Ollama → Gemini → Groq → OpenRouter. `get_active_llm_info()` returns status of all providers |

### 5.2 Backend — Agent Layer

| File | Class | Plain English |
|---|---|---|
| `agents/resume_processor.py` | `ResumeProcessor` | Takes a PDF resume, rips out the text, detects section headers, splits into overlapping word chunks, embeds each chunk using a SentenceTransformer model, and stores them in ChromaDB. Also provides `query()` and `query_multi()` to retrieve the most relevant chunks for a given job description. |
| `agents/search_agent.py` | `SearchAgent` | The "cold outreach" hunter. Fires 6 parallel search queries via Google CSE/Bing/DDGS, filters out generic job boards, extracts company names and HR emails from results and scraped pages, and scores each company with bonus points for career pages and email availability. |
| `agents/job_listing_agent.py` | `JobListingAgent` | The "job listing" hunter. Fetches RSS feeds from Indeed, LinkedIn, Wellfound, and Naukri in parallel, then scrapes Naukri, Shine, Foundit, and Internshala HTML pages. Expands locations (e.g., Noida → Delhi NCR) and prioritizes Indian job sources. |
| `agents/shortlister_agent.py` | `ShortlisterAgent` | Scores companies by counting how many of the first 50 keywords from the resume summary appear in the job description. Score is capped at 4–10 plus any bonus points. |
| `agents/tailor_agent.py` | `TailorAgent` | The RAG engine. Uses `query_multi()` to retrieve the 5 most relevant resume chunks, categorizes them by section, optionally rewrites each bullet point to match the JD, then assembles them into an ordered tailored resume. |
| `agents/writer_agent.py` | `WriterAgent` | Constructs a detailed LLM prompt with style instructions, strict rules, a few-shot example, and the tailored resume + company info. Parses the JSON response into cover letter, email subject, and email body. Has a full fallback template if generation fails. |
| `agents/sending_agent.py` | `SendingAgent` | Reads the user's original resume PDF from disk, encodes it as a base64 attachment, builds an HTML email, and dispatches it via the Resend API. Detects PDF vs DOCX via file magic bytes. |

### 5.3 Backend — API Routes

| File | Prefix | Endpoints |
|---|---|---|
| `api/routes/auth.py` | `/api/auth` | `POST /register`, `POST /login`, `GET /me`, `PUT /update` |
| `api/routes/resume.py` | `/api/resume` | `POST /upload`, `GET /active` |
| `api/routes/hunt.py` | `/api/hunt` + `/api/generate` + `/api/send` + `/api/applications` | `POST /start`, `GET /stream/{job_id}`, `GET /preferences`, `POST /generate/{id}`, `POST /send/{id}`, `GET /applications`, `PUT /applications/{id}/status`, `DELETE /applications/{id}`, `POST /applications/check-replies`, `POST /webhooks/resend` |
| `api/routes/community.py` | `/api/community` | `GET /posts`, `POST /posts`, `POST /posts/{id}/like` |
| `api/routes/settings.py` | `/api/settings` | `GET /`, `PUT /`, `DELETE /field/{name}` |
| `api/routes/analytics.py` | `/api/analytics` | `GET /` |

### 5.4 Backend — Utilities

| File | Purpose |
|---|---|
| `utils/encryption.py` | Fernet symmetric encryption/decryption for API keys stored in MongoDB. Uses `SECRET_KEY` from env. |
| `utils/enrichment.py` | `enrich_company()` — takes a company dict, finds its website (via SearchAgent), scrapes homepage + /contact + /about for emails and career links, extracts meta description. Results cached in `ENRICHMENT_CACHE` dict. |
| `utils/imap_monitor.py` | `check_replies_for_user()` — connects to Gmail IMAP, searches last 30 days of emails, checks `In-Reply-To` and `References` headers against stored Resend `message_id`s, updates application status to "replied". |

### 5.5 Frontend — Pages & Routes

| File | Route | Description |
|---|---|---|
| `routes/index.tsx` | `/` | Landing page (unauthenticated) or Analytics Dashboard (authenticated) |
| `routes/hunt.tsx` | `/hunt` | The main hunt interface — setup form → 4-column Kanban dashboard (Protected) |
| `routes/applications.tsx` | `/applications` | Application tracker with status management (Protected) |
| `routes/community.tsx` | `/community` | Social feed for tips, wins, and rants (Protected) |
| `routes/settings.tsx` | `/settings` | User settings: LLM provider, API keys, email config (Protected) |
| `routes/profile.tsx` | `/profile` | User profile view/edit (Protected) |
| `routes/login.tsx` | `/login` | Login form |
| `routes/register.tsx` | `/register` | Registration form |
| `routes/feedback.tsx` | `/feedback` | Feedback submission form |
| `routes/__root.tsx` | (layout) | Root layout: Navbar, Footer, Toaster, Providers, LLM status dropdown |

### 5.6 Frontend — Shared Components

| Component | File | Purpose |
|---|---|---|
| `ProtectedRoute` | `components/ProtectedRoute.tsx` | Redirects to `/login` if no authenticated user |
| `MobileMenu` | `components/MobileMenu.tsx` | Slide-in mobile navigation panel |
| `RichTextEditor` | `components/RichTextEditor.tsx` | Inline text editor for cover letters/emails |
| `StatCard` | `components/StatCard.tsx` | Reusable metric card with icon, value, and subtext |
| `ThemeToggle` | `components/ThemeToggle.tsx` | Dark/Light mode toggle |

### 5.7 Frontend — Context & State

| Context | File | Provides |
|---|---|---|
| `AuthContext` | `context/AuthContext.tsx` | `user`, `token`, `loading`, `login()`, `register()`, `logout()`, `updateUserPreferences()`. State hydrated from `localStorage` on mount, synced with `GET /api/auth/me`. |
| `ThemeContext` | `context/ThemeContext.tsx` | `theme` (dark/light), `toggleTheme()`. Persisted in `localStorage`. Applied as class on `<html>`. |

### 5.8 Frontend — API Client Layer

| File | Purpose |
|---|---|
| `utils/apiClient.ts` | Base `apiCall()` function — prepends `BASE_URL`, attaches `Bearer` token from localStorage, sets `Content-Type: application/json` (except for FormData). Throws on non-OK responses with parsed error detail. |
| `api/client.ts` | Domain-specific API functions: `uploadResume()`, `startHunt()`, `generateForCompany()`, `sendApplication()`, `getAnalytics()`, etc. Supports `USE_MOCK` mode (toggled with Ctrl+Shift+X) that uses `mockClient.ts` for offline development. |
| `api/mockClient.ts` | Mock implementations returning dummy data for development without a backend |

---

## 6. Database Schema Map

### MongoDB Collections

#### `users`
```json
{
  "_id": ObjectId,
  "email": "user@example.com",        // unique index
  "password": "$2b$10$...",            // bcrypt hash
  "name": "John Doe",
  "preferences": { "role": "...", "location": "..." },
  "hunt_preferences": {
    "role": "...", "location": "...", "mode": "...",
    "company_size": "...", "company_type": "...",
    "writing_style": "...", "max_results": 10
  },
  "preferred_llm": "auto",
  "ollama_url": "http://localhost:11434",
  "gemini_api_key": "gAAAAA...",       // Fernet encrypted
  "groq_api_key": "gAAAAA...",         // Fernet encrypted
  "openrouter_api_key": "gAAAAA...",   // Fernet encrypted
  "resend_api_key": "gAAAAA...",       // Fernet encrypted
  "gmail_address": "user@gmail.com",
  "gmail_app_password": "gAAAAA..."    // Fernet encrypted
}
```

#### `resumes`
```json
{
  "_id": ObjectId,
  "user_id": "string",                // index
  "filename": "resume.pdf",
  "summary": "first 500 words...",
  "sections_found": ["Experience", "Skills", "Projects"],
  "chunks_count": 12,
  "is_active": true,
  "uploaded_at": ISODate
}
```

#### `hunt_sessions`
```json
{
  "_id": ObjectId,
  "user_id": "string",                // index
  "role": "Full Stack Developer",
  "location": "Bangalore",
  "mode": "job_listings",
  "company_size": "any",
  "company_type": "any",
  "writing_style": "casual",
  "max_results": 10,
  "status": "started" | "done",
  "created_at": ISODate
}
```

#### `companies`
```json
{
  "_id": "uuid-string",
  "hunt_id": "string",                // compound index with user_id
  "user_id": "string",
  "company": "Tech Corp",
  "job_title": "Backend Engineer",
  "website": "https://techcorp.com",
  "career_page": "https://techcorp.com/careers",
  "hr_email": "hr@techcorp.com",
  "description": "...",
  "company_description": "...",
  "apply_url": "https://...",
  "source": "cold_outreach" | "indeed_rss" | "naukri_scrape" | ...,
  "score": 7,
  "type": "cold_outreach" | "job_listing",
  "status": "ready" | "generated" | "applied",
  "cover_letter": "...",
  "email_body": "...",
  "subject": "...",
  "tailored_resume": "...",
  "llm_provider": "gemini",
  "unverified": false
}
```

#### `applications`
```json
{
  "_id": ObjectId,
  "user_id": "string",                // index
  "company_id": "uuid-string",
  "company_name": "Tech Corp",
  "job_title": "Backend Engineer",
  "applied_at": ISODate,
  "last_updated": ISODate,
  "status": "applied" | "viewed" | "replied" | "interview" | "rejected" | "failed",
  "status_history": [
    { "status": "applied", "timestamp": ISODate, "source": "manual" },
    { "status": "viewed", "timestamp": ISODate, "source": "auto_resend" },
    { "status": "replied", "timestamp": ISODate, "source": "auto_imap" }
  ],
  "message_id": "resend-message-id",
  "llm_provider": "gemini",
  "cover_letter": "...",
  "email_body": "...",
  "subject": "...",
  "tailored_resume": "...",
  "website": "...",
  "hr_email": "...",
  "apply_url": "...",
  "score": 7
}
```

#### `community_posts`
```json
{
  "_id": ObjectId,
  "user_id": "string",
  "username": "HungryDev_42",
  "text": "Got a callback from a startup!",
  "tag": "Win 🏆",
  "likes_count": 24,
  "likes": ["user_id_1", "user_id_2"],
  "created_at": ISODate                // index (descending)
}
```

### ChromaDB Collection

```
Collection: "resume_chunks"
Metadata: {"hnsw:space": "cosine"}
Path: ./data/resume_db (PersistentClient)

Each document:
  - id: UUID string
  - document: chunk text (up to 300 words)
  - embedding: 384-dimensional float vector
  - metadata: { "section": "Experience", "chunk_index": 0 }
```

---

## 7. API Reference (Complete)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create account → returns JWT |
| `POST` | `/api/auth/login` | No | Login → returns JWT + triggers IMAP scan |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `PUT` | `/api/auth/update` | Yes | Update role/location preferences |
| `POST` | `/api/resume/upload` | Yes | Upload PDF → process → embed → store |
| `GET` | `/api/resume/active` | Yes | Get active resume metadata |
| `GET` | `/api/hunt/preferences` | Yes | Get saved hunt preferences |
| `POST` | `/api/hunt/start` | Yes | Start a new hunt → returns job_id for SSE |
| `GET` | `/api/hunt/stream/{job_id}` | Yes* | SSE stream of discovered companies |
| `POST` | `/api/generate/{company_id}` | Yes | Generate tailored resume + cover letter |
| `POST` | `/api/send/{company_id}` | Yes | Send application email via Resend |
| `GET` | `/api/applications` | Yes | List all applications (last 100) |
| `PUT` | `/api/applications/{id}/status` | Yes | Update application status |
| `DELETE` | `/api/applications/{id}` | Yes | Delete an application |
| `POST` | `/api/applications/check-replies` | Yes | Trigger IMAP reply scan |
| `GET` | `/api/community/posts` | No | Fetch last 50 community posts |
| `POST` | `/api/community/posts` | Yes | Create a community post |
| `POST` | `/api/community/posts/{id}/like` | Yes | Toggle like on a post |
| `GET` | `/api/settings` | Yes | Get user settings (keys masked) |
| `PUT` | `/api/settings` | Yes | Update settings (keys encrypted) |
| `DELETE` | `/api/settings/field/{name}` | Yes | Remove a settings field |
| `GET` | `/api/analytics` | Yes | Get application analytics |
| `GET` | `/api/llm/status` | Optional | Get active LLM provider info |
| `GET` | `/api/status` | No | Check if resume is ready |
| `GET` | `/api/user/profile` | No | Get Gmail address from .env |
| `POST` | `/api/feedback` | No | Submit feedback |
| `POST` | `/api/webhooks/resend` | No** | Resend webhook for email events |

\* Auth via `?token=` query parameter (EventSource doesn't support headers)
\** Verified via Svix webhook signature

---

## 8. Configuration & Environment

### Environment Variables (`.env`)

| Variable | Required | Used By | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes (for Gemini) | `core/llm_router.py` | Google Gemini API key |
| `GROQ_API_KEY` | No | `core/llm_router.py` | Groq API key |
| `OPENROUTER_API_KEY` | No | `core/llm_router.py` | OpenRouter API key |
| `OLLAMA_BASE_URL` | No | `core/llm_router.py` | Local Ollama URL (default: localhost:11434) |
| `MONGODB_URI` | Yes | `core/database.py` | MongoDB connection string |
| `MONGODB_DB` | Yes | `core/database.py` | Database name (default: agentapply) |
| `JWT_SECRET` | Yes | `core/auth.py` | JWT signing secret |
| `SECRET_KEY` | Yes | `utils/encryption.py` | Fernet encryption key for API keys in DB |
| `RESEND_API_KEY` | Yes (for email) | `agents/sending_agent.py` | Resend email API key |
| `RESEND_FROM_ADDRESS` | Yes (for email) | `agents/sending_agent.py` | Email sender address |
| `RESEND_WEBHOOK_SECRET` | No | `api/routes/hunt.py` | Svix webhook verification secret |
| `GOOGLE_CSE_API_KEY` | No | `agents/search_agent.py` | Google Custom Search API key |
| `GOOGLE_CSE_ID` | No | `agents/search_agent.py` | Google Custom Search Engine ID |
| `BING_SEARCH_API_KEY` | No | `agents/search_agent.py` | Bing Search API key |

### Hardcoded Defaults (`config/settings.py`)

| Constant | Value | Description |
|---|---|---|
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | SentenceTransformer model for embeddings |
| `CHROMA_DB_PATH` | `./data/resume_db` | ChromaDB persistent storage path |
| `CHUNK_SIZE` | `300` | Words per chunk |
| `CHUNK_OVERLAP` | `50` | Overlapping words between chunks |
| `MAX_SEARCH_RESULTS` | `50` | Maximum search results from DDGS |
| `EMAIL_DELAY_SECONDS` | `30` | Delay between emails (rate limiting) |
| `JWT_EXPIRE_HOURS` | `24` | JWT token expiry |

---

*This document was auto-generated from a deep analysis of the ApplyAgent codebase. Last updated: July 2026.*
