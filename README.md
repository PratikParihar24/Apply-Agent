# ApplyAgent 🤖

> AI-powered job application automation — semantic resume parsing, intelligent company discovery, and personalized outreach generation at scale.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6B35?style=flat)](https://trychroma.com)
[![LangChain](https://img.shields.io/badge/LangChain-Framework-1C3C3C?style=flat)](https://langchain.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is ApplyAgent?

Job hunting is repetitive, slow, and demoralizing. ApplyAgent automates the mechanical parts — finding companies that are actually hiring, tailoring your resume to each role, writing personalized cover letters, and dispatching applications via email — so you can focus on the conversations that matter.

You upload your resume once. ApplyAgent handles the rest.

---

## ✨ Features

- **Semantic Resume Parsing** — Splits your PDF into section-aware chunks, embeds them with `sentence-transformers`, and stores them in ChromaDB for context-aware retrieval.
- **Intelligent Company Discovery** — Bypasses generic job boards. Uses targeted DuckDuckGo queries to find companies with active career pages and real HR contacts.
- **Real-time Hunt Stream** — Results stream live to your dashboard via Server-Sent Events (SSE) as companies are discovered and scored.
- **RAG-Powered Tailoring** — For each company, retrieves the most relevant resume chunks via vector similarity search and reconstructs a tailored resume aligned to the job description.
- **LLM-Generated Outreach** — Writes a personalized cover letter, email subject, and email body using Gemini — grounded strictly in your actual experience, not hallucinations.
- **One-Click Dispatch** — Generates PDF attachments on-the-fly and sends the full application package via Gmail SMTP.
- **Community Feed** — Share tips, wins, and referrals with other job seekers on the platform.
- **JWT Auth** — Secure registration, login, and session management.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│          (Vite + TanStack Router + Tailwind)             │
└──────────────────────┬──────────────────────────────────┘
                       │ REST + SSE
┌──────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend                        │
│         /auth   /resume   /hunt   /community             │
└────┬──────────────┬───────────────┬──────────────────────┘
     │              │               │
┌────▼────┐  ┌──────▼──────┐  ┌────▼────────────────────┐
│ MongoDB │  │  ChromaDB   │  │       Agent Layer        │
│ (users, │  │ (resume     │  │                          │
│  hunts, │  │  chunks,    │  │  SearchAgent             │
│  apps)  │  │  embeddings)│  │  ShortlisterAgent        │
└─────────┘  └─────────────┘  │  TailorAgent             │
                               │  WriterAgent (Gemini)    │
                               │  SendingAgent (SMTP)     │
                               └──────────────────────────┘
```

---

## 🔄 Application Flow

```
1. Upload Resume (PDF)
        │
        ▼
2. Parse → Section Detection → Chunking → Embedding → ChromaDB
        │
        ▼
3. Start Hunt (role + location)
        │
        ▼
4. SearchAgent → 6 parallel DDGS queries → filter job boards → extract HR emails
        │
        ▼
5. ShortlisterAgent → keyword match scoring (1–10) → SSE stream to dashboard
        │
        ▼
6. User selects company → POST /generate/{company_id}
        │
        ▼
7. TailorAgent → ChromaDB similarity query → reconstruct tailored resume
        │
        ▼
8. WriterAgent → Gemini prompt → Cover Letter + Email Subject + Email Body (JSON)
        │
        ▼
9. User reviews → POST /send/{company_id}
        │
        ▼
10. SendingAgent → generate PDFs → SMTP dispatch → MongoDB updated
```

---

## 🗂️ Project Structure

```
Agent-apply/
├── api/
│   ├── main.py                  # FastAPI entrypoint, CORS, startup
│   └── routes/
│       ├── auth.py              # Register, login, profile
│       ├── resume.py            # PDF upload + processing
│       ├── hunt.py              # SSE stream, generate, send
│       └── community.py        # Posts, likes
├── core/
│   ├── auth.py                  # JWT + bcrypt
│   ├── database.py              # MongoDB (Motor) connection + indexes
│   ├── embedder.py              # sentence-transformers wrapper
│   └── llm_router.py            # Gemini / Ollama fallback router
├── agents/
│   ├── resume_processor.py      # PDF parse → chunk → embed → ChromaDB
│   ├── search_agent.py          # Company discovery via DDGS
│   ├── shortlister_agent.py     # Fast keyword-based fit scoring
│   ├── tailor_agent.py          # RAG resume reconstruction
│   ├── writer_agent.py          # LLM cover letter + email generation
│   └── sending_agent.py         # PDF generation + SMTP dispatch
├── config/
│   └── settings.py              # All env vars + hardcoded defaults
├── front-end/
│   └── src/
│       ├── routes/              # index, hunt, profile, community, login
│       ├── components/          # Shared UI components
│       └── context/             # Auth context
├── data/                        # Resume PDFs + ChromaDB persistence
├── .env                         # Secret keys (not committed)
└── requirements.txt
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI (Python) |
| Frontend | React 18, Vite, TanStack Router, Tailwind CSS |
| Vector Database | ChromaDB |
| Embedding Model | `all-MiniLM-L6-v2` (sentence-transformers) |
| LLM | Google Gemini 2.0 Flash / 1.5 Flash (Ollama Mistral fallback) |
| LLM Orchestration | LangChain |
| Primary Database | MongoDB (Motor async driver) |
| Authentication | JWT (HS256) + bcrypt |
| Real-time | Server-Sent Events (SSE) |
| Email Dispatch | Gmail SMTP (SSL) |
| PDF Generation | fpdf |
| Web Scraping | DuckDuckGo Search (DDGS), BeautifulSoup4 |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB instance (local or Atlas)
- Google Gemini API key (free tier works)
- Gmail account with App Password enabled

### 1. Clone & install backend

```bash
git clone https://github.com/yourusername/agent-apply.git
cd Agent-apply

pip install -r requirements.txt
```

### 2. Configure environment

Create a `.env` file in the root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GMAIL_ADDRESS=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=applyagent
OLLAMA_BASE_URL=http://localhost:11434   # optional, only if using local LLM
```

> **Getting a Gmail App Password**: Google Account → Security → 2-Step Verification → App Passwords → Generate.

### 3. Start the backend

```bash
# Windows
start.bat

# Or manually
uvicorn api.main:app --reload --port 8000
```

### 4. Install & start the frontend

```bash
cd front-end
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:8000`.

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GMAIL_ADDRESS` | Yes | Gmail address for sending applications |
| `GMAIL_APP_PASSWORD` | Yes | Gmail App Password (not your login password) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB` | Yes | Database name |
| `OLLAMA_BASE_URL` | No | Local Ollama URL (fallback LLM) |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/update` | Update profile |

### Resume
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/resume/upload` | Upload and process PDF resume |
| GET | `/api/resume/active` | Get active resume metadata |

### Hunt
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/hunt/start` | Start a new hunt (role + location) |
| GET | `/api/hunt/stream/{job_id}` | SSE stream of discovered companies |
| POST | `/api/generate/{company_id}` | Generate tailored resume + cover letter |
| POST | `/api/send/{company_id}` | Dispatch application via email |

### Community
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/community/posts` | Fetch post feed |
| POST | `/api/community/posts` | Create a post |
| POST | `/api/community/posts/{post_id}/like` | Like a post |

---

## 🧠 How the RAG Pipeline Works

1. **Chunking**: Your resume is split into ~300-word chunks with 50-word overlaps, preserving section boundaries (Experience, Skills, Projects, etc.).
2. **Embedding**: Each chunk is embedded using `all-MiniLM-L6-v2` into a 384-dimensional vector.
3. **Storage**: Chunks and their vectors are persisted in ChromaDB under a collection keyed to your user ID.
4. **Retrieval**: When generating for a company, the job description is embedded and used to query ChromaDB. The top-k most semantically similar resume chunks are returned.
5. **Reconstruction**: Retrieved chunks are sorted by section type and assembled into a tailored resume that surfaces your most relevant experience for that specific role.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👤 Author

Built by [Pratik Parihar](https://github.com/PratikParihar24)

---

*If this helped you land a job, star the repo ⭐*
