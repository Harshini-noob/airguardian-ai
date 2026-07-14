import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import './App.css'

const API = 'http://localhost:8000'

const AQI_COLOR = (aqi) => {
  if (aqi <= 50)  return '#10b981'
  if (aqi <= 100) return '#84cc16'
  if (aqi <= 200) return '#f59e0b'
  if (aqi <= 300) return '#ef4444'
  if (aqi <= 400) return '#8b5cf6'
  return '#7e0023'
}

const AQI_LABEL = (aqi) => {
  if (aqi <= 50)  return 'Good'
  if (aqi <= 100) return 'Satisfactory'
  if (aqi <= 200) return 'Moderate'
  if (aqi <= 300) return 'Poor'
  if (aqi <= 400) return 'Very Poor'
  return 'Severe'
}

const SOURCE_COLORS = {
  Industrial:     '#ef4444',
  Traffic:        '#f59e0b',
  Construction:   '#0ea5e9',
  'Dust/Natural': '#64748b',
}

// ─── Top navigation bar ───────────────────────────────────────────────────────

function TopBar({ stations, onOpenChat, chatOpen }) {
  const navigate = useNavigate()
  const worst    = stations.reduce((a, b) => a.aqi > b.aqi ? a : b, { aqi: 0, name: '--' })
  const avg      = stations.length
    ? Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length)
    : '--'

  const navBtn = (label, path, red = false) => (
    <button key={label} onClick={() => navigate(path)} style={{
      background: red ? 'rgba(239,68,68,0.08)' : 'none',
      border: red ? '1px solid rgba(239,68,68,0.2)' : 'none',
      color: red ? '#ef4444' : '#475569',
      borderRadius: red ? 5 : 0,
      padding: red ? '4px 12px' : '0',
      fontSize: 11, fontWeight: 600,
      cursor: 'pointer', letterSpacing: '0.06em',
      fontFamily: 'Inter, sans-serif',
      transition: 'color 0.15s',
    }}
    onMouseOver={e => { if (!red) e.target.style.color = '#94a3b8' }}
    onMouseOut={e => { if (!red) e.target.style.color = '#475569' }}
    >
      {label.toUpperCase()}
    </button>
  )

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(5,13,26,0.97)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '0 20px', height: 52,
      fontFamily: 'Inter, system-ui, sans-serif',
      backdropFilter: 'blur(8px)',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* Logo */}
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15,
        color: '#f0f4f8', letterSpacing: '-0.01em',
        paddingRight: 20, borderRight: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
      }} onClick={() => navigate('/')}>
        AeroSense
      </div>

      {/* City avg */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 18px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: AQI_COLOR(avg), boxShadow: `0 0 6px ${AQI_COLOR(avg)}` }}/>
        <span style={{ color: '#475569', fontSize: 12 }}>City avg</span>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', color: AQI_COLOR(avg), fontSize: 13, fontWeight: 700 }}>{avg}</span>
      </div>

      {/* Worst */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 18px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: '#475569', fontSize: 12 }}>Worst</span>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>
          {worst.name?.replace(', Chennai - CPCB', '')?.replace(', Chennai - TNPCB', '')}
        </span>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', color: AQI_COLOR(worst.aqi), fontSize: 13, fontWeight: 700 }}>
          {Math.round(worst.aqi)}
        </span>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginRight: 16 }}>
        {navBtn('Advisories', '/advisories')}
        {navBtn('Compare', '/compare')}
        {navBtn('Enforcement', '/enforcement', true)}
      </div>

      {/* Chat toggle */}
      <button onClick={onOpenChat} style={{
        background: chatOpen ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
        border: chatOpen ? '1px solid rgba(14,165,233,0.3)' : '1px solid rgba(255,255,255,0.08)',
        color: chatOpen ? '#0ea5e9' : '#64748b',
        borderRadius: 6, padding: '5px 14px',
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif',
        transition: 'all 0.15s',
      }}>
        {chatOpen ? 'CLOSE CHAT' : 'AI CHAT'}
      </button>
    </div>
  )
}

// ─── AQI legend ───────────────────────────────────────────────────────────────

