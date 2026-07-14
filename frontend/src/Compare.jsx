import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend as RechartsLegend,
} from 'recharts'

const API = 'http://localhost:8000'

const STATION_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const AQI_COLOR = (aqi) => {
  if (aqi <= 50)  return '#10b981'
  if (aqi <= 100) return '#84cc16'
  if (aqi <= 200) return '#f59e0b'
  if (aqi <= 300) return '#ef4444'
  if (aqi <= 400) return '#8b5cf6'
  return '#7e0023'
}

export default function Compare() {
  const navigate = useNavigate()
  const [stations, setStations]     = useState([])
  const [selected, setSelected]     = useState([])
  const [compareData, setCompare]   = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    axios.get(`${API}/api/stations`)
      .then(r => setStations(r.data))
      .catch(() => setError('Could not load stations. Is the backend running?'))
  }, [])

  const toggleStation = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const compare = async () => {
    if (selected.length < 2) return
    setLoading(true)
    setError('')
    setCompare([])
    try {
      const r = await axios.get(`${API}/api/compare?ids=${selected.join(',')}`)
      setCompare(r.data)
    } catch {
      setError('Failed to load comparison data.')
    }
    setLoading(false)
  }

  // Merge readings arrays into one chart data array by index position
  const chartData = (() => {
    if (!compareData.length) return []
    const maxLen = Math.max(...compareData.map(s => s.readings.length))
    return Array.from({ length: maxLen }, (_, i) => {
      const point = { idx: i }
      compareData.forEach((s, si) => {
        const r = s.readings[i]
        if (r) {
          point[`station_${si}`] = r.aqi
          point.hour = r.hour
        }
      })
      return point
    })
  })()

  return (
    <div style={{
      minHeight: '100vh', background: '#050d1a',
      color: '#f0f4f8', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '16px 48px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(5,13,26,0.97)', backdropFilter: 'blur(8px)',
      }}>
        <span
          onClick={() => navigate('/')}
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#f0f4f8', cursor: 'pointer' }}
        >
          AeroSense
        </span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }}/>
        <span style={{ color: '#475569', fontSize: 13 }}>Station Comparison</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {[['Dashboard', '/dashboard'], ['Advisories', '/advisories'], ['Enforcement', '/enforcement']].map(([l, p]) => (
            <button key={l} onClick={() => navigate(p)} style={{
              background: 'none', border: 'none', color: '#475569',
              fontSize: 12, cursor: 'pointer', letterSpacing: '0.05em',
              fontFamily: 'Inter, sans-serif',
            }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: '#334155', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Chennai — 24-Hour Trend
          </div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 32, fontWeight: 700,
            color: '#f0f4f8', letterSpacing: '-0.02em', marginBottom: 10,
          }}>
            Compare Stations
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Select 2–5 stations to overlay their 24-hour AQI trends on a single chart.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '14px 20px', color: '#ef4444', fontSize: 13, marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {/* Station picker grid */}
        <div style={{
          background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: '28px 32px', marginBottom: 24,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20,
          }}>
            <div style={{ color: '#475569', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
              Select Stations &nbsp;<span style={{ color: '#334155' }}>({selected.length}/5 selected)</span>
            </div>
            {selected.length >= 2 && (
              <button
                onClick={compare}
                disabled={loading}
                style={{
                  padding: '8px 22px',
                  background: loading ? '#0c4a6e' : '#0ea5e9',
                  color: '#fff', border: 'none', borderRadius: 6,
                  fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {loading ? 'Loading...' : 'Compare →'}
              </button>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 8,
          }}>
            {stations.map((s, si) => {
              const selIdx  = selected.indexOf(s.id)
              const isSel   = selIdx !== -1
              const color   = isSel ? STATION_COLORS[selIdx % STATION_COLORS.length] : null
              const isMaxed = !isSel && selected.length >= 5

              return (
                <div
                  key={s.id}
                  onClick={() => !isMaxed && toggleStation(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    background: isSel ? `${color}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSel ? color + '50' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 7, cursor: isMaxed ? 'not-allowed' : 'pointer',
                    opacity: isMaxed ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Color dot / number */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: isSel ? color : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    {isSel ? selIdx + 1 : ''}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#d1d5db', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name.replace(', Chennai - CPCB', '').replace(', Chennai - TNPCB', '')}
                    </div>
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                      {s.area}
                    </div>
                  </div>

                  <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 16, fontWeight: 700,
                    color: AQI_COLOR(s.aqi), flexShrink: 0,
                  }}>
                    {Math.round(s.aqi)}
                  </div>
                </div>
              )
            })}
          </div>

          {selected.length < 2 && (
            <div style={{ color: '#334155', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
              Select at least 2 stations to compare
            </div>
          )}
        </div>

        {/* Chart */}
        {compareData.length > 0 && (
          <>
            {/* Summary stat cards */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              {compareData.map((s, i) => (
                <div key={s.station_id} style={{
                  flex: 1, minWidth: 160,
                  background: '#0a1628',
                  border: `1px solid ${STATION_COLORS[i % STATION_COLORS.length]}40`,
                  borderRadius: 8, padding: '18px 20px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: STATION_COLORS[i % STATION_COLORS.length],
                      flexShrink: 0,
                    }}/>
                    <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.station_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ color: '#475569', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Avg</div>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, color: AQI_COLOR(s.avg_aqi) }}>
                        {s.avg_aqi}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#475569', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Peak</div>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, color: AQI_COLOR(s.peak_aqi) }}>
                        {s.peak_aqi}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Line chart */}
            <div style={{
              background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '28px 28px 16px',
            }}>
              <div style={{ color: '#475569', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20, fontWeight: 500 }}>
                24-Hour AQI Comparison
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#334155', fontSize: 10 }}
                    interval={Math.floor(chartData.length / 8)}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    tick={{ fill: '#334155', fontSize: 10 }}
                    width={32} axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, fontSize: 12,
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: 6 }}
                    formatter={(val, key) => {
                      const idx = parseInt(key.split('_')[1])
                      const name = compareData[idx]?.station_name || key
                      return [val, name]
                    }}
                  />
                  <ReferenceLine y={100} stroke="#84cc16" strokeDasharray="3 3" strokeOpacity={0.25}/>
                  <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.25}/>
                  <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.25}/>
                  {compareData.map((s, i) => (
                    <Line
                      key={s.station_id}
                      type="monotone"
                      dataKey={`station_${i}`}
                      stroke={STATION_COLORS[i % STATION_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name={s.station_name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap', paddingLeft: 4 }}>
                {compareData.map((s, i) => (
                  <div key={s.station_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 20, height: 2, background: STATION_COLORS[i % STATION_COLORS.length], borderRadius: 1 }}/>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{s.station_name}</span>
                  </div>
                ))}
                <div style={{ flex: 1 }}/>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#334155' }}>
                  <span>── 100 (Satisfactory)</span>
                  <span>── 200 (Moderate)</span>
                  <span>── 300 (Poor)</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '60px 32px', textAlign: 'center',
          }}>
            <div style={{
              width: 32, height: 32, border: '3px solid rgba(14,165,233,0.2)',
              borderTopColor: '#0ea5e9', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }}/>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ color: '#475569', fontSize: 13 }}>Loading comparison data...</div>
          </div>
        )}
      </div>
    </div>
  )
}
