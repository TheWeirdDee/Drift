import numpy as np

_model = None
_model_type = None

# Try loading fastembed (lightweight, for production Render)
# Fallback to sentence-transformers (for local environment if ONNX/fastembed has DLL issues)
try:
    from fastembed import TextEmbedding
    _model_type = "fastembed"
    print("Using fastembed engine.")
except Exception as e:
    print(f"fastembed import failed: {e}. Falling back to sentence-transformers.")
    try:
        from sentence_transformers import SentenceTransformer
        _model_type = "sentence-transformers"
        print("Using sentence-transformers engine.")
    except Exception as e2:
        print(f"Warning: both fastembed and sentence-transformers failed to import. Embeddings will not be available. {e2}")
        _model_type = None

def get_model():
    global _model, _model_type
    if _model_type is None:
        raise RuntimeError("No embedding engine is loaded.")
    
    if _model is None:
        print("Loading embedding model...")
        if _model_type == "fastembed":
            _model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        elif _model_type == "sentence-transformers":
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Model loaded.")
    return _model


def get_embedding(text: str) -> list[float]:
    """Convert text to a normalized 384-dim vector."""
    model = get_model()
    if _model_type == "fastembed":
        embeddings = list(model.embed([text]))
        return embeddings[0].tolist()
    else:
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()


def get_batch_embeddings(texts: list[str]) -> list[list[float]]:
    """Batch embed multiple texts efficiently."""
    model = get_model()
    if _model_type == "fastembed":
        embeddings = list(model.embed(texts))
        return [e.tolist() for e in embeddings]
    else:
        embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
        return [e.tolist() for e in embeddings]
