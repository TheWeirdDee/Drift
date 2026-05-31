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
    if (d < 30) return `${d} days ago`; if (d < 365) return `${Math.floor(d/30)}mo ago`
    return `${Math.floor(d/365)}y ago`
  } catch { return '' }
}

function fmtDate(ts: string) {
  try { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '' }
}

const mono = '"DM Mono","Courier New",monospace'
const serif = '"Cormorant Garamond",Georgia,serif'
const sans = '"Outfit",system-ui,sans-serif'
const GUIDE_KEY = 'drift_guide_seen_v2'

// ── Guide ─────────────────────────────────────────────────────────────────────
function Guide({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0)
  const steps = [
    { icon: '◉', title: 'Every dot is a thought', body: 'Each point is a journal entry. No dates, no categories — only meaning. The space organises itself.' },
    { icon: '⟷', title: 'Proximity = similarity', body: 'Dots close together share similar ideas — even if written weeks apart. Clusters reveal what your mind keeps returning to.' },
    { icon: '✦', title: 'Color = time', body: 'Blue is older. Purple is middle. Orange is recent. Watch how your thinking has shifted over time.' },
    { icon: '↗', title: 'Click any dot to explore', body: 'Click a dot to read the entry. Hit "Find similar" to draw glowing lines between thoughts that echo each other across time.' },
  ]
  const s = steps[step]; const isLast = step === steps.length - 1
  return (
    <div style={{ position:'absolute',inset:0,zIndex:100,background:'rgba(5,5,8,0.9)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',padding:'1rem' }}>
      <div style={{ maxWidth:'380px',width:'100%',background:'rgba(10,10,18,0.99)',border:'1px solid rgba(176,136,255,0.15)',padding:'2.5rem',fontFamily:sans }}>
        <div style={{ display:'flex',gap:'5px',marginBottom:'2rem' }}>
          {steps.map((_,i) => <div key={i} style={{ height:'2px',background:i<=step?'#b088ff':'#1a1a2e',flex:1,borderRadius:'1px',transition:'background 0.3s' }} />)}
        </div>
        <div style={{ fontSize:'1.6rem',marginBottom:'0.6rem' }}>{s.icon}</div>
        <h2 style={{ fontFamily:serif,fontSize:'1.5rem',fontWeight:300,color:'#c8c8d4',marginBottom:'0.75rem',lineHeight:1.2 }}>{s.title}</h2>
        <p style={{ color:'#50505e',lineHeight:1.85,fontSize:'0.88rem',marginBottom:'2rem' }}>{s.body}</p>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          {step > 0
            ? <button onClick={()=>setStep(s=>s-1)} style={{ background:'none',border:'none',color:'#50505e',fontSize:'0.62rem',letterSpacing:'0.15em',cursor:'pointer',fontFamily:mono,textTransform:'uppercase' }}>← Back</button>
            : <div/>}
          <button onClick={isLast?onDismiss:()=>setStep(s=>s+1)} style={{ padding:'10px 22px',background:isLast?'#c8c8d4':'transparent',color:isLast?'#050508':'#c8c8d4',border:isLast?'none':'1px solid #50505e',fontSize:'0.62rem',letterSpacing:'0.15em',cursor:'pointer',fontFamily:mono,textTransform:'uppercase' }}>
            {isLast?'Enter the constellation':'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Entry panel ───────────────────────────────────────────────────────────────
function EntryPanel({ entry, similar, onClose, onFindSimilar, loading }: {
  entry: Entry; similar: any[]; onClose: () => void; onFindSimilar: () => void; loading: boolean
}) {
  return (
    <div className="entry-panel" style={{ position:'absolute',right:0,top:0,bottom:0,width:'min(340px,90vw)',background:'rgba(8,8,15,0.99)',borderLeft:'1px solid rgba(176,136,255,0.08)',display:'flex',flexDirection:'column',fontFamily:sans,zIndex:50,overflowY:'auto' }}>
      <div style={{ padding:'1.25rem 1.5rem',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'1rem' }}>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:'0.6rem',letterSpacing:'0.18em',color:'#b088ff',fontFamily:mono,textTransform:'uppercase',marginBottom:'0.3rem' }}>
            {entry.source==='voice'?'◉ Voice':'⌨ Text'} · {timeAgo(entry.timestamp)}
          </p>
          {entry.title && <p style={{ color:'#c8c8d4',fontFamily:serif,fontSize:'1rem',fontWeight:300,wordBreak:'break-word' }}>{entry.title}</p>}
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',color:'#a0a0b5',fontSize:'1.1rem',cursor:'pointer',lineHeight:1,flexShrink:0 }}>✕</button>
      </div>
      <div style={{ flex:1,padding:'1.25rem 1.5rem',overflowY:'auto' }}>
        <p style={{ color:'#c8c8d4',fontWeight:300,lineHeight:1.9,fontSize:'0.88rem',wordBreak:'break-word' }}>{entry.text}</p>
        <p style={{ fontFamily:mono,fontSize:'0.6rem',color:'#808092',marginTop:'0.75rem' }}>{fmtDate(entry.timestamp)}</p>
        <button onClick={onFindSimilar} disabled={loading} style={{ width:'100%',marginTop:'1.25rem',padding:'11px',background:'none',border:'1px solid rgba(176,136,255,0.12)',color:loading?'#50506e':'#c8c8d4',cursor:loading?'default':'pointer',fontSize:'0.62rem',letterSpacing:'0.15em',textTransform:'uppercase',fontFamily:mono }}>
          {loading?'Searching...':'⟷  Find similar entries'}
        </button>
        {similar.length > 0 && (
          <div style={{ marginTop:'1.25rem' }}>
            <p style={{ fontSize:'0.6rem',letterSpacing:'0.18em',color:'#a0a0b5',textTransform:'uppercase',fontFamily:mono,marginBottom:'0.75rem' }}>Echoes in the space</p>
            {similar.map((s:any) => (
              <div key={s.id} style={{ border:'1px solid rgba(255,107,53,0.12)',padding:'0.85rem',marginBottom:'0.6rem' }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.4rem' }}>
                  <span style={{ color:'#ff6b35',fontSize:'0.6rem',fontFamily:mono }}>{(s.score*100).toFixed(1)}% match</span>
                  <span style={{ color:'#808092',fontSize:'0.6rem',fontFamily:mono }}>{timeAgo(s.timestamp)}</span>
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

// ── Timeline slider ───────────────────────────────────────────────────────────
function Timeline({ entries, onFilter }: { entries: Entry[]; onFilter: (ids: Set<string>) => void }) {
  const timestamps = entries.map(e => new Date(e.timestamp).getTime())
  const minT = Math.min(...timestamps), maxT = Math.max(...timestamps)
  const [range, setRange] = useState([0, 100])

  useEffect(() => {
    const lo = minT + (range[0]/100)*(maxT-minT)
    const hi = minT + (range[1]/100)*(maxT-minT)
    const visible = new Set(entries.filter(e => {
      const t = new Date(e.timestamp).getTime()
      return t >= lo && t <= hi
    }).map(e => e.id))
    onFilter(visible)
  }, [range, entries])

  const fmtTs = (pct: number) => {
    const t = new Date(minT + (pct/100)*(maxT-minT))
    return t.toLocaleDateString('en-US', { month:'short', day:'numeric' })
  }

  if (minT === maxT) return null

  return (
    <div className="timeline-wrap" style={{ position:'absolute',bottom:'1rem',left:'50%',transform:'translateX(-50%)',width:'min(480px,80vw)',zIndex:20,padding:'0.75rem 1rem',background:'rgba(10,10,18,0.7)',backdropFilter:'blur(10px)',border:'1px solid rgba(176,136,255,0.08)',maxHeight:'80px',overflowY:'hidden' as const }}>
      <p style={{ fontFamily:mono,fontSize:'0.58rem',letterSpacing:'0.2em',color:'#a0a0b5',textTransform:'uppercase',textAlign:'center',marginBottom:'0.6rem' }}>Timeline filter</p>
      <div style={{ display:'flex',alignItems:'center',gap:'0.75rem' }}>
        <span style={{ fontFamily:mono,fontSize:'0.58rem',color:'#808092',whiteSpace:'nowrap' }}>{fmtTs(range[0])}</span>
        <div style={{ flex:1,position:'relative',height:'20px',display:'flex',alignItems:'center' }}>
          <div style={{ position:'absolute',left:0,right:0,height:'2px',background:'rgba(176,136,255,0.15)',borderRadius:'1px' }}/>
          <div style={{ position:'absolute',left:`${range[0]}%`,right:`${100-range[1]}%`,height:'2px',background:'#b088ff',borderRadius:'1px' }}/>
          <input type="range" min={0} max={100} value={range[0]}
            onChange={e => setRange(r => [Math.min(Number(e.target.value), r[1]-5), r[1]])}
            style={{ position:'absolute',width:'100%',appearance:'none',background:'transparent',cursor:'pointer',height:'20px' }}/>
          <input type="range" min={0} max={100} value={range[1]}
            onChange={e => setRange(r => [r[0], Math.max(Number(e.target.value), r[0]+5)])}
            style={{ position:'absolute',width:'100%',appearance:'none',background:'transparent',cursor:'pointer',height:'20px' }}/>
        </div>
        <span style={{ fontFamily:mono,fontSize:'0.58rem',color:'#808092',whiteSpace:'nowrap' }}>{fmtTs(range[1])}</span>
      </div>
      <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#b088ff;cursor:pointer;border:1px solid #050508;}`}</style>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
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
  const [visibleIds, setVisibleIds] = useState<Set<string> | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

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

  useEffect(() => {
    const seen = localStorage.getItem(GUIDE_KEY)
    if (!seen) setShowGuide(true)
  }, [])

  const dismissGuide = () => { localStorage.setItem(GUIDE_KEY, '1'); setShowGuide(false) }

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
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000)
    camera.position.set(0,0,14)

    const pos3D = projectToPCA3D(entries.map(e=>e.vector))
    const maxD = Math.max(...pos3D.map(p=>Math.sqrt(p[0]**2+p[1]**2+p[2]**2)))
    const sc = 6/(maxD||1)
    const tss = entries.map(e=>new Date(e.timestamp).getTime())
    const minT=Math.min(...tss),maxT=Math.max(...tss),tR=maxT-minT||1

    const meshes = new Map<string,THREE.Mesh>()
    const group = new THREE.Group()
    entries.forEach((entry,i)=>{
      const [x,y,z]=pos3D[i]
      const pos=new THREE.Vector3(x*sc,y*sc,z*sc)
      entry.position=pos
      const tN=(new Date(entry.timestamp).getTime()-minT)/tR
      const geo=new THREE.SphereGeometry(0.1,8,8)
      const mat=new THREE.MeshBasicMaterial({color:timeColor(tN),transparent:true,opacity:0.92})
      const mesh=new THREE.Mesh(geo,mat)
      mesh.position.copy(pos); mesh.userData={id:entry.id}
      group.add(mesh); meshes.set(entry.id,mesh)
    })
    scene.add(group)

    const sg=new THREE.BufferGeometry()
    const sp=new Float32Array(600)
    for(let i=0;i<200;i++){sp[i*3]=(Math.random()-.5)*100;sp[i*3+1]=(Math.random()-.5)*100;sp[i*3+2]=(Math.random()-.5)*100}
    sg.setAttribute('position',new THREE.BufferAttribute(sp,3))
    scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0x222244,size:0.04})))

    let radius=14,dragging=false,px=0,py=0,moved=false

    const onDown=(e:MouseEvent)=>{
      dragging=true;px=e.clientX;py=e.clientY;moved=false
    }
    const onMove=(e:MouseEvent)=>{
      if(!dragging)return
      const dx=e.clientX-px; const dy=e.clientY-py
      if(Math.abs(dx)>2||Math.abs(dy)>2)moved=true
      
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.005)
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.005)
      group.quaternion.premultiply(qY).premultiply(qX)
      
      px=e.clientX;py=e.clientY
    }
    const onUp=()=>{dragging=false}
    const onWheel=(e:WheelEvent)=>{radius=Math.max(4,Math.min(28,radius+e.deltaY*.012))}

    const onTouchStart=(e:TouchEvent)=>{
      if(e.touches.length===1){
        dragging=true;px=e.touches[0].clientX;py=e.touches[0].clientY;moved=false
      }
    }
    const onTouchMove=(e:TouchEvent)=>{
      if(!dragging||e.touches.length!==1)return
      const dx=e.touches[0].clientX-px; const dy=e.touches[0].clientY-py
      if(Math.abs(dx)>2||Math.abs(dy)>2)moved=true
      
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.005)
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.005)
      group.quaternion.premultiply(qY).premultiply(qX)
      
      px=e.touches[0].clientX;py=e.touches[0].clientY
    }
    const onTouchEnd=()=>{dragging=false}

    const ray=new THREE.Raycaster(); const ptr=new THREE.Vector2()
    const onClick=(e:MouseEvent)=>{
      if(moved)return // Skip click/selection if we were dragging/rotating!
      ptr.x=(e.clientX/window.innerWidth)*2-1; ptr.y=-(e.clientY/window.innerHeight)*2+1
      ray.setFromCamera(ptr,camera)
      const hits=ray.intersectObjects(Array.from(meshes.values()))
      if(hits.length>0){
        const id=hits[0].object.userData.id
        const entry=entries.find(en=>en.id===id)
        if(entry){
          setSelected(entry)
          setSimilar([])
          setSimilarIds([])
        }
      }
    }
    canvas.addEventListener('mousedown',onDown); window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp)
    canvas.addEventListener('touchstart',onTouchStart); canvas.addEventListener('touchmove',onTouchMove); canvas.addEventListener('touchend',onTouchEnd)
    canvas.addEventListener('wheel',onWheel); canvas.addEventListener('click',onClick)
    sceneRef.current={scene,camera,meshes,entries,group,lines:null}

    let animId:number
    const animate=()=>{
      animId=requestAnimationFrame(animate)
      if(!dragging){
        const qAutoY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.0012)
        const qAutoX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.0006)
        group.quaternion.premultiply(qAutoY).premultiply(qAutoX)
      }
      camera.position.set(0, 0, radius)
      camera.lookAt(0,0,0); renderer.render(scene,camera)
    }
    animate()
    const onResize=()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight)}
    window.addEventListener('resize',onResize)
    return()=>{
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown',onDown);
      window.removeEventListener('mousemove',onMove);
      window.removeEventListener('mouseup',onUp);
      canvas.removeEventListener('touchstart',onTouchStart);
      window.removeEventListener('touchmove',onTouchMove);
      window.removeEventListener('touchend',onTouchEnd);
      canvas.removeEventListener('wheel',onWheel);
      canvas.removeEventListener('click',onClick);
      window.removeEventListener('resize',onResize);
      renderer.dispose();
    }
  },[entries])

  // Timeline filter visibility
  useEffect(()=>{
    const s=sceneRef.current; if(!s)return
    s.meshes.forEach((mesh:THREE.Mesh,id:string)=>{
      mesh.visible = visibleIds===null || visibleIds.has(id)
    })
  },[visibleIds])

  // Selection + lines
  useEffect(()=>{
    const s=sceneRef.current; if(!s)return
    const tss=s.entries.map((e:Entry)=>new Date(e.timestamp).getTime())
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
    if(s.lines){s.group.remove(s.lines);s.lines.geometry.dispose();(s.lines.material as THREE.Material).dispose();s.lines=null}
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
          const mat=new THREE.LineBasicMaterial({color:0xff6b35,transparent:true,opacity:0.45})
          s.lines=new THREE.LineSegments(geo,mat); s.group.add(s.lines)
        }
      }
    }
  },[selected,similarIds])

  const handleSimilar=useCallback(async()=>{
    if(!selected)return; setLoadingSim(true)
    try{const r=await getSimilarEntries(selected.id);setSimilar(r.similar);setSimilarIds(r.similar.map((s:any)=>s.id))}
    finally{setLoadingSim(false)}
  },[selected])

  const visibleCount = visibleIds ? entries.filter(e=>visibleIds.has(e.id)).length : entries.length

  return (
    <div style={{width:'100vw',height:'100vh',background:'#050508',overflow:'hidden',position:'relative'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @media(min-width:641px){ *{cursor:none!important;} }
        @media(max-width:640px){ #crc{display:none!important;} }
        a{text-decoration:none;color:inherit;}
        .nav-btn{background:none;border:1px solid #1a1a2e;color:#b0b0c5;fontFamily:${mono};font-size:0.6rem;letter-spacing:0.15em;text-transform:uppercase;padding:6px 12px;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
        .nav-btn:hover{border-color:rgba(176,136,255,0.3);color:#ffffff;}
        .nav-link{font-family:${mono};font-size:0.6rem;color:#b0b0c5;letter-spacing:0.15em;text-transform:uppercase;white-space:nowrap;}
        .nav-link:hover{color:#ffffff;}
        .hamburger{background:none;border:none;color:#50505e;font-size:1.2rem;cursor:pointer;padding:4px 8px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:640px){.desktop-nav{display:none!important}.mobile-menu-btn{display:flex!important}}
        @media(min-width:641px){.mobile-menu-btn{display:none!important}.mobile-dropdown{display:none!important}}
        @media(max-width:640px){ .timeline-wrap{ bottom: 1rem !important; left: 1rem !important; right: 1rem !important; transform: none !important; width: auto !important; } }
        @media(max-width:640px){
          .entry-panel{
            position:fixed!important;
            right:0!important;
            left:0!important;
            top:auto!important;
            bottom:0!important;
            width:100%!important;
            max-height:45vh!important;
            border-left:none!important;
            border-top:1px solid rgba(176,136,255,0.1)!important;
            border-radius:12px 12px 0 0!important;
          }
        }
        @media(max-width:640px){
          .nav-container{
            padding: 1rem 1.5rem!important;
          }
        }
      `}</style>

      {/* Cursor */}
      <div id="crc" style={{position:'fixed',width:'8px',height:'8px',background:'#b088ff',borderRadius:'50%',pointerEvents:'none',zIndex:9999,transform:'translate(-50%,-50%)',mixBlendMode:'screen' as any}}/>

      {/* Nav */}
      <nav className="nav-container" style={{position:'absolute',top:0,left:0,right:0,zIndex:40,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1.25rem 2rem',gap:'1rem'}}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" style={{ display: 'block' }}>
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
          <span style={{fontFamily:serif,fontSize:'1.3rem',fontWeight:300,color:'#c8c8d4',letterSpacing:'0.1em'}}>DRIFT</span>
        </Link>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{display:'flex',gap:'1rem',alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <span style={{fontFamily:mono,fontSize:'0.58rem',color:'#a0a0b5',letterSpacing:'0.1em'}}>{visibleCount} of {entries.length} entries</span>
          <button onClick={()=>setShowGuide(true)} className="nav-btn">? Guide</button>
          <Link href="/report"><span className="nav-link">Weekly Report</span></Link>
          <Link href="/journal"><span className="nav-btn" style={{display:'inline-block'}}>+ New Entry</span></Link>
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger mobile-menu-btn" onClick={()=>setMenuOpen(o=>!o)} style={{display:'none'}}>☰</button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-dropdown" style={{position:'absolute',top:'56px',right:'1rem',zIndex:45,background:'rgba(10,10,18,0.98)',border:'1px solid rgba(176,136,255,0.1)',padding:'1rem',display:'flex',flexDirection:'column',gap:'0.75rem',minWidth:'160px'}}>
          <button onClick={()=>{setShowGuide(true);setMenuOpen(false)}} style={{background:'none',border:'none',color:'#c8c8d4',fontFamily:mono,fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',textAlign:'left'}}>? Guide</button>
          <Link href="/report" onClick={()=>setMenuOpen(false)}><span style={{fontFamily:mono,fontSize:'0.65rem',color:'#c8c8d4',letterSpacing:'0.15em',textTransform:'uppercase'}}>Weekly Report</span></Link>
          <Link href="/journal" onClick={()=>setMenuOpen(false)}><span style={{fontFamily:mono,fontSize:'0.65rem',color:'#c8c8d4',letterSpacing:'0.15em',textTransform:'uppercase'}}>+ New Entry</span></Link>
        </div>
      )}

      <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',touchAction:'none'}}/>

      {loading&&(
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:30}}>
          <div style={{width:'36px',height:'36px',border:'1px solid #50506e',borderTopColor:'#b088ff',borderRadius:'50%',animation:'spin 2s linear infinite',marginBottom:'1rem'}}/>
          <p style={{fontFamily:mono,fontSize:'0.65rem',color:'#808092',letterSpacing:'0.15em'}}>Mapping your constellation...</p>
        </div>
      )}

      {!loading&&entries.length===0&&(
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:30,padding:'2rem',textAlign:'center'}}>
          <p style={{fontFamily:serif,fontSize:'2rem',fontWeight:300,color:'#c8c8d4',marginBottom:'0.75rem'}}>The space is empty.</p>
          <p style={{color:'#808092',marginBottom:'2rem',fontFamily:sans,fontWeight:300}}>Write your first entry to begin.</p>
          <Link href="/journal"><span style={{fontFamily:mono,fontSize:'0.65rem',letterSpacing:'0.2em',textTransform:'uppercase',border:'1px solid #808092',color:'#808092',padding:'10px 24px'}}>Begin</span></Link>
        </div>
      )}

      {showGuide&&!loading&&<Guide onDismiss={dismissGuide}/>}

      {selected&&(
        <EntryPanel entry={selected} similar={similar}
          onClose={()=>{setSelected(null)}}
          onFindSimilar={handleSimilar} loading={loadingSim}
        />
      )}

      {/* Timeline */}
      {!loading&&entries.length>1&&(
        <Timeline entries={entries} onFilter={(ids)=>setVisibleIds(ids)}/>
      )}

      {/* Legend */}
      {!loading&&entries.length>0&&(
        <div style={{position:'absolute',bottom:'2rem',left:'1.5rem',fontFamily:mono,fontSize:'0.6rem'}}>
          <p style={{color:'#a0a0b5',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'0.4rem'}}>Color = Time</p>
          <div style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.35rem'}}>
            <div style={{width:'60px',height:'2px',borderRadius:'1px',background:'linear-gradient(90deg,#3b6ea5,#b088ff,#ff6b35)'}}/>
            <span style={{color:'#808092'}}>oldest → newest</span>
          </div>
          <p style={{color:'#808092'}}>Drag · Scroll to zoom · Click to explore</p>
        </div>
      )}

    </div>
  )
}
