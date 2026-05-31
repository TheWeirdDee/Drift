# DRIFT — Master Plan
> *A mirror that shows you who you are becoming*

---

## What We're Building

A personal thinking journal where every entry (voice or text) is embedded into vector space and rendered as a living 3D constellation. Over time, the space reveals the hidden shape of how your mind moves — your clusters, your drift, your outliers.

**Core loop:**
1. User writes or speaks a journal entry
2. Entry is transcribed (if voice) and embedded into a vector
3. Vector stored in Qdrant with metadata
4. 3D constellation updates in real time
5. User can explore: click points, find similar entries, see their own patterns

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **Three.js** — 3D constellation rendering
- **Framer Motion** — page animations
- **Tailwind CSS** — utility styling
- **MediaRecorder API** — voice capture in browser

### Backend
- **FastAPI** (Python) — REST API
- **OpenAI Whisper API** — voice transcription
- **sentence-transformers** (`all-mpnet-base-v2`) — text embeddings (384-dim)
- **Qdrant** — vector storage + similarity search

### Infrastructure
- **Qdrant Cloud** (free tier) — hosted vector DB
- **Vercel** — frontend deployment
- **Railway or Render** — backend deployment
- `.env` files for all secrets

---

## Project Structure

```
drift/
├── frontend/                  # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page (animation heavy)
│   │   │   ├── journal/
│   │   │   │   └── page.tsx       # Journal entry page
│   │   │   └── constellation/
│   │   │       └── page.tsx       # 3D visualization page
│   │   ├── components/
│   │   │   ├── ConstellationCanvas.tsx   # Three.js 3D scene
│   │   │   ├── EntryRecorder.tsx         # Voice/text input
│   │   │   ├── EntryCard.tsx             # Entry detail panel
│   │   │   ├── SimilarEntries.tsx        # Nearest neighbors panel
│   │   │   └── LandingHero.tsx           # Animated landing
│   │   ├── hooks/
│   │   │   ├── useConstellation.ts       # Three.js logic
│   │   │   └── useVoiceRecorder.ts       # MediaRecorder hook
│   │   └── lib/
│   │       └── api.ts                    # Backend API calls
│   ├── package.json
│   └── .env.local
│
├── backend/                   # FastAPI app
│   ├── main.py                    # App entrypoint + routes
│   ├── embeddings.py              # Embedding logic
│   ├── qdrant_client.py           # Qdrant operations
│   ├── transcribe.py              # Whisper transcription
│   ├── models.py                  # Pydantic schemas
│   ├── requirements.txt
│   └── .env
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEMO_SCRIPT.md
│
├── README.md
└── MASTER_PLAN.md
```

---

## Build Phases

### Phase 1 — Foundation (Hours 1-4)
**Goal:** Qdrant connected, embeddings working, entries storing

- [ ] Set up Qdrant Cloud collection
- [ ] FastAPI skeleton with health check
- [ ] Embedding pipeline: text → vector
- [ ] POST /entries endpoint (store entry + vector)
- [ ] GET /entries endpoint (list all with vectors)
- [ ] GET /entries/similar/{id} (nearest neighbor search)
- [ ] Test with Postman/curl

### Phase 2 — Core Frontend (Hours 5-10)
**Goal:** 3D constellation rendering real data

- [ ] Next.js project setup
- [ ] Three.js ConstellationCanvas component
  - Points positioned by PCA-reduced 3D coords
  - Points colored by time (gradient cool→warm)
  - Click to select, hover to highlight
  - Orbit controls (drag to rotate)
  - Animated entry of new points
- [ ] EntryRecorder component (text + voice)
- [ ] Wire frontend → backend API
- [ ] Entries appear in constellation after submit

### Phase 3 — The Magic (Hours 11-15)
**Goal:** The demo moments that win

- [ ] Click a point → entry detail panel slides in
- [ ] "Find similar" → nearest neighbors highlight in constellation (connected by glowing lines)
- [ ] Cluster detection — visually group tight clusters with subtle halos
- [ ] Outlier detection — isolated points pulse differently
- [ ] Timeline scrubber — filter points by date range
- [ ] Seed demo data (30-50 pre-written entries loaded on first run)

### Phase 4 — Landing Page (Hours 16-18)
**Goal:** Speechless first impression

- [ ] Full-screen animated hero
- [ ] Floating particle constellation background (Three.js or CSS)
- [ ] Staggered text reveals
- [ ] "Enter DRIFT" CTA
- [ ] Scroll-triggered sections explaining the concept

### Phase 5 — Polish + Demo Prep (Hours 19-20)
**Goal:** Submission ready

- [ ] README.md with setup instructions
- [ ] Seed script with compelling demo data
- [ ] 3-minute demo video script
- [ ] Deploy frontend (Vercel) + backend (Railway)
- [ ] Final pass: animations, loading states, error handling

---

## The Demo Script (3 minutes)

**0:00-0:20** — Open the landing page. No words. Let the animation breathe. Then say: *"What if you could see yourself from the outside?"*

**0:20-0:50** — Show the empty constellation. Add a first entry live. Watch the first point appear. Then load the pre-seeded dataset. The constellation fills up. The room reacts.

**0:50-1:30** — Walk through the constellation. Point out a tight cluster. *"This person came back to the same thought 6 times across 3 weeks. They didn't know that."* Point out an outlier. *"This is the day everything shifted."*

**1:30-2:10** — Click a point. Read the entry. Click "Find similar." Watch the connecting lines light up. Show two entries from different weeks that are neighbors in vector space. Read them both. *"The model knew something the person didn't."*

**2:10-2:40** — Add a new entry live. Watch it land in the constellation. Notice where it falls. *"It already knows where this belongs."*

**2:40-3:00** — Back to the tagline: *"This is what Qdrant makes possible. Not search. Revelation."*

---

## Qdrant Usage (for judges)

- **Collection:** `drift_entries` — 384-dimensional vectors
- **Payload:** `{id, text, transcript, timestamp, source: "text"|"voice"}`
- **Operations used:**
  - `upsert` — store new entry vector
  - `search` — find k-nearest neighbors (similar entries)
  - `scroll` — retrieve all entries for constellation render
  - **Payload filtering** — filter by date range for timeline feature
  - **Named vectors** — optional: store both audio + text embeddings separately

---

## Seed Data Strategy

Pre-write 40 entries that tell a visually interesting story:
- 10 entries about work/productivity (tight cluster)
- 10 entries about relationships/people (separate cluster)  
- 8 entries about uncertainty/change (scattered, transitional)
- 7 entries about creative ideas (mid-cluster)
- 5 extreme outliers (singular, strange moments)

This guarantees a beautiful constellation on demo day regardless of live entries.

---

## What Makes This Win

1. **No chatbot.** Zero Q&A. Vector search IS the product.
2. **Multimodal.** Voice → transcription → text embedding. Audio as input.
3. **Novel interaction.** Nobody has built a 3D vector-space journal before.
4. **Qdrant as the core.** Without Qdrant this literally does not exist.
5. **Emotional resonance.** The demo makes people think about their own minds.
6. **Technical depth.** Embeddings, nearest-neighbor search, dimensionality reduction, filtering — all demonstrated.
7. **Beautiful.** The constellation is genuinely stunning.
