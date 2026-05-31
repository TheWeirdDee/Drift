from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue
)
import os
from dotenv import load_dotenv

load_dotenv()

COLLECTION_NAME = "drift_entries"
VECTOR_SIZE = 384

_client = None
_is_local = False

def get_client() -> AsyncQdrantClient:
    global _client
    if _client is None:
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        qdrant_api_key = os.getenv("QDRANT_API_KEY", None)
        if qdrant_url and ("qdrant.io" in qdrant_url or "localhost" not in qdrant_url):
            print(f"Connecting to remote Qdrant: {qdrant_url}")
            _client = AsyncQdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=5.0)
        else:
            print("Using local persistent Qdrant (qdrant_db)")
            _client = AsyncQdrantClient(path="qdrant_db")
    return _client


async def init_collection():
    """Create the Qdrant collection if it doesn't exist."""
    global _client, _is_local
    client = get_client()
    try:
        # Test connection
        collections = await client.get_collections()
    except Exception as e:
        print(f"Failed to connect to remote Qdrant: {e}")
        print("Falling back to local persistent Qdrant (qdrant_db)")
        _client = AsyncQdrantClient(path="qdrant_db")
        client = _client
        _is_local = True
        collections = await client.get_collections()

    names = [c.name for c in collections.collections]

    if COLLECTION_NAME not in names:
        await client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )
        print(f"Created Qdrant collection: {COLLECTION_NAME}")
    else:
        print(f"Collection {COLLECTION_NAME} already exists.")


async def upsert_entry(
    entry_id: str,
    vector: list[float],
    text: str,
    timestamp: str,
    source: str,
    title: str
):
    """Store a journal entry vector in Qdrant."""
    client = get_client()
    await client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=entry_id,
                vector=vector,
                payload={
                    "text": text,
                    "timestamp": timestamp,
                    "source": source,
                    "title": title
                }
            )
        ]
    )


async def search_similar(
    vector: list[float],
    limit: int = 5,
    exclude_id: str = None
) -> list[dict]:
    """Find nearest neighbors in vector space."""
    client = get_client()

    response = await client.query_points(
        collection_name=COLLECTION_NAME,
        query=vector,
        limit=limit + (1 if exclude_id else 0),
        with_payload=True
    )
    results = response.points

    output = []
    for r in results:
        if exclude_id and str(r.id) == exclude_id:
            continue
        output.append({
            "id": str(r.id),
            "text": r.payload.get("text", ""),
            "timestamp": r.payload.get("timestamp", ""),
            "source": r.payload.get("source", "text"),
            "title": r.payload.get("title", ""),
            "score": round(r.score, 4)
        })

    return output[:limit]


async def get_all_entries() -> list[dict]:
    """Retrieve all entries for constellation rendering."""
    client = get_client()

    # Scroll through entire collection
    results, _ = await client.scroll(
        collection_name=COLLECTION_NAME,
        limit=1000,
        with_payload=True,
        with_vectors=True
    )

    output = []
    for point in results:
        output.append({
            "id": str(point.id),
            "text": point.payload.get("text", ""),
            "timestamp": point.payload.get("timestamp", ""),
            "source": point.payload.get("source", "text"),
            "title": point.payload.get("title", ""),
            "vector": point.vector
        })

    return output
