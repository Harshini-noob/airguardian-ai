import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './design.css'
import Landing              from './Landing'
import App                  from './App'
import Advisories           from './Advisories'
import Compare              from './Compare'
import EnforcementDashboard from './EnforcementDashboard'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/dashboard"   element={<App />} />
        <Route path="/advisories"  element={<Advisories />} />
        <Route path="/compare"     element={<Compare />} />
        <Route path="/enforcement" element={<EnforcementDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
