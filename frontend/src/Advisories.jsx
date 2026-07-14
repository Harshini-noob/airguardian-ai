import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'

const RISK_CONFIG = {
  low:      { label: 'LOW RISK',      color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
  moderate: { label: 'MODERATE RISK', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  high:     { label: 'HIGH RISK',     color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  severe:   { label: 'SEVERE RISK',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)'  },
}

const AQI_COLOR = (aqi) => {
  if (aqi <= 50)  return '#10b981'
  if (aqi <= 100) return '#84cc16'
  if (aqi <= 200) return '#f59e0b'
  if (aqi <= 300) return '#ef4444'
  if (aqi <= 400) return '#8b5cf6'
  return '#7e0023'
}

export default function Advisories() {
  const navigate = useNavigate()
  const [stations, setStations]   = useState([])
  const [selected, setSelected]   = useState('')
  const [lang, setLang]           = useState('en')
  const [advisory, setAdvisory]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    axios.get(`${API}/api/stations`)
      .then(r => {
        setStations(r.data)
        if (r.data.length > 0) setSelected(String(r.data[0].id))
      })
      .catch(() => setError('Could not load stations. Is the backend running?'))
  }, [])

  const generate = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    setAdvisory(null)
    try {
      const r = await axios.get(`${API}/api/advisory/${selected}?lang=${lang}`)
      setAdvisory(r.data)
    } catch {
      setError('Failed to generate advisory. Check your GROQ_API_KEY.')
    }
    setLoading(false)
  }

  const risk = advisory ? (RISK_CONFIG[advisory.risk_level] || RISK_CONFIG.moderate) : null

  return (
    <div style={{
      minHeight: '100vh', background: '#050d1a',
      color: '#f0f4f8', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        select, button, input { font-family: inherit; }
        option { background: #0a1628; color: #f0f4f8; }
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
        <span style={{ color: '#475569', fontSize: 13 }}>Health Advisories</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {[['Dashboard', '/dashboard'], ['Compare', '/compare'], ['Enforcement', '/enforcement']].map(([l, p]) => (
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

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 48px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: '#334155', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Chennai — AI-Generated
          </div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 32, fontWeight: 700,
            color: '#f0f4f8', letterSpacing: '-0.02em', marginBottom: 10,
          }}>
            Citizen Health Advisories
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
            AI-generated advisories grounded in live AQI data, WHO 2021 guidelines, CPCB, and TNPCB standards.
            Available in English and Tamil.
          </p>
        </div>

        {/* Controls */}
        <div style={{
          background: '#0a1628',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: '28px 32px',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>

            {/* Station picker */}
            <div style={{ flex: 2, minWidth: 240 }}>
              <label style={{
                display: 'block', color: '#475569',
                fontSize: 11, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 8, fontWeight: 500,
              }}>
                Monitoring Station
              </label>
              <select
                value={selected}
                onChange={e => { setSelected(e.target.value); setAdvisory(null) }}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, padding: '10px 14px',
                  color: '#f0f4f8', fontSize: 14, outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {stations.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name.replace(', Chennai - CPCB', '').replace(', Chennai - TNPCB', '')}
                    {' '}— AQI {Math.round(s.aqi)}
                  </option>
                ))}
              </select>
            </div>

            {/* Language toggle */}
            <div>
              <label style={{
                display: 'block', color: '#475569',
                fontSize: 11, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 8, fontWeight: 500,
              }}>
                Language
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['en', 'English'], ['ta', 'தமிழ்']].map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => { setLang(code); setAdvisory(null) }}
                    style={{
                      padding: '10px 18px',
                      background: lang === code ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
                      border: lang === code ? '1px solid rgba(14,165,233,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: lang === code ? '#0ea5e9' : '#64748b',
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: 13, fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={loading || !selected}
              style={{
                padding: '10px 28px',
                background: loading ? '#0c4a6e' : '#0ea5e9',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em', whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Generating...' : 'Generate Advisory'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '16px 20px',
            color: '#ef4444', fontSize: 13, marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {/* Loading placeholder */}
        {loading && (
          <div style={{
            background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{
              width: 32, height: 32, border: '3px solid rgba(14,165,233,0.2)',
              borderTopColor: '#0ea5e9', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}/>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ color: '#475569', fontSize: 13 }}>
              Generating {lang === 'ta' ? 'Tamil' : 'English'} advisory via Groq LLaMA 3.3 70B...
            </div>
          </div>
        )}

        {/* Advisory card */}
        {advisory && !loading && (
          <div style={{
            background: '#0a1628',
            border: `1px solid ${risk.border}`,
            borderRadius: 10, overflow: 'hidden',
          }}>
            {/* Card header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 20, fontWeight: 700, color: '#f0f4f8',
                  marginBottom: 4,
                }}>
                  {advisory.station_name}
                </div>
                <div style={{ color: '#475569', fontSize: 13 }}>
                  {lang === 'ta' ? 'தமிழ் அறிவிப்பு' : 'English Advisory'} — Generated by AI
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{
                  background: risk.bg, border: `1px solid ${risk.border}`,
                  borderRadius: 5, padding: '4px 12px',
                  color: risk.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                }}>
                  {risk.label}
                </div>
                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 26, fontWeight: 700,
                  color: AQI_COLOR(advisory.aqi),
                }}>
                  {advisory.aqi}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#475569', marginLeft: 4 }}>AQI</span>
                </div>
              </div>
            </div>

            {/* Advisory text */}
            <div style={{ padding: '28px 32px' }}>
              <p style={{
                fontSize: lang === 'ta' ? 17 : 16,
                lineHeight: lang === 'ta' ? 1.9 : 1.8,
                color: '#d1d5db',
                marginBottom: 28,
                fontFamily: lang === 'ta' ? 'system-ui, sans-serif' : 'Inter, sans-serif',
              }}>
                {advisory.advisory}
              </p>

              {/* Vulnerable groups */}
              {advisory.vulnerable_groups?.length > 0 && (
                <div>
                  <div style={{
                    color: '#475569', fontSize: 11, letterSpacing: '0.08em',
                    textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
                  }}>
                    Vulnerable Groups
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {advisory.vulnerable_groups.map((g, i) => (
                      <span key={i} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 20, padding: '4px 14px',
                        color: '#94a3b8', fontSize: 12,
                      }}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 32px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: 24, flexWrap: 'wrap',
            }}>
              {['WHO Air Quality Guidelines 2021', 'CPCB NAQI Standards', 'TNPCB Chennai Data'].map((src, i) => (
                <span key={i} style={{ color: '#334155', fontSize: 11 }}>{src}</span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!advisory && !loading && !error && (
          <div style={{
            background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '60px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🌫️</div>
            <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
              Select a station and language above,<br/>
              then click <strong style={{ color: '#64748b' }}>Generate Advisory</strong> to create an AI health advisory.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
