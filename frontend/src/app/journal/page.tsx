'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createEntry, createVoiceEntry } from '@/lib/api'

const mono = '"DM Mono", "Courier New", monospace'
const serif = '"Cormorant Garamond", Georgia, serif'
const sans = '"Outfit", system-ui, sans-serif'

type Mode = 'text' | 'voice'
type Status = 'idle' | 'recording' | 'processing' | 'success' | 'error'

export default function JournalPage() {
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [lastEntry, setLastEntry] = useState<any>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  useEffect(() => {
    const el = document.getElementById('crc') || document.getElementById('cr')
    if (!el) return
    const move = (e: MouseEvent) => {
      (el as HTMLElement).style.left = e.clientX + 'px';
      (el as HTMLElement).style.top = e.clientY + 'px';
    }
    document.addEventListener('mousemove', move)
    return () => document.removeEventListener('mousemove', move)
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        try {
          const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
          const entry = await createVoiceEntry(file)
          setLastEntry(entry); setStatus('success')
        } catch { setStatus('error') }
      }
      recorder.start()
      mediaRef.current = recorder
      setStatus('recording'); setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch { setStatus('error') }
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    mediaRef.current?.stop()
    setStatus('processing')
  }

  const submitText = async () => {
    if (!text.trim()) return
    setStatus('processing')
    try {
      const entry = await createEntry({ text: text.trim(), title: title.trim() })
      setLastEntry(entry); setText(''); setTitle(''); setStatus('success')
    } catch { setStatus('error') }
  }

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <main style={{ minHeight: '100vh', background: '#050508', color: '#c8c8d4', fontFamily: sans, fontWeight: 300 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@200;300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; cursor: none !important; }
        body { -webkit-font-smoothing: antialiased; background: #050508; }
        textarea { font-family: ${sans}; font-weight: 300; }
        input { font-family: ${serif}; font-weight: 300; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: #3a2260; }
        a { text-decoration: none; color: inherit; }
        textarea:focus, input:focus { outline: none; border-color: rgba(176,136,255,0.3) !important; }
        textarea::placeholder, input::placeholder { color: #3a3a48; }
        .mode-btn { background: none; border: none; padding: 0 0 8px 0; cursor: pointer; transition: color 0.2s; }
        .mode-btn:hover { color: #c8c8d4 !important; }
        .submit-btn:hover:not(:disabled) { opacity: 0.85; }
        .submit-btn:disabled { opacity: 0.3; cursor: default; }
        .record-btn:hover { border-color: #b088ff !important; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Cursor */}
      <div id="cr" style={{ position: 'fixed', width: '8px', height: '8px', background: '#b088ff', borderRadius: '50%', pointerEvents: 'none', zIndex: 10000, transform: 'translate(-50%,-50%)', mixBlendMode: 'screen' }} />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.5rem 3rem',
        background: 'rgba(5,5,8,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" style={{ display: 'block' }}>
            <rect width="32" height="32" fill="#050508" rx="6"/>
            <line x1="16" y1="14" x2="22" y2="10" stroke="rgba(176,136,255,0.3)" strokeWidth="0.8"/>
            <line x1="16" y1="14" x2="22" y2="19" stroke="rgba(176,136,255,0.3)" strokeWidth="0.8"/>
            <line x1="16" y1="14" x2="10" y2="11" stroke="rgba(126,184,247,0.3)" strokeWidth="0.8"/>
            <line x1="22" y1="10" x2="22" y2="19" stroke="rgba(176,136,255,0.2)" strokeWidth="0.8"/>
            <line x1="10" y1="11" x2="9" y2="19" stroke="rgba(126,184,247,0.2)" strokeWidth="0.8"/>
            <line x1="9" y1="19" x2="16" y2="14" stroke="rgba(126,184,247,0.2)" strokeWidth="0.8"/>
            <line x1="16" y1="14" x2="14" y2="22" stroke="rgba(255,107,53,0.2)" strokeWidth="0.8"/>
            <line x1="14" y1="22" x2="9" y2="19" stroke="rgba(255,107,53,0.2)" strokeWidth="0.8"/>
            <line x1="22" y1="19" x2="14" y2="22" stroke="rgba(255,107,53,0.2)" strokeWidth="0.8"/>
            <circle cx="16" cy="14" r="4.5" fill="#b088ff" opacity="0.08"/>
            <circle cx="16" cy="14" r="3" fill="#b088ff" opacity="0.1"/>
            <circle cx="16" cy="14" r="2.5" fill="#b088ff" opacity="0.95"/>
            <circle cx="22" cy="10" r="1.8" fill="#b088ff" opacity="0.8"/>
            <circle cx="22" cy="19" r="1.5" fill="#b088ff" opacity="0.7"/>
            <circle cx="10" cy="11" r="1.8" fill="#7eb8f7" opacity="0.8"/>
            <circle cx="9" cy="19" r="1.5" fill="#7eb8f7" opacity="0.7"/>
            <circle cx="14" cy="22" r="1.5" fill="#ff6b35" opacity="0.7"/>
            <circle cx="6" cy="7" r="1" fill="#50505e" opacity="0.45"/>
            <circle cx="26" cy="6" r="0.9" fill="#50505e" opacity="0.35"/>
            <circle cx="27" cy="24" r="0.9" fill="#ff6b35" opacity="0.3"/>
          </svg>
          <span style={{ fontFamily: serif, fontSize: '1.4rem', fontWeight: 300, color: '#c8c8d4', letterSpacing: '0.1em' }}>DRIFT</span>
        </Link>
        <Link href="/constellation" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: mono, fontSize: '0.65rem', color: '#50505e',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            border: '1px solid #1a1a2e', padding: '8px 16px',
          }}>View Constellation</span>
        </Link>
      </nav>

      {/* Main content */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '9rem 2.5rem 5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.25em', color: '#3a2260', textTransform: 'uppercase', marginBottom: '1rem' }}>
            New entry
          </p>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, color: '#c8c8d4' }}>
            What's on your mind?
          </h1>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0' }}>
          {(['text', 'voice'] as Mode[]).map(m => (
            <button key={m} className="mode-btn" onClick={() => setMode(m)} style={{
              fontFamily: mono, fontSize: '0.7rem', letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: mode === m ? '#c8c8d4' : '#50505e',
              borderBottom: mode === m ? '1px solid #b088ff' : '1px solid transparent',
              paddingBottom: '10px',
            }}>
              {m === 'text' ? '⌨  Write' : '◉  Speak'}
            </button>
          ))}
        </div>

        {/* Text mode */}
        {mode === 'text' && (
          <div className="fade-in">
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Title (optional)"
              style={{
                width: '100%', background: 'transparent',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)',
                color: '#c8c8d4', fontSize: '1.1rem',
                padding: '0 0 1rem 0', marginBottom: '2rem', display: 'block',
                fontFamily: serif,
              }}
            />
            <textarea
              value={text} onChange={e => setText(e.target.value)}
              placeholder="Write freely. This is yours. The space is listening..."
              rows={12}
              style={{
                width: '100%', background: 'rgba(10,10,18,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#c8c8d4', fontSize: '0.95rem',
                padding: '1.5rem', resize: 'none', display: 'block',
                lineHeight: 1.9, borderRadius: '2px',
                transition: 'border-color 0.2s',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <span style={{ fontFamily: mono, fontSize: '0.65rem', color: '#3a3a48', letterSpacing: '0.1em' }}>
                {text.length} chars
              </span>
              <button
                onClick={submitText}
                disabled={!text.trim() || status === 'processing'}
                className="submit-btn"
                style={{
                  padding: '12px 2rem', background: '#c8c8d4', color: '#050508',
                  border: 'none', fontFamily: mono, fontSize: '0.65rem',
                  letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                {status === 'processing' ? 'Embedding...' : 'Send to constellation'}
              </button>
            </div>
          </div>
        )}

        {/* Voice mode */}
        {mode === 'voice' && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '4rem 0' }}>
            {status === 'idle' && (
              <>
                <p style={{ color: '#50505e', fontWeight: 300, lineHeight: 1.9, marginBottom: '3rem', fontSize: '0.9rem' }}>
                  Press and speak. Your voice will be transcribed<br />and embedded into the constellation.
                </p>
                <button onClick={startRecording} className="record-btn" style={{
                  width: '88px', height: '88px', borderRadius: '50%',
                  border: '1px solid #50505e', background: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem', fontSize: '2rem', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}>◉</button>
                <p style={{ fontFamily: mono, fontSize: '0.65rem', color: '#3a3a48', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Press to record
                </p>
              </>
            )}
            {status === 'recording' && (
              <>
                <button onClick={stopRecording} style={{
                  width: '88px', height: '88px', borderRadius: '50%',
                  border: '2px solid #ff6b35', background: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem', cursor: 'pointer',
                }}>
                  <div style={{ width: '22px', height: '22px', background: '#ff6b35', borderRadius: '3px', animation: 'pulse 1s ease-in-out infinite' }} />
                </button>
                <p style={{ fontFamily: mono, fontSize: '1.5rem', color: '#ff6b35', marginBottom: '0.5rem' }}>{fmt(recordingTime)}</p>
                <p style={{ fontFamily: mono, fontSize: '0.65rem', color: '#50505e', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Press to stop</p>
              </>
            )}
            {status === 'processing' && (
              <>
                <div style={{ width: '48px', height: '48px', border: '1px solid #3a2260', borderTopColor: '#b088ff', borderRadius: '50%', animation: 'spin 2s linear infinite', margin: '0 auto 1.5rem' }} />
                <p style={{ color: '#50505e', fontWeight: 300 }}>Transcribing and embedding...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </>
            )}
          </div>
        )}

        {/* Success card */}
        {status === 'success' && lastEntry && (
          <div className="fade-in" style={{
            marginTop: '2rem',
            background: 'rgba(10,10,18,0.9)',
            border: '1px solid rgba(176,136,255,0.12)',
            padding: '1.75rem', borderRadius: '2px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <p style={{ fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.18em', color: '#b088ff', textTransform: 'uppercase' }}>
                ✓ Mapped to constellation
              </p>
              <button onClick={() => setStatus('idle')} style={{
                background: 'none', border: 'none', fontFamily: mono,
                fontSize: '0.65rem', color: '#50505e', cursor: 'pointer', letterSpacing: '0.1em',
              }}>+ New entry</button>
            </div>
            <p style={{ color: '#c8c8d4', fontWeight: 300, lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
              {lastEntry.text?.slice(0, 200)}{lastEntry.text?.length > 200 ? '...' : ''}
            </p>
            <p style={{ fontFamily: mono, fontSize: '0.6rem', color: '#3a3a48', marginBottom: '1.25rem', letterSpacing: '0.08em' }}>
              Vector: [{lastEntry.vector_preview?.map((v: number) => v.toFixed(3)).join(', ')}...]
            </p>
            <Link href="/constellation" style={{ textDecoration: 'none' }}>
              <span style={{
                fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', border: '1px solid #1a1a2e',
                color: '#50505e', padding: '8px 16px', display: 'inline-block',
              }}>See it in the constellation →</span>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="fade-in" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '2px' }}>
            <p style={{ fontFamily: mono, fontSize: '0.7rem', color: '#ff6b35', letterSpacing: '0.1em' }}>
              Something went wrong. Check the backend is running and try again.
            </p>
          </div>
        )}
      </div>

    </main>
  )
}
