import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'

const AQI_COLOR = (v) => v<=50?'#10b981':v<=100?'#84cc16':v<=200?'#f59e0b':v<=300?'#ef4444':v<=400?'#8b5cf6':'#be185d'
const shortName = (n) => n?.replace(/,\s*Chennai\s*-\s*(CPCB|TNPCB)/,'').trim()

const SEV = {
  low:      { label:'LOW',      c:'#10b981', bg:'rgba(16,185,129,0.08)',  b:'rgba(16,185,129,0.2)'  },
  moderate: { label:'MODERATE', c:'#f59e0b', bg:'rgba(245,158,11,0.08)', b:'rgba(245,158,11,0.2)'  },
  high:     { label:'HIGH',     c:'#ef4444', bg:'rgba(239,68,68,0.08)',  b:'rgba(239,68,68,0.2)'   },
  severe:   { label:'SEVERE',   c:'#8b5cf6', bg:'rgba(139,92,246,0.08)',b:'rgba(139,92,246,0.2)'  },
}
const SRC_COLORS = { Industrial:'#f43f5e', Traffic:'#f59e0b', Construction:'#0ea5e9', 'Dust/Natural':'#64748b' }

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ flex:1, minWidth:160, background:'rgba(8,15,28,0.9)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 26px' }}>
      <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,marginBottom:14 }}>{label}</div>
      <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:30,fontWeight:700,color:color||'#e2eaf4',letterSpacing:'-0.03em',lineHeight:1,marginBottom:sub?10:0 }}>{value}</div>
      {sub && <div style={{ color:'#334155',fontSize:12,marginTop:8,lineHeight:1.5 }}>{sub}</div>}
    </div>
  )
}

