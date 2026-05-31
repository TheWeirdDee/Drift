'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDriftReport, DriftReport } from '@/lib/api'

const mono = '"DM Mono", "Courier New", monospace'
const serif = '"Cormorant Garamond", Georgia, serif'
const sans = '"Outfit", system-ui, sans-serif'

function timeAgo(ts: string) {
  try {
    const diff = Date.now() - new Date(ts).getTime()
    const d = Math.floor(diff / 86400000)
    if (d === 0) return 'today'
    if (d === 1) return 'yesterday'
    if (d < 30) return `${d} days ago`
    if (d < 365) return `${Math.floor(d / 30)} months ago`
    return `${Math.floor(d / 365)} years ago`
  } catch { return '' }
}

function formatGenerated(ts: string) {
  try {
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const STEPS = [
  'Reading your constellation...',
  'Finding your center of gravity...',
  'Locating your furthest thought...',
  'Searching for echoes...',
  'Writing your report...',
]

function LoadingState() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 1500)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
      <div style={{
        width: '48px', height: '48px',
        border: '1px solid #3a2260', borderTopColor: '#b088ff',
        borderRadius: '50%', animation: 'spin 2s linear infinite'
      }} />
      <p style={{ fontFamily: mono, fontSize: '0.75rem', color: '#50505e', letterSpacing: '0.15em', textAlign: 'center' }}>
        {STEPS[step]}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Card({ accent, label, children }: { accent: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(10,10,18,0.9)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderLeft: `3px solid ${accent}`,
      borderRadius: '2px',
      padding: '2.5rem',
      marginBottom: '1.5rem',
    }}>
      <p style={{ fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function Excerpt({ text, timestamp }: { text: string; timestamp?: string }) {
  return (
    <div style={{ borderLeft: '2px solid rgba(255,255,255,0.05)', paddingLeft: '1.25rem', marginTop: '1.25rem' }}>
      <p style={{ fontFamily: serif, fontSize: '1.05rem', fontStyle: 'italic', fontWeight: 300, color: '#c8c8d4', lineHeight: 1.8 }}>
        "{text.slice(0, 300)}{text.length > 300 ? '...' : ''}"
      </p>
      {timestamp && (
        <p style={{ fontFamily: mono, fontSize: '0.65rem', color: '#3a3a48', marginTop: '0.75rem', letterSpacing: '0.1em' }}>
          {timeAgo(timestamp)}
        </p>
      )}
    </div>
  )
}

export default function ReportPage() {
  const [report, setReport] = useState<DriftReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDriftReport()
      .then(setReport)
      .catch(() => setError('Not enough entries yet. Write at least 3 entries and come back.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#050508', color: '#c8c8d4', fontFamily: sans, fontWeight: 300 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@200;300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; cursor: none !important; }
        body { -webkit-font-smoothing: antialiased; background: #050508; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: #3a2260; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .card-in { animation: fadeUp 0.6s ease both; }
        .card-in:nth-child(2) { animation-delay: 0.15s; }
        .card-in:nth-child(3) { animation-delay: 0.3s; }
        .card-in:nth-child(4) { animation-delay: 0.45s; }
        .btn-ghost:hover { border-color: rgba(176,136,255,0.4) !important; color: #c8c8d4 !important; }
        .btn-solid:hover { opacity: 0.85; }
      `}</style>

      {/* Custom cursor */}
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
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/constellation" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: mono, fontSize: '0.65rem', color: '#50505e', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Constellation</span>
          </Link>
          <Link href="/journal" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: mono, fontSize: '0.65rem', color: '#50505e',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              border: '1px solid #1a1a2e', padding: '8px 16px',
            }}>+ New entry</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '9rem 2.5rem 5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '4rem' }}>
          <p style={{ fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.25em', color: '#3a2260', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Weekly drift report
          </p>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 300, lineHeight: 1.25, color: '#c8c8d4' }}>
            What your mind has<br />
            <span style={{ fontStyle: 'italic', color: '#50505e' }}>been doing this week.</span>
          </h1>
        </div>

        {/* Loading */}
        {loading && <LoadingState />}

        {/* Error */}
        {!loading && error && (
          <div style={{
            background: 'rgba(10,10,18,0.9)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '3rem', textAlign: 'center', borderRadius: '2px',
          }}>
            <p style={{ color: '#50505e', fontWeight: 300, marginBottom: '2rem', lineHeight: 1.7 }}>{error}</p>
            <Link href="/journal" style={{ textDecoration: 'none' }}>
              <span style={{
                fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                border: '1px solid #50505e', color: '#50505e', padding: '10px 24px', display: 'inline-block',
              }}>Write an entry →</span>
            </Link>
          </div>
        )}

        {/* Report */}
        {!loading && report && (
          <div>
            <p style={{ fontFamily: mono, fontSize: '0.65rem', color: '#3a3a48', letterSpacing: '0.1em', marginBottom: '2.5rem' }}>
              Based on {report.week_entry_count} entries · Generated {formatGenerated(report.generated_at)}
            </p>

            <div className="card-in">
              <Card accent="#b088ff" label="01 — Center of gravity">
                <p style={{ fontFamily: serif, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontStyle: 'italic', fontWeight: 300, color: '#c8c8d4', lineHeight: 1.3, marginBottom: '1rem' }}>
                  {report.center_of_gravity.theme}
                </p>
                <p style={{ color: '#50505e', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                  This is what your thoughts orbited this week — not what you wrote about, but the gravitational center underneath all of it.
                </p>
                {report.center_of_gravity.sample_entries.length > 0 && (
                  <div>
                    <p style={{ fontFamily: mono, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#3a3a48', textTransform: 'uppercase', marginBottom: '1rem' }}>
                      Entries that shaped it
                    </p>
                    {report.center_of_gravity.sample_entries.slice(0, 2).map((e, i) => (
                      <div key={i} style={{ borderLeft: '2px solid rgba(176,136,255,0.1)', paddingLeft: '1rem', marginBottom: '0.75rem' }}>
                        {e.title && <p style={{ fontFamily: mono, fontSize: '0.65rem', color: '#3a2260', marginBottom: '0.3rem' }}>{e.title}</p>}
                        <p style={{ color: '#c8c8d4', fontSize: '0.85rem', lineHeight: 1.7 }}>{e.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="card-in">
              <Card accent="#ff6b35" label="02 — Furthest drift">
                <p style={{ color: '#50505e', fontSize: '0.85rem', lineHeight: 1.8 }}>
                  {report.furthest_drift.insight}
                </p>
                <Excerpt text={report.furthest_drift.text} timestamp={report.furthest_drift.timestamp} />
              </Card>
            </div>

            {report.echo && (
              <div className="card-in">
                <Card accent="#7eb8f7" label="03 — Echo">
                  <p style={{ fontFamily: serif, fontSize: '1.2rem', fontStyle: 'italic', fontWeight: 300, color: '#c8c8d4', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    {report.echo.insight}
                  </p>
                  <p style={{ fontFamily: mono, fontSize: '0.65rem', color: '#3a3a48', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                    {report.echo.days_ago} days ago
                  </p>
                  <Excerpt text={report.echo.text} timestamp={report.echo.timestamp} />
                </Card>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(176,136,255,0.2), transparent)', margin: '3rem 0' }} />

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/constellation" style={{ flex: 1, minWidth: '200px', textDecoration: 'none' }}>
                <div className="btn-ghost" style={{
                  textAlign: 'center', padding: '1rem',
                  border: '1px solid rgba(255,255,255,0.08)', color: '#50505e',
                  fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}>
                  See in constellation →
                </div>
              </Link>
              <Link href="/journal" style={{ flex: 1, minWidth: '200px', textDecoration: 'none' }}>
                <div className="btn-solid" style={{
                  textAlign: 'center', padding: '1rem',
                  background: '#c8c8d4', color: '#050508',
                  fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                  transition: 'opacity 0.2s',
                }}>
                  Write today's entry
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        var cr = document.getElementById('cr');
        document.addEventListener('mousemove', function(e) {
          if(cr) { cr.style.left = e.clientX + 'px'; cr.style.top = e.clientY + 'px'; }
        });
      `}} />
    </main>
  )
}
