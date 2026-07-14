# ApplyAgent — The Interview Bible

> **Purpose**: This document covers every concept, technology, pattern, and design decision used in ApplyAgent. It is structured as interview preparation material — each section explains the "what", "why", and "how", followed by potential interview questions with project-specific answers.

---

## Table of Contents

1. [Tech Stack Deep Dive](#1-tech-stack-deep-dive)
2. [Architecture & Design Patterns](#2-architecture--design-patterns)
3. [RAG (Retrieval-Augmented Generation)](#3-rag-retrieval-augmented-generation)
4. [Vector Databases & Embeddings](#4-vector-databases--embeddings)
5. [LLM Integration & Prompt Engineering](#5-llm-integration--prompt-engineering)
6. [Authentication & Security](#6-authentication--security)
7. [Real-Time Communication (SSE)](#7-real-time-communication-sse)
8. [Database Design (MongoDB)](#8-database-design-mongodb)
9. [Web Scraping & Search](#9-web-scraping--search)
10. [Concurrency & Async Programming](#10-concurrency--async-programming)
11. [Email Delivery & Webhook Systems](#11-email-delivery--webhook-systems)
12. [Frontend Architecture](#12-frontend-architecture)
13. [DevOps & Deployment](#13-devops--deployment)
14. [Data Structures & Algorithms Used](#14-data-structures--algorithms-used)
15. [Comprehensive Interview Q&A](#15-comprehensive-interview-qa)

---

## 1. Tech Stack Deep Dive

### 1.1 FastAPI (Backend Framework)

**What it is**: A modern, high-performance Python web framework built on top of Starlette (for web parts) and Pydantic (for data validation). It provides automatic OpenAPI documentation, type checking, and native async support.

**Why it was chosen for this project**:
- **Async-first**: The entire backend uses `async/await` with Motor (async MongoDB driver). FastAPI's native async support means database calls don't block the event loop.
- **Pydantic models**: Request bodies are validated automatically. For example, `SearchRequest` in `api/routes/hunt.py` guarantees type safety:
  ```python
  class SearchRequest(BaseModel):
      role: str
      location: str
      max_results: int
      mode: Optional[str] = "job_listings"
  ```
- **Dependency Injection**: Authentication is handled via `Depends(get_current_user)` — a single decorator that extracts and validates the JWT from any request.
- **StreamingResponse**: Native support for Server-Sent Events, used for the real-time hunt stream.
- **Lifespan events**: `@app.on_event("startup")` initializes the database and indexes.

**Key concepts to know**:
- **ASGI vs WSGI**: FastAPI is ASGI (Asynchronous Server Gateway Interface), meaning it can handle concurrent requests without threading (unlike Flask's WSGI).
- **Uvicorn**: The ASGI server that actually runs FastAPI. It uses `uvloop` for high-performance event loops.
- **APIRouter**: Used to modularize routes (`router = APIRouter(prefix="/api/auth", tags=["auth"])`).

---

### 1.2 React + Vite + TanStack Router (Frontend)

**What they are**:
- **React 18**: UI library for building component-based interfaces.
- **Vite**: Next-generation build tool — uses ESBuild for dev and Rollup for production, resulting in ~10x faster HMR than Webpack.
- **TanStack Router**: Type-safe, file-based routing for React. Each file in `routes/` becomes a route.
- **TanStack Query**: Data fetching and caching library (used via `QueryClientProvider`).

**Why this stack**:
- **Vite** provides instant hot module replacement (HMR) during development — critical for rapid UI iteration.
- **TanStack Router** provides file-based routing with full TypeScript type safety, route-level `head()` for SEO meta tags, and built-in error/404 components.
- **Tailwind CSS** provides utility-first styling with a custom design system (terracotta, sage, sand color palette).

**How routing works in this project**:
- `routes/__root.tsx` defines the root layout (Navbar, Footer, Providers).
- `routes/index.tsx` handles `/`.
- `routes/hunt.tsx` handles `/hunt`.
- `createFileRoute("/hunt")` creates the route definition with `head()` metadata and `component`.
- Protected routes wrap content in `<ProtectedRoute>`, which checks `useAuth().user`.

---

### 1.3 MongoDB + Motor (Primary Database)

**What it is**: MongoDB is a document-oriented NoSQL database. Motor is its async Python driver.

**Why MongoDB**:
- **Flexible schema**: Application data varies widely — a company might have an HR email or not, a hunt might have a writing style or not. MongoDB's schemaless documents avoid empty columns.
- **Nested documents**: Status history is stored as an array within the application document — no need for a separate table/join.
- **Aggregation pipelines**: Used for analytics (grouping by status, counting by date range, etc.).

**How it's used in this project**:
- **Connection**: `AsyncIOMotorClient(MONGODB_URI)` with 5-second timeout (`core/database.py`)
- **Indexes created at startup**: unique email index, compound indexes for efficient queries
- **Pattern**: Global `db` variable initialized once at startup, accessed via `get_db()`

---

### 1.4 ChromaDB (Vector Database)

**What it is**: An open-source embedding database purpose-built for AI applications. It stores document chunks alongside their vector embeddings and supports similarity search.

**Why ChromaDB**:
- **PersistentClient**: Data survives server restarts (stored at `./data/resume_db`)
- **Cosine similarity**: Configured via `metadata={"hnsw:space": "cosine"}` — ideal for semantic similarity between text embeddings
- **Simple API**: `collection.add(documents, embeddings, metadatas, ids)` and `collection.query(query_embeddings, n_results)`
- **HNSW index**: Uses Hierarchical Navigable Small World graphs for approximate nearest neighbor search — O(log n) query time

---

### 1.5 SentenceTransformers (Embedding Model)

**What it is**: A Python library built on top of Hugging Face Transformers that provides pre-trained models for generating sentence embeddings.

**Model used**: `all-MiniLM-L6-v2`
- **Architecture**: 6-layer MiniLM (distilled from a larger BERT model)
- **Output dimension**: 384 floats
- **Speed**: ~14,000 sentences/second on GPU, ~2,000 on CPU
- **Quality**: State-of-the-art for sentence similarity tasks, despite being small

**How it's used**:
```python
# core/embedder.py
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
embedding = model.encode("Some text")  # Returns numpy array of 384 floats
```

---

### 1.6 LangChain (LLM Orchestration)

**What it is**: A framework for building LLM-powered applications. Provides standardized interfaces for different LLM providers.

**How it's used in this project** — primarily as a **unified LLM interface**:
```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

# All expose the same .invoke(prompt) → response.content interface
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", ...)
response = llm.invoke("Your prompt here")
text = response.content
```

**Why LangChain**: It abstracts away provider-specific API differences. Switching from Gemini to Groq requires changing one line, not rewriting the entire generation pipeline.

---

## 2. Architecture & Design Patterns

### 2.1 Multi-Agent Architecture

**Pattern**: The backend uses a **pipeline of specialized agents**, each handling one step of the application process.

```
ResumeProcessor → SearchAgent/JobListingAgent → ShortlisterAgent
                                                       ↓
                                        TailorAgent → WriterAgent → SendingAgent
```

**Why this pattern**:
- **Single Responsibility**: Each agent does one thing well. `SearchAgent` only searches, `WriterAgent` only writes.
- **Composability**: Agents can be tested independently (each has a `__main__` block for standalone testing).
- **Swappability**: The search strategy can change (RSS vs scraping) without affecting downstream agents.

**Design Decision**: Agents are **not** LangChain Agents (autonomous tool-using agents). They are plain Python classes with deterministic control flow. The LLM is invoked only for specific tasks (requirement extraction, rewriting, generation), not for decision-making about what to do next. This provides:
- **Predictability**: No hallucinated tool calls or infinite loops.
- **Speed**: Direct function calls are faster than agent reasoning chains.
- **Cost**: Fewer LLM tokens consumed.

---

### 2.2 Multi-Provider LLM Fallback Chain

**Pattern**: The `get_llm()` function in `core/llm_router.py` implements a **cascading fallback chain**:

```
User preference → Ollama (local) → Gemini (cloud) → Groq (cloud) → OpenRouter (cloud) → None
```

**How it works**:
1. Check user's `preferred_llm` setting first
2. If that fails (or is set to "auto"), try each provider in order
3. Each `try_*()` function checks for API key availability and (for Ollama) network reachability
4. Ollama status is **cached for 15 seconds** to avoid blocking timeouts
5. Cloud-deployed instances skip localhost Ollama entirely (`if "RENDER" in os.environ`)

**Design Decision**: Users can bring their own API keys (stored encrypted in MongoDB) or fall back to server-provided keys. This supports both self-hosted and SaaS deployment models.

---

### 2.3 Producer-Consumer Queue Pattern (SSE)

**Pattern**: The hunt stream uses a classic **producer-consumer** architecture:

```
Producer (background thread)     Consumer (SSE endpoint)
         │                                │
         ▼                                ▼
    queue.Queue() ──────────────── async polling (200ms)
         │                                │
    .put(company)                    .get() → yield SSE
    .put({"status": "done"})         → close stream
```

**Why this pattern**:
- The search operations (web scraping, DDGS queries) are **blocking I/O** that would block FastAPI's async event loop if run directly.
- By running them in a **separate thread** and communicating via a thread-safe `queue.Queue()`, the async SSE endpoint can poll without blocking.
- The `asyncio.run_coroutine_threadsafe()` bridge allows the background thread to perform async MongoDB operations on the main event loop.

---

### 2.4 Lazy Loading / Singleton Pattern

**Pattern**: Several expensive resources are lazily initialized:

```python
# core/embedder.py — Lazy singleton
_default_embedder = None
def get_embedder():
    global _default_embedder
    if _default_embedder is None:
        _default_embedder = Embedder()  # Loads ~90MB model
    return _default_embedder

# agents/resume_processor.py — Lazy property
@property
def chroma_client(self):
    if self._chroma_client is None:
        self._chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return self._chroma_client
```

**Why**: The SentenceTransformer model is ~90MB and takes 2-3 seconds to load. ChromaDB initialization also has overhead. Loading them on first use rather than at import time keeps server startup fast.

---

### 2.5 Strategy Pattern (Search Modes)

**Pattern**: The hunt supports two search strategies selected at runtime:

```python
if request.mode == "job_listings":
    listing_agent = JobListingAgent()
    listing_agent.search_stream(...)
else:
    search_agent = SearchAgent()
    search_agent.search_stream(...)
```

Both agents share the same interface: `search_stream(role, location, resume_summary, callback)` and use `ShortlisterAgent` for scoring. The strategy is selected based on user input.

---

### 2.6 Optimistic UI Updates

**Pattern**: The LLM provider dropdown in the Navbar uses **optimistic updates**:

```javascript
// 1. Instantly update UI state
setStatus(prev => ({ ...prev, active_provider: provider }));
setIsOpen(false);

// 2. Perform backend update in background
await apiCall("/api/settings", { method: "PUT", body: ... });

// 3. Re-sync with actual backend state
fetchStatus();

// 4. Rollback on failure
catch (e) { setStatus(previousStatus); }
```

**Why**: This makes the UI feel instant. The user doesn't wait for the network round-trip to see the change.

---

## 3. RAG (Retrieval-Augmented Generation)

### 3.1 What is RAG?

**RAG** is a technique that enhances LLM outputs by first **retrieving** relevant context from a knowledge base, then **generating** a response grounded in that context. It solves two key problems:
1. **Hallucination**: The LLM is restricted to facts from the retrieved documents.
2. **Context limits**: Instead of feeding the entire resume into the LLM, only the most relevant chunks are selected.

### 3.2 How RAG Works in This Project

```
Job Description
    │
    ▼
[1] Requirement Extraction (LLM)
    "Given this JD, extract 3-5 specific requirements as a JSON array"
    → ["3+ years Python", "REST API experience", "PostgreSQL knowledge"]
    │
    ▼
[2] Multi-Query Vector Search
    For each requirement:
        embed_text(requirement) → 384-dim vector
        ChromaDB.query(vector, n_results=3) → top 3 matching resume chunks
    │
    ▼
[3] Merge & Deduplicate
    - Deduplicate by exact text (case-insensitive)
    - Sort by cosine distance (lower = more similar)
    - Take top 5 unique chunks
    │
    ▼
[4] Categorize & Rewrite
    - Each chunk is categorized: summary, experience, skills, projects, other
    - LLM rewrites each chunk to highlight skills relevant to the JD
    │
    ▼
[5] Assemble
    - Chunks are ordered: summary → experience → skills → projects → other
    - Each chunk gets its section header in UPPERCASE
    - Combined into a single tailored resume string
    │
    ▼
[6] Generation (LLM)
    - The tailored resume + company info feeds into the WriterAgent prompt
    - LLM generates: cover_letter, email_subject, email_body
```

### 3.3 Why Multi-Query RAG?

The project uses `query_multi()` instead of a simple single-query approach. Here's why:

**Problem with single-query**: If you embed the entire JD and query ChromaDB once, you get chunks semantically close to the *overall* meaning, which might miss specific requirements.

**Multi-query advantage**: By extracting individual requirements and querying separately, you ensure each specific skill/requirement has a corresponding resume chunk, even if those chunks are semantically distant from each other.

**Example**: A JD asking for "Python + Kubernetes + Agile" might retrieve 3 Python chunks with a single query (because the resume heavily mentions Python). Multi-query would retrieve 1 Python chunk + 1 Kubernetes chunk + 1 Agile chunk.

---

## 4. Vector Databases & Embeddings

### 4.1 What are Embeddings?

An embedding is a **dense numerical representation** of text in a continuous vector space. Semantically similar texts have vectors that are close together in this space.

**Example**:
```
"Python developer with Flask experience" → [0.12, -0.45, 0.78, ..., 0.33]  (384 floats)
"Backend engineer who works with Python"  → [0.11, -0.43, 0.76, ..., 0.31]  (close in space)
"Professional pastry chef"                → [0.89, 0.22, -0.67, ..., -0.45] (far away)
```

### 4.2 Cosine Similarity

**Formula**: `cos(θ) = (A · B) / (||A|| × ||B||)`

- Returns a value between -1 and 1 (or 0 to 1 for normalized vectors)
- 1 = identical meaning, 0 = unrelated, -1 = opposite meaning
- **Why cosine over Euclidean distance?** Cosine similarity is invariant to vector magnitude — it only cares about direction. This means "Python developer" and "PYTHON DEVELOPER WITH 10 YEARS" would have similar cosine similarity despite different vector magnitudes.

**In this project**: ChromaDB is configured with `{"hnsw:space": "cosine"}`. The `distances` returned by queries are cosine distances (1 - cosine_similarity), so **lower is more similar**.

### 4.3 HNSW (Hierarchical Navigable Small World)

**What it is**: The indexing algorithm used by ChromaDB for approximate nearest neighbor (ANN) search.

**How it works** (simplified):
1. Build a multi-layer graph where each node is an embedding.
2. Top layers have fewer, long-range connections (for coarse search).
3. Bottom layers have many short-range connections (for fine-grained search).
4. Search starts at the top layer and navigates down, progressively narrowing.

**Time complexity**: O(log n) for search vs O(n) for brute-force comparison.

### 4.4 Chunking Strategy

**Why chunk?** The embedding model has a token limit (~128 tokens for MiniLM), and embedding an entire resume would lose granularity. A chunk about "Python experience" and a chunk about "leadership skills" should be independently retrievable.

**This project's strategy**:
- **Chunk size**: 300 words (configurable in `config/settings.py`)
- **Overlap**: 50 words between consecutive chunks
- **Section-aware**: Chunks are created per-section (Experience chunks, Skills chunks, etc.), preserving section boundaries
- **Metadata**: Each chunk stores its `section` name and `chunk_index`

**Why overlap?** Without overlap, a key sentence at a chunk boundary would be split in half, losing meaning. A 50-word overlap ensures sentences spanning the boundary appear in both chunks.

---

## 5. LLM Integration & Prompt Engineering

### 5.1 Provider Abstraction

The `get_llm()` function returns a `(llm, provider_name)` tuple. All providers expose the same `.invoke(prompt)` interface via LangChain:

| Provider | Model | Library | Latency | Cost |
|---|---|---|---|---|
| Ollama | llama3.2:1b | `langchain_ollama` | ~2s (local) | Free |
| Gemini | gemini-1.5-flash | `langchain_google_genai` | ~3s | Free tier |
| Groq | llama-3.1-8b-instant | `langchain_groq` | ~1s | Free tier |
| OpenRouter | mistral-7b-instruct:free | `langchain_openai` | ~3s | Free |

### 5.2 Prompt Engineering Techniques Used

#### 5.2.1 Structured Output Prompting
The WriterAgent prompt demands a specific JSON format:
```
Return ONLY a valid JSON object — no markdown, no preamble.
```
And provides the exact schema:
```json
{
  "cover_letter": "...",
  "email_subject": "...",
  "email_body": "..."
}
```

#### 5.2.2 Few-Shot Learning
A complete example JSON is included in the prompt (lines 67-71 of `writer_agent.py`). This grounds the LLM's output format and tone.

#### 5.2.3 Negative Constraints (Banned Phrases)
```
Banned phrases (never use): "I am passionate about", "leverage", "synergy",
"I would love the opportunity", "please find attached", "to whom it may concern",
"I am writing to express"
```
This prevents generic, corporate-sounding output.

#### 5.2.4 Style Parameterization
Three writing styles with distinct instructions:
- **Casual**: "Use contractions. Vary sentence length. Sound like you're talking to a person."
- **Formal**: "Full sentences, no contractions. Show respect for the company's work."
- **Assertive**: "Lead every paragraph with an achievement. Do not apologise for gaps."

#### 5.2.5 Grounding Constraints
```
Use ONLY skills and experiences present in RESUME CONTEXT.
Never invent roles, titles, metrics, or companies.
```
This is the anti-hallucination safeguard.

#### 5.2.6 Robust JSON Parsing
The code handles malformed LLM output gracefully:
```python
# Strip markdown fences
cleaned = re.sub(r'^```[a-zA-Z]*\n', '', raw_response)
cleaned = re.sub(r'\n```$', '', cleaned)
# Extract JSON block even if surrounded by text
match = re.search(r'\{.*\}', cleaned, re.DOTALL)
```

---

## 6. Authentication & Security

### 6.1 JWT (JSON Web Tokens)

**What it is**: A compact, URL-safe token format for securely transmitting claims between parties.

**Structure**: `header.payload.signature`
- **Header**: `{"alg": "HS256", "typ": "JWT"}`
- **Payload**: `{"sub": "user_id", "exp": 1719936000}`
- **Signature**: `HMAC-SHA256(base64(header) + "." + base64(payload), secret_key)`

**How it's used in this project**:
```python
# Creating a token (core/auth.py)
payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(hours=24)}
token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# Validating a token
payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
user_id = payload["sub"]
```

**Why JWT over session cookies**: JWTs are **stateless** — the server doesn't need to store session data. The token itself contains all necessary information. This simplifies scaling (no shared session store needed) and works well with SPAs that make API calls from JavaScript.

### 6.2 bcrypt (Password Hashing)

**What it is**: An adaptive hash function based on the Blowfish cipher, specifically designed for password storage.

**Key properties**:
- **Salt**: Automatically generates a random 128-bit salt per password, preventing rainbow table attacks.
- **Work factor**: The `rounds` parameter (set to 10 in this project) controls computational cost. Each increment doubles the time.
- **One-way**: You cannot reverse a bcrypt hash to get the original password.

```python
# Hashing (registration)
salt = bcrypt.gensalt(rounds=10)        # ~4x faster than default 12
hashed = bcrypt.hashpw(pwd_bytes, salt)

# Verification (login)
is_valid = bcrypt.checkpw(plain_bytes, hashed_bytes)
```

### 6.3 Fernet Encryption (API Key Storage)

**What it is**: A symmetric encryption scheme from the `cryptography` library that guarantees that a message encrypted using it cannot be manipulated or read without the key.

**Why it's needed**: Users can store their personal API keys (Gemini, Groq, Resend) in MongoDB. These must be encrypted at rest to prevent exposure if the database is compromised.

```python
from cryptography.fernet import Fernet
fernet = Fernet(SECRET_KEY.encode())

# Encrypt before storing
encrypted = fernet.encrypt(value.encode()).decode()  # Store this in MongoDB

# Decrypt when needed
decrypted = fernet.decrypt(encrypted.encode()).decode()  # Use this for API calls
```

**Key difference from hashing**: Encryption is **reversible** (you can decrypt to get the original value). Hashing is **one-way**. Passwords should be hashed (you never need the original). API keys must be encrypted (you need the original to make API calls).

### 6.4 SSE Authentication Challenge

**Problem**: The `EventSource` API (used for SSE) does not support custom headers. You cannot send `Authorization: Bearer <token>`.

**Solution**: Pass the token as a query parameter:
```javascript
const streamUrl = `http://localhost:8000/api/hunt/stream/${job_id}?token=${token}`;
const eventSource = new EventSource(streamUrl);
```

Backend fallback in `get_current_user()`:
```python
token = request.query_params.get("token")  # Fallback for EventSource
```

---

## 7. Real-Time Communication (SSE)

### 7.1 What is SSE?

**Server-Sent Events (SSE)** is a standard protocol for servers to push data to web clients over HTTP. Unlike WebSockets, SSE is:
- **Unidirectional**: Server → Client only
- **HTTP-based**: Works through proxies and load balancers without special configuration
- **Auto-reconnecting**: The browser automatically reconnects if the connection drops

**Format**:
```
data: {"company": "Tech Corp", "score": 8}\n\n
data: {"company": "Startup Inc", "score": 6}\n\n
data: {"status": "done"}\n\n
```

### 7.2 SSE vs WebSockets — Why SSE for This Project?

| Feature | SSE | WebSockets |
|---|---|---|
| Direction | Server → Client | Bidirectional |
| Protocol | HTTP | WS (custom) |
| Reconnection | Automatic | Manual |
| Proxies/LBs | Just works | Needs config |
| Complexity | Simple | More complex |

**Why SSE is the right choice here**: The hunt stream is inherently one-directional — the server discovers companies and pushes them to the client. The client never needs to send data back through this channel (it uses REST for that). SSE is simpler, more reliable through CDNs/proxies, and sufficient.

### 7.3 Implementation in This Project

**Backend** (`api/routes/hunt.py`):
```python
async def event_generator():
    while True:
        while q.empty():
            await asyncio.sleep(0.2)  # Non-blocking poll
        item = q.get()
        if item.get("status") == "done":
            yield f"data: {json.dumps(item)}\n\n"
            break
        yield f"data: {json.dumps(item)}\n\n"

return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Frontend** (`front-end/src/api/client.ts`):
```javascript
const eventSource = new EventSource(streamUrl);
eventSource.onmessage = (event) => {
    const company = JSON.parse(event.data);
    if (company.status === "done") {
        eventSource.close();
        onDone();
    } else {
        onCompany(company);
    }
};
```

---

## 8. Database Design (MongoDB)

### 8.1 Document Model vs Relational Model

**Why MongoDB's document model suits this project**:

1. **Variable schemas**: A company from LinkedIn RSS has different fields than one from cold outreach scraping. Documents naturally accommodate this.
2. **Embedded arrays**: `status_history` is an array within the application document — no need for a `status_changes` junction table.
3. **Read-heavy workload**: The application tracker reads entire application records at once — document databases serve this in a single read.

### 8.2 Indexing Strategy

From `core/database.py`:
```python
await db.users.create_index("email", unique=True)       # Login lookup
await db.resumes.create_index("user_id")                 # Get user's resumes
await db.hunt_sessions.create_index("user_id")           # Get user's hunts
await db.companies.create_index([("hunt_id", 1), ("user_id", 1)])  # Compound
await db.community_posts.create_index([("created_at", -1)])        # Sort by newest
await db.applications.create_index("user_id")            # Get user's apps
await db.applications.create_index("status")             # Filter by status
await db.applications.create_index([("user_id", 1), ("applied_at", -1)])  # User + sort
```

**Why these indexes matter**:
- Without the `email` unique index, login would be a full collection scan O(n).
- The compound index `(user_id, applied_at)` supports the "get my applications sorted by date" query in a single index scan.

### 8.3 Aggregation Pipelines

The analytics endpoint uses MongoDB's aggregation framework:
```python
pipeline_status = [
    {"$match": {"user_id": current_user_id}},
    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
]
```
This is the MongoDB equivalent of `SELECT status, COUNT(*) FROM applications WHERE user_id = ? GROUP BY status` in SQL.

### 8.4 Atomic Operations

Like/unlike uses MongoDB atomic operators:
```python
# Like (atomic)
await db.community_posts.update_one(
    {"_id": oid},
    {
        "$addToSet": {"likes": current_user_id},  # Prevents duplicates
        "$inc": {"likes_count": 1}                 # Atomic increment
    }
)
```

`$addToSet` is a set operation — it only adds the value if it's not already present, preventing double-likes without a separate uniqueness check.

---

## 9. Web Scraping & Search

### 9.1 Search Strategy

The project implements a **three-tier search fallback**:
1. **Google Custom Search Engine (CSE)** — highest quality results but requires an API key
2. **Bing Search API** — good fallback, requires an API key
3. **DuckDuckGo Search (DDGS)** — always free, no API key needed

This is implemented in `_unified_search()` in `search_agent.py`:
```python
results = self._search_google(query, num)
if results: return results
results = self._search_bing(query, num)
if results: return results
# DDGS fallback...
```

### 9.2 Web Scraping Techniques

**Tools used**: `requests` for HTTP + `BeautifulSoup4` for HTML parsing.

**Techniques applied**:
1. **User-Agent spoofing**: All requests use a Chrome User-Agent string to avoid bot detection.
2. **Career page detection**: Links are scanned for keywords ("careers", "jobs", "join us") in anchor text.
3. **Path probing**: HEAD requests to `/careers`, `/jobs`, `/about/careers` to find career pages without full page loads.
4. **Email extraction**: Dual strategy — `mailto:` links first (most reliable), then regex pattern matching on page text.
5. **Email prioritization**: Emails are scored: +10 for matching company domain, +5 for HR-related keywords.

### 9.3 Rate Limiting & Politeness

- `time.sleep(random.uniform(0.5, 1.5))` between DDGS results to avoid rate limiting
- HTTP timeouts (5s for GET, 3s for HEAD) to prevent hanging on slow servers
- `requests.Timeout` and `requests.ConnectionError` caught separately from general exceptions

### 9.4 Blocklist Pattern

A set of domains is blocked from search results:
```python
BLOCKED_DOMAINS = {
    "linkedin.com", "indeed.com", "glassdoor.com", "naukri.com", ...
}
```
This prevents job board aggregator pages from appearing as "companies" — the system wants direct company websites for cold outreach.

---

## 10. Concurrency & Async Programming

### 10.1 Async/Await (Python)

**What it is**: Python's coroutine-based concurrency model. `async def` defines a coroutine, `await` pauses execution until an I/O operation completes, freeing the event loop for other tasks.

**How it's used**:
- All FastAPI route handlers are `async def`
- MongoDB operations use `await db.collection.find_one(...)` (Motor)
- Multiple independent queries run in parallel via `asyncio.gather()`:
```python
(total, by_status, recent, ...) = await asyncio.gather(
    db.applications.count_documents(...),
    db.applications.aggregate(pipeline_status).to_list(20),
    db.applications.aggregate(pipeline_recent).to_list(1),
    ...
)
```

### 10.2 Threading (for Blocking I/O)

**Problem**: Web scraping and DDGS searches are blocking I/O operations that would freeze the async event loop.

**Solution**: Run blocking operations in background threads:
```python
# Hunt search runs in a background thread
thread = threading.Thread(target=background_search)
thread.start()

# Search queries run in a thread pool
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    futures = [executor.submit(_run_query, q) for q in queries]
```

### 10.3 Thread-to-Async Bridge

The background search thread needs to write to MongoDB (which requires the async event loop). This is solved with:
```python
def run_db_call(coro):
    future = asyncio.run_coroutine_threadsafe(coro, main_loop)
    return future.result()  # Block until the coroutine completes
```

`asyncio.run_coroutine_threadsafe()` schedules a coroutine on the main event loop from a different thread and returns a `concurrent.futures.Future`.

### 10.4 IMAP in Executor

The IMAP monitor uses `loop.run_in_executor()` to run blocking IMAP operations without blocking the async event loop:
```python
matches = await loop.run_in_executor(None, run_imap)
```
`None` uses the default `ThreadPoolExecutor`.

---

## 11. Email Delivery & Webhook Systems

### 11.1 Resend API

**What it is**: A modern email API service (alternative to SendGrid/Mailgun). Provides a simple REST API for sending transactional emails.

**How it's used**:
```python
resend.api_key = api_key
params = {
    "from": from_address,
    "to": recipient,
    "subject": subject,
    "html": html_body,
    "attachments": [{"filename": "Resume.pdf", "content": base64_encoded}]
}
response = resend.Emails.send(params)
```

### 11.2 Webhook Verification (Svix)

**What it is**: Resend uses Svix for webhook delivery. Each webhook request includes a signature that must be verified to prevent spoofing.

```python
from svix.webhooks import Webhook, WebhookVerificationError

wh = Webhook(secret)
payload = wh.verify(payload_bytes, headers)  # Raises on invalid signature
```

### 11.3 IMAP Protocol

**What it is**: Internet Message Access Protocol — a standard protocol for reading emails from a mail server.

**How it's used for reply detection**:
1. Connect to `imap.gmail.com:993` via SSL
2. Login with Gmail App Password
3. Search for emails from the last 30 days
4. For each email, read `In-Reply-To` and `References` headers
5. Match these headers against stored Resend `message_id`s
6. If a match is found, the recipient replied to our application email

---

## 12. Frontend Architecture

### 12.1 State Management Strategy

The frontend uses a **no-global-store** approach:

| State Type | Solution | Example |
|---|---|---|
| Auth state | React Context (`AuthContext`) | User object, JWT token |
| Theme state | React Context (`ThemeContext`) | Dark/light mode |
| Server data | TanStack Query | Analytics, applications list |
| Page state | Local `useState` | Hunt cards, form fields |
| Persistent state | `localStorage` | Hunt progress, preferences |

**Why no Redux/Zustand**: The application's state is naturally scoped — hunt cards belong to the hunt page, auth belongs everywhere. Context handles the "everywhere" case; local state handles the rest.

### 12.2 Client-Side Persistence

The hunt page persists its entire state in `localStorage`:
```javascript
useEffect(() => {
    localStorage.setItem('agentapply_hunt_state', JSON.stringify(cards));
}, [cards]);
```

This means if the user refreshes the page or navigates away, they return to the exact same hunt state — all cards, all generated content, all progress is preserved.

### 12.3 Dev Mode (Mock API)

A hidden feature toggled with `Ctrl+Shift+X`:
```javascript
const USE_MOCK = localStorage.getItem('devMode') === 'true';

export const uploadResume = async (file: File) => {
    if (USE_MOCK) return mockClient.uploadResume(file);
    // ...real API call...
};
```

This allows frontend development without a running backend.

### 12.4 API Client Architecture

Two-layer architecture:
1. **`utils/apiClient.ts`** — Generic `apiCall()` function handling auth headers, content type, error parsing
2. **`api/client.ts`** — Domain-specific functions (`uploadResume`, `startHunt`, etc.) that use `apiCall()`

This separates cross-cutting concerns (auth, base URL, error handling) from business logic.

---

## 13. DevOps & Deployment

### 13.1 CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Any origin (dev-friendly, tighten for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**What is CORS?** Cross-Origin Resource Sharing — a browser security mechanism that blocks requests from one domain to another unless the server explicitly allows it. The frontend runs on `localhost:5173`, the backend on `localhost:8000` — different ports = different origins.

### 13.2 Environment-Aware Configuration

The LLM router skips localhost Ollama on cloud deployments:
```python
if "RENDER" in os.environ and ("localhost" in base_url or "127.0.0.1" in base_url):
    return None  # Skip — there's no local Ollama on Render
```

### 13.3 Keep-Alive Mechanism

A GitHub Actions workflow pings the deployed backend periodically to prevent cold starts on free-tier hosting (like Render's free tier which spins down after 15 minutes of inactivity).

---

## 14. Data Structures & Algorithms Used

### 14.1 Priority Queue (Email Scoring)

Emails found during scraping are scored and sorted:
```python
prioritized = []
for email in emails_found:
    score = 0
    if company_domain in email.lower(): score += 10
    if any(kw in email.lower() for kw in ['hr', 'career', 'recruit']): score += 5
    prioritized.append((score, email))
prioritized.sort(key=lambda x: x[0], reverse=True)
best_email = prioritized[0][1]
```

### 14.2 Set-Based Deduplication

Company deduplication during search:
```python
seen_companies = set()
comp_key = company.lower()
if comp_key not in seen_companies:
    seen_companies.add(comp_key)
    results.append(...)
```
O(1) lookup and insertion — critical when processing hundreds of search results.

### 14.3 Sliding Window Chunking

The resume chunking algorithm:
```python
i = 0
while i < len(words):
    chunk = " ".join(words[i:i + CHUNK_SIZE])
    chunks.append(chunk)
    i += CHUNK_SIZE - CHUNK_OVERLAP  # Slide by (300 - 50) = 250 words
```
This is a classic sliding window with stride < window size, ensuring overlapping coverage.

### 14.4 Heuristic Classification (Section Detection)

The section header detector uses a multi-feature heuristic:
```python
is_header = (
    len(words) <= 5 and
    len(line) <= 40 and
    (line.isupper() or line.istitle()) and
    not line.endswith(('.', ',', ';', ':')) and
    not any(c.isdigit() for c in line) and
    not any(w.endswith('ing') for w in words)
)
```
This avoids the need for an NLP model to identify resume sections — a lightweight heuristic that works reliably for standard resume formats.

### 14.5 Location Expansion Graph

The `_get_expanded_locations()` method implements a simple adjacency map:
```python
near_map = {
    "ahmedabad": ["gujarat", "mumbai", "india"],
    "noida": ["delhi ncr", "delhi", "gurgaon", "india"],
    ...
}
```
If the primary location yields few results, the system expands to nearby locations and tries again. This is a form of query expansion.

---

## 15. Comprehensive Interview Q&A

### Category: Architecture & Design

**Q: Why did you choose a multi-agent architecture instead of a single monolithic pipeline?**

A: Each agent has a single responsibility — `SearchAgent` only searches, `WriterAgent` only generates text. This makes the system easier to test (each agent has its own `__main__` test block), easier to debug (I can trace issues to a specific agent), and easier to extend (adding a new search source means modifying only `SearchAgent` or creating a new agent). It also allows different concurrency strategies per agent — the search agents run in threads while the tailor/writer agents run synchronously.

---

**Q: How does your LLM fallback chain work, and why is it designed this way?**

A: The `get_llm()` function tries providers in order: Ollama (local) → Gemini → Groq → OpenRouter. Each provider is wrapped in a `try_*()` function that checks API key availability and connectivity. Ollama status is cached for 15 seconds to avoid blocking timeouts. On cloud deployments (detected via `RENDER` in env), localhost Ollama is skipped entirely. Users can override the auto-selection by setting a preferred provider. The chain ensures the system always has an LLM available — if the user's local Ollama is down, it seamlessly falls back to a cloud provider.

---

**Q: Why did you use SSE instead of WebSockets for the hunt stream?**

A: The hunt stream is inherently unidirectional — the server discovers companies and pushes them to the client. The client never sends data through this channel (it uses separate REST endpoints for actions like generate and send). SSE is simpler to implement, works through proxies and CDNs without special configuration, and automatically reconnects on connection drops. WebSockets would add unnecessary complexity for a use case that doesn't require bidirectional communication.

---

**Q: How do you handle the async/sync boundary in the hunt search?**

A: The search operations (web scraping, DDGS queries) are blocking I/O that would freeze FastAPI's async event loop. I run them in a background `threading.Thread`. When the thread needs to write to MongoDB (which requires async), I use `asyncio.run_coroutine_threadsafe(coro, main_loop)` to schedule the coroutine on the main event loop and block until it completes. Communication between the thread and the SSE endpoint uses a thread-safe `queue.Queue()`.

---

### Category: RAG & Embeddings

**Q: Explain your RAG pipeline step by step.**

A: When a user clicks "Generate" for a company, the system first uses the LLM to extract 3-5 specific requirements from the job description as a JSON array. Each requirement is independently embedded using the `all-MiniLM-L6-v2` model (384-dimensional vectors) and used to query ChromaDB, retrieving the top 3 most similar resume chunks per requirement. The results are merged, deduplicated by exact text, and sorted by cosine distance. The top 5 unique chunks are categorized by section (experience, skills, projects, etc.), optionally rewritten by the LLM to better match the JD keywords, and assembled into a tailored resume. This tailored resume then feeds into the WriterAgent's prompt to generate the cover letter and email.

---

**Q: Why multi-query RAG instead of a single query?**

A: A single-query approach would embed the entire JD and retrieve chunks that are semantically close to the overall meaning. This biases towards the dominant theme — if the JD mentions Python 10 times and Kubernetes once, you'd get all Python chunks and miss Kubernetes. Multi-query extraction ensures each specific requirement (Python, Kubernetes, Agile) gets its own vector search, resulting in broader, more balanced coverage of the candidate's relevant experience.

---

**Q: Why `all-MiniLM-L6-v2` and not a larger model?**

A: It's the best trade-off between quality and speed for our use case. It produces 384-dimensional embeddings (vs 768 for larger models), making ChromaDB queries faster and storage smaller. It embeds at ~2,000 sentences/second on CPU — fast enough to embed a resume in real time. And its semantic similarity quality is sufficient for matching resume chunks to job requirements — we don't need the marginal accuracy improvement of a larger model for this domain-specific task.

---

### Category: Security

**Q: How do you handle authentication for SSE connections?**

A: The `EventSource` API doesn't support custom HTTP headers, so I can't send the JWT in an `Authorization` header. Instead, the token is passed as a query parameter: `?token=<jwt>`. The backend's `get_current_user()` function first checks the `Authorization` header, then falls back to `request.query_params.get("token")`. This is a well-known pattern for SSE authentication. In production, the connection runs over HTTPS, so the token is encrypted in transit.

---

**Q: How are user API keys stored securely?**

A: Users can store personal API keys (Gemini, Groq, Resend, etc.) in their settings. Before writing to MongoDB, each key is encrypted using Fernet symmetric encryption (`cryptography.fernet.Fernet`). The encryption key is a `SECRET_KEY` environment variable. When the keys are needed for API calls, they're decrypted on-the-fly. When displayed in the settings UI, they're masked to show only the last 4 characters. This means even if the database is compromised, the API keys are encrypted at rest.

---

**Q: Why bcrypt with rounds=10 instead of the default 12?**

A: The comment in the code says it all: "Set rounds to 10 to optimize performance on CPU-constrained servers (4x faster than default 12)". On free-tier cloud hosting (like Render), CPU is limited. Each bcrypt round doubles the computation time, so dropping from 12 to 10 makes hashing 4x faster while still providing 2^10 iterations — more than enough for password security. It's a pragmatic trade-off between security and server performance.

---

### Category: Database & Data

**Q: Why MongoDB instead of PostgreSQL?**

A: The data model is highly variable — a company discovered via RSS has different fields than one found via cold outreach. Application documents embed status history as arrays. User documents grow dynamically as settings are added. MongoDB's flexible document model handles this naturally without schema migrations or NULL-heavy columns. The aggregation framework handles analytics queries (grouping by status, counting by date range). And Motor provides first-class async support that integrates perfectly with FastAPI's async architecture.

---

**Q: How does your indexing strategy optimize queries?**

A: I created indexes during startup targeting the most frequent query patterns. The `email` unique index on `users` makes login O(log n). The compound index `(user_id, applied_at)` on `applications` supports the "get my applications sorted by date" query in a single index scan instead of a full collection scan + in-memory sort. The `(hunt_id, user_id)` compound index on `companies` supports fetching all companies for a specific hunt efficiently.

---

### Category: Frontend

**Q: How do you persist the hunt state across page refreshes?**

A: The entire `cards` array (all discovered companies, their status, generated content) is serialized to `localStorage` on every state change. When the hunt page mounts, it reads from `localStorage` to restore the previous state. Hunt preferences (role, location) are also stored separately. This means a user can close the browser, come back, and see exactly where they left off — without any backend session storage.

---

**Q: How does the dev mode / mock API work?**

A: Pressing `Ctrl+Shift+X` toggles a `devMode` flag in `localStorage`. All API client functions check this flag: if `USE_MOCK` is true, they return data from `mockClient.ts` instead of making real HTTP requests. This allows frontend development without a running backend — useful for UI iteration, testing edge cases, and demo purposes. The page reloads after toggling to ensure all components pick up the new mode.

---

### Category: Prompt Engineering

**Q: How do you prevent the LLM from hallucinating in cover letters?**

A: Three mechanisms: (1) The prompt explicitly states "Use ONLY skills and experiences present in RESUME CONTEXT. Never invent roles, titles, metrics, or companies." (2) The tailored resume provided as context contains only actual resume content — the LLM can't reference skills that aren't there. (3) A list of banned generic phrases ("I am passionate about", "leverage", etc.) prevents the LLM from falling back to filler when it doesn't have specific information. Additionally, the few-shot example demonstrates the expected specificity level.

---

**Q: How do you handle different writing tones?**

A: The WriterAgent accepts a `writing_style` parameter ("casual", "formal", "assertive"), each mapped to a detailed style instruction block. "Casual" says "Use contractions, vary sentence length, sound human." "Formal" says "Full sentences, no contractions, structured." "Assertive" says "Lead with achievements, active voice, metrics." The prompt says "Apply the STYLE INSTRUCTIONS strictly — they override default tone." This gives users control over how their applications sound.

---

### Category: System Design

**Q: How would you scale this system to handle 1000 concurrent users?**

A: Several changes would be needed: (1) Replace the in-memory `hunt_queues` dict with Redis Pub/Sub — the current approach stores queues in process memory, which doesn't survive restarts or scale across multiple workers. (2) Run search agents in Celery workers instead of Python threads — this provides proper task distribution and retry mechanisms. (3) Move ChromaDB to a dedicated server (Chroma supports client-server mode) — the current embedded mode locks to a single process. (4) Add connection pooling for MongoDB with Motor's built-in pool settings. (5) Deploy behind a load balancer with sticky sessions for SSE connections.

---

**Q: What are the potential failure points in this system?**

A: (1) **Search rate limiting**: DDGS, Google CSE, and website scraping can all be rate-limited or blocked. The system handles this with retries, fallbacks, and try/except at every level. (2) **LLM failures**: JSON parsing of LLM output can fail. The WriterAgent has a complete fallback template. (3) **Email delivery**: Resend can fail, emails can bounce. The system saves the application with status "failed" and the error message. (4) **ChromaDB single-process**: The embedded PersistentClient doesn't support concurrent writes from multiple processes. (5) **In-memory queue loss**: If the server restarts mid-hunt, active SSE streams and their queues are lost.

---

**Q: Walk me through what happens when I click "Start the Hunt" — from the button click to seeing the first company card.**

A: (1) The React `handleStart()` function calls `startHunt()` in the API client. (2) `startHunt()` POSTs to `/api/hunt/start` with the hunt parameters. (3) The backend creates a `hunt_sessions` document in MongoDB, generates a UUID `job_id`, creates an in-memory `Queue()`, and spawns a background thread for the search. It returns `{job_id}` immediately. (4) The frontend receives `job_id` and opens an `EventSource` to `/api/hunt/stream/{job_id}?token=...`. (5) Meanwhile, the background thread (depending on mode) starts the `JobListingAgent` or `SearchAgent`. (6) The agent fires parallel search queries (RSS feeds or DDGS/Google/Bing). (7) For each result, it's scored by `ShortlisterAgent._quick_score()`, saved to MongoDB `companies`, and pushed to the Queue. (8) The SSE endpoint polls the Queue every 200ms, picks up the company, and yields it as `data: {json}\n\n`. (9) The frontend's `onmessage` handler parses the JSON and calls `setCards(prev => [...prev, newCard])`, causing React to re-render with the new card in the "Searching" column. Total time from click to first card: typically 3-10 seconds, depending on search API response times.

---

*This document was auto-generated from a deep analysis of the ApplyAgent codebase. Last updated: July 2026.*
