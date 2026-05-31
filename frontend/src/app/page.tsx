'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const S = {
  page: {
    minHeight: '100vh',
    background: '#050508',
    color: '#c8c8d4',
    fontFamily: '"Outfit", system-ui, sans-serif',
    fontWeight: 300,
    overflowX: 'hidden' as const,
  },
  canvas: {
    position: 'fixed' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    opacity: 0.55,
  },
  hero: {
    position: 'relative' as const,
    zIndex: 1,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '0 24px',
  },
  wordmark: {
    fontSize: 'clamp(5rem, 15vw, 10rem)',
    fontFamily: '"Cormorant Garamond", "Georgia", serif',
    fontWeight: 300,
    letterSpacing: '0.4em',
    color: '#c8c8d4',
    marginBottom: '1.5rem',
    lineHeight: 1,
  },
  tagline: {
    fontSize: '1.1rem',
    color: '#50505e',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    fontWeight: 300,
  },
  sub: {
    fontSize: '0.85rem',
    color: '#3a3a48',
    letterSpacing: '0.05em',
    marginBottom: '3.5rem',
  },
  ctaRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  btnPrimary: {
    padding: '14px 36px',
    background: '#c8c8d4',
    color: '#050508',
    border: 'none',
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    fontFamily: '"DM Mono", monospace',
    cursor: 'none',
    boxShadow: '0 0 40px rgba(176,136,255,0.25)',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'transform 0.2s ease',
  },
  btnSecondary: {
    padding: '14px 36px',
    background: 'transparent',
    color: '#c8c8d4',
    border: '1px solid #50505e',
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    fontFamily: '"DM Mono", monospace',
    cursor: 'none',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'border-color 0.2s ease',
  },
  section: {
    position: 'relative' as const,
    zIndex: 1,
    maxWidth: '860px',
    margin: '0 auto',
    padding: '80px 24px',
  },
  sectionLabel: {
    fontSize: '0.65rem',
    letterSpacing: '0.3em',
    textTransform: 'uppercase' as const,
    color: '#50505e',
    fontFamily: '"DM Mono", monospace',
    marginBottom: '3rem',
    textAlign: 'center' as const,
  },
  conceptHeading: {
    fontSize: 'clamp(1.8rem, 4vw, 3rem)',
    fontFamily: '"Cormorant Garamond", "Georgia", serif',
    fontWeight: 300,
    lineHeight: 1.5,
    textAlign: 'center' as const,
    marginBottom: '2rem',
    color: '#c8c8d4',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #b088ff, transparent)',
    margin: '3rem 0',
    opacity: 0.4,
  },
  conceptBody: {
    fontSize: '1rem',
    color: '#50505e',
    lineHeight: 2,
    textAlign: 'center' as const,
    maxWidth: '640px',
    margin: '0 auto',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginTop: '2rem',
  },
  card: {
    background: 'rgba(15,15,26,0.8)',
    border: '1px solid rgba(176,136,255,0.1)',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
  },
  cardIcon: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    display: 'block',
  },
  cardTitle: {
    fontFamily: '"Cormorant Garamond", "Georgia", serif',
    fontSize: '1.2rem',
    fontWeight: 300,
    color: '#c8c8d4',
    marginBottom: '0.75rem',
  },
  cardBody: {
    fontSize: '0.82rem',
    color: '#50505e',
    lineHeight: 1.8,
  },
  quoteSection: {
    position: 'relative' as const,
    zIndex: 1,
    padding: '80px 24px',
    textAlign: 'center' as const,
    maxWidth: '900px',
    margin: '0 auto',
  },
  quoteText: {
    fontFamily: '"Cormorant Garamond", "Georgia", serif',
    fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
    fontStyle: 'italic',
    fontWeight: 300,
    color: '#c8c8d4',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  quoteAttr: {
    fontSize: '0.65rem',
    letterSpacing: '0.3em',
    color: '#50505e',
    fontFamily: '"DM Mono", monospace',
    textTransform: 'uppercase' as const,
  },
  stepsSection: {
    position: 'relative' as const,
    zIndex: 1,
    maxWidth: '760px',
    margin: '0 auto',
    padding: '60px 24px',
    borderTop: '1px solid #0f0f1a',
  },
  step: {
    display: 'flex',
    gap: '2rem',
    padding: '2rem 0',
    borderBottom: '1px solid #0f0f1a',
  },
  stepNum: {
    fontFamily: '"DM Mono", monospace',
    fontSize: '0.7rem',
    color: '#3a2260',
    paddingTop: '4px',
    minWidth: '2rem',
    letterSpacing: '0.1em',
  },
  stepTitle: {
    fontFamily: '"Cormorant Garamond", "Georgia", serif',
    fontSize: '1.3rem',
    fontWeight: 300,
    color: '#c8c8d4',
    marginBottom: '0.4rem',
  },
  stepBody: {
    fontSize: '0.82rem',
    color: '#50505e',
    lineHeight: 1.8,
  },
  finalSection: {
    position: 'relative' as const,
    zIndex: 1,
    textAlign: 'center' as const,
    padding: '100px 24px',
  },
  finalHeading: {
    fontFamily: '"Cormorant Garamond", "Georgia", serif',
    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
    fontStyle: 'italic',
    fontWeight: 300,
    color: '#c8c8d4',
    marginBottom: '1rem',
  },
  finalSub: {
    color: '#50505e',
    marginBottom: '3rem',
    fontSize: '0.9rem',
  },
  footer: {
    position: 'relative' as const,
    zIndex: 1,
    borderTop: '1px solid #0f0f1a',
    padding: '2rem 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footerText: {
    fontFamily: '"DM Mono", monospace',
    fontSize: '0.65rem',
    color: '#50505e',
    letterSpacing: '0.1em',
  },
  cursor: {
    position: 'fixed' as const,
    width: '8px',
    height: '8px',
    background: '#b088ff',
    borderRadius: '50%',
    pointerEvents: 'none' as const,
    zIndex: 10000,
    transform: 'translate(-50%, -50%)',
    mixBlendMode: 'screen' as const,
    transition: 'width 0.2s, height 0.2s',
  },
  cursorRing: {
    position: 'fixed' as const,
    width: '28px',
    height: '28px',
    border: '1px solid rgba(176,136,255,0.35)',
    borderRadius: '50%',
    pointerEvents: 'none' as const,
    zIndex: 9999,
    transform: 'translate(-50%, -50%)',
  },
}

