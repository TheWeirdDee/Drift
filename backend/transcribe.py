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
        if upload_res.status_code != 200:
            raise Exception(f"AssemblyAI upload failed ({upload_res.status_code}): {upload_res.text}")
        
        upload_data = upload_res.json()
        if "upload_url" not in upload_data:
            raise Exception(f"AssemblyAI upload response missing upload_url: {upload_data}")
        upload_url = upload_data["upload_url"]
        
        # Request transcript
        transcript_res = await client.post(
            "https://api.assemblyai.com/v2/transcript",
            headers={"authorization": ASSEMBLYAI_KEY},
            json={
                "audio_url": upload_url,
                "speech_models": ["universal-3-pro", "universal-2"]
            }
        )
        if transcript_res.status_code not in (200, 201):
            raise Exception(f"AssemblyAI transcript request failed ({transcript_res.status_code}): {transcript_res.text}")
            
        transcript_data = transcript_res.json()
        if "id" not in transcript_data:
            raise Exception(f"AssemblyAI transcript response missing id: {transcript_data}")
        transcript_id = transcript_data["id"]
        
        # Poll until done
        for _ in range(60):
            import asyncio
            await asyncio.sleep(2)
            poll = await client.get(
                f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                headers={"authorization": ASSEMBLYAI_KEY}
            )
            if poll.status_code != 200:
                raise Exception(f"AssemblyAI polling failed ({poll.status_code}): {poll.text}")
            result = poll.json()
            if result["status"] == "completed":
                return result["text"]
            if result["status"] == "error":
                raise Exception(f"Transcription failed: {result['error']}")
        
        raise Exception("Transcription timed out")
