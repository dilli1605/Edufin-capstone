import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Stocks from './components/Stocks'
import Education from './components/Education'
import Simulation from './components/Simulation'
import RiskAnalysis from './components/RiskAnalysis'
import Navigation from './components/Navigation'
import './styles.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    
    if (token && username) {
      setUser({ username, token })
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Edufin...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} onLogout={handleLogout} />
        
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/education" element={<Education />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/risk-analysis" element={<RiskAnalysis />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-xl mr-2">📈</span>
                <span className="text-lg font-semibold text-gray-800">Edufin</span>
              </div>
              <div className="text-sm text-gray-600">
                AI-Powered Financial Education Platform
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App