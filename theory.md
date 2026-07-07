# Agent Apply - Interview & Theory Bible

This document contains all the theoretical concepts, computer science principles, and system design patterns used in the **Agent Apply** project. It is designed to act as a study guide for technical interviews regarding this repository.

---

## 1. Retrieval-Augmented Generation (RAG)

### What is RAG?
RAG is a technique that combines an LLM's generative capabilities with a traditional search engine. Instead of relying on the LLM's internal memory (which might hallucinate or lack personal context), RAG fetches relevant external documents and injects them into the prompt.

### How is it used in Agent Apply?
The `TailorAgent` uses RAG. It takes a Job Description, embeds it, and queries the ChromaDB database for the most mathematically similar chunks of the user's resume. It then feeds *only* those relevant chunks to the LLM to generate the Cover Letter, ensuring the AI only talks about real, relevant experiences and doesn't invent fake jobs.

---

## 2. Vector Databases & Embeddings

### What are Embeddings?
Embeddings are dense arrays of numbers (vectors) that represent the semantic meaning of text. Words with similar meanings will have vectors that are closer together in a high-dimensional space.
- **Tech Used**: `sentence-transformers` (HuggingFace).

### What is a Vector Database?
A specialized database designed to store, index, and query these high-dimensional vectors efficiently. 
- **Tech Used**: `ChromaDB`.
- **How it works here**: The `ResumeProcessor` embeds resume chunks and saves them in ChromaDB. When a Job Description is passed to `query()`, ChromaDB calculates the **Cosine Similarity** (or L2 distance) between the JD's vector and the resume vectors, returning the top K closest matches.

---

## 3. Large Language Models (LLMs) & Prompt Engineering

### Local vs. Cloud Models
- **Local (Ollama / llama3.2:1b)**: Runs entirely on your hardware (8GB RAM). It is private and free but lacks the deep reasoning capabilities and strict formatting adherence of massive models.
- **Cloud (Gemini 2.0 Flash)**: Requires an API key and internet. Much smarter and faster, but subject to rate limits (like the 429 errors encountered) and privacy concerns.
- **Router Pattern**: `core/llm_router.py` checks for the local model via a fast HTTP request to `/api/tags` and dynamically falls back to the cloud model to ensure system resilience.

### Prompt Engineering Techniques Used
- **Few-Shot Prompting**: Giving the LLM an `EXAMPLE OUTPUT` so it understands the expected format.
- **Constraint Prompting**: Strict rules like "exactly 3 paragraphs", "under 12 words", and "No markdown".
- **Defensive Parsing**: Because local models (like 1B parameters) hallucinate JSON formatting, the `WriterAgent` uses string slicing (`response.index('{')`) to violently rip the JSON object out of the surrounding conversational text.

---

## 4. Agentic Architecture

### What makes this an "Agent" system?
Instead of one massive script, the system is broken into highly decoupled, specialized "Agents" (`SearchAgent`, `ShortlisterAgent`, `TailorAgent`, `WriterAgent`). 
- **Separation of Concerns**: Each agent has one job and doesn't care how the others work. The `ShortlisterAgent` only cares about returning scores; it doesn't know about ChromaDB.
- **State Management**: The `dashboard/app.py` acts as the Orchestrator, passing state (`st.session_state`) linearly between the agents.

---

## 5. System Design & Error Handling

### API Rate Limiting
APIs have quotas. DuckDuckGo will block IPs that send too many requests too fast, and Gemini limits users to 15 Requests Per Minute (RPM) on the free tier.
- **Solution**: The `SearchAgent` uses `time.sleep(random.uniform(1.0, 2.0))` to simulate human browsing and avoid HTTP 429 (Too Many Requests) errors.

### Fallback Strategies (Graceful Degradation)
The system is built to survive failures:
1. **PDF Extraction**: Tries `PyPDF2` -> falls back to `pdfplumber` -> falls back to `pymupdf`.
2. **LLM Routing**: Tries Local Ollama -> falls back to Cloud Gemini.
3. **JSON Generation**: Tries to parse LLM JSON -> falls back to a hardcoded string template (`"Please find my resume attached..."`).

---

## 6. Potential Interview Questions

1. **"Why did you chunk the resume before storing it in the database?"**
   *Answer*: If I fed the entire resume into the LLM every time, it would consume too many tokens and dilute the context. By chunking it (300 words, 50-word overlap), the RAG pipeline can retrieve *only* the specific jobs or projects that match the current job description, saving tokens and improving focus.

2. **"How did you handle the local LLM failing to return valid JSON?"**
   *Answer*: Small 1B parameter models often wrap JSON in markdown or conversational text ("Here is your JSON..."). I implemented a dual-layer defense: first, regex to strip markdown fences, and second, string slicing to extract everything between the first `{` and the last `}`. Finally, if `json.loads()` still failed, I implemented a safe fallback dictionary.

3. **"Explain how your LLM Router works."**
   *Answer*: It acts as a Factory Pattern. Before returning an LLM object, it pings the local Ollama `/api/tags` endpoint with a 2-second timeout. If the server is up and the model exists, it returns a `ChatOllama` object. If the connection fails or times out, it gracefully instantiates a `ChatGoogleGenerativeAI` object instead.
