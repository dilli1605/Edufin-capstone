import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Navigation = ({ user, onLogout }) => {
  const location = useLocation()
  
  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-600'
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-2">📈</span>
              <div className="text-2xl font-bold text-blue-600">Edufin</div>
            </div>
            <div className="ml-10 flex space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/stocks" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/stocks')}`}
              >
                AI Forecasting
              </Link>
              <Link 
                to="/education" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/education')}`}
              >
                Learning
              </Link>
              <Link 
                to="/simulation" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/simulation')}`}
              >
                Trading Simulator
              </Link>
              <Link 
                to="/risk-analysis" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/risk-analysis')}`}
              >
                Risk Analysis
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 text-sm">Welcome, {user.username}</span>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation