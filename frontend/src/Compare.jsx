import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

const API = 'http://localhost:8000'
const COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6']
const AQI_COLOR = (v) => v<=50?'#10b981':v<=100?'#84cc16':v<=200?'#f59e0b':v<=300?'#ef4444':v<=400?'#8b5cf6':'#be185d'
const shortName = (n) => n?.replace(/,\s*Chennai\s*-\s*(CPCB|TNPCB)/,'').trim()

function ChartTip({ active, payload, label }) {
  if(!active||!payload?.length) return null
  return (
    <div style={{ background:'#0d1b2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'12px 16px',fontSize:12 }}>
      <div style={{ color:'#475569',marginBottom:8 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:i<payload.length-1?6:0 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:p.stroke,flexShrink:0 }}/>
          <span style={{ color:'#64748b',fontSize:11,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.name}</span>
          <span style={{ fontFamily:'Space Grotesk,sans-serif',color:p.stroke,fontWeight:700,fontSize:13,marginLeft:'auto',paddingLeft:8 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Compare() {
  const navigate = useNavigate()
  const [stations,    setStations]    = useState([])
  const [selected,    setSelected]    = useState([])
  const [compareData, setCompareData] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(()=>{
    axios.get(`${API}/api/stations`).then(r=>setStations(r.data)).catch(()=>setError('Could not load stations.'))
  },[])

  const toggle = (id) => {
    setSelected(p=>p.includes(id)?p.filter(x=>x!==id):p.length<5?[...p,id]:p)
  }

  const compare = async () => {
    if(selected.length<2) return
    setLoading(true); setError(''); setCompareData([])
    try {
      const r = await axios.get(`${API}/api/compare?ids=${selected.join(',')}`)
      setCompareData(r.data)
    } catch { setError('Failed to load comparison data.') }
    setLoading(false)
  }

  const chartData = (() => {
    if(!compareData.length) return []
    const max = Math.max(...compareData.map(s=>s.readings.length))
    return Array.from({length:max},(_,i)=>{
      const pt = {}
      compareData.forEach((s,si)=>{ const r=s.readings[i]; if(r){pt[`s${si}`]=r.aqi; pt.hour=r.hour} })
      return pt
    })
  })()

  return (
    <div style={{ minHeight:'100vh',background:'#020817',color:'#e2eaf4' }}>
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse 70% 40% at 50% -10%,rgba(14,165,233,0.05) 0%,transparent 60%)',zIndex:0 }}/>

      {/* Nav */}
      <nav style={{ position:'sticky',top:0,zIndex:100,display:'flex',alignItems:'center',gap:20,padding:'0 48px',height:58,background:'rgba(2,8,23,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div onClick={()=>navigate('/')} style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:15,background:'linear-gradient(135deg,#e2eaf4 30%,#0ea5e9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',cursor:'pointer',letterSpacing:'-0.02em' }}>
          AeroSense
        </div>
        <div style={{ width:1,height:16,background:'rgba(255,255,255,0.08)' }}/>
        <span style={{ color:'#334155',fontSize:12,letterSpacing:'0.04em' }}>Station Comparison</span>
        <div style={{ flex:1 }}/>
        {[['Dashboard','/dashboard'],['Advisories','/advisories'],['Enforcement','/enforcement']].map(([l,p])=>(
          <button key={l} onClick={()=>navigate(p)} style={{ background:'none',border:'none',color:'#334155',fontSize:11,fontWeight:600,cursor:'pointer',letterSpacing:'0.07em',fontFamily:'Inter,sans-serif',padding:'5px 10px',borderRadius:6,transition:'all 0.15s' }}
          onMouseOver={e=>{e.currentTarget.style.color='#64748b';e.currentTarget.style.background='rgba(255,255,255,0.04)'}}
          onMouseOut={e=>{e.currentTarget.style.color='#334155';e.currentTarget.style.background='none'}}>
            {l.toUpperCase()}
          </button>
        ))}
      </nav>

      <div style={{ position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'60px 48px' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom:48 }}>
          <div style={{ color:'#1e3a5f',fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,marginBottom:10 }}>Chennai · 24-Hour Trend</div>
          <h1 style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:36,fontWeight:700,color:'#e2eaf4',letterSpacing:'-0.03em',marginBottom:12 }}>Compare Stations</h1>
          <p style={{ color:'#475569',fontSize:15 }}>Select 2–5 stations to overlay their AQI trend on a single chart.</p>
        </div>

        {error && (
          <div className="fade-up" style={{ background:'rgba(244,63,94,0.06)',border:'1px solid rgba(244,63,94,0.2)',borderRadius:10,padding:'14px 20px',color:'#f43f5e',fontSize:13,marginBottom:24 }}>
            {error}
          </div>
        )}

        {/* Station grid */}
        <div className="fade-up glass" style={{ animationDelay:'60ms',borderRadius:14,padding:'28px 32px',marginBottom:24 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
            <div>
              <span style={{ color:'#334155',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700 }}>Select Stations </span>
              <span style={{ color:'#1e3a5f',fontSize:10 }}>({selected.length}/5)</span>
            </div>
            {selected.length>=2 && (
              <button onClick={compare} disabled={loading} style={{
                padding:'8px 24px',
                background:loading?'rgba(14,165,233,0.08)':'linear-gradient(135deg,#0ea5e9,#0284c7)',
                color:loading?'#0ea5e9':'#fff',border:loading?'1px solid rgba(14,165,233,0.3)':'none',
                borderRadius:8,fontSize:12,fontWeight:700,cursor:loading?'not-allowed':'pointer',
                letterSpacing:'0.05em',boxShadow:loading?'none':'0 6px 20px rgba(14,165,233,0.2)',
              }}>
                {loading?'Loading…':'Compare →'}
              </button>
            )}
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:8 }}>
            {stations.map(s=>{
              const selIdx = selected.indexOf(s.id)
              const isSel  = selIdx!==-1
              const color  = isSel ? COLORS[selIdx%COLORS.length] : null
              const maxed  = !isSel && selected.length>=5

              return (
                <div key={s.id} onClick={()=>!maxed&&toggle(s.id)} style={{
                  display:'flex',alignItems:'center',gap:12,padding:'13px 16px',
                  background:isSel?`${color}10`:'rgba(255,255,255,0.02)',
                  border:`1px solid ${isSel?color+'45':'rgba(255,255,255,0.06)'}`,
                  borderRadius:9,cursor:maxed?'not-allowed':'pointer',opacity:maxed?0.35:1,
                  transition:'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow:isSel?`0 0 20px ${color}15`:'none',
                }}>
                  <div style={{ width:26,height:26,borderRadius:'50%',flexShrink:0,
                    background:isSel?color:'rgba(255,255,255,0.05)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:11,fontWeight:800,color:'#fff',
                    boxShadow:isSel?`0 0 12px ${color}60`:'none',
                    transition:'all 0.18s',
                  }}>
                    {isSel?selIdx+1:''}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ color:isSel?'#e2eaf4':'#94a3b8',fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',transition:'color 0.15s' }}>
                      {shortName(s.name)}
                    </div>
                    <div style={{ color:'#334155',fontSize:11,marginTop:2 }}>{s.area}</div>
                  </div>
                  <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:17,fontWeight:700,color:AQI_COLOR(s.aqi),flexShrink:0 }}>
                    {Math.round(s.aqi)}
                  </div>
                </div>
              )
            })}
          </div>

          {selected.length<2 && (
            <div style={{ color:'#1e3a5f',fontSize:12,marginTop:18,textAlign:'center' }}>
              Select at least 2 stations to compare
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="fade-up glass" style={{ borderRadius:14,padding:'60px 32px',textAlign:'center' }}>
            <div style={{ width:36,height:36,border:'3px solid rgba(14,165,233,0.15)',borderTopColor:'#0ea5e9',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto 20px' }}/>
            <div style={{ color:'#334155',fontSize:13 }}>Loading comparison data…</div>
          </div>
        )}

        {/* Results */}
        {compareData.length>0 && (
          <div className="fade-up">

            {/* Stat cards */}
            <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
              {compareData.map((s,i)=>(
                <div key={s.station_id} style={{
                  flex:1,minWidth:160,
                  background:'rgba(8,15,28,0.9)',backdropFilter:'blur(20px)',
                  border:`1px solid ${COLORS[i%COLORS.length]}30`,
                  borderRadius:10,padding:'20px 22px',
                  boxShadow:`0 0 24px ${COLORS[i%COLORS.length]}08`,
                }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                    <div style={{ width:10,height:10,borderRadius:'50%',background:COLORS[i%COLORS.length],boxShadow:`0 0 10px ${COLORS[i%COLORS.length]}80`,flexShrink:0 }}/>
                    <span style={{ color:'#94a3b8',fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      {s.station_name}
                    </span>
                  </div>
                  <div style={{ display:'flex',gap:20 }}>
                    {[['Avg',s.avg_aqi],['Peak',s.peak_aqi]].map(([l,v])=>(
                      <div key={l}>
                        <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,marginBottom:4 }}>{l}</div>
                        <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:22,fontWeight:700,color:AQI_COLOR(v),letterSpacing:'-0.02em' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="glass" style={{ borderRadius:14,padding:'28px 28px 20px' }}>
              <div style={{ color:'#1e3a5f',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,marginBottom:22 }}>
                24-Hour AQI Comparison
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{top:4,right:8,bottom:0,left:0}}>
                  <XAxis dataKey="hour" tick={{fill:'#1e3a5f',fontSize:10}} interval={Math.floor(chartData.length/8)} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,'auto']} tick={{fill:'#1e3a5f',fontSize:10}} width={30} axisLine={false} tickLine={false}/>
                  <ReferenceLine y={100} stroke="#84cc16" strokeDasharray="3 3" strokeOpacity={0.2}/>
                  <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.2}/>
                  <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.2}/>
                  {compareData.map((s,i)=>(
                    <Line key={s.station_id} type="monotone" dataKey={`s${i}`}
                      stroke={COLORS[i%COLORS.length]} strokeWidth={2.5} dot={false}
                      activeDot={{r:5,fill:COLORS[i%COLORS.length],strokeWidth:0}}
                      name={s.station_name}/>
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div style={{ display:'flex',gap:20,marginTop:20,flexWrap:'wrap',alignItems:'center',paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                {compareData.map((s,i)=>(
                  <div key={s.station_id} style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:20,height:2.5,background:COLORS[i%COLORS.length],borderRadius:2,boxShadow:`0 0 6px ${COLORS[i%COLORS.length]}80` }}/>
                    <span style={{ color:'#475569',fontSize:12 }}>{s.station_name}</span>
                  </div>
                ))}
                <div style={{ flex:1 }}/>
                <div style={{ display:'flex',gap:16 }}>
                  {[['100','Satisfactory','#84cc16'],['200','Moderate','#f59e0b'],['300','Poor','#ef4444']].map(([v,l,c])=>(
                    <span key={v} style={{ color:'#1e3a5f',fontSize:10,fontFamily:'JetBrains Mono,monospace' }}>
                      <span style={{ color:c }}>— — </span>{v} {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
