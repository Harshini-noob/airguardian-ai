import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const SEVERITY_COLOR = {
  low:      { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  moderate: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  high:     { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  severe:   { bg: '#4c1d95', text: '#ffffff', border: '#7c3aed' },
}

const SOURCE_ICON = {
  Industrial:   '🏭',
  Traffic:      '🚗',
  Construction: '🏗️',
  'Dust/Natural': '💨',
}

function PriorityCard({ station, rank }) {
  const colors = SEVERITY_COLOR[station.severity] || SEVERITY_COLOR.moderate

  return (
    <div style={{
      background: '#1a1a2e',
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 12,
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start'
    }}>
      {/* Rank badge */}
      <div style={{
        minWidth: 40, height: 40,
        borderRadius: '50%',
        background: rank === 1 ? '#dc2626' : rank === 2 ? '#ea580c' : rank === 3 ? '#d97706' : '#374151',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 16
      }}>
        {rank}
      </div>

      {/* Main content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
              {station.name.replace(', Chennai - CPCB', '').replace(', Chennai - TNPCB', '')}
            </div>
            <div style={{ color: '#aaa', fontSize: 12 }}>{station.area}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: colors.bg, color: colors.text,
              padding: '2px 10px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, display: 'inline-block'
            }}>
              {station.severity.toUpperCase()}
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginTop: 2 }}>
              AQI {Math.round(station.aqi)}
            </div>
          </div>
        </div>

        {/* Source breakdown */}
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(station.sources).map(([source, pct]) => (
            <div key={source} style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 6, padding: '3px 8px',
              fontSize: 12, color: '#ddd',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              {SOURCE_ICON[source] || '📊'} {source} {Math.round(pct * 100)}%
            </div>
          ))}
        </div>

        {/* Enforcement action */}
        <div style={{
          marginTop: 10,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8, padding: '8px 12px',
          borderLeft: `3px solid ${colors.border}`
        }}>
          <div style={{ color: '#60a5fa', fontSize: 11, marginBottom: 3 }}>
            RECOMMENDED ACTION
          </div>
          <div style={{ color: '#fff', fontSize: 13 }}>
            {station.enforcement}
          </div>
        </div>

        {/* Priority score */}
        <div style={{ marginTop: 8, color: '#6b7280', fontSize: 11 }}>
          Priority score: {station.priority_score} · Source confidence: {station.primary_pct}%
        </div>
      </div>
    </div>
  )
}

export default function EnforcementDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = () => {
    setLoading(true)
    axios.get(`${API}/api/enforcement`)
      .then(r => {
        setData(r.data)
        setLastUpdated(new Date().toLocaleTimeString())
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div style={{
      height: '100vh', background: '#0f0f19',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: 16
    }}>
      Loading enforcement data...
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', height: '100vh', overflowY: 'auto', background: '#0f0f19',
      color: '#fff', fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,15,25,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 20
      }}>
        <a href="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 13 }}>
          ← Back to Map
        </a>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#60a5fa' }}>
          🌬 Vayu
        </span>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
          Enforcement Intelligence Dashboard
        </span>
        <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 12 }}>
          Updated: {lastUpdated} · Auto-refresh: 5 min
        </span>
        <button
          onClick={load}
          style={{
            background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13
          }}
        >
          ↻ Refresh
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {/* Summary cards */}
        {data && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{
              flex: 1, background: '#1a1a2e',
              borderRadius: 10, padding: '14px 18px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ color: '#aaa', fontSize: 12 }}>Total Stations</div>
              <div style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>
                {data.total_stations}
              </div>
            </div>
            <div style={{
              flex: 1, background: '#1a1a2e',
              borderRadius: 10, padding: '14px 18px',
              border: '1px solid #fca5a5'
            }}>
              <div style={{ color: '#aaa', fontSize: 12 }}>Critical / High Priority</div>
              <div style={{ color: '#f87171', fontSize: 28, fontWeight: 700 }}>
                {data.critical_count}
              </div>
            </div>
            <div style={{
              flex: 1, background: '#1a1a2e',
              borderRadius: 10, padding: '14px 18px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ color: '#aaa', fontSize: 12 }}>Top Priority Station</div>
              <div style={{ color: '#fb923c', fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {data.priorities[0]?.name
                  .replace(', Chennai - CPCB', '')
                  .replace(', Chennai - TNPCB', '')}
              </div>
              <div style={{ color: '#aaa', fontSize: 12 }}>
                {data.priorities[0]?.enforcement}
              </div>
            </div>
            <div style={{
              flex: 1, background: '#1a1a2e',
              borderRadius: 10, padding: '14px 18px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ color: '#aaa', fontSize: 12 }}>Primary Source Today</div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {SOURCE_ICON[data.priorities[0]?.primary_source]}
                {' '}{data.priorities[0]?.primary_source}
              </div>
              <div style={{ color: '#aaa', fontSize: 12 }}>
                {data.priorities[0]?.primary_pct}% contribution
              </div>
            </div>
          </div>
        )}

        {/* Priority list */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            Inspection Priority Queue
          </h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
            Ranked by AQI severity × source confidence. Deploy inspectors top-down.
          </p>
          {data?.priorities.map((station, i) => (
            <PriorityCard
              key={station.station_id}
              station={station}
              rank={i + 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}