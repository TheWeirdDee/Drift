import openai
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def transcribe_audio(audio_bytes: bytes, filename: str = "recording.webm") -> str:
    """Transcribe audio bytes using OpenAI Whisper API."""
    with tempfile.NamedTemporaryFile(suffix=f".{filename.split('.')[-1]}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp.flush()
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
        return response.text
    finally:
        import os as _os
        _os.unlink(tmp_path)
