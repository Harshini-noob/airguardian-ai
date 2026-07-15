import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import './App.css'

const API = 'http://localhost:8000'

const AQI_COLOR = (v) => v<=50?'#10b981':v<=100?'#84cc16':v<=200?'#f59e0b':v<=300?'#ef4444':v<=400?'#8b5cf6':'#be185d'
const AQI_LABEL = (v) => v<=50?'Good':v<=100?'Satisfactory':v<=200?'Moderate':v<=300?'Poor':v<=400?'Very Poor':'Severe'
const shortName = (n) => n?.replace(/,\s*Chennai\s*-\s*(CPCB|TNPCB)/,'').trim()

const SOURCE_COLORS = { Industrial:'#f43f5e', Traffic:'#f59e0b', Construction:'#0ea5e9', 'Dust/Natural':'#64748b' }

/* ── Custom chart tooltip ── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background:'#0d1b2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 14px',fontSize:12,fontFamily:'Inter,sans-serif' }}>
      <div style={{ color:'#64748b',marginBottom:4 }}>{label}</div>
      <div style={{ color:AQI_COLOR(d?.aqi||0),fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:16 }}>
        {d?.aqi}
        <span style={{ color:'#334155',fontSize:11,fontWeight:400,marginLeft:4 }}>AQI</span>
      </div>
      {d?.category && <div style={{ color:'#475569',fontSize:11,marginTop:2 }}>{d.category}</div>}
    </div>
  )
}

/* ── TopBar ── */
function TopBar({ stations, chatOpen, onChatToggle }) {
  const navigate = useNavigate()
  const avg   = stations.length ? Math.round(stations.reduce((s,x)=>s+x.aqi,0)/stations.length) : null
  const worst = stations.reduce((a,b)=>a.aqi>b.aqi?a:b,{aqi:0,name:'--'})

  return (
    <div style={{
      position:'absolute',top:0,left:0,right:0,zIndex:1000,height:54,
      display:'flex',alignItems:'center',padding:'0 20px',gap:0,
      background:'rgba(2,8,23,0.95)',backdropFilter:'blur(20px)',
      borderBottom:'1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div onClick={()=>navigate('/')} style={{
        fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:15,
        background:'linear-gradient(135deg,#e2eaf4 30%,#0ea5e9)',
        WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
        cursor:'pointer',letterSpacing:'-0.02em',paddingRight:20,
        borderRight:'1px solid rgba(255,255,255,0.07)',
      }}>AeroSense</div>

      {/* City avg */}
      {avg && (
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'0 18px',borderRight:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ width:7,height:7,borderRadius:'50%',background:AQI_COLOR(avg),boxShadow:`0 0 10px ${AQI_COLOR(avg)}90`,display:'inline-block' }}/>
          <span style={{ color:'#334155',fontSize:11 }}>City avg</span>
          <span style={{ fontFamily:'Space Grotesk,sans-serif',color:AQI_COLOR(avg),fontSize:14,fontWeight:700,letterSpacing:'-0.01em' }}>{avg}</span>
        </div>
      )}

      {/* Worst */}
      {worst.aqi > 0 && (
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'0 18px',borderRight:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ color:'#334155',fontSize:11 }}>Worst</span>
          <span style={{ color:'#94a3b8',fontSize:11,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            {shortName(worst.name)}
          </span>
          <span style={{ fontFamily:'Space Grotesk,sans-serif',color:AQI_COLOR(worst.aqi),fontSize:13,fontWeight:700 }}>{Math.round(worst.aqi)}</span>
        </div>
      )}

      <div style={{ flex:1 }}/>

      {/* Nav */}
      <div style={{ display:'flex',gap:4,marginRight:12 }}>
        {[['ADVISORIES','/advisories'],['COMPARE','/compare']].map(([l,p])=>(
          <button key={l} onClick={()=>navigate(p)} style={{
            background:'none',border:'none',color:'#334155',fontSize:11,fontWeight:600,
            cursor:'pointer',letterSpacing:'0.07em',padding:'5px 12px',borderRadius:6,
            fontFamily:'Inter,sans-serif',transition:'all 0.15s',
          }}
          onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='#64748b'}}
          onMouseOut={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#334155'}}>
            {l}
          </button>
        ))}
        <button onClick={()=>navigate('/enforcement')} style={{
          background:'rgba(244,63,94,0.07)',border:'1px solid rgba(244,63,94,0.18)',
          color:'#f43f5e',borderRadius:6,padding:'5px 12px',
          fontSize:11,fontWeight:600,cursor:'pointer',letterSpacing:'0.07em',
          fontFamily:'Inter,sans-serif',marginRight:8,
        }}>ENFORCEMENT</button>
      </div>

      {/* Chat button */}
      <button onClick={onChatToggle} style={{
        background: chatOpen ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
        border: chatOpen ? '1px solid rgba(14,165,233,0.35)' : '1px solid rgba(255,255,255,0.08)',
        color: chatOpen ? '#0ea5e9' : '#475569',
        borderRadius:6,padding:'5px 16px',fontSize:11,fontWeight:600,cursor:'pointer',
        letterSpacing:'0.07em',fontFamily:'Inter,sans-serif',transition:'all 0.2s',
      }}>
        {chatOpen ? 'CLOSE' : 'AI CHAT'}
      </button>
    </div>
  )
}

