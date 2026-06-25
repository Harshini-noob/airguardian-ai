import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import './App.css'

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
      padding: '12px 16px', fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <strong style={{ display: 'block', marginBottom: 8 }}>
        AQI — India CPCB
      </strong>
      {levels.map(l => (
        <div key={l.label} style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: 3, background: l.color,
            border: '1px solid #ccc'
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
      background: 'rgba(15,15,25,0.85)', color: '#fff',
      display: 'flex', alignItems: 'center', gap: 24,
      padding: '10px 20px', fontSize: 14
    }}>
      <span style={{ fontWeight: 700, fontSize: 18, color: '#60a5fa' }}>
        🌬 Vayu
      </span>
      <span>Chennai Air Quality</span>
      <span style={{ marginLeft: 'auto' }}>
        Avg AQI: <strong>{avg}</strong>
      </span>
      <span>
        Worst: <strong style={{ color: '#ff7e00' }}>{worst.name}</strong>
        {' '}({Math.round(worst.aqi)})
      </span>
      <span style={{ color: '#aaa', fontSize: 12 }}>
        Auto-refresh: 5 min
      </span>
    </div>
  )
}

export default function App() {
  const [stations, setStations] = useState([])

  const load = () => {
    axios.get('http://localhost:8000/api/stations')
      .then(r => setStations(r.data))
      .catch(e => console.error('Failed to fetch stations:', e))
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
          >
            <Popup>
              <div style={{ fontSize: 14, minWidth: 160 }}>
                <strong>{s.name}</strong><br/>
                <span style={{
                  color: AQI_COLOR(s.aqi),
                  fontWeight: 700,
                  fontSize: 18
                }}>
                  AQI {Math.round(s.aqi)}
                </span>
                {' — '}{s.category}<br/>
                PM2.5: {s.pm25} µg/m³<br/>
                Area: {s.area}<br/>
                <small style={{ color: '#888' }}>
                  {new Date(s.fetched_at).toLocaleTimeString()}
                </small>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <Legend />
    </div>
  )
}