'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import * as THREE from 'three'
import { getEntries, getSimilarEntries } from '@/lib/api'
import { projectToPCA3D } from '@/pca'

type Entry = {
  id: string; text: string; title: string
  timestamp: string; source: string; vector: number[]
  position?: THREE.Vector3
}

function timeColor(t: number): THREE.Color {
  const colors = [
    new THREE.Color('#3b6ea5'), new THREE.Color('#7eb8f7'),
    new THREE.Color('#b088ff'), new THREE.Color('#ff9966'), new THREE.Color('#ff6b35'),
  ]
  const sc = Math.max(0, Math.min(1, t)) * (colors.length - 1)
  const i = Math.floor(sc); const f = sc - i
  return i >= colors.length - 1 ? colors[colors.length - 1] : colors[i].clone().lerp(colors[i + 1], f)
}

function timeAgo(ts: string) {
  try {
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000)
    if (d === 0) return 'today'; if (d === 1) return 'yesterday'
    if (d < 30) return `${d} days ago`; if (d < 365) return `${Math.floor(d/30)} months ago`
    return `${Math.floor(d/365)} years ago`
  } catch { return '' }
}

const mono = '"DM Mono","Courier New",monospace'
const serif = '"Cormorant Garamond",Georgia,serif'
const sans = '"Outfit",system-ui,sans-serif'