/* ── Legend ── */
function Legend() {
  const levels=[['Good','0–50','#10b981'],['Satisfactory','51–100','#84cc16'],['Moderate','101–200','#f59e0b'],['Poor','201–300','#ef4444'],['Very Poor','301–400','#8b5cf6'],['Severe','401+','#be185d']]
  return (
    <div style={{
      position:'absolute',bottom:24,right:20,zIndex:999,
      background:'rgba(2,8,23,0.88)',backdropFilter:'blur(20px)',
      border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,
      padding:'16px 18px',fontFamily:'Inter,sans-serif',
    }}>
      <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,marginBottom:12 }}>INDIA CPCB AQI</div>
      {levels.map(([l,r,c])=>(
        <div key={l} style={{ display:'flex',alignItems:'center',gap:9,marginBottom:7 }}>
          <div style={{ width:3,height:12,borderRadius:2,background:c,flexShrink:0,boxShadow:`0 0 6px ${c}60` }}/>
          <span style={{ color:'#475569',fontSize:11,flex:1 }}>{l}</span>
          <span style={{ color:'#1e3a5f',fontSize:10,fontFamily:'JetBrains Mono,monospace' }}>{r}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Station Detail Panel ── */
function DetailPanel({ station, onClose }) {
  const [tab,       setTab]       = useState('forecast')
  const [forecast,  setForecast]  = useState([])
  const [attrib,    setAttrib]    = useState(null)
  const [loadingF,  setLoadingF]  = useState(true)
  const [loadingA,  setLoadingA]  = useState(false)

  useEffect(()=>{
    setLoadingF(true)
    axios.get(`${API}/api/forecast/${station.station_id}`)
      .then(r=>setForecast(r.data.forecast.map(f=>({hour:`+${f.hour}h`,aqi:f.aqi,category:f.category}))))
      .catch(()=>{})
      .finally(()=>setLoadingF(false))
  },[station.station_id])

  useEffect(()=>{
    if(tab!=='attribution'||attrib) return
    setLoadingA(true)
    axios.get(`${API}/api/attribution/${station.station_id}`)
      .then(r=>setAttrib(r.data)).catch(()=>{}).finally(()=>setLoadingA(false))
  },[tab,station.station_id,attrib])

  const peak    = forecast.reduce((a,b)=>a.aqi>b.aqi?a:b,{aqi:0,hour:''})
  const rising  = peak.aqi > station.aqi
  const aColor  = AQI_COLOR(station.aqi)

  return (
    <div className="fade-up" style={{
      position:'absolute',bottom:24,left:20,zIndex:999,width:460,
      background:'rgba(6,15,30,0.96)',backdropFilter:'blur(28px)',
      border:`1px solid rgba(255,255,255,0.08)`,borderRadius:14,
      overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.6)',
    }}>
      {/* accent stripe */}
      <div style={{ height:2,background:`linear-gradient(90deg,${aColor},transparent)` }}/>

      {/* Header */}
      <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:16,fontWeight:700,color:'#e2eaf4',letterSpacing:'-0.02em',marginBottom:4 }}>
              {shortName(station.station_name)}
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ color:'#334155',fontSize:11 }}>{station.area}</span>
              <span style={{ color:aColor,fontSize:13,fontWeight:700,fontFamily:'Space Grotesk,sans-serif' }}>AQI {Math.round(station.aqi)}</span>
              <span style={{ color:'#334155',fontSize:11 }}>— {station.category}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#475569',width:28,height:28,borderRadius:6,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>×</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',background:'rgba(0,0,0,0.2)' }}>
        {['forecast','attribution'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:'11px 0',background:'none',border:'none',
            borderBottom:`2px solid ${tab===t?'#0ea5e9':'transparent'}`,
            color:tab===t?'#0ea5e9':'#334155',
            fontSize:11,fontWeight:700,cursor:'pointer',
            letterSpacing:'0.08em',textTransform:'uppercase',
            fontFamily:'Inter,sans-serif',transition:'all 0.15s',
          }}>
            {t==='forecast'?'24-Hour Forecast':'Source Attribution'}
          </button>
        ))}
      </div>

      {/* Forecast */}
      {tab==='forecast' && (
        <>
          <div style={{ padding:'18px 18px 0' }}>
            {loadingF?(
              <div style={{ height:140 }} className="skeleton"/>
            ):(
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={forecast} margin={{top:4,right:4,bottom:0,left:0}}>
                  <defs>
                    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={aColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={aColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{fill:'#1e3a5f',fontSize:10}} interval={5} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,Math.max(500,peak.aqi+80)]} tick={{fill:'#1e3a5f',fontSize:10}} width={28} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <ReferenceLine y={100} stroke="#84cc16" strokeDasharray="3 3" strokeOpacity={0.25}/>
                  <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.25}/>
                  <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.25}/>
                  <Area type="monotone" dataKey="aqi" stroke={aColor} strokeWidth={2} fill="url(#fg)" dot={false} activeDot={{r:4,fill:aColor,strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {!loadingF && (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',margin:'12px 0 0',borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              {[
                {label:'Now',  val:Math.round(station.aqi),  color:AQI_COLOR(station.aqi),  sub:station.category},
                {label:'Peak', val:Math.round(peak.aqi),     color:AQI_COLOR(peak.aqi),     sub:`at ${peak.hour}`},
                {label:'Trend',val:rising?'Rising ↑':'Falling ↓',color:rising?'#ef4444':'#10b981',sub:rising?'Limit outdoor time':'Improving'},
              ].map(({label,val,color,sub})=>(
                <div key={label} style={{ padding:'14px 18px',borderRight:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,marginBottom:7 }}>{label}</div>
                  <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:17,fontWeight:700,color,letterSpacing:'-0.01em',marginBottom:3 }}>{val}</div>
                  <div style={{ color:'#334155',fontSize:10 }}>{sub}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Attribution */}
      {tab==='attribution' && (
        <div style={{ padding:'20px 22px' }}>
          {loadingA ? (
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {[80,60,40,90].map((w,i)=>(
                <div key={i} className="skeleton" style={{ height:12,width:`${w}%` }}/>
              ))}
            </div>
          ) : attrib ? (
            <>
              {/* Stacked bar */}
              <div style={{ display:'flex',height:5,borderRadius:3,overflow:'hidden',marginBottom:20,gap:1 }}>
                {Object.entries(attrib.sources).map(([src,pct])=>(
                  <div key={src} style={{ flex:pct,background:SOURCE_COLORS[src]||'#475569',boxShadow:`0 0 6px ${SOURCE_COLORS[src]||'#475569'}80` }}/>
                ))}
              </div>

              {Object.entries(attrib.sources).sort((a,b)=>b[1]-a[1]).map(([src,pct])=>(
                <div key={src} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                  <div style={{ width:3,height:32,borderRadius:2,background:SOURCE_COLORS[src]||'#475569',flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                      <span style={{ color:'#94a3b8',fontSize:12 }}>{src}</span>
                      <span style={{ fontFamily:'Space Grotesk,sans-serif',color:SOURCE_COLORS[src]||'#475569',fontSize:13,fontWeight:700 }}>
                        {Math.round(pct*100)}%
                      </span>
                    </div>
                    <div style={{ height:2,background:'rgba(255,255,255,0.05)',borderRadius:1,overflow:'hidden' }}>
                      <div style={{ height:'100%',background:SOURCE_COLORS[src]||'#475569',width:`${pct*100}%`,transition:'width 0.6s var(--ease-out)',boxShadow:`0 0 8px ${SOURCE_COLORS[src]}80` }}/>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop:16,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color:'#1e3a5f',fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,marginBottom:8 }}>Recommended Action</div>
                <div style={{ color:'#64748b',fontSize:12,lineHeight:1.65 }}>{attrib.enforcement}</div>
              </div>
            </>
          ) : (
            <div style={{ color:'#1e3a5f',fontSize:13,textAlign:'center',padding:'20px 0' }}>Attribution data unavailable.</div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Chat Panel ── */
function ChatPanel() {
  const [msgs,    setMsgs]    = useState([{role:'assistant',text:'Ask me about air quality at any Chennai station — in English or Tamil.'}])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  const send = async () => {
    if(!input.trim()||loading) return
    const msg = input.trim()
    setInput('')
    setMsgs(p=>[...p,{role:'user',text:msg}])
    setLoading(true)
    try {
      const history = msgs.map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}))
      const r = await axios.post(`${API}/api/chat`,{message:msg,history})
      setMsgs(p=>[...p,{role:'assistant',text:r.data.reply,sources:r.data.sources_used}])
    } catch {
      setMsgs(p=>[...p,{role:'assistant',text:'Unable to reach advisory service.'}])
    }
    setLoading(false)
  }

  return (
    <div style={{
      position:'absolute',top:54,right:0,bottom:0,width:360,zIndex:999,
      background:'rgba(4,10,20,0.97)',backdropFilter:'blur(24px)',
      borderLeft:'1px solid rgba(255,255,255,0.07)',
      display:'flex',flexDirection:'column',fontFamily:'Inter,sans-serif',
    }}>
      <div style={{ padding:'18px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:'#0ea5e9',boxShadow:'0 0 10px #0ea5e9',animation:'glow-pulse 2s infinite' }}/>
          <span style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:14,fontWeight:700,color:'#e2eaf4' }}>AeroSense AI</span>
        </div>
        <div style={{ color:'#1e3a5f',fontSize:11 }}>WHO · CPCB · TNPCB — English & Tamil</div>
      </div>

      <div style={{ flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:12 }}>
        {msgs.map((m,i)=>(
          <div key={i} className="fade-up" style={{ alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'88%' }}>
            <div style={{
              background:m.role==='user'?'rgba(14,165,233,0.12)':'rgba(255,255,255,0.04)',
              border:m.role==='user'?'1px solid rgba(14,165,233,0.2)':'1px solid rgba(255,255,255,0.07)',
              color:'#c8d6e8',borderRadius:10,padding:'10px 14px',fontSize:13,lineHeight:1.65,
            }}>
              {m.text}
            </div>
            {m.sources?.length>0&&(
              <div style={{ fontSize:10,color:'#1e3a5f',marginTop:5,paddingLeft:2 }}>{m.sources.join(' · ')}</div>
            )}
          </div>
        ))}
        {loading&&(
          <div style={{ alignSelf:'flex-start',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'#1e3a5f',borderRadius:10,padding:'10px 14px',fontSize:13 }}>
            <span style={{ animation:'glow-pulse 1s infinite',display:'inline-block' }}>···</span>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Ask in English or Tamil..."
          style={{
            flex:1,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:8,padding:'9px 13px',color:'#d1d5db',fontSize:13,outline:'none',
            fontFamily:'Inter,sans-serif',transition:'border-color 0.15s',
          }}
          onFocus={e=>e.target.style.borderColor='rgba(14,165,233,0.35)'}
          onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
        />
        <button onClick={send} disabled={loading} style={{
          background:loading?'#0c4a6e':'linear-gradient(135deg,#0ea5e9,#0284c7)',
          color:'#fff',border:'none',borderRadius:8,padding:'9px 16px',
          cursor:loading?'not-allowed':'pointer',fontSize:12,fontWeight:700,
          fontFamily:'Inter,sans-serif',letterSpacing:'0.05em',flexShrink:0,
        }}>
          SEND
        </button>
      </div>
    </div>
  )
}

/* ═══ Main App ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [stations,  setStations] = useState([])
  const [selected,  setSelected] = useState(null)
  const [chatOpen,  setChatOpen] = useState(false)

  const load = () => {
    axios.get(`${API}/api/stations`).then(r=>setStations(r.data)).catch(()=>{})
  }

  useEffect(()=>{ load(); const id=setInterval(load,5*60*1000); return()=>clearInterval(id) },[])

  return (
    <div style={{ position:'relative',height:'100vh',width:'100vw',background:'#020817',overflow:'hidden' }}>
      <TopBar stations={stations} chatOpen={chatOpen} onChatToggle={()=>{setChatOpen(o=>!o);setSelected(null)}}/>

      <div style={{ position:'absolute',top:54,left:0,bottom:0,right:chatOpen?360:0,transition:'right 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
        <MapContainer center={[13.0827,80.2707]} zoom={12}
          maxBounds={[[12.7,79.9],[13.5,80.7]]} maxBoundsViscosity={0.85}
          style={{ height:'100%',width:'100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
          />
          {stations.map(s=>{
            const c = AQI_COLOR(s.aqi)
            const isHigh = s.aqi > 200
            return (
              <CircleMarker
                key={s.openaq_id}
                center={[s.lat,s.lon]}
                radius={Math.max(10,s.aqi/20)}
                fillColor={c}
                color={c}
                weight={isHigh?2:1.5}
                fillOpacity={0.82}
                eventHandlers={{ click:()=>{ setChatOpen(false); setSelected({ station_id:s.id,station_name:s.name,area:s.area,aqi:s.aqi,category:s.category }) } }}
              >
                <Popup>
                  <div style={{ background:'rgba(6,15,30,0.98)',border:`1px solid ${c}40`,borderRadius:12,padding:16,minWidth:200,fontFamily:'Inter,sans-serif',overflow:'hidden',boxShadow:`0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px ${c}20` }}>
                    <div style={{ height:2,background:`linear-gradient(90deg,${c},transparent)`,margin:'-16px -16px 12px' }}/>
                    <div style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:14,color:'#e2eaf4',marginBottom:10,letterSpacing:'-0.01em' }}>
                      {shortName(s.name)}
                    </div>
                    <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:28,fontWeight:700,color:c,letterSpacing:'-0.03em',lineHeight:1,marginBottom:6 }}>
                      {Math.round(s.aqi)}
                      <span style={{ fontSize:13,fontWeight:400,color:'#334155',marginLeft:6 }}>AQI</span>
                    </div>
                    <div style={{ color:'#475569',fontSize:12,marginBottom:14 }}>{AQI_LABEL(s.aqi)} · PM2.5 {s.pm25} µg/m³</div>
                    <button
                      onClick={()=>setSelected({station_id:s.id,station_name:s.name,area:s.area,aqi:s.aqi,category:s.category})}
                      style={{ width:'100%',background:`${c}15`,border:`1px solid ${c}35`,color:c,borderRadius:7,padding:'7px 0',fontSize:11,fontWeight:700,cursor:'pointer',letterSpacing:'0.06em',fontFamily:'Inter,sans-serif' }}>
                      FORECAST + ATTRIBUTION →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        <Legend/>

        {selected && (
          <DetailPanel station={selected} onClose={()=>setSelected(null)}/>
        )}
      </div>

      {chatOpen && <ChatPanel/>}
    </div>
  )
}