const CYCLING = ['obsessions', 'patterns', 'fractures', 'becoming', 'silences', 'returns']

const FEATURES = [
  { icon: '◉', title: 'When you changed', body: 'The moment your points start clustering somewhere new. Not a mood score. Not a chart. The actual topology of your transformation, visible in 3D space.' },
  { icon: '⟷', title: 'What you keep returning to', body: 'Tight clusters are your anchors — thoughts you\'ve circled without knowing. Named not by you but by the space itself.' },
  { icon: '✦', title: 'Your singular moments', body: 'The isolated points, far from any cluster. The days you were most alone in your thinking. Some of them are your most important days.' },
  { icon: '◎', title: 'Your weekly drift', body: 'A synthesized weekly report mapping the gravitational center of your mind, identifying outlying thoughts, and highlighting past semantic echoes.' },
]

const STEPS = [
  { n: '01', title: 'You write or speak', body: 'Text or voice. As long or brief as you need. DRIFT accepts both.' },
  { n: '02', title: 'It becomes a vector', body: 'Your entry is embedded into a 384-dimensional semantic space using sentence-transformers. The entire meaning encoded into coordinates.' },
  { n: '03', title: 'Qdrant stores the shape', body: 'The vector is stored in Qdrant alongside your entry. Every entry permanently occupies a position in the space.' },
  { n: '04', title: 'The constellation renders', body: 'All your vectors are projected into 3D via PCA and rendered as a live point cloud. Proximity = similarity of thought.' },
  { n: '05', title: 'You explore', body: 'Click any point to read the entry. Ask for its neighbors. Watch your mind map itself.' },
  { n: '06', title: 'Uncover your weekly drift', body: 'Receive a synthesized weekly report identifying the gravitational theme of your thoughts, outlying deviations, and past semantic echoes.' },
]

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [cycleIdx, setCycleIdx] = useState(0)
  const [visible, setVisible] = useState(false)

  // Cursor
  useEffect(() => {
    let rx = 0, ry = 0, mx = 0, my = 0
    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      if (cursorRef.current) {
        cursorRef.current.style.left = mx + 'px'
        cursorRef.current.style.top = my + 'px'
      }
    }
    const tick = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px'
        ringRef.current.style.top = ry + 'px'
      }
      requestAnimationFrame(tick)
    }
    document.addEventListener('mousemove', move)
    tick()
    return () => document.removeEventListener('mousemove', move)
  }, [])

  // Fade in
  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  // Cycling words
  useEffect(() => {
    const t = setInterval(() => setCycleIdx(i => (i + 1) % CYCLING.length), 2200)
    return () => clearInterval(t)
  }, [])

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H

    const N = 140
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.6 + 0.3,
      op: Math.random() * 0.55 + 0.1,
      ph: Math.random() * Math.PI * 2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; p.ph += 0.009
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        const o = p.op * (0.65 + 0.35 * Math.sin(p.ph))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(176,136,255,${o})`
        ctx.fill()
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(126,184,247,${(1 - d / 110) * 0.07})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@200;300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; cursor: none !important; }
        html { background: #050508; scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: #3a2260; }
        ::selection { background: rgba(176,136,255,0.25); }
        a { text-decoration: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes wordSwap {
          0%,100% { opacity:0; transform: translateY(12px); }
          15%,85% { opacity:1; transform: translateY(0); }
        }
        .fade-1 { animation: fadeUp 1s ease both; animation-delay: 0.2s; opacity: 0; }
        .fade-2 { animation: fadeUp 1s ease both; animation-delay: 0.7s; opacity: 0; }
        .fade-3 { animation: fadeUp 1s ease both; animation-delay: 1.1s; opacity: 0; }
        .fade-4 { animation: fadeUp 1s ease both; animation-delay: 1.5s; opacity: 0; }
        .btn-p:hover { transform: scale(1.04); }
        .btn-s:hover { border-color: rgba(176,136,255,0.5) !important; }
        .feat-card:hover { border-color: rgba(176,136,255,0.28) !important; }
        .step-row:hover .step-num { color: #b088ff !important; }
        .radial-glow {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 55% 45% at 50% 50%, rgba(176,136,255,0.05) 0%, transparent 70%);
        }
      `}</style>

      {/* Cursor */}
      <div ref={cursorRef} style={S.cursor} />
      <div ref={ringRef} style={S.cursorRing} />

      {/* Particle bg */}
      <canvas ref={canvasRef} style={S.canvas} />
      <div className="radial-glow" />

      <main style={S.page}>

        {/* Nav */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem 3rem',
          background: 'rgba(5,5,8,0.35)',
          borderBottom: '1px solid rgba(255,255,255,0.02)',
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
              <line x1="16" y1="14" x2="14" y2="22" stroke="rgba(255,107,53,0.2)" stroke-width="0.8"/>
              <line x1="14" y1="22" x2="9" y2="19" stroke="rgba(255,107,53,0.2)" stroke-width="0.8"/>
              <line x1="22" y1="19" x2="14" y2="22" stroke="rgba(255,107,53,0.2)" stroke-width="0.8"/>
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
            <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.4rem', fontWeight: 300, color: '#c8c8d4', letterSpacing: '0.1em' }}>DRIFT</span>
          </Link>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link href="/constellation" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#50505e', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Constellation</span>
            </Link>
            <Link href="/report" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#50505e', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Weekly Report</span>
            </Link>
            <Link href="/journal" style={{ textDecoration: 'none' }}>
              <span style={{
                fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#50505e',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                border: '1px solid #1a1a2e', padding: '8px 16px',
              }}>+ New Entry</span>
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={S.hero}>
          <div className="fade-1" style={{ marginBottom: '1.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="80" height="80" style={{ display: 'block', margin: '0 auto' }}>
              <rect width="32" height="32" fill="#050508" rx="6"/>
              <line x1="16" y1="14" x2="22" y2="10" stroke="rgba(176,136,255,0.3)" strokeWidth="0.8"/>
              <line x1="16" y1="14" x2="22" y2="19" stroke="rgba(176,136,255,0.3)" strokeWidth="0.8"/>
              <line x1="16" y1="14" x2="10" y2="11" stroke="rgba(126,184,247,0.3)" strokeWidth="0.8"/>
              <line x1="22" y1="10" x2="22" y2="19" stroke="rgba(176,136,255,0.2)" strokeWidth="0.8"/>
              <line x1="10" y1="11" x2="9" y2="19" stroke="rgba(126,184,247,0.2)" strokeWidth="0.8"/>
              <line x1="9" y1="19" x2="16" y2="14" stroke="rgba(126,184,247,0.2)" strokeWidth="0.8"/>
              <line x1="16" y1="14" x2="14" y2="22" stroke="rgba(255,107,53,0.2)" strokeWidth="0.8"/>
              <line x1="14" y1="22" x2="9" y2="19" stroke="rgba(255,107,53,0.2)" stroke-width="0.8"/>
              <line x1="22" y1="19" x2="14" y2="22" stroke="rgba(255,107,53,0.2)" stroke-width="0.8"/>
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
          </div>
          <div className="fade-1" style={S.wordmark}>DRIFT</div>
          <p className="fade-2" style={S.tagline}>A mirror that shows you who you are becoming.</p>
          <p className="fade-3" style={S.sub}>Your thoughts. Mapped. In vector space.</p>
          <div className="fade-4" style={S.ctaRow}>
            <Link href="/journal" style={S.btnPrimary} className="btn-p">Begin</Link>
            <Link href="/constellation" style={S.btnSecondary} className="btn-s">See the Constellation</Link>
            <Link href="/report" style={S.btnSecondary} className="btn-s">Weekly Report</Link>
          </div>

          {/* Scroll indicator */}
          <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{
              width: '1px', height: '48px',
              background: 'linear-gradient(to bottom, transparent, #3a2260, transparent)',
              animation: 'fadeUp 2s ease infinite alternate',
            }} />
          </div>
        </section>

        {/* ── CONCEPT ── */}
        <section style={S.section}>
          <p style={S.sectionLabel}>The idea</p>
          <h2 style={S.conceptHeading}>
            Every thought you have has a shape.<br />
            <span style={{ color: '#50505e' }}>Every feeling has a neighbor.</span>
          </h2>
          <div style={S.divider} />
          <p style={S.conceptBody}>
            DRIFT embeds your journal entries into vector space — not by keyword, not by date,
            but by the deep semantic texture of how you think. Over time, your entries form a
            constellation. Clusters reveal your{' '}
            <span key={cycleIdx} style={{ color: '#b088ff', fontStyle: 'italic', display: 'inline-block', animation: 'wordSwap 2.2s ease' }}>
              {CYCLING[cycleIdx]}
            </span>.
            {' '}Outliers mark the days you were most yourself. And two entries from different months
            that land beside each other in the space? The model knew something you didn't.
          </p>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ ...S.section, paddingTop: '20px' }}>
          <p style={S.sectionLabel}>What DRIFT shows you</p>
          <div style={S.cardsGrid}>
            {FEATURES.map(f => (
              <div key={f.title} style={S.card} className="feat-card" >
                <span style={S.cardIcon}>{f.icon}</span>
                <div style={S.cardTitle}>{f.title}</div>
                <div style={S.cardBody}>{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── QUOTE ── */}
        <section style={S.quoteSection}>
          <p style={S.quoteText}>
            "We do not grow absolutely, chronologically. We grow sometimes in one dimension, and not in another; unevenly."
          </p>
          <p style={S.quoteAttr}>— Anaïs Nin</p>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={S.stepsSection}>
          <p style={{ ...S.sectionLabel, textAlign: 'left' }}>Under the hood</p>
          {STEPS.map(s => (
            <div key={s.n} style={S.step} className="step-row">
              <span style={S.stepNum} className="step-num">{s.n}</span>
              <div>
                <div style={S.stepTitle}>{s.title}</div>
                <div style={S.stepBody}>{s.body}</div>
              </div>
            </div>
          ))}
        </section>

        {/* ── FINAL CTA ── */}
        <section style={S.finalSection}>
          <p style={S.finalHeading}>Who are you becoming?</p>
          <p style={S.finalSub}>The constellation will tell you.</p>
          <Link href="/journal" style={S.btnPrimary} className="btn-p">Enter DRIFT</Link>
        </section>

        {/* ── FOOTER ── */}
        <footer style={S.footer}>
          <span style={S.footerText}>DRIFT — Powered by Qdrant Vector Search</span>
          <span style={S.footerText}>Built for Vector Space Day 2026</span>
        </footer>

      </main>
    </>
  )
}
