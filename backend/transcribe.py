import httpx
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

ASSEMBLYAI_KEY = os.getenv("ASSEMBLYAI_API_KEY", "")

async def transcribe_audio(audio_bytes: bytes, filename: str = "recording.webm") -> str:
    if not ASSEMBLYAI_KEY:
        raise Exception("ASSEMBLYAI_API_KEY not set in .env")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Upload audio
        upload_res = await client.post(
            "https://api.assemblyai.com/v2/upload",
            headers={"authorization": ASSEMBLYAI_KEY},
            content=audio_bytes
        )
        upload_url = upload_res.json()["upload_url"]
        
        # Request transcript
        transcript_res = await client.post(
            "https://api.assemblyai.com/v2/transcript",
            headers={"authorization": ASSEMBLYAI_KEY},
            json={"audio_url": upload_url}
        )
        transcript_id = transcript_res.json()["id"]
        
        # Poll until done
        for _ in range(60):
            import asyncio
            await asyncio.sleep(2)
            poll = await client.get(
                f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                headers={"authorization": ASSEMBLYAI_KEY}
            )
            result = poll.json()
            if result["status"] == "completed":
                return result["text"]
            if result["status"] == "error":
                raise Exception(f"Transcription failed: {result['error']}")
        
        raise Exception("Transcription timed out")
