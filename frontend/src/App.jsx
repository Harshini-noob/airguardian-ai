import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import './App.css'

const API = 'http://localhost:8000'

const AQI_COLOR = (aqi) => {
  if (aqi <= 50)  return '#00e400'
  if (aqi <= 100) return '#ffff00'
  if (aqi <= 200) return '#ff7e00'
  if (aqi <= 300) return '#ff0000'
  if (aqi <= 400) return '#8f3f97'
  return '#7e0023'
}

function Legend() {
  const levels = [
    { label: 'Good',         range: '0–50',   color: '#00e400' },
    { label: 'Satisfactory', range: '51–100',  color: '#ffff00' },
    { label: 'Moderate',     range: '101–200', color: '#ff7e00' },
    { label: 'Poor',         range: '201–300', color: '#ff0000' },
    { label: 'Very Poor',    range: '301–400', color: '#8f3f97' },
    { label: 'Severe',       range: '401+',    color: '#7e0023' },
  ]
  return (
    <div style={{
      position: 'absolute', bottom: 30, right: 10, zIndex: 1000,
      background: 'rgba(255,255,255,0.95)', borderRadius: 10,
      padding: '12px 16px', fontSize: 13,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <strong style={{ display: 'block', marginBottom: 8 }}>AQI — India CPCB</strong>
      {levels.map(l => (
        <div key={l.label} style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: l.color, border: '1px solid #ccc'
          }}/>
          <span>{l.label}</span>
          <span style={{ color: '#888', marginLeft: 'auto', paddingLeft: 12 }}>
            {l.range}
          </span>
        </div>
      ))}
    </div>
  )
}

function TopBar({ stations }) {
  const worst = stations.reduce((a, b) => a.aqi > b.aqi ? a : b, { aqi: 0, name: '--' })
  const avg   = stations.length
    ? Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length)
    : '--'
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(15,15,25,0.88)', color: '#fff',
      display: 'flex', alignItems: 'center', gap: 24,
      padding: '10px 20px', fontSize: 14
    }}>
      <span style={{ fontWeight: 700, fontSize: 18, color: '#60a5fa' }}>🌬 Vayu</span>
      <span>Chennai Air Quality</span>
      <span style={{ marginLeft: 'auto' }}>Avg AQI: <strong>{avg}</strong></span>
      <span>Worst: <strong style={{ color: '#ff7e00' }}>{worst.name}</strong> ({Math.round(worst.aqi)})</span>
      <span style={{ color: '#aaa', fontSize: 12 }}>Auto-refresh: 5 min</span>
    </div>
  )
}

function ForecastPanel({ station, onClose }) {
  const [forecast, setForecast] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/forecast/${station.station_id}`)
      .then(r => {
        const data = r.data.forecast.map(f => ({
          hour:     `+${f.hour}h`,
          aqi:      f.aqi,
          category: f.category,
          color:    AQI_COLOR(f.aqi),
        }))
        setForecast(data)
        setLoading(false)
      })
  }, [station.station_id])

  const peak = forecast.reduce((a, b) => a.aqi > b.aqi ? a : b, { aqi: 0, hour: '' })

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 20, zIndex: 1000,
      background: 'rgba(15,15,25,0.95)', color: '#fff',
      borderRadius: 12, padding: '16px 20px', width: 420,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{station.station_name}</div>
          <div style={{ color: '#aaa', fontSize: 13 }}>{station.area} · 24hr LSTM Forecast</div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#aaa',
          fontSize: 20, cursor: 'pointer'
        }}>✕</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>
          Loading forecast...
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={forecast}>
              <XAxis
                dataKey="hour"
                tick={{ fill: '#aaa', fontSize: 11 }}
                interval={3}
              />
              <YAxis
                domain={[0, 500]}
                tick={{ fill: '#aaa', fontSize: 11 }}
                width={35}
              />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                formatter={(val, _, props) => [
                  `AQI ${val} — ${props.payload.category}`, ''
                ]}
              />
              {/* AQI threshold lines */}
              <ReferenceLine y={100} stroke="#ffff00" strokeDasharray="3 3" strokeOpacity={0.5}/>
              <ReferenceLine y={200} stroke="#ff7e00" strokeDasharray="3 3" strokeOpacity={0.5}/>
              <ReferenceLine y={300} stroke="#ff0000" strokeDasharray="3 3" strokeOpacity={0.5}/>
              <Line
                type="monotone"
                dataKey="aqi"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ fill: '#60a5fa', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div style={{
            display: 'flex', gap: 12, marginTop: 12, fontSize: 13
          }}>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '8px 12px'
            }}>
              <div style={{ color: '#aaa' }}>Peak AQI</div>
              <div style={{
                fontSize: 20, fontWeight: 700,
                color: AQI_COLOR(peak.aqi)
              }}>
                {Math.round(peak.aqi)}
              </div>
              <div style={{ color: '#aaa', fontSize: 12 }}>at {peak.hour}</div>
            </div>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '8px 12px'
            }}>
              <div style={{ color: '#aaa' }}>Now</div>
              <div style={{
                fontSize: 20, fontWeight: 700,
                color: AQI_COLOR(station.aqi)
              }}>
                {Math.round(station.aqi)}
              </div>
              <div style={{ color: '#aaa', fontSize: 12 }}>{station.category}</div>
            </div>
            <div style={{
              flex: 2, background: 'rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '8px 12px'
            }}>
              <div style={{ color: '#aaa', marginBottom: 4 }}>Trend</div>
              <div style={{ fontSize: 13 }}>
                {peak.aqi > station.aqi
                  ? '⚠️ AQI rising — avoid outdoor activity'
                  : '✅ AQI improving over next 24hrs'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  const [stations, setStations]         = useState([])
  const [selectedStation, setSelected] = useState(null)

  const load = () => {
    axios.get(`${API}/api/stations`)
      .then(r => setStations(r.data))
      .catch(e => console.error('Failed:', e))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <TopBar stations={stations} />

      <MapContainer
        center={[13.0827, 80.2707]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        {stations.map((s) => (
          <CircleMarker
            key={s.openaq_id}
            center={[s.lat, s.lon]}
            radius={Math.max(14, s.aqi / 12)}
            fillColor={AQI_COLOR(s.aqi)}
            color="#fff"
            weight={2}
            fillOpacity={0.85}
            eventHandlers={{
              click: () => setSelected({
                station_id:   s.id,
                station_name: s.name,
                area:         s.area,
                aqi:          s.aqi,
                category:     s.category,
              })
            }}
          >
            <Popup>
              <div style={{ fontSize: 14, minWidth: 160 }}>
                <strong>{s.name}</strong><br/>
                <span style={{
                  color: AQI_COLOR(s.aqi),
                  fontWeight: 700, fontSize: 18
                }}>
                  AQI {Math.round(s.aqi)}
                </span>
                {' — '}{s.category}<br/>
                PM2.5: {s.pm25} µg/m³<br/>
                Area: {s.area}<br/>
                <small style={{ color: '#888' }}>
                  {new Date(s.fetched_at).toLocaleTimeString()}
                </small><br/>
                <small style={{ color: '#60a5fa', cursor: 'pointer' }}
                  onClick={() => setSelected({
                    station_id:   s.id,
                    station_name: s.name,
                    area:         s.area,
                    aqi:          s.aqi,
                    category:     s.category,
                  })}>
                  📈 View 24hr forecast →
                </small>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <Legend />

      {selectedStation && (
        <ForecastPanel
          station={selectedStation}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}