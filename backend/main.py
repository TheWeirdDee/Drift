from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import numpy as np
from models import EntryCreate, EntryResponse, SimilarEntriesResponse
from embeddings import get_embedding
from qdrant_service import init_collection, upsert_entry, search_similar, get_all_entries
from transcribe import transcribe_audio
from drift_report import compute_drift_report
import uuid
from datetime import datetime

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_collection()
    yield

app = FastAPI(title="DRIFT API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    response = JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.get("/health")
async def health():
    return {"status": "alive", "service": "drift-api"}


@app.post("/entries", response_model=EntryResponse)
async def create_entry(entry: EntryCreate):
    """Create a new journal entry from text."""
    entry_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    vector = get_embedding(entry.text)

    await upsert_entry(
        entry_id=entry_id,
        vector=vector,
        text=entry.text,
        timestamp=timestamp,
        source="text",
        title=entry.title or ""
    )

    return EntryResponse(
        id=entry_id,
        text=entry.text,
        timestamp=timestamp,
        source="text",
        title=entry.title or "",
        vector_preview=vector[:5]
    )


@app.post("/entries/voice", response_model=EntryResponse)
async def create_voice_entry(file: UploadFile = File(...)):
    """Create a new journal entry from voice recording."""
    audio_bytes = await file.read()
    transcript = await transcribe_audio(audio_bytes, file.filename or "recording.webm")

    entry_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    vector = get_embedding(transcript)

    await upsert_entry(
        entry_id=entry_id,
        vector=vector,
        text=transcript,
        timestamp=timestamp,
        source="voice",
        title=""
    )

    return EntryResponse(
        id=entry_id,
        text=transcript,
        timestamp=timestamp,
        source="voice",
        title="",
        vector_preview=vector[:5]
    )


@app.get("/entries", response_model=list[EntryResponse])
async def list_entries():
    """Get all entries with their vectors for constellation rendering."""
    entries = await get_all_entries()
    return entries


@app.get("/entries/{entry_id}/similar")
async def get_similar_entries(entry_id: str, limit: int = 5):
    import traceback
    try:
        all_entries = await get_all_entries()
        target = next((e for e in all_entries if e["id"] == entry_id), None)
        if not target:
            raise HTTPException(status_code=404, detail=f"Entry {entry_id} not found in {len(all_entries)} entries")
        similar = await search_similar(
            vector=target["vector"],
            limit=limit + 1,
            exclude_id=entry_id
        )
        return {"source_id": entry_id, "similar": similar[:limit]}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/entries/batch")
async def create_batch_entries(entries: list[EntryCreate]):
    """Seed the database with demo data."""
    created = []
    for entry in entries:
        entry_id = str(uuid.uuid4())
        timestamp = entry.timestamp or datetime.utcnow().isoformat()
        vector = get_embedding(entry.text)
        await upsert_entry(
            entry_id=entry_id,
            vector=vector,
            text=entry.text,
            timestamp=timestamp,
            source="text",
            title=entry.title or ""
        )
        created.append(entry_id)
    return {"created": len(created), "ids": created}


@app.get("/report/weekly")
async def weekly_drift_report():
    """
    Generate the weekly drift report:
    - Center of gravity: the theme this week's entries orbit
    - Furthest drift: the most unusual thought this week
    - Echo: the older entry that resonates most with this week
    """
    all_entries = await get_all_entries()
    if len(all_entries) < 3:
        raise HTTPException(
            status_code=400,
            detail="Not enough entries yet. Write at least 3 entries to generate a report."
        )
    report = await compute_drift_report(all_entries)
    return report


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
