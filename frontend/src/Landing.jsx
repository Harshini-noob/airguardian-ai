import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'

const AQI_COLOR = (v) => v<=50?'#10b981':v<=100?'#84cc16':v<=200?'#f59e0b':v<=300?'#ef4444':v<=400?'#8b5cf6':'#be185d'
const AQI_LABEL = (v) => v<=50?'Good':v<=100?'Satisfactory':v<=200?'Moderate':v<=300?'Poor':v<=400?'Very Poor':'Severe'

/* ── Ticker ── */
function Ticker({ stations }) {
  const ref   = useRef(null)
  const posX  = useRef(0)
  const rafId = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !stations.length) return
    const step = () => {
      posX.current -= 0.45
      if (posX.current < -(el.scrollWidth / 2)) posX.current = 0
      el.style.transform = `translateX(${posX.current}px)`
      rafId.current = requestAnimationFrame(step)
    }
    rafId.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId.current)
  }, [stations])

  if (!stations.length) return null
  const items = [...stations, ...stations]

  return (
    <div style={{ overflow:'hidden', borderTop:'1px solid rgba(14,165,233,0.1)', borderBottom:'1px solid rgba(14,165,233,0.1)', padding:'10px 0', background:'rgba(14,165,233,0.03)' }}>
      <div ref={ref} style={{ display:'flex', whiteSpace:'nowrap' }}>
        {items.map((s,i) => (
          <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'0 36px', borderRight:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:AQI_COLOR(s.aqi),boxShadow:`0 0 8px ${AQI_COLOR(s.aqi)}`,display:'inline-block',flexShrink:0 }}/>
            <span style={{ color:'#475569',fontSize:11,letterSpacing:'0.08em' }}>
              {s.name.replace(/,\s*Chennai\s*-\s*(CPCB|TNPCB)/,'').trim().toUpperCase()}
            </span>
            <span style={{ fontFamily:'Space Grotesk,sans-serif',color:AQI_COLOR(s.aqi),fontSize:13,fontWeight:700 }}>{Math.round(s.aqi)}</span>
            <span style={{ color:'#334155',fontSize:10 }}>{AQI_LABEL(s.aqi)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Stat chip ── */
function LiveChip({ aqi }) {
  if (!aqi) return null
  const c = AQI_COLOR(aqi)
  return (
    <div style={{ display:'flex',alignItems:'center',gap:8, padding:'7px 16px', background:`${c}12`, border:`1px solid ${c}35`, borderRadius:40 }}>
      <span style={{ width:7,height:7,borderRadius:'50%',background:c,boxShadow:`0 0 10px ${c}`,display:'inline-block',flexShrink:0 }}/>
      <span style={{ fontFamily:'Space Grotesk,sans-serif',color:c,fontSize:13,fontWeight:700,letterSpacing:'-0.01em' }}>
        City avg AQI {aqi}
      </span>
    </div>
  )
}

/* ── Floating card ── */
function FeatureCard({ icon, title, desc, stat, statLabel, delay }) {
  return (
    <div className="fade-up" style={{
      animationDelay: `${delay}ms`,
      background:'rgba(8,15,28,0.9)', backdropFilter:'blur(24px)',
      border:'1px solid rgba(255,255,255,0.07)', borderRadius:14,
      padding:'32px 28px', display:'flex', flexDirection:'column', gap:16,
      transition:'border-color 0.2s, transform 0.2s',
      cursor:'default',
    }}
    onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(14,165,233,0.3)';e.currentTarget.style.transform='translateY(-3px)'}}
    onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.transform='translateY(0)'}}
    >
      <div style={{ fontSize:26 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:15,fontWeight:600,color:'#e2eaf4',marginBottom:8 }}>{title}</div>
        <div style={{ color:'#475569',fontSize:13,lineHeight:1.65 }}>{desc}</div>
      </div>
      <div style={{ marginTop:'auto',paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontFamily:'Space Grotesk,sans-serif',color:'#0ea5e9',fontSize:22,fontWeight:700,letterSpacing:'-0.02em' }}>{stat}</span>
        <span style={{ color:'#334155',fontSize:11,marginLeft:8 }}>{statLabel}</span>
      </div>
    </div>
  )
}

/* ── NavLink ── */
function NavLink({ label, path, navigate, red }) {
  return (
    <button onClick={()=>navigate(path)} style={{
      background: red ? 'rgba(244,63,94,0.08)' : 'none',
      border: red ? '1px solid rgba(244,63,94,0.2)' : 'none',
      color: red ? '#f43f5e' : '#475569',
      borderRadius: red ? 6 : 0, padding: red ? '5px 14px' : 0,
      fontSize:12, fontWeight:600, cursor:'pointer', letterSpacing:'0.06em',
      fontFamily:'Inter,sans-serif', transition:'color 0.15s',
    }}
    onMouseOver={e=>{ if(!red) e.target.style.color='#94a3b8' }}
    onMouseOut={e=>{ if(!red) e.target.style.color='#475569' }}
    >
      {label}
    </button>
  )
}

/* ═══ Page ══════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const [stations, setStations] = useState([])
  const [avgAqi,   setAvgAqi]   = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    axios.get(`${API}/api/stations`)
      .then(r=>{
        setStations(r.data)
        setAvgAqi(Math.round(r.data.reduce((s,x)=>s+x.aqi,0)/r.data.length))
      }).catch(()=>{})
  },[])

  return (
    <div style={{ minHeight:'100vh', background:'#020817', color:'#e2eaf4' }}>

      {/* mesh bg */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0,
        background:'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(14,165,233,0.08) 0%,transparent 60%)' }}/>

      {/* ── NAV ── */}
      <nav style={{ position:'sticky',top:0,zIndex:100,
        display:'flex',alignItems:'center',gap:20,padding:'0 48px',height:60,
        background:'rgba(2,8,23,0.85)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)' }}>

        <div style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:16,
          background:'linear-gradient(135deg,#e2eaf4 30%,#0ea5e9)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          backgroundClip:'text', cursor:'pointer', letterSpacing:'-0.02em' }}
          onClick={()=>navigate('/')}>
          AeroSense
        </div>

        <div style={{ width:1,height:16,background:'rgba(255,255,255,0.08)' }}/>

        <NavLink label="DASHBOARD"  path="/dashboard"   navigate={navigate}/>
        <NavLink label="ADVISORIES" path="/advisories"  navigate={navigate}/>
        <NavLink label="COMPARE"    path="/compare"     navigate={navigate}/>
        <div style={{ flex:1 }}/>
        <NavLink label="ENFORCEMENT" path="/enforcement" navigate={navigate} red/>
        <LiveChip aqi={avgAqi}/>
      </nav>

      <Ticker stations={stations}/>

      {/* ── HERO ── */}
      <section style={{ position:'relative',zIndex:1, maxWidth:1100,margin:'0 auto',padding:'100px 48px 80px' }}>
        <div className="fade-up" style={{
          display:'inline-flex',alignItems:'center',gap:8,
          background:'rgba(14,165,233,0.07)',border:'1px solid rgba(14,165,233,0.2)',
          borderRadius:40,padding:'5px 16px 5px 10px',marginBottom:32,
        }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:'#0ea5e9',
            boxShadow:'0 0 8px #0ea5e9',display:'inline-block',
            animation:'glow-pulse 2s ease-in-out infinite' }}/>
          <span style={{ color:'#0ea5e9',fontSize:11,fontWeight:600,letterSpacing:'0.1em' }}>
            LIVE — CHENNAI AIR QUALITY INTELLIGENCE
          </span>
        </div>

        <h1 className="fade-up" style={{
          animationDelay:'60ms',
          fontFamily:'Space Grotesk,sans-serif',
          fontSize:'clamp(38px,5.5vw,68px)',
          fontWeight:700,lineHeight:1.05,letterSpacing:'-0.04em',
          color:'#e2eaf4',marginBottom:28,maxWidth:780,
        }}>
          From sensor<br/>to citizen advisory.<br/>
          <span style={{ background:'linear-gradient(90deg,#0ea5e9,#38bdf8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>
            In real time.
          </span>
        </h1>

        <p className="fade-up" style={{
          animationDelay:'120ms',
          fontSize:17,color:'#64748b',lineHeight:1.75,maxWidth:540,marginBottom:48,
        }}>
          LSTM forecasting, Groq-powered bilingual health advisories,
          source attribution, and enforcement intelligence — built for Chennai.
        </p>

        <div className="fade-up" style={{ animationDelay:'180ms',display:'flex',gap:12,flexWrap:'wrap' }}>
          <button onClick={()=>navigate('/dashboard')} style={{
            background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
            color:'#fff',border:'none',borderRadius:8,padding:'13px 32px',
            fontSize:14,fontWeight:600,cursor:'pointer',letterSpacing:'0.01em',
            boxShadow:'0 8px 32px rgba(14,165,233,0.25)',
            transition:'transform 0.15s,box-shadow 0.15s',
          }}
          onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(14,165,233,0.35)'}}
          onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 8px 32px rgba(14,165,233,0.25)'}}>
            Open Dashboard
          </button>
          <button onClick={()=>navigate('/advisories')} style={{
            background:'rgba(255,255,255,0.04)',color:'#94a3b8',
            border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'13px 32px',
            fontSize:14,fontWeight:500,cursor:'pointer',letterSpacing:'0.01em',
            transition:'all 0.15s',
          }}
          onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='#e2eaf4'}}
          onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='#94a3b8'}}>
            Health Advisories
          </button>
          <button onClick={()=>navigate('/compare')} style={{
            background:'rgba(255,255,255,0.04)',color:'#94a3b8',
            border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'13px 32px',
            fontSize:14,fontWeight:500,cursor:'pointer',letterSpacing:'0.01em',
            transition:'all 0.15s',
          }}
          onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='#e2eaf4'}}
          onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='#94a3b8'}}>
            Compare Stations
          </button>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section style={{ position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'0 48px 100px' }}>
        <div style={{ marginBottom:40 }}>
          <div style={{ color:'#1e3a5f',fontSize:11,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10,fontWeight:600 }}>
            Platform Capabilities
          </div>
          <div style={{ width:32,height:2,background:'linear-gradient(90deg,#0ea5e9,transparent)',borderRadius:1 }}/>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12 }}>
          <FeatureCard delay={0}   icon="🗺️" title="Real-Time Monitoring"   stat="15 min"   statLabel="data refresh" desc="Live AQI from CPCB + TNPCB stations. Geospatial CARTO dark map with AQI-coded pulsing markers."/>
          <FeatureCard delay={60}  icon="🔮" title="AI Forecasting"         stat="24 hr"    statLabel="LSTM horizon"  desc="Per-station PyTorch LSTM models predict AQI 24 hours ahead with diurnal peak detection."/>
          <FeatureCard delay={120} icon="🌐" title="Bilingual Advisory"     stat="Tamil"    statLabel="+ English"     desc="Groq LLaMA 3.3 70B grounded in WHO 2021 + CPCB NAQI. Advisory in the user's language."/>
          <FeatureCard delay={180} icon="⚡" title="Enforcement Intel"      stat="4"        statLabel="source types"  desc="Attribution across Industrial, Traffic, Construction, and Natural. Ranked inspection queue."/>
        </div>
      </section>

      {/* ── DATA SOURCES ── */}
      <section style={{ position:'relative',zIndex:1, borderTop:'1px solid rgba(255,255,255,0.05)',padding:'28px 48px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',gap:24,flexWrap:'wrap' }}>
          <span style={{ color:'#1e3a5f',fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600,flexShrink:0 }}>Data Sources</span>
          <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.04)' }}/>
          {['CPCB','TNPCB','WHO 2021','OpenAQ','Groq LLaMA 3.3'].map(s=>(
            <span key={s} style={{ color:'#1e3a5f',fontSize:12,whiteSpace:'nowrap',fontFamily:'JetBrains Mono,monospace' }}>{s}</span>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer style={{ position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,0.04)',padding:'20px 48px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <span style={{ fontFamily:'Space Grotesk,sans-serif',color:'#1e3a5f',fontSize:13,fontWeight:700 }}>AeroSense</span>
        <span style={{ color:'#1e3a5f',fontSize:11 }}>AI-Powered Urban Air Quality · Chennai</span>
      </footer>
    </div>
  )
}
