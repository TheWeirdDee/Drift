import asyncio
import os
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams

load_dotenv()

COLLECTION_NAME = "drift_entries"
VECTOR_SIZE = 384

async def reset():
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY", None)

    print(f"Connecting to Qdrant at: {qdrant_url}")
    if qdrant_url and ("qdrant.io" in qdrant_url or "localhost" not in qdrant_url):
        client = AsyncQdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=10.0)
    else:
        client = AsyncQdrantClient(path="qdrant_db")

    try:
        collections = await client.get_collections()
        names = [c.name for c in collections.collections]
        if COLLECTION_NAME in names:
            print(f"Deleting existing collection '{COLLECTION_NAME}'...")
            await client.delete_collection(COLLECTION_NAME)
            print("Collection deleted.")
        
        print(f"Recreating collection '{COLLECTION_NAME}'...")
        await client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )
        print("Collection recreated successfully.")
    except Exception as e:
        print(f"Error resetting database: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(reset())
