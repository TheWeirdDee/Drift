# DRIFT — 3-Minute Demo Script

---

## Setup before recording

1. Backend running: `uvicorn main:app --reload`
2. Seed data loaded: `python seed.py` (40 entries)
3. Browser open on `localhost:3000` (landing page)
4. Second tab open on `localhost:3000/constellation`
5. Screen recording software ready
6. No notifications, full screen

---

## THE SCRIPT

### [0:00 – 0:18] — The landing page. No talking yet.

Let the landing page animation run. The particle constellation breathes. The word "DRIFT" letterspace-animates in. The cycling words rotate: *obsessions... patterns... fractures...*

Then say:

> *"What if you could see your own mind from the outside?"*

---

### [0:18 – 0:35] — Navigate to the constellation

Click "See the Constellation." The 3D scene loads — the constellation auto-rotates.

> *"Every dot here is a journal entry. But they're not arranged by date. They're arranged by meaning. Proximity in this space means similarity of thought — not because I programmed it, but because Qdrant's vector search found it."*

Slowly rotate the constellation with your mouse.

---

### [0:35 – 1:00] — Point out the clusters

Zoom in on the densest cluster.

> *"This cluster — this person kept coming back to the same idea. Seven entries over three weeks. They didn't know they were doing it. The space knew."*

Move to an isolated outlier point.

> *"And this point — completely alone in the space. That's the entry from the day something shifted. The most singular thought in the entire constellation."*

---

### [1:00 – 1:35] — The echo moment (THE DEMO'S PEAK)

Click on one of the echo pair entries — "Starting over (late)" — from 72 days ago.

> *"This entry is from 72 days ago."*

Click "Find similar entries." Watch the connecting lines light up. One of the highlighted entries is "Starting over (early)" from 16 days ago.

> *"This entry is from 16 days ago. Different words. Different month. Different circumstances. But in the vector space — neighbors. The model found something the person couldn't."*

Read a line from each entry. Let the similarity land.

> *"This is not keyword search. This is semantic geometry. This is what Qdrant makes possible."*

---

### [1:35 – 2:10] — Live entry

Navigate to `/journal`. Type a new entry live (pre-write it for speed):

> *"I keep starting things I don't finish. Not because I give up — I think it's because the beginning is where the aliveness is. The middle is just maintenance."*

Click "Send to constellation." 

Navigate back to `/constellation`. The new point has appeared.

> *"It just placed this thought in the space. Watch where it landed."*

Zoom toward the new point. It's near the work/productivity cluster.

> *"It knows where this belongs. Without labels. Without categories. Just geometry."*

---

### [2:10 – 2:40] — The voice entry

Switch to voice mode on `/journal`. Record 15 seconds:

> *"I've been thinking about how much of who I am was chosen versus inherited. I'm not sure the distinction matters as much as I thought it did."*

Stop recording. Watch "Transcribing and embedding..." 

Navigate to the constellation. New point has appeared.

> *"Voice to text to vector to space. In under three seconds."*

---

### [2:40 – 3:00] — Close

Pull back to the full constellation view. Let it rotate.

> *"DRIFT doesn't use vector search to find answers. It uses vector search to ask better questions — about yourself, over time. This is built on Qdrant. Every dot is a Qdrant upsert. Every connection is a Qdrant similarity search. Every cluster is something Qdrant revealed."*

Final beat:

> *"Who are you becoming? The constellation will tell you."*

---

## Tips

- Keep your voice calm and deliberate — not excited, not pitched. The product is quiet and serious.
- Let silences breathe, especially after "the model found something the person couldn't."
- The demo video is also a product demo for DRIFT itself — treat it like you're showing someone a mirror, not a feature list.
- Record in one take if possible. Edit only for dead air, not for pace.