function Legend() {
  const levels = [
    ['Good',         '0–50',    '#10b981'],
    ['Satisfactory', '51–100',  '#84cc16'],
    ['Moderate',     '101–200', '#f59e0b'],
    ['Poor',         '201–300', '#ef4444'],
    ['Very Poor',    '301–400', '#8b5cf6'],
    ['Severe',       '401+',    '#7e0023'],
  ]
  return (
    <div style={{
      position: 'absolute', bottom: 24, right: 16, zIndex: 1000,
      background: 'rgba(5,13,26,0.92)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '14px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ color: '#334155', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
        India CPCB AQI
      </div>
      {levels.map(([label, range, color]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 3, height: 12, borderRadius: 1, background: color, flexShrink: 0 }}/>
          <span style={{ color: '#64748b', fontSize: 11, flex: 1 }}>{label}</span>
          <span style={{ color: '#334155', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif' }}>{range}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Station detail panel (Forecast + Attribution tabs) ───────────────────────

function DetailPanel({ station, onClose }) {
  const [tab, setTab]             = useState('forecast')
  const [forecast, setForecast]   = useState([])
  const [attribution, setAttrib]  = useState(null)
  const [loadingF, setLoadingF]   = useState(true)
  const [loadingA, setLoadingA]   = useState(false)

  useEffect(() => {
    setLoadingF(true)
    axios.get(`${API}/api/forecast/${station.station_id}`)
      .then(r => {
        setForecast(r.data.forecast.map(f => ({
          hour: `+${f.hour}h`, aqi: f.aqi, category: f.category,
        })))
      })
      .catch(() => {})
      .finally(() => setLoadingF(false))
  }, [station.station_id])

  useEffect(() => {
    if (tab !== 'attribution' || attribution) return
    setLoadingA(true)
    axios.get(`${API}/api/attribution/${station.station_id}`)
      .then(r => setAttrib(r.data))
      .catch(() => {})
      .finally(() => setLoadingA(false))
  }, [tab, station.station_id, attribution])

  const peak   = forecast.reduce((a, b) => a.aqi > b.aqi ? a : b, { aqi: 0, hour: '' })
  const rising = peak.aqi > station.aqi

  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 24, zIndex: 1000,
      width: 440,
      background: 'rgba(5,13,26,0.97)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      fontFamily: 'Inter, system-ui, sans-serif',
      backdropFilter: 'blur(8px)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 15, fontWeight: 600, color: '#f0f4f8',
            letterSpacing: '-0.01em', marginBottom: 2
          }}>
            {station.station_name?.replace(', Chennai - CPCB', '')?.replace(', Chennai - TNPCB', '')}
          </div>
          <div style={{ color: '#475569', fontSize: 11 }}>
            {station.area} &nbsp;·&nbsp;
            <span style={{ color: AQI_COLOR(station.aqi), fontWeight: 600 }}>
              AQI {Math.round(station.aqi)}
            </span>
            &nbsp;— {station.category}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#334155',
          fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 6px',
        }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['forecast', 'attribution'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0',
            background: tab === t ? 'rgba(14,165,233,0.08)' : 'none',
            border: 'none',
            borderBottom: tab === t ? '2px solid #0ea5e9' : '2px solid transparent',
            color: tab === t ? '#0ea5e9' : '#475569',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}>
            {t === 'forecast' ? '24-Hour Forecast' : 'Source Attribution'}
          </button>
        ))}
      </div>

      {/* Forecast tab */}
      {tab === 'forecast' && (
        <>
          <div style={{ padding: '16px 20px 0' }}>
            {loadingF ? (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 13 }}>
                Loading forecast...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={forecast} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fill: '#334155', fontSize: 10 }} interval={5} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0, Math.max(500, peak.aqi + 50)]} tick={{ fill: '#334155', fontSize: 10 }} width={30} axisLine={false} tickLine={false}/>
                  <Tooltip
                    contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(val, _, props) => [`${val} — ${props.payload.category}`, 'AQI']}
                  />
                  <ReferenceLine y={100} stroke="#84cc16" strokeDasharray="3 3" strokeOpacity={0.3}/>
                  <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3}/>
                  <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.3}/>
                  <Area type="monotone" dataKey="aqi" stroke="#0ea5e9" strokeWidth={1.5} fill="url(#aqiGrad)" dot={false} activeDot={{ r: 4, fill: '#0ea5e9' }}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          {!loadingF && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1,
              margin: '12px 0 0',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              {[
                { label: 'Now',   value: Math.round(station.aqi), color: AQI_COLOR(station.aqi), sub: station.category },
                { label: 'Peak',  value: Math.round(peak.aqi),    color: AQI_COLOR(peak.aqi),    sub: `at ${peak.hour}` },
                { label: 'Trend', value: rising ? 'Rising ↑' : 'Falling ↓', color: rising ? '#ef4444' : '#10b981', sub: rising ? 'Limit outdoor activity' : 'Improving' },
              ].map(({ label, value, color, sub }) => (
                <div key={label} style={{ padding: '14px 16px' }}>
                  <div style={{ color: '#334155', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{value}</div>
                  <div style={{ color: '#475569', fontSize: 10, marginTop: 3 }}>{sub}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Attribution tab */}
      {tab === 'attribution' && (
        <div style={{ padding: '16px 20px' }}>
          {loadingA ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 13 }}>
              Analysing sources...
            </div>
          ) : attribution ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#475569', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Pollution Source Breakdown
                </div>
                {/* Stacked bar */}
                <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12, gap: 1 }}>
                  {Object.entries(attribution.sources).map(([src, pct]) => (
                    <div key={src} style={{ flex: pct, background: SOURCE_COLORS[src] || '#475569' }}/>
                  ))}
                </div>
                {/* Source rows */}
                {Object.entries(attribution.sources)
                  .sort((a, b) => b[1] - a[1])
                  .map(([src, pct]) => (
                  <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 28, borderRadius: 2, background: SOURCE_COLORS[src] || '#475569', flexShrink: 0 }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{src}</span>
                        <span style={{ color: SOURCE_COLORS[src] || '#475569', fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
                          {Math.round(pct * 100)}%
                        </span>
                      </div>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: SOURCE_COLORS[src] || '#475569', width: `${pct * 100}%` }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 14, marginTop: 4,
              }}>
                <div style={{ color: '#334155', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
                  Recommended Action
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
                  {attribution.enforcement}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: '#334155', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>
              Unable to load attribution data.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── AI Chat panel ────────────────────────────────────────────────────────────

function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Hi! Ask me about air quality at any Chennai station — in English or Tamil.'
  }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))
      const r = await axios.post(`${API}/api/chat`, { message: userMsg, history })
      setMessages(prev => [...prev, {
        role: 'assistant', text: r.data.reply, sources: r.data.sources_used,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Unable to reach advisory service.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'absolute', top: 52, right: 0, bottom: 0,
      width: 360, zIndex: 999,
      background: 'rgba(5,13,26,0.97)',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, color: '#f0f4f8', marginBottom: 3 }}>
          AeroSense AI
        </div>
        <div style={{ color: '#334155', fontSize: 11 }}>
          Grounded in WHO · CPCB · TNPCB — English and Tamil
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
            <div style={{
              background: m.role === 'user' ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
              border: m.role === 'user' ? '1px solid rgba(14,165,233,0.2)' : '1px solid rgba(255,255,255,0.06)',
              color: '#d1d5db', borderRadius: 8,
              padding: '9px 13px', fontSize: 13, lineHeight: 1.6,
            }}>
              {m.text}
            </div>
            {m.sources?.length > 0 && (
              <div style={{ fontSize: 10, color: '#334155', marginTop: 4, paddingLeft: 2 }}>
                {m.sources.join(' · ')}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#475569', borderRadius: 8,
            padding: '9px 13px', fontSize: 13,
          }}>
            Thinking...
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask in English or Tamil..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '8px 12px',
            color: '#d1d5db', fontSize: 13, outline: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <button onClick={send} disabled={loading} style={{
          background: loading ? '#0c4a6e' : '#0ea5e9',
          color: '#fff', border: 'none', borderRadius: 6,
          padding: '8px 14px', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.04em',
        }}>
          SEND
        </button>
      </div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [stations, setStations]        = useState([])
  const [selectedStation, setSelected] = useState(null)
  const [chatOpen, setChatOpen]        = useState(false)

  const load = () => {
    axios.get(`${API}/api/stations`)
      .then(r => setStations(r.data))
      .catch(e => console.error('Failed to load stations:', e))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'relative', height: '100vh', width: '100vw',
      background: '#050d1a', overflow: 'hidden',
    }}>
      <TopBar
        stations={stations}
        onOpenChat={() => setChatOpen(o => !o)}
        chatOpen={chatOpen}
      />

      {/* Map */}
      <div style={{
        position: 'absolute', top: 52, left: 0, bottom: 0,
        right: chatOpen ? 360 : 0,
        transition: 'right 0.2s ease',
      }}>
        <MapContainer
          center={[13.0827, 80.2707]}
          zoom={12}
          maxBounds={[[12.7, 79.9], [13.5, 80.7]]}
          maxBoundsViscosity={0.8}
          style={{ height: '100%', width: '100%' }}
        >
          {/* CARTO dark tiles — much better than OSM on dark UI */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
          />
          {stations.map(s => (
            <CircleMarker
              key={s.openaq_id}
              center={[s.lat, s.lon]}
              radius={Math.max(10, s.aqi / 18)}
              fillColor={AQI_COLOR(s.aqi)}
              color={AQI_COLOR(s.aqi)}
              weight={2}
              fillOpacity={0.85}
              eventHandlers={{
                click: () => {
                  setChatOpen(false)
                  setSelected({
                    station_id:   s.id,
                    station_name: s.name,
                    area:         s.area,
                    aqi:          s.aqi,
                    category:     s.category,
                  })
                }
              }}
            >
              <Popup>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 13,
                  minWidth: 180, background: '#0a1628',
                  color: '#f0f4f8', borderRadius: 6, padding: 12,
                }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, marginBottom: 6 }}>
                    {s.name.replace(', Chennai - CPCB', '').replace(', Chennai - TNPCB', '')}
                  </div>
                  <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 22, fontWeight: 700,
                    color: AQI_COLOR(s.aqi), marginBottom: 4,
                  }}>
                    {Math.round(s.aqi)}
                    <span style={{ fontSize: 12, color: '#475569', marginLeft: 4 }}>AQI</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11, marginBottom: 10 }}>
                    {AQI_LABEL(s.aqi)} · PM2.5 {s.pm25} µg/m³
                  </div>
                  <button
                    onClick={() => setSelected({
                      station_id: s.id, station_name: s.name,
                      area: s.area, aqi: s.aqi, category: s.category,
                    })}
                    style={{
                      background: 'rgba(14,165,233,0.1)',
                      border: '1px solid rgba(14,165,233,0.2)',
                      color: '#0ea5e9', borderRadius: 4,
                      padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontWeight: 500, width: '100%',
                    }}
                  >
                    View forecast & attribution →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <Legend />

        {selectedStation && (
          <DetailPanel
            station={selectedStation}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  )
}
