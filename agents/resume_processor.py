import os
import sys
import re
import uuid

# Ensure the parent directory is in sys.path so we can import from core and config when running as a script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Decoupled imports
from core.embedder import embed_batch, embed_text
from config.settings import CHROMA_DB_PATH, CHUNK_SIZE, CHUNK_OVERLAP

class ResumeProcessor:
    def __init__(self):
        """
        Initializes the ResumeProcessor. Chroma client and collection will be loaded lazily.
        """
        self._chroma_client = None
        self._collection = None

    @property
    def chroma_client(self):
        if self._chroma_client is None:
            import chromadb
            os.makedirs(CHROMA_DB_PATH, exist_ok=True)
            self._chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        return self._chroma_client

    @property
    def collection(self):
        if self._collection is None:
            self._collection = self.chroma_client.get_or_create_collection(
                name="resume_chunks",
                metadata={"hnsw:space": "cosine"}
            )
        return self._collection

    def _extract_text(self, pdf_path: str) -> str:
        """Extracts text using pypdf, falls back to pdfplumber, then pymupdf."""
        text = ""
        try:
            import pypdf
            with open(pdf_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pypdf extraction failed: {e}")
            
        if len(text.strip()) < 100:
            print("Falling back to pdfplumber...")
            text = "" # Reset text
            try:
                import pdfplumber
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                print(f"pdfplumber extraction failed: {e}")
                
        if len(text.strip()) < 100:
            print("Falling back to pymupdf...")
            text = "" # Reset text
            try:
                import fitz
                doc = fitz.open(pdf_path)
                text = '\n'.join([page.get_text() for page in doc])
            except Exception as e:
                print(f"pymupdf extraction failed: {e}")

        if len(text.strip()) < 100:
            raise ValueError('Could not extract text from PDF. The file may be scanned or corrupted.')
                
        return text

    def _clean_text_preserve_newlines(self, text: str) -> str:
        """Removes non-ASCII and extra horizontal spaces, but preserves newlines for header detection."""
        text = text.encode("ascii", "ignore").decode("ascii")
        text = re.sub(r'[ \t\r\f\v]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    def _clean_chunk(self, text: str) -> str:
        """Strips extra whitespace entirely."""
        return re.sub(r'\s+', ' ', text).strip()

    def _detect_sections(self, text: str) -> dict[str, str]:
        """Detects headers of the given resume and splits text into sections."""
        sections = {}
        current_header = "General"
        current_content = []
        
        lines = text.split('\n')
        for line in lines:
            cleaned_line = line.strip()
            if not cleaned_line:
                continue
            
            # Heuristic for header: < 5 words, < 40 chars, upper/title case, no trailing punctuation
            words = cleaned_line.split()
            is_short = len(words) <= 5 and len(cleaned_line) <= 40
            is_upper = cleaned_line.isupper()
            is_title = cleaned_line.istitle()
            no_punctuation = not cleaned_line.endswith(('.', ',', ';', ':'))
            
            # Additional filters for false positives
            starts_with_paren = cleaned_line.startswith('(') or cleaned_line.startswith('[')
            has_no_uppercase = not any(c.isupper() for c in cleaned_line)
            has_digits = any(c.isdigit() for c in cleaned_line)
            
            # Filter out activities (like "Playing Flute") and inline list formatting
            has_ing_verb = any(w.lower().endswith('ing') for w in words)
            has_list_punctuation = any(c in cleaned_line for c in ['|', ':', '•', '*', '-', '►'])
            
            is_false_positive = (
                starts_with_paren or 
                has_no_uppercase or 
                has_digits or 
                has_ing_verb or 
                has_list_punctuation
            )
            
            if is_short and (is_upper or is_title) and no_punctuation and len(cleaned_line) > 2 and not is_false_positive:
                # Store previous section
                if current_content:
                    existing = sections.get(current_header, "")
                    sections[current_header] = (existing + " " + " ".join(current_content)).strip()
                current_header = cleaned_line
                current_content = []
            else:
                current_content.append(cleaned_line)
                
        # Store last section
        if current_content:
            existing = sections.get(current_header, "")
            sections[current_header] = (existing + " " + " ".join(current_content)).strip()
            
        return sections

    def _chunk_text(self, text: str) -> list[str]:
        """Chunks section into pieces with overlap."""
        words = text.split()
        chunks = []
        if not words:
            return chunks
            
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + CHUNK_SIZE])
            chunks.append(chunk)
            i += CHUNK_SIZE - CHUNK_OVERLAP
            if CHUNK_SIZE <= CHUNK_OVERLAP:
                i += 1
        return chunks

    def _generate_summary(self, sections: dict[str, str]) -> str:
        """Generates a compressed resume summary."""
        summary_parts = []
        for header, content in sections.items():
            words = content.split()
            part = f"{header}: " + " ".join(words[:200])
            summary_parts.append(part)
        
        full_summary = " ".join(summary_parts)
        summary_words = full_summary.split()
        return " ".join(summary_words[:500])

    def process(self, pdf_path: str) -> dict:
        """
        Extracts, cleans, sections, chunks, embeds and stores resume text.
        Returns metadata about the processed resume.
        """
        raw_text = self._extract_text(pdf_path)
        text = self._clean_text_preserve_newlines(raw_text)
        sections = self._detect_sections(text)
        
        all_chunks = []
        all_metadatas = []
        all_ids = []
        
        for section, content in sections.items():
            cleaned_content = self._clean_chunk(content)
            chunks = self._chunk_text(cleaned_content)
            
            for idx, chunk in enumerate(chunks):
                if not chunk.strip():
                    continue
                all_chunks.append(chunk)
                all_metadatas.append({"section": section, "chunk_index": idx})
                all_ids.append(str(uuid.uuid4()))
                
        # Embed chunks and store in ChromaDB
        if all_chunks:
            embeddings = embed_batch(all_chunks)
            self.collection.add(
                documents=all_chunks,
                embeddings=embeddings,
                metadatas=all_metadatas,
                ids=all_ids
            )
            
        summary = self._generate_summary(sections)
        
        return {
            "chunks_count": len(all_chunks),
            "summary": summary,
            "sections_found": list(sections.keys())
        }

    def query(self, job_description: str, top_k: int = 5) -> list[dict]:
        """
        Embeds the JD and retrieves top-k similar chunks from ChromaDB.
        """
        jd_embedding = embed_text(job_description)
        results = self.collection.query(
            query_embeddings=[jd_embedding],
            n_results=top_k
        )
        
        formatted_results = []
        if results and "documents" in results and results["documents"] and results["documents"][0]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            dists = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)
            
            for doc, meta, dist in zip(docs, metas, dists):
                formatted_results.append({
                    "text": doc,
                    "section": meta.get("section", "Unknown"),
                    "score": dist
                })
                
        return formatted_results

    def query_multi(self, job_description: str, top_k: int = 5) -> list[dict]:
        """
        Extracts 3-5 key requirements from the JD using LLM, queries ChromaDB per requirement,
        merges, deduplicates, and returns top_k unique chunks.
        """
        from core.llm_router import get_llm
        import json
        
        requirements = []
        try:
            llm, provider = get_llm()
            prompt = (
                f"Given this job description, extract exactly 3-5 specific technical or experience requirements "
                f"as a JSON array of short strings (under 15 words each). Return ONLY the JSON array, nothing else.\n\n"
                f"Job Description: {job_description}"
            )
            response = llm.invoke(prompt)
            raw_response = response.content.strip()
            
            # strip markdown fences with regex
            cleaned = re.sub(r'^```[a-zA-Z]*\n', '', raw_response)
            cleaned = re.sub(r'\n```$', '', cleaned)
            cleaned = cleaned.strip()
            
            # extract JSON block
            match = re.search(r'\[.*\]', cleaned, re.DOTALL)
            if match:
                cleaned = match.group(0)
                
            requirements = json.loads(cleaned)
            if not isinstance(requirements, list):
                requirements = []
        except Exception as e:
            print(f"Warning: Failed to extract requirements using LLM: {e}")
            requirements = []

        # Fallback to chunking the JD if JSON parse or extraction fails
        if not requirements or not isinstance(requirements, list):
            print("Falling back to chunk-based queries...")
            words = job_description.split()
            if len(words) > 0:
                chunk_len = max(1, len(words) // 3)
                requirements = [
                    " ".join(words[i:i+chunk_len])
                    for i in range(0, len(words), chunk_len)
                ][:3]
            else:
                requirements = [job_description]

        results = []
        for req in requirements:
            if not req.strip():
                continue
            try:
                req_embedding = embed_text(req)
                res = self.collection.query(
                    query_embeddings=[req_embedding],
                    n_results=3
                )
                if res and "documents" in res and res["documents"] and res["documents"][0]:
                    docs = res["documents"][0]
                    metas = res["metadatas"][0]
                    dists = res["distances"][0] if "distances" in res and res["distances"] else [0.0] * len(docs)
                    
                    for doc, meta, dist in zip(docs, metas, dists):
                        results.append({
                            "text": doc,
                            "section": meta.get("section", "Unknown"),
                            "score": dist
                        })
            except Exception as e:
                print(f"Warning: Query failed for requirement '{req}': {e}")

        # Merge and deduplicate by exact chunk text
        seen_texts = set()
        unique_results = []
        for r in results:
            text_cleaned = r["text"].strip().lower()
            if text_cleaned not in seen_texts:
                seen_texts.add(text_cleaned)
                unique_results.append(r)

        # Sort by distance score (lower is more similar)
        unique_results.sort(key=lambda x: x["score"])

        return unique_results[:top_k]

    def is_ready(self) -> bool:
        """Checks if ChromaDB collection exists and has documents."""
        try:
            return self.collection.count() > 0
        except Exception:
            return False

if __name__ == '__main__':
    processor = ResumeProcessor()
    test_pdf = os.path.join(os.path.dirname(__file__), '..', 'data', 'resume.pdf')
    
    if os.path.exists(test_pdf):
        print(f"Processing {test_pdf}...")
        result = processor.process(test_pdf)
        print("--- Result ---")
        print(f"Chunks created: {result['chunks_count']}")
        print(f"Sections found: {result['sections_found']}")
        print(f"Summary: {result['summary']}")
    else:
        print(f"Test PDF not found at {test_pdf}. Please place a resume.pdf in the data folder to test.")
