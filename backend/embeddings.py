from sentence_transformers import SentenceTransformer
import numpy as np

# Load model once at startup — 384-dimensional embeddings
_model = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print("Loading embedding model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Model loaded.")
    return _model


def get_embedding(text: str) -> list[float]:
    """Convert text to a normalized 384-dim vector."""
    model = get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def get_batch_embeddings(texts: list[str]) -> list[list[float]]:
    """Batch embed multiple texts efficiently."""
    model = get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return [e.tolist() for e in embeddings]
