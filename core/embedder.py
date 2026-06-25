from sentence_transformers import SentenceTransformer
from config.settings import EMBEDDING_MODEL

class Embedder:
    def __init__(self, model_name=EMBEDDING_MODEL):
        self.model = SentenceTransformer(model_name)

    def embed_text(self, text: str) -> list[float]:
        """Embed a single text string."""
        embedding = self.model.encode(text)
        return embedding.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of text strings."""
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

# Instantiate a default embedder
_default_embedder = Embedder()

def embed_text(text: str) -> list[float]:
    return _default_embedder.embed_text(text)

def embed_batch(texts: list[str]) -> list[list[float]]:
    return _default_embedder.embed_batch(texts)
