import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

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

function LiveDataStrip({ stations }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let x = 0
    const speed = 0.4
    const animate = () => {
      x -= speed
      if (x < -el.scrollWidth / 2) x = 0
      el.style.transform = `translateX(${x}px)`
      requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [stations])

  if (!stations.length) return null

  const doubled = [...stations, ...stations]

  return (
    <div style={{
      overflow: 'hidden',
      borderTop: '1px solid rgba(14,165,233,0.15)',
      borderBottom: '1px solid rgba(14,165,233,0.15)',
      padding: '12px 0',
      background: 'rgba(14,165,233,0.03)',
    }}>
      <div ref={ref} style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap' }}>
        {doubled.map((s, i) => (
          <div key={i} style={{
            display: 'inline-flex', alignItems: 'center',
            gap: 10, padding: '0 40px',
            borderRight: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: AQI_COLOR(s.aqi),
              boxShadow: `0 0 6px ${AQI_COLOR(s.aqi)}`
            }}/>
            <span style={{ color: '#94a3b8', fontSize: 12, letterSpacing: '0.05em' }}>
              {s.name.replace(', Chennai - CPCB', '').replace(', Chennai - TNPCB', '').toUpperCase()}
            </span>
            <span style={{
              color: AQI_COLOR(s.aqi), fontSize: 13,
              fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif'
            }}>
              {Math.round(s.aqi)}
            </span>
            <span style={{ color: '#475569', fontSize: 11 }}>
              {AQI_LABEL(s.aqi)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CAPABILITIES = [
  {
    label: 'Real-Time Monitoring',
    description: 'Live AQI readings from 7 CPCB and TNPCB stations across Chennai, updated every 15 minutes. Geospatial heatmap with ward-level granularity.',
    stat: '15 min',
    statLabel: 'refresh interval',
  },
  {
    label: '24-Hour Forecasting',
    description: 'PyTorch LSTM models trained per station predict AQI 24 hours ahead. Empirically outperformed Transformer architecture across all 7 stations.',
    stat: '16.7',
    statLabel: 'best RMSE (AQI units)',
  },
  {
    label: 'Bilingual Advisory',
    description: 'RAG-powered health advisory grounded in WHO 2021 guidelines, CPCB NAQI standards, and TNPCB Chennai data. Responds in Tamil or English automatically.',
    stat: 'Tamil',
    statLabel: '+ English, auto-detected',
  },
  {
    label: 'Enforcement Intelligence',
    description: 'Source attribution across Industrial, Traffic, Construction, and Natural categories. Ranked inspection priority queue for municipal authorities.',
    stat: '4',
    statLabel: 'pollution source categories',
  },
]

const DATA_SOURCES = [
  'CPCB — Central Pollution Control Board',
  'TNPCB — Tamil Nadu Pollution Control Board',
  'WHO Air Quality Guidelines 2021',
  'data.gov.in Real-Time AQI Feed',
  'Open-Meteo Meteorological API',
]

export default function Landing() {
  const [stations, setStations] = useState([])
  const [avgAqi, setAvgAqi]     = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${API}/api/stations`)
      .then(r => {
        setStations(r.data)
        const avg = r.data.reduce((s, x) => s + x.aqi, 0) / r.data.length
        setAvgAqi(Math.round(avg))
      })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050d1a',
      color: '#f0f4f8',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowX: 'hidden',
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700, fontSize: 20,
          color: '#f0f4f8', letterSpacing: '-0.02em'
        }}>
          VAYU
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ color: '#64748b', fontSize: 13 }}>
            Chennai Air Quality Intelligence
          </span>
          {avgAqi && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(14,165,233,0.08)',
              border: '1px solid rgba(14,165,233,0.2)',
              borderRadius: 6, padding: '6px 14px'
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: AQI_COLOR(avgAqi),
                boxShadow: `0 0 8px ${AQI_COLOR(avgAqi)}`
              }}/>
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif',
                color: AQI_COLOR(avgAqi), fontSize: 13, fontWeight: 600
              }}>
                City Avg AQI {avgAqi}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Live data strip */}
      <LiveDataStrip stations={stations} />

      {/* Hero */}
      <section style={{
        padding: '96px 48px 80px',
        maxWidth: 1100, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(14,165,233,0.08)',
          border: '1px solid rgba(14,165,233,0.2)',
          borderRadius: 4, padding: '4px 12px',
          marginBottom: 28
        }}>
          <span style={{ color: '#0ea5e9', fontSize: 11, letterSpacing: '0.1em', fontWeight: 500 }}>
            AI FOR CLEANER CITIES
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: '#f0f4f8',
          marginBottom: 24,
          maxWidth: 800,
        }}>
          From sensor to citizen advisory.<br/>
          <span style={{ color: '#0ea5e9' }}>In real time.</span>
        </h1>

        <p style={{
          fontSize: 18, color: '#94a3b8',
          lineHeight: 1.7, maxWidth: 580,
          marginBottom: 48, fontWeight: 400,
        }}>
          Vayu is an AI-powered air quality intelligence platform for Chennai —
          combining live sensor data, LSTM forecasting, and bilingual health
          advisories grounded in WHO, CPCB, and TNPCB guidelines.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#0ea5e9',
              color: '#fff', border: 'none',
              borderRadius: 6, padding: '13px 28px',
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.01em',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => e.target.style.background = '#0284c7'}
            onMouseOut={e => e.target.style.background = '#0ea5e9'}
          >
            Open Dashboard
          </button>
          <button
            onClick={() => navigate('/enforcement')}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, padding: '13px 28px',
              fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseOver={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = '#f0f4f8' }}
            onMouseOut={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.color = '#94a3b8' }}
          >
            Enforcement Dashboard
          </button>
        </div>
      </section>

      {/* Divider */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}/>

      {/* Capabilities */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          color: '#475569', fontSize: 11,
          letterSpacing: '0.1em', fontWeight: 500,
          marginBottom: 48, textTransform: 'uppercase'
        }}>
          Platform Capabilities
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, overflow: 'hidden',
        }}>
          {CAPABILITIES.map((cap, i) => (
            <div key={i} style={{
              background: '#050d1a',
              padding: '32px 28px',
            }}>
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 28, fontWeight: 700,
                color: '#0ea5e9', marginBottom: 4,
                letterSpacing: '-0.02em'
              }}>
                {cap.stat}
              </div>
              <div style={{
                color: '#475569', fontSize: 11,
                letterSpacing: '0.05em', marginBottom: 20,
                textTransform: 'uppercase'
              }}>
                {cap.statLabel}
              </div>
              <div style={{
                color: '#f0f4f8', fontSize: 15,
                fontWeight: 600, marginBottom: 10,
                fontFamily: 'Space Grotesk, sans-serif'
              }}>
                {cap.label}
              </div>
              <div style={{
                color: '#64748b', fontSize: 13,
                lineHeight: 1.6
              }}>
                {cap.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section style={{
        padding: '0 48px 80px',
        maxWidth: 1100, margin: '0 auto'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 24, flexWrap: 'wrap'
        }}>
          <span style={{
            color: '#475569', fontSize: 11,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            Data Sources
          </span>
          <div style={{
            flex: 1, height: 1,
            background: 'rgba(255,255,255,0.06)'
          }}/>
          {DATA_SOURCES.map((src, i) => (
            <span key={i} style={{
              color: '#475569', fontSize: 12,
              whiteSpace: 'nowrap'
            }}>
              {src}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 48px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#334155', fontSize: 13, fontWeight: 600
        }}>
          VAYU
        </span>
        <span style={{ color: '#334155', fontSize: 12 }}>
          Built for ET AI Hackathon 2026 — Urban Air Quality Intelligence
        </span>
      </div>
    </div>
  )
}