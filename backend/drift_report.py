"""
drift_report.py — Weekly Drift Report engine

Computes three insights from the constellation:
1. Center of gravity — what theme the week's entries orbit
2. Furthest drift — the most unusual thought this week
3. Echo — the oldest entry in the full constellation nearest to this week's center
"""

import os
import numpy as np
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _vec(v: list[float]) -> np.ndarray:
    return np.array(v, dtype=np.float32)


def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _centroid(vectors: list[list[float]]) -> np.ndarray:
    arr = np.array(vectors, dtype=np.float32)
    return arr.mean(axis=0)


async def _name_theme(entries_text: list[str]) -> str:
    """Ask LLM to name the gravitational theme of a set of entries in 6 words or fewer."""
    combined = "\n---\n".join(e[:300] for e in entries_text[:8])
    prompt = f"""These are journal entries written by one person this week:

{combined}

In 6 words or fewer, name the single underlying theme or feeling that connects these entries.
Be specific and human — not clinical. Not a label. A phrase.
Examples: "uncertainty about what comes next", "returning to the question of worth", "searching for stillness"
Reply with only the phrase, no punctuation, no quotes."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=30,
            temperature=0.4,
        )
        return response.choices[0].message.content.strip().strip('"').strip("'")
    except Exception as e:
        print(f"OpenAI API error in _name_theme: {e}. Falling back to heuristic.")
        # Simple dynamic heuristic: see if certain keywords appear
        text_lower = " ".join(entries_text).lower()
        if "work" in text_lower or "project" in text_lower or "build" in text_lower or "tabs" in text_lower:
            return "focus on work, ambition, and pressure"
        elif "friend" in text_lower or "mother" in text_lower or "people" in text_lower or "relationship" in text_lower:
            return "navigating connection and relationships"
        elif "change" in text_lower or "uncertain" in text_lower or "future" in text_lower:
            return "embracing uncertainty and personal change"
        else:
            return "reflection on daily focus and mindset"


async def _write_echo_insight(week_theme: str, echo_text: str, days_ago: int) -> str:
    """Write a single sentence connecting the week's theme to the echo entry."""
    prompt = f"""A person's journal this week centered on: "{week_theme}"

An older entry from {days_ago} days ago says:
"{echo_text[:400]}"

Write one sentence (max 20 words) connecting these two moments. 
Make it feel like a quiet revelation, not an observation. 
Do not use the word "theme". Do not start with "Both" or "You".
Reply with only the sentence."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip().strip('"')
    except Exception as e:
        print(f"OpenAI API error in _write_echo_insight: {e}. Falling back to default.")
        return f"A silent resonance with your thoughts about '{week_theme}' from earlier."



async def compute_drift_report(all_entries: list[dict]) -> dict:
    """
    Main function — takes all entries from Qdrant, returns the weekly report.
    
    all_entries: list of dicts with keys: id, text, title, timestamp, vector
    """
    if len(all_entries) < 3:
        return {"error": "Not enough entries to generate a report. Write at least 3 entries."}

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    # Split into this week vs older
    week_entries = []
    older_entries = []

    for e in all_entries:
        try:
            ts = datetime.fromisoformat(e["timestamp"].replace("Z", ""))
        except Exception:
            ts = now - timedelta(days=30)

        if ts >= week_ago:
            week_entries.append(e)
        else:
            older_entries.append(e)

    # If not enough this week, use the 7 most recent overall
    if len(week_entries) < 2:
        sorted_all = sorted(
            all_entries,
            key=lambda e: e["timestamp"],
            reverse=True
        )
        week_entries = sorted_all[:7]
        older_entries = sorted_all[7:]

    # ── 1. CENTER OF GRAVITY ──────────────────────────────────────────────────
    week_vectors = [e["vector"] for e in week_entries]
    centroid = _centroid(week_vectors)
    week_theme = await _name_theme([e["text"] for e in week_entries])

    # ── 2. FURTHEST DRIFT ────────────────────────────────────────────────────
    # Entry this week whose vector is furthest from the week's centroid
    distances = [
        (e, float(np.linalg.norm(_vec(e["vector"]) - centroid)))
        for e in week_entries
    ]
    furthest_entry = max(distances, key=lambda x: x[1])[0]

    # ── 3. ECHO ──────────────────────────────────────────────────────────────
    # Oldest entry in the full constellation nearest to this week's centroid
    if older_entries:
        similarities = [
            (e, _cosine_sim(_vec(e["vector"]), centroid))
            for e in older_entries
        ]
        echo_entry = max(similarities, key=lambda x: x[1])[0]

        # How long ago
        try:
            echo_ts = datetime.fromisoformat(echo_entry["timestamp"].replace("Z", ""))
            days_ago = max(1, (now - echo_ts).days)
        except Exception:
            days_ago = 30

        echo_insight = await _write_echo_insight(
            week_theme,
            echo_entry["text"],
            days_ago
        )
    else:
        echo_entry = None
        days_ago = 0
        echo_insight = None

    return {
        "generated_at": now.isoformat(),
        "week_entry_count": len(week_entries),
        "center_of_gravity": {
            "theme": week_theme,
            "entry_count": len(week_entries),
            "sample_entries": [
                {"id": e["id"], "title": e.get("title", ""), "text": e["text"][:200]}
                for e in week_entries[:3]
            ]
        },
        "furthest_drift": {
            "id": furthest_entry["id"],
            "title": furthest_entry.get("title", ""),
            "text": furthest_entry["text"],
            "timestamp": furthest_entry["timestamp"],
            "insight": "Your most singular thought this period — furthest from everything else you were thinking."
        },
        "echo": {
            "id": echo_entry["id"] if echo_entry else None,
            "title": echo_entry.get("title", "") if echo_entry else "",
            "text": echo_entry["text"] if echo_entry else "",
            "timestamp": echo_entry["timestamp"] if echo_entry else None,
            "days_ago": days_ago,
            "insight": echo_insight,
        } if echo_entry else None
    }
