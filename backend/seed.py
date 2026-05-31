"""
Seed script — loads 40 demo entries into DRIFT.
Run: python seed.py
These entries are crafted to produce a visually compelling constellation:
  - Tight clusters around recurring themes
  - Clear outliers
  - Two distant-in-time entries that land near each other in vector space
"""

import asyncio
import httpx
from datetime import datetime, timedelta
import random

API_URL = "http://localhost:8000"

# Entries are grouped thematically so the constellation clusters naturally
# Timestamps spread over ~90 days to simulate real use

BASE_DATE = datetime(2026, 2, 1)

def days_ago(n):
    return (BASE_DATE + timedelta(days=n)).isoformat()

ENTRIES = [
    # ---- CLUSTER 1: Work / Productivity / Ambition ----
    {
        "title": "The weight of unfinished things",
        "text": "I have fourteen tabs open and I haven't closed one of them in three days. Each one is a promise I made to myself. I keep thinking that staying busy means I'm moving forward, but I'm not sure that's true anymore.",
        "timestamp": days_ago(0)
    },
    {
        "title": "On momentum",
        "text": "There's a particular kind of tiredness that comes not from doing too much but from starting too many things. I feel it today. The projects pile up not because I'm lazy but because I keep finding new things worth caring about.",
        "timestamp": days_ago(3)
    },
    {
        "title": "Deep work",
        "text": "Three hours this morning where I didn't check my phone once. I forgot what it felt like to actually be inside something. The work was better. I was better. I need to protect those hours like they're the only ones that matter.",
        "timestamp": days_ago(7)
    },
    {
        "title": "Perfectionism again",
        "text": "Sent the draft even though it wasn't ready. Or maybe it was ready and I just couldn't see it. I keep confusing 'not perfect' with 'not good enough.' They're not the same thing. They never were.",
        "timestamp": days_ago(11)
    },
    {
        "title": "What I'm actually building",
        "text": "I've been so focused on the execution that I forgot to ask if the thing I'm building is the thing I actually want. Sat with that question today. Didn't like the silence that came back.",
        "timestamp": days_ago(18)
    },
    {
        "title": "The comparison trap",
        "text": "Spent an hour looking at what everyone else is doing. Closed the laptop and went for a walk. By the time I came back I couldn't remember why I was looking in the first place. That seems like information.",
        "timestamp": days_ago(22)
    },
    {
        "title": "Saying no",
        "text": "Turned down the project today. It felt like failing at first and then it felt like breathing. I have to stop measuring my value by how much I can hold.",
        "timestamp": days_ago(29)
    },
    {
        "title": "Flow",
        "text": "The work moved through me today rather than me moving through it. Hours passed. I forgot to eat. This is what I'm trying to get back to. The state where the work and I are the same thing for a little while.",
        "timestamp": days_ago(34)
    },

    # ---- CLUSTER 2: Relationships / People / Longing ----
    {
        "title": "Missing someone without a reason",
        "text": "I thought about my old friend today, the one I lost touch with after we moved. Not because anything happened. Just because I heard a song we used to listen to and for a second they were right there and then they weren't.",
        "timestamp": days_ago(2)
    },
    {
        "title": "What we don't say",
        "text": "My mother called and we talked for forty minutes about nothing. The real things were underneath every sentence. I think she was trying to ask if I was okay. I think I was trying to ask the same thing. Neither of us did.",
        "timestamp": days_ago(6)
    },
    {
        "title": "On being known",
        "text": "The rarest thing isn't love. It's being truly known by someone. Understood not just in your good moments but in the ones you're ashamed of. I've had that once or twice in my life and I don't take it for granted.",
        "timestamp": days_ago(14)
    },
    {
        "title": "A difficult conversation",
        "text": "We finally said the thing we'd been not saying for months. It was harder than I expected and better than I feared. I keep thinking honesty is dangerous and then remembering that silence is worse.",
        "timestamp": days_ago(20)
    },
    {
        "title": "The people who shaped me",
        "text": "I made a list today of the ten people who changed how I think. Most of them don't know they're on it. Some of them I've never met. A book can change you as much as a person if you let it.",
        "timestamp": days_ago(27)
    },
    {
        "title": "Loneliness vs solitude",
        "text": "Spent the whole weekend alone and felt both. Loneliness is the ache of wanting someone and not having them. Solitude is the fullness of your own company. They can exist in the same afternoon.",
        "timestamp": days_ago(33)
    },
    {
        "title": "Forgiveness",
        "text": "I'm not sure I've fully forgiven them. But I'm no longer carrying it the same way. The weight shifted. Maybe that's what forgiveness actually is — not release but redistribution.",
        "timestamp": days_ago(41)
    },
    {
        "title": "New friendship",
        "text": "We talked for four hours and it felt like twenty minutes. There's a particular electricity of a new person who sees the world in a way that rhymes with yours but isn't identical. I'd forgotten that feeling.",
        "timestamp": days_ago(50)
    },

    # ---- CLUSTER 3: Identity / Change / Uncertainty ----
    {
        "title": "Who am I becoming",
        "text": "I don't recognize all of my opinions from five years ago. Some of them embarrass me. I wonder which of my current ones will embarrass me in five more. This should be uncomfortable. I'm trying to find it beautiful instead.",
        "timestamp": days_ago(5)
    },
    {
        "title": "The old self",
        "text": "Found a journal from eight years ago. Read it cover to cover. The person who wrote it wanted the same things I want now but for completely different reasons. I love them. I'm glad I'm not them anymore.",
        "timestamp": days_ago(9)
    },
    {
        "title": "Continuity",
        "text": "What makes me me across time? My cells replace themselves. My beliefs shift. My tastes change. Yet there's something that persists. I think it's not what I think but how I think. The shape of the questioning.",
        "timestamp": days_ago(15)
    },
    {
        "title": "Halfway through",
        "text": "Statistically I'm probably somewhere in the middle of my life. That used to frighten me. Today it felt clarifying. What actually matters? Not as a question but as a practice.",
        "timestamp": days_ago(23)
    },
    {
        "title": "The version of me I perform",
        "text": "I catch myself performing a version of myself in meetings. Confident, clear, certain. I wonder if everyone is doing this. I think everyone is doing this. The performance might be the thing that eventually becomes real.",
        "timestamp": days_ago(31)
    },
    {
        "title": "Uncertainty as home",
        "text": "I've spent so much of my life trying to resolve uncertainty that I didn't notice when it became my natural state. I don't need to know what comes next. I need to be curious about it.",
        "timestamp": days_ago(38)
    },
    {
        "title": "Changing my mind",
        "text": "Updated a belief today I've held since I was twenty-two. It felt like a small death and a small birth at the same time. I want to keep doing this. I want to hold my convictions lightly enough to revise them.",
        "timestamp": days_ago(47)
    },

    # ---- CLUSTER 4: Creativity / Making / Expression ----
    {
        "title": "Why I make things",
        "text": "I make things because the inside of my head is noisy and making things is the only way to quiet it. The work externalizes something. Once it's out there, I don't have to hold it anymore.",
        "timestamp": days_ago(4)
    },
    {
        "title": "The blank page",
        "text": "The cursor blinked at me for an hour. Nothing came. Then something did. I've learned not to judge the fallow periods. They're not absence. They're the work happening underground.",
        "timestamp": days_ago(13)
    },
    {
        "title": "Influence and originality",
        "text": "Everything I make is assembled from things I've absorbed. I used to feel guilty about that. Now I think originality is just the unique way your influences combine. The filter is you.",
        "timestamp": days_ago(25)
    },
    {
        "title": "When it's working",
        "text": "The piece does something today I didn't plan for it to do. It surprised me. I think this is the goal — to make something that exceeds your intention. To be surprised by your own work.",
        "timestamp": days_ago(36)
    },
    {
        "title": "Sharing vs hiding",
        "text": "There's a part of me that wants to keep everything private. Not because I'm ashamed but because sharing changes it. The moment something is witnessed it's no longer purely yours. Sometimes that's the point.",
        "timestamp": days_ago(44)
    },

    # ---- CLUSTER 5: Body / Presence / The Physical ----
    {
        "title": "Walking",
        "text": "Two miles this morning. No headphones. Just the sound of the city starting its day. I noticed things I've walked past a hundred times without seeing. Presence is a practice and I'm out of shape.",
        "timestamp": days_ago(8)
    },
    {
        "title": "Tired in a different way",
        "text": "The tiredness I feel today is different from yesterday's. Yesterday was depletion. Today feels more like the tiredness after something was completed. Good tired. I want to honor that distinction.",
        "timestamp": days_ago(17)
    },
    {
        "title": "Breath",
        "text": "Someone reminded me to breathe today. I realized I'd been shallow breathing for weeks without noticing. The body keeps the score in ways we don't notice until someone hands us the receipts.",
        "timestamp": days_ago(26)
    },

    # ---- OUTLIERS — isolated, strange, singular ----
    {
        "title": "3am thought",
        "text": "Woke up at 3am with the absolute conviction that I've been thinking about time completely wrong. Lay there for an hour building the argument. Fell asleep before I could write it down. It was probably nothing. It might have been everything.",
        "timestamp": days_ago(10)
    },
    {
        "title": "The dream",
        "text": "I was in a house I'd never been in but recognized completely. Every room was a different year of my life but out of order. I knew which room was which but couldn't explain how. Woke up and the feeling stayed all day.",
        "timestamp": days_ago(21)
    },
    {
        "title": "Complete stillness",
        "text": "For about ninety seconds today I felt completely at peace. Not happy exactly. Just — still. All the things I'm chasing fell quiet. I didn't do anything to cause it and couldn't hold onto it. But it was real.",
        "timestamp": days_ago(42)
    },
    {
        "title": "A sentence I can't stop thinking about",
        "text": "Read a sentence today: 'The goal is not to live forever but to create something that will.' I've thought about almost nothing else since. I don't even know if I agree with it. That might be why I can't stop.",
        "timestamp": days_ago(55)
    },
    {
        "title": "Grief without object",
        "text": "Spent the morning crying and I can't tell you why. Nothing happened. Everything is fine. But the body sometimes has its own accounting system and today it was settling old debts.",
        "timestamp": days_ago(63)
    },

    # ---- ECHO PAIR — two entries far apart in time that are near in vector space ----
    # These are written to be semantically very similar despite different timestamps
    {
        "title": "Starting over (early)",
        "text": "I think I need to let go of the version of my life I planned and be curious about what wants to happen instead. The plan was never really mine anyway. It was assembled from expectations. What do I actually want? I'm not sure I know yet. That might be the beginning of something.",
        "timestamp": days_ago(16)
    },
    {
        "title": "Starting over (late)",
        "text": "The old map doesn't match the territory anymore. I can keep forcing the route or I can put the map down and look around. What wants to happen if I stop insisting on my plan? I don't know. But the question feels more alive than any answer I've been carrying.",
        "timestamp": days_ago(72)
    },
]


async def seed():
    async with httpx.AsyncClient(timeout=300.0) as client:
        print(f"Seeding {len(ENTRIES)} entries...")

        response = await client.post(
            f"{API_URL}/entries/batch",
            json=ENTRIES
        )

        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] Seeded {data['created']} entries successfully")
        else:
            print(f"[ERROR] Error: {response.status_code} - {response.text}")


if __name__ == "__main__":
    asyncio.run(seed())