// ── Guide modal ───────────────────────────────────────────────────────────────
function Guide({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0)
  const steps = [
    { icon: '◉', title: 'Every dot is a thought', body: 'Each point in this space is a journal entry you wrote. There are no dates or categories — only meaning.' },
    { icon: '⟷', title: 'Proximity = similarity', body: 'Dots close together contain similar ideas — even if written weeks apart. The space reveals what your mind keeps returning to.' },
    { icon: '✦', title: 'Color = time', body: 'Blue dots are older entries. Purple is the middle. Orange is recent. Watch how your thinking has moved across time.' },
    { icon: '↗', title: 'Click to explore', body: 'Click any dot to read the entry. Then hit "Find similar" to draw glowing lines between thoughts that echo each other.' },
  ]
  const s = steps[step]; const isLast = step === steps.length - 1
  return (
    <div style={{ position:'absolute',inset:0,zIndex:100,background:'rgba(5,5,8,0.88)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)' }}>
      <div style={{ maxWidth:'400px',width:'90%',background:'rgba(10,10,18,0.98)',border:'1px solid rgba(176,136,255,0.15)',padding:'2.5rem',fontFamily:sans }}>
        <div style={{ display:'flex',gap:'6px',marginBottom:'2rem' }}>
          {steps.map((_,i) => <div key={i} style={{ height:'3px',background:i===step?'#b088ff':'#1a1a2e',borderRadius:'2px',flex:i===step?2:1,transition:'all 0.3s ease' }} />)}
        </div>
        <div style={{ fontSize:'1.8rem',marginBottom:'0.75rem' }}>{s.icon}</div>
        <h2 style={{ fontFamily:serif,fontSize:'1.6rem',fontWeight:300,color:'#c8c8d4',marginBottom:'0.75rem' }}>{s.title}</h2>
        <p style={{ color:'#50505e',lineHeight:1.85,fontSize:'0.88rem',marginBottom:'2rem' }}>{s.body}</p>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          {step > 0
            ? <button onClick={() => setStep(s=>s-1)} style={{ background:'none',border:'none',color:'#50505e',fontSize:'0.65rem',letterSpacing:'0.15em',cursor:'pointer',fontFamily:mono,textTransform:'uppercase' }}>← Back</button>
            : <div/>}
          <button onClick={isLast ? onDismiss : () => setStep(s=>s+1)} style={{ padding:'10px 24px',background:isLast?'#c8c8d4':'transparent',color:isLast?'#050508':'#c8c8d4',border:isLast?'none':'1px solid #50505e',fontSize:'0.65rem',letterSpacing:'0.15em',cursor:'pointer',fontFamily:mono,textTransform:'uppercase' }}>
            {isLast ? 'Enter the constellation' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Entry panel ───────────────────────────────────────────────────────────────
// (It uses ✕ button for closing)
function EntryPanel({ entry, similar, onClose, onFindSimilar, loading }: {
  entry: Entry; similar: any[]; onClose: () => void; onFindSimilar: () => void; loading: boolean
}) {
  return (
    <div style={{ position:'absolute',right:0,top:0,bottom:0,width:'340px',background:'rgba(8,8,15,0.98)',borderLeft:'1px solid rgba(176,136,255,0.08)',display:'flex',flexDirection:'column',fontFamily:sans,zIndex:50 }}>
      <div style={{ padding:'1.5rem',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
        <div>
          <p style={{ fontSize:'0.6rem',letterSpacing:'0.2em',color:'#3a2260',fontFamily:mono,textTransform:'uppercase',marginBottom:'0.4rem' }}>
            {entry.source==='voice'?'◉ Voice':'⌨ Text'} · {timeAgo(entry.timestamp)}
          </p>
          {entry.title && <p style={{ color:'#c8c8d4',fontFamily:serif,fontSize:'1.1rem',fontWeight:300 }}>{entry.title}</p>}
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',color:'#50505e',fontSize:'1.1rem',cursor:'pointer',lineHeight:1,padding:'0 0 0 1rem' }}>✕</button>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'1.5rem' }}>
        <p style={{ color:'#c8c8d4',fontWeight:300,lineHeight:1.9,fontSize:'0.88rem' }}>{entry.text}</p>
        <button onClick={onFindSimilar} disabled={loading} style={{ width:'100%',marginTop:'1.5rem',padding:'11px',background:'none',border:'1px solid rgba(176,136,255,0.12)',color:loading?'#3a2260':'#c8c8d4',cursor:loading?'default':'pointer',fontSize:'0.62rem',letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:mono,transition:'border-color 0.2s' }}>
          {loading ? 'Searching...' : '⟷  Find similar entries'}
        </button>
        {similar.length > 0 && (
          <div style={{ marginTop:'1.5rem' }}>
            <p style={{ fontSize:'0.6rem',letterSpacing:'0.2em',color:'#50505e',textTransform:'uppercase',fontFamily:mono,marginBottom:'0.75rem' }}>Echoes in the space</p>
            {similar.map((s:any) => (
              <div key={s.id} style={{ border:'1px solid rgba(255,107,53,0.12)',padding:'0.9rem',marginBottom:'0.6rem',borderRadius:'2px' }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.4rem' }}>
                  <span style={{ color:'#ff6b35',fontSize:'0.62rem',fontFamily:mono }}>{(s.score*100).toFixed(1)}% similar</span>
                  <span style={{ color:'#50505e',fontSize:'0.62rem',fontFamily:mono }}>{timeAgo(s.timestamp)}</span>
                </div>
                <p style={{ color:'#c8c8d4',fontSize:'0.82rem',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical' as any }}>{s.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const GUIDE_KEY = 'drift_guide_seen'

export default function ConstellationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<any>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Entry | null>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [similarIds, setSimilarIds] = useState<string[]>([])
  const [loadingSim, setLoadingSim] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  // Show guide only first time
  useEffect(() => {
    const seen = localStorage.getItem(GUIDE_KEY)
    if (!seen) setShowGuide(true)
  }, [])

  const dismissGuide = () => {
    localStorage.setItem(GUIDE_KEY, '1')
    setShowGuide(false)
  }

  useEffect(() => {
    getEntries().then(data => { setEntries(data); setLoading(false) })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || entries.length === 0) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 14)

    const vectors = entries.map(e => e.vector)
    const pos3D = projectToPCA3D(vectors)
    const maxD = Math.max(...pos3D.map(p => Math.sqrt(p[0]**2+p[1]**2+p[2]**2)))
    const sc = 6 / (maxD || 1)

    const tss = entries.map(e => new Date(e.timestamp).getTime())
    const minT = Math.min(...tss), maxT = Math.max(...tss), tR = maxT - minT || 1

    const meshes = new Map<string, THREE.Mesh>()
    const group = new THREE.Group()

    entries.forEach((entry, i) => {
      const [x, y, z] = pos3D[i]
      const pos = new THREE.Vector3(x*sc, y*sc, z*sc)
      entry.position = pos
      const tN = (new Date(entry.timestamp).getTime() - minT) / tR
      const geo = new THREE.SphereGeometry(0.1, 8, 8)
      const mat = new THREE.MeshBasicMaterial({ color: timeColor(tN), transparent: true, opacity: 0.92 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      mesh.userData = { id: entry.id }
      group.add(mesh); meshes.set(entry.id, mesh)
    })
    scene.add(group)

    // Stars bg
    const sg = new THREE.BufferGeometry()
    const sp = new Float32Array(600)
    for (let i=0;i<200;i++){sp[i*3]=(Math.random()-.5)*100;sp[i*3+1]=(Math.random()-.5)*100;sp[i*3+2]=(Math.random()-.5)*100}
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3))
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x222244, size: 0.04 })))

    let theta=0, phi=Math.PI/2, radius=14, dragging=false, px=0, py=0
    const onDown=(e:MouseEvent)=>{dragging=true;px=e.clientX;py=e.clientY}
    const onMove=(e:MouseEvent)=>{if(!dragging)return;theta-=(e.clientX-px)*.005;phi=Math.max(.3,Math.min(Math.PI-.3,phi-(e.clientY-py)*.005));px=e.clientX;py=e.clientY}
    const onUp=()=>{dragging=false}
    const onWheel=(e:WheelEvent)=>{radius=Math.max(4,Math.min(28,radius+e.deltaY*.012))}

    const ray = new THREE.Raycaster()
    const ptr = new THREE.Vector2()
    const onClick=(e:MouseEvent)=>{
      ptr.x=(e.clientX/window.innerWidth)*2-1
      ptr.y=-(e.clientY/window.innerHeight)*2+1
      ray.setFromCamera(ptr, camera)
      const hits = ray.intersectObjects(Array.from(meshes.values()))
      if(hits.length>0){
        const id=hits[0].object.userData.id
        const entry=entries.find(en=>en.id===id)
        if(entry){setSelected(entry);setSimilar([]);setSimilarIds([])}
      }
    }

    canvas.addEventListener('mousedown',onDown)
    canvas.addEventListener('mousemove',onMove)
    canvas.addEventListener('mouseup',onUp)
    canvas.addEventListener('wheel',onWheel)
    canvas.addEventListener('click',onClick)

    sceneRef.current = { scene, camera, meshes, entries, lines: null }

    let animId: number
    const animate=()=>{
      animId=requestAnimationFrame(animate)
      if(!dragging) theta+=.0006
      camera.position.x=radius*Math.sin(phi)*Math.sin(theta)
      camera.position.y=radius*Math.cos(phi)
      camera.position.z=radius*Math.sin(phi)*Math.cos(theta)
      camera.lookAt(0,0,0)
      renderer.render(scene,camera)
    }
    animate()

    const onResize=()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight)}
    window.addEventListener('resize',onResize)

    return()=>{
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousedown',onDown);canvas.removeEventListener('mousemove',onMove)
      canvas.removeEventListener('mouseup',onUp);canvas.removeEventListener('wheel',onWheel)
      canvas.removeEventListener('click',onClick);window.removeEventListener('resize',onResize)
      renderer.dispose()
    }
  }, [entries])

  // Update selection visuals + lines
  useEffect(() => {
    const s = sceneRef.current; if(!s) return
    const tss = s.entries.map((e:Entry)=>new Date(e.timestamp).getTime())
    const minT=Math.min(...tss),maxT=Math.max(...tss),tR=maxT-minT||1

    s.meshes.forEach((mesh:THREE.Mesh,id:string)=>{
      const mat=mesh.material as THREE.MeshBasicMaterial
      const entry=s.entries.find((e:Entry)=>e.id===id)
      if(!entry)return
      const tN=(new Date(entry.timestamp).getTime()-minT)/tR
      if(id===selected?.id){mat.color.set(0xffffff);mesh.scale.setScalar(3)}
      else if(similarIds.includes(id)){mat.color.set(0xff6b35);mesh.scale.setScalar(2.2)}
      else{mat.color.copy(timeColor(tN));mesh.scale.setScalar(selected?.id?0.7:1)}
    })

    if(s.lines){s.scene.remove(s.lines);s.lines.geometry.dispose();(s.lines.material as THREE.Material).dispose();s.lines=null}
    if(selected&&similarIds.length>0){
      const sel=s.entries.find((e:Entry)=>e.id===selected.id)
      if(sel?.position){
        const pts:THREE.Vector3[]=[]
        similarIds.forEach((sid:string)=>{
          const sim=s.entries.find((e:Entry)=>e.id===sid)
          if(sim?.position){pts.push(sel.position.clone());pts.push(sim.position.clone())}
        })
        if(pts.length>0){
          const geo=new THREE.BufferGeometry().setFromPoints(pts)
          const mat=new THREE.LineBasicMaterial({color:0xff6b35,transparent:true,opacity:0.4})
          s.lines=new THREE.LineSegments(geo,mat)
          s.scene.add(s.lines)
        }
      }
    }
  }, [selected, similarIds])

  const handleSimilar = useCallback(async()=>{
    if(!selected)return; setLoadingSim(true)
    try{const r=await getSimilarEntries(selected.id);setSimilar(r.similar);setSimilarIds(r.similar.map((s:any)=>s.id))}
    finally{setLoadingSim(false)}
  },[selected])

  return (
    <div style={{ width:'100vw',height:'100vh',background:'#050508',overflow:'hidden',position:'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400&display=swap');
        *{cursor:none!important;box-sizing:border-box;margin:0;padding:0;}
        a{text-decoration:none;color:inherit;}
        .guide-btn:hover{color:#c8c8d4!important;border-color:rgba(176,136,255,0.3)!important;}
      `}</style>

      {/* Cursor */}
      <div id="crc" style={{ position:'fixed',width:'8px',height:'8px',background:'#b088ff',borderRadius:'50%',pointerEvents:'none',zIndex:9999,transform:'translate(-50%,-50%)',mixBlendMode:'screen' as any }} />

      {/* Nav */}
      <nav style={{ position:'absolute',top:0,left:0,right:0,zIndex:40,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1.5rem 2.5rem' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" style={{ display: 'block' }}>
            <rect width="32" height="32" fill="#050508" rx="6"/>
            <line x1="16" y1="14" x2="22" y2="10" stroke="rgba(176,136,255,0.3)" stroke-width="0.8"/>
            <line x1="16" y1="14" x2="22" y2="19" stroke="rgba(176,136,255,0.3)" stroke-width="0.8"/>
            <line x1="16" y1="14" x2="10" y2="11" stroke="rgba(126,184,247,0.3)" stroke-width="0.8"/>
            <line x1="22" y1="10" x2="22" y2="19" stroke="rgba(176,136,255,0.2)" stroke-width="0.8"/>
            <line x1="10" y1="11" x2="9" y2="19" stroke="rgba(126,184,247,0.2)" stroke-width="0.8"/>
            <line x1="9" y1="19" x2="16" y2="14" stroke="rgba(126,184,247,0.2)" stroke-width="0.8"/>
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
          <span style={{ fontFamily:serif,fontSize:'1.3rem',fontWeight:300,color:'#c8c8d4',letterSpacing:'0.1em' }}>DRIFT</span>
        </Link>
        <div style={{ display:'flex',gap:'1.5rem',alignItems:'center' }}>
          {!loading&&<span style={{ fontFamily:mono,fontSize:'0.6rem',color:'#3a3a48',letterSpacing:'0.1em' }}>{entries.length} of {entries.length} entries visible</span>}
          <button onClick={()=>setShowGuide(true)} className="guide-btn" style={{ background:'none',border:'1px solid #1a1a2e',color:'#50505e',fontFamily:mono,fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',padding:'6px 12px',cursor:'pointer',transition:'all 0.2s' }}>
            ? Guide
          </button>
          <Link href="/report">
            <span style={{ fontFamily:mono,fontSize:'0.6rem',color:'#50505e',letterSpacing:'0.15em',textTransform:'uppercase' }}>Weekly Report</span>
          </Link>
          <Link href="/journal">
            <span style={{ fontFamily:mono,fontSize:'0.6rem',color:'#50505e',letterSpacing:'0.15em',textTransform:'uppercase',border:'1px solid #1a1a2e',padding:'6px 12px' }}>+ New Entry</span>
          </Link>
        </div>
      </nav>

      <canvas ref={canvasRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%' }} />

      {loading&&(
        <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:30 }}>
          <div style={{ width:'36px',height:'36px',border:'1px solid #3a2260',borderTopColor:'#b088ff',borderRadius:'50%',animation:'spin 2s linear infinite',marginBottom:'1rem' }} />
          <p style={{ fontFamily:mono,fontSize:'0.65rem',color:'#3a2260',letterSpacing:'0.15em' }}>Mapping your constellation...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {!loading&&entries.length===0&&(
        <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:30 }}>
          <p style={{ fontFamily:serif,fontSize:'2rem',fontWeight:300,color:'#c8c8d4',marginBottom:'0.75rem' }}>The space is empty.</p>
          <p style={{ color:'#50505e',marginBottom:'2rem',fontFamily:sans,fontWeight:300,fontSize:'0.9rem' }}>Write your first entry to begin.</p>
          <Link href="/journal"><span style={{ fontFamily:mono,fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',border:'1px solid #50505e',color:'#50505e',padding:'10px 24px' }}>Begin</span></Link>
        </div>
      )}

      {showGuide&&!loading&&<Guide onDismiss={dismissGuide}/>}

      {selected&&(
        <EntryPanel entry={selected} similar={similar}
          onClose={()=>{setSelected(null);setSimilar([]);setSimilarIds([])}}
          onFindSimilar={handleSimilar} loading={loadingSim}
        />
      )}

      {!loading&&entries.length>0&&(
        <div style={{ position:'absolute',bottom:'2rem',left:'2rem',fontFamily:mono,fontSize:'0.62rem' }}>
          <p style={{ color:'#50505e',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'0.5rem' }}>Color = Time</p>
          <div style={{ display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.4rem' }}>
            <div style={{ width:'72px',height:'3px',borderRadius:'2px',background:'linear-gradient(90deg,#3b6ea5,#b088ff,#ff6b35)' }}/>
            <span style={{ color:'#3a3a48' }}>oldest → newest</span>
          </div>
          <p style={{ color:'#3a3a48' }}>Drag to rotate · Scroll to zoom · Click to explore</p>
        </div>
      )}

      <script dangerouslySetInnerHTML={{__html:`var c=document.getElementById('crc');document.addEventListener('mousemove',function(e){if(c){c.style.left=e.clientX+'px';c.style.top=e.clientY+'px';}});`}}/>
    </div>
  )
}