function PriorityCard({ station, rank }) {
  const sev   = SEV[station.severity] || SEV.moderate
  const aColor = AQI_COLOR(station.aqi)
  const isTop = rank <= 3

  return (
    <div className="fade-up" style={{
      animationDelay:`${(rank-1)*30}ms`,
      background:'rgba(8,15,28,0.85)',backdropFilter:'blur(20px)',
      border:`1px solid ${isTop?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.06)'}`,
      borderRadius:12,marginBottom:8,overflow:'hidden',
      boxShadow:isTop?'0 4px 24px rgba(0,0,0,0.3)':'none',
      transition:'border-color 0.2s,transform 0.2s',
    }}
    onMouseOver={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'}
    onMouseOut={e=>e.currentTarget.style.borderColor=isTop?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.06)'}>
      {/* accent stripe on top-3 */}
      {isTop && <div style={{ height:2,background:`linear-gradient(90deg,${aColor},transparent)` }}/>}

      <div style={{ padding:'22px 26px' }}>
        <div style={{ display:'flex',gap:20,alignItems:'flex-start' }}>

          {/* Rank */}
          <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,fontWeight:700,
            color:isTop?'#0ea5e9':'#1e3a5f',letterSpacing:'0.05em',paddingTop:3,flexShrink:0,width:24,textAlign:'right' }}>
            {String(rank).padStart(2,'0')}
          </div>

          <div style={{ flex:1 }}>
            {/* Name + badges row */}
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:16,fontWeight:700,color:'#e2eaf4',letterSpacing:'-0.02em',marginBottom:4 }}>
                  {shortName(station.name)}
                </div>
                <div style={{ color:'#334155',fontSize:12 }}>
                  {station.area}
                  <span style={{ color:'#1e3a5f',margin:'0 8px' }}>·</span>
                  Priority score {station.priority_score}
                </div>
              </div>
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <div style={{ background:sev.bg,border:`1px solid ${sev.b}`,borderRadius:20,padding:'3px 12px',color:sev.c,fontSize:9,fontWeight:800,letterSpacing:'0.12em' }}>
                  {sev.label}
                </div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:24,fontWeight:700,color:aColor,letterSpacing:'-0.03em' }}>
                  {Math.round(station.aqi)}
                  <span style={{ fontSize:11,fontWeight:400,color:'#334155',marginLeft:5 }}>AQI</span>
                </div>
              </div>
            </div>

            {/* Source bar */}
            <div style={{ display:'flex',height:4,borderRadius:2,overflow:'hidden',marginBottom:12,gap:1 }}>
              {Object.entries(station.sources).map(([src,pct])=>(
                <div key={src} style={{ flex:pct,background:SRC_COLORS[src]||'#475569',boxShadow:`0 0 6px ${SRC_COLORS[src]||'#475569'}60` }}/>
              ))}
            </div>
            <div style={{ display:'flex',gap:16,flexWrap:'wrap',marginBottom:16 }}>
              {Object.entries(station.sources).sort((a,b)=>b[1]-a[1]).map(([src,pct])=>(
                <div key={src} style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:7,height:7,borderRadius:2,background:SRC_COLORS[src]||'#475569',flexShrink:0 }}/>
                  <span style={{ color:'#475569',fontSize:11 }}>{src}</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace',color:SRC_COLORS[src]||'#475569',fontSize:11,fontWeight:600 }}>
                    {Math.round(pct*100)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Action */}
            <div style={{ paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap' }}>
              <div>
                <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,marginBottom:5 }}>Recommended Action</div>
                <div style={{ color:'#64748b',fontSize:13 }}>{station.enforcement}</div>
              </div>
              <div style={{ color:'#1e3a5f',fontSize:11,fontFamily:'JetBrains Mono,monospace',whiteSpace:'nowrap',flexShrink:0 }}>
                {station.primary_source} · {station.primary_pct}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnforcementDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [ts,      setTs]      = useState(null)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    axios.get(`${API}/api/enforcement`)
      .then(r=>{ setData(r.data); setTs(new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})) })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }

  useEffect(()=>{ load(); const id=setInterval(load,5*60*1000); return()=>clearInterval(id) },[])

  // Source summary for sidebar
  const sourceSummary = (() => {
    if(!data) return []
    const counts = {}
    data.priorities.forEach(p=>{ counts[p.primary_source]=(counts[p.primary_source]||0)+1 })
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])
  })()

  return (
    <div style={{ minHeight:'100vh',background:'#020817',color:'#e2eaf4' }}>
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse 70% 40% at 50% -10%,rgba(244,63,94,0.04) 0%,transparent 60%)',zIndex:0 }}/>

      {/* Nav */}
      <nav style={{ position:'sticky',top:0,zIndex:100,display:'flex',alignItems:'center',gap:20,padding:'0 48px',height:58,background:'rgba(2,8,23,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div onClick={()=>navigate('/')} style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:15,background:'linear-gradient(135deg,#e2eaf4 30%,#0ea5e9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',cursor:'pointer',letterSpacing:'-0.02em' }}>
          AeroSense
        </div>
        <div style={{ width:1,height:16,background:'rgba(255,255,255,0.08)' }}/>
        <span style={{ color:'#334155',fontSize:12,letterSpacing:'0.04em' }}>Enforcement Intelligence</span>
        <div style={{ flex:1 }}/>
        {[['Dashboard','/dashboard'],['Advisories','/advisories'],['Compare','/compare']].map(([l,p])=>(
          <button key={l} onClick={()=>navigate(p)} style={{ background:'none',border:'none',color:'#334155',fontSize:11,fontWeight:600,cursor:'pointer',letterSpacing:'0.07em',fontFamily:'Inter,sans-serif',padding:'5px 10px',borderRadius:6,transition:'all 0.15s' }}
          onMouseOver={e=>{e.currentTarget.style.color='#64748b';e.currentTarget.style.background='rgba(255,255,255,0.04)'}}
          onMouseOut={e=>{e.currentTarget.style.color='#334155';e.currentTarget.style.background='none'}}>
            {l.toUpperCase()}
          </button>
        ))}
        {ts && <span style={{ color:'#1e3a5f',fontSize:11,fontFamily:'JetBrains Mono,monospace' }}>Updated {ts}</span>}
        <button onClick={load} disabled={loading} style={{
          background:'rgba(14,165,233,0.08)',border:'1px solid rgba(14,165,233,0.2)',color:'#0ea5e9',
          borderRadius:6,padding:'5px 16px',fontSize:11,fontWeight:700,cursor:loading?'not-allowed':'pointer',
          letterSpacing:'0.07em',fontFamily:'Inter,sans-serif',
        }}>
          {loading?'…':'REFRESH'}
        </button>
      </nav>

      <div style={{ position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'48px 48px' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom:40 }}>
          <div style={{ color:'#1e3a5f',fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,marginBottom:10 }}>Chennai · Live</div>
          <h1 style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:36,fontWeight:700,color:'#e2eaf4',letterSpacing:'-0.03em',marginBottom:12 }}>
            Inspection Priority Queue
          </h1>
          <p style={{ color:'#475569',fontSize:14,lineHeight:1.65 }}>
            Stations ranked by AQI severity weighted by source attribution confidence.<br/>Deploy inspection teams from rank 01 downward.
          </p>
        </div>

        {/* Stat cards */}
        {data && (
          <div className="fade-up" style={{ display:'flex',gap:10,marginBottom:40,flexWrap:'wrap',animationDelay:'60ms' }}>
            <StatCard label="Active Stations" value={data.total_stations}/>
            <StatCard label="Need Immediate Action" value={data.critical_count} color="#ef4444" sub="High or Severe threshold exceeded"/>
            <StatCard label="Highest Priority" value={shortName(data.priorities[0]?.name)} color="#f59e0b"
              sub={`AQI ${Math.round(data.priorities[0]?.aqi||0)} — ${data.priorities[0]?.category}`}/>
            <StatCard label="Dominant Source" value={data.priorities[0]?.primary_source}
              sub={`${data.priorities[0]?.primary_pct}% at top station`}/>
          </div>
        )}

        {/* Main columns */}
        {data && (
          <div style={{ display:'flex',gap:24,alignItems:'flex-start' }}>

            {/* Priority list */}
            <div style={{ flex:2 }}>
              <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,marginBottom:16 }}>
                All Stations — Priority Order
              </div>
              {data.priorities.map((s,i)=>(
                <PriorityCard key={s.station_id} station={s} rank={i+1}/>
              ))}
            </div>

            {/* Sidebar */}
            <div style={{ flex:1,minWidth:240,position:'sticky',top:78 }}>

              {/* Source summary */}
              <div className="glass" style={{ borderRadius:12,padding:'24px 26px',marginBottom:12 }}>
                <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,marginBottom:18 }}>
                  Dominant Source by Station
                </div>
                {sourceSummary.map(([src,count])=>(
                  <div key={src} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                    <div style={{ width:3,height:36,borderRadius:2,background:SRC_COLORS[src]||'#475569',flexShrink:0,boxShadow:`0 0 8px ${SRC_COLORS[src]||'#475569'}60` }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                        <span style={{ color:'#94a3b8',fontSize:12 }}>{src}</span>
                        <span style={{ fontFamily:'Space Grotesk,sans-serif',color:SRC_COLORS[src]||'#475569',fontSize:12,fontWeight:700 }}>
                          {count} station{count>1?'s':''}
                        </span>
                      </div>
                      <div style={{ height:2,background:'rgba(255,255,255,0.05)',borderRadius:1,overflow:'hidden' }}>
                        <div style={{ height:'100%',background:SRC_COLORS[src]||'#475569',width:`${(count/data.priorities.length)*100}%`,transition:'width 0.6s cubic-bezier(0.16,1,0.3,1)',boxShadow:`0 0 8px ${SRC_COLORS[src]||'#475569'}80` }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AQI scale */}
              <div className="glass" style={{ borderRadius:12,padding:'24px 26px' }}>
                <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,marginBottom:18 }}>India CPCB AQI Scale</div>
                {[['0–50','Good','#10b981'],['51–100','Satisfactory','#84cc16'],['101–200','Moderate','#f59e0b'],['201–300','Poor','#ef4444'],['301–400','Very Poor','#8b5cf6'],['401+','Severe','#be185d']].map(([r,l,c])=>(
                  <div key={l} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                    <div style={{ width:3,height:14,borderRadius:2,background:c,flexShrink:0,boxShadow:`0 0 6px ${c}60` }}/>
                    <span style={{ color:'#475569',fontSize:12,flex:1 }}>{l}</span>
                    <span style={{ color:'#1e3a5f',fontSize:10,fontFamily:'JetBrains Mono,monospace' }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && !data && (
          <div style={{ textAlign:'center',padding:'100px 0' }}>
            <div style={{ width:40,height:40,border:'3px solid rgba(14,165,233,0.15)',borderTopColor:'#0ea5e9',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto 20px' }}/>
            <div style={{ color:'#1e3a5f',fontSize:13 }}>Loading enforcement data…</div>
          </div>
        )}
      </div>
    </div>
  )
}
