import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'

const SEVERITY_CONFIG = {
  low:      { label: 'LOW',      color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
  moderate: { label: 'MODERATE', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  high:     { label: 'HIGH',     color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  severe:   { label: 'SEVERE',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)'  },
}

const AQI_COLOR = (aqi) => {
  if (aqi <= 50)  return '#10b981'
  if (aqi <= 100) return '#84cc16'
  if (aqi <= 200) return '#f59e0b'
  if (aqi <= 300) return '#ef4444'
  if (aqi <= 400) return '#8b5cf6'
  return '#7e0023'
}

function StatCard({ label, value, valueColor, sub }) {
  return (
    <div style={{
      background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8, padding: '24px 28px', flex: 1,
    }}>
      <div style={{ color: '#475569', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 700,
        color: valueColor || '#f0f4f8', letterSpacing: '-0.02em', lineHeight: 1,
        marginBottom: sub ? 8 : 0,
      }}>
        {value}
      </div>
      {sub && <div style={{ color: '#64748b', fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}

function SourceBar({ sources }) {
  const total  = Object.values(sources).reduce((a, b) => a + b, 0)
  const colors = { Industrial: '#ef4444', Traffic: '#f59e0b', Construction: '#0ea5e9', 'Dust/Natural': '#64748b' }
  return (
    <div>
      <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 10, gap: 1 }}>
        {Object.entries(sources).map(([src, pct]) => (
          <div key={src} style={{ flex: pct / total, background: colors[src] || '#475569' }}/>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(sources).map(([src, pct]) => (
          <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 1, background: colors[src] || '#475569', flexShrink: 0 }}/>
            <span style={{ color: '#64748b', fontSize: 11 }}>{src}</span>
            <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>
              {Math.round(pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PriorityRow({ station, rank, isFirst }) {
  const sev   = SEVERITY_CONFIG[station.severity] || SEVERITY_CONFIG.moderate
  const isTop3 = rank <= 3
  return (
    <div style={{
      background: isFirst ? 'rgba(14,165,233,0.03)' : '#0a1628',
      border: `1px solid ${isFirst ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 8, padding: '24px 28px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{
          minWidth: 32, paddingTop: 2,
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 13, fontWeight: 700,
          color: isTop3 ? '#0ea5e9' : '#334155', letterSpacing: '0.05em',
        }}>
          {String(rank).padStart(2, '0')}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 16, fontWeight: 600, color: '#f0f4f8', marginBottom: 3, letterSpacing: '-0.01em',
              }}>
                {station.name.replace(', Chennai - CPCB', '').replace(', Chennai - TNPCB', '')}
              </div>
              <div style={{ color: '#475569', fontSize: 12 }}>
                {station.area} · Priority score {station.priority_score}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                background: sev.bg, border: `1px solid ${sev.border}`,
                borderRadius: 4, padding: '3px 10px',
                color: sev.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              }}>
                {sev.label}
              </div>
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 22, fontWeight: 700, color: AQI_COLOR(station.aqi), letterSpacing: '-0.02em',
              }}>
                {Math.round(station.aqi)}
                <span style={{ fontSize: 12, fontWeight: 400, color: '#475569', marginLeft: 4 }}>AQI</span>
              </div>
            </div>
          </div>
          <SourceBar sources={station.sources} />
          <div style={{
            marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ color: '#334155', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
                Recommended Action
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>{station.enforcement}</div>
            </div>
            <div style={{ color: '#334155', fontSize: 11, whiteSpace: 'nowrap' }}>
              Primary: {station.primary_source} ({station.primary_pct}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SourceSummary({ priorities }) {
  const sourceCounts = {}
  priorities.forEach(p => {
    sourceCounts[p.primary_source] = (sourceCounts[p.primary_source] || 0) + 1
  })
  const sorted = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])
  const colors = { Industrial: '#ef4444', Traffic: '#f59e0b', Construction: '#0ea5e9', 'Dust/Natural': '#64748b' }

  return (
    <div style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '24px 28px' }}>
      <div style={{ color: '#475569', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20, fontWeight: 500 }}>
        Dominant Source by Station Count
      </div>
      {sorted.map(([src, count]) => (
        <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 3, height: 32, borderRadius: 2, background: colors[src] || '#475569', flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{src}</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', color: colors[src], fontSize: 13, fontWeight: 600 }}>
                {count} station{count > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 1, background: colors[src], width: `${(count / priorities.length) * 100}%` }}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function EnforcementDashboard() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    axios.get(`${API}/api/enforcement`)
      .then(r => {
        setData(r.data)
        setUpdatedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', overflowY: 'auto',
      background: '#050d1a', color: '#f0f4f8',
      fontFamily: 'Inter, system-ui, sans-serif',
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
        <span style={{ color: '#475569', fontSize: 13 }}>Enforcement Intelligence</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[['Dashboard', '/dashboard'], ['Advisories', '/advisories'], ['Compare', '/compare']].map(([l, p]) => (
            <button key={l} onClick={() => navigate(p)} style={{
              background: 'none', border: 'none', color: '#475569',
              fontSize: 12, cursor: 'pointer', letterSpacing: '0.05em',
              fontFamily: 'Inter, sans-serif',
            }}>
              {l.toUpperCase()}
            </button>
          ))}
          {updatedAt && <span style={{ color: '#334155', fontSize: 12 }}>Updated {updatedAt}</span>}
          <button onClick={load} disabled={loading} style={{
            background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
            color: '#0ea5e9', borderRadius: 6, padding: '6px 16px', fontSize: 12,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.05em', fontWeight: 500,
          }}>
            {loading ? 'LOADING...' : 'REFRESH'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ color: '#334155', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }}>
            Chennai — Live
          </div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700,
            color: '#f0f4f8', letterSpacing: '-0.02em', marginBottom: 8,
          }}>
            Inspection Priority Queue
          </h1>
          <p style={{ color: '#475569', fontSize: 14 }}>
            Stations ranked by AQI severity weighted by source attribution confidence.
            Deploy inspection teams from rank 01 downward.
          </p>
        </div>

        {data && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
            <StatCard label="Active Stations" value={data.total_stations} />
            <StatCard
              label="Require Immediate Action" value={data.critical_count}
              valueColor="#ef4444" sub="High or Severe severity threshold exceeded"
            />
            <StatCard
              label="Highest Priority"
              value={data.priorities[0]?.name.replace(', Chennai - CPCB', '').replace(', Chennai - TNPCB', '')}
              valueColor="#f59e0b"
              sub={`AQI ${Math.round(data.priorities[0]?.aqi)} — ${data.priorities[0]?.category}`}
            />
            <StatCard
              label="Dominant Source" value={data.priorities[0]?.primary_source}
              sub={`${data.priorities[0]?.primary_pct}% contribution at top station`}
            />
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 2 }}>
              <div style={{ color: '#334155', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>
                All Stations — Priority Order
              </div>
              {data.priorities.map((station, i) => (
                <PriorityRow key={station.station_id} station={station} rank={i + 1} isFirst={i === 0}/>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ color: '#334155', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>
                Source Analysis
              </div>
              <SourceSummary priorities={data.priorities} />
              <div style={{
                background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '24px 28px', marginTop: 12,
              }}>
                <div style={{ color: '#475569', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>
                  India CPCB AQI Scale
                </div>
                {[
                  ['0–50',    'Good',         '#10b981'],
                  ['51–100',  'Satisfactory', '#84cc16'],
                  ['101–200', 'Moderate',     '#f59e0b'],
                  ['201–300', 'Poor',         '#ef4444'],
                  ['301–400', 'Very Poor',    '#8b5cf6'],
                  ['401+',    'Severe',       '#7e0023'],
                ].map(([range, label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 3, height: 14, borderRadius: 1, background: color, flexShrink: 0 }}/>
                    <span style={{ color: '#64748b', fontSize: 12, flex: 1 }}>{label}</span>
                    <span style={{ color: '#334155', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' }}>{range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && !data && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#334155', fontSize: 14 }}>
            Loading enforcement data...
          </div>
        )}
      </div>
    </div>
  )
}
