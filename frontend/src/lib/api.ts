const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type Entry = {
  id: string
  text: string
  title: string
  timestamp: string
  source: 'text' | 'voice'
  vector: number[]
  vector_preview?: number[]
}

export type SimilarEntry = {
  id: string
  text: string
  title: string
  timestamp: string
  source: string
  score: number
}

export async function createEntry(data: { text: string; title?: string }): Promise<Entry> {
  const res = await fetch(`${API_URL}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create entry')
  return res.json()
}

export async function createVoiceEntry(file: File): Promise<Entry> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/entries/voice`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Failed to create voice entry')
  return res.json()
}

export async function getEntries(): Promise<Entry[]> {
  const res = await fetch(`${API_URL}/entries`)
  if (!res.ok) throw new Error('Failed to fetch entries')
  return res.json()
}

export async function getSimilarEntries(id: string, limit = 5): Promise<{ source_id: string; similar: SimilarEntry[] }> {
  const res = await fetch(`${API_URL}/entries/${id}/similar?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch similar entries')
  return res.json()
}

export type DriftReport = {
  generated_at: string
  week_entry_count: number
  center_of_gravity: {
    theme: string
    entry_count: number
    sample_entries: { id: string; title: string; text: string }[]
  }
  furthest_drift: {
    id: string
    title: string
    text: string
    timestamp: string
    insight: string
  }
  echo: {
    id: string
    title: string
    text: string
    timestamp: string
    days_ago: number
    insight: string
  } | null
}

export async function getDriftReport(): Promise<DriftReport> {
  const res = await fetch(`${API_URL}/report/weekly`)
  if (!res.ok) {
    let errMsg = 'Failed to fetch report';
    try {
      const data = await res.json();
      errMsg = data.detail || data.message || errMsg;
    } catch {
      try {
        const text = await res.text();
        errMsg = text || errMsg;
      } catch {}
    }
    throw new Error(errMsg);
  }
  return res.json()
}
