import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [marketData, setMarketData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchMarketData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      // Set mock data on error
      setDashboardData({
        user: { username: 'demo', learning_points: 450, current_level: 2 },
        portfolio: { total_value: 12500, virtual_cash: 10000, holdings_value: 2500 },
        learning_progress: { completed_modules: 2, total_modules: 4, progress_percent: 50 },
        market_overview: { total_symbols: 7 }
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMarketData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/market/overview', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMarketData(response.data.market_data.slice(0, 6))
    } catch (error) {
      console.error('Error fetching market data:', error)
      // Mock market data
      setMarketData([
        { symbol: 'AAPL', price: 150.25, change_percent: 1.5 },
        { symbol: 'GOOGL', price: 135.75, change_percent: 0.8 },
        { symbol: 'MSFT', price: 340.50, change_percent: 2.1 },
        { symbol: 'TSLA', price: 210.25, change_percent: -0.5 },
        { symbol: 'AMZN', price: 175.80, change_percent: 1.2 },
        { symbol: 'META', price: 485.60, change_percent: 0.9 }
      ])
    }
  }

  const performanceData = [
    { date: 'Jan', value: 10000 },
    { date: 'Feb', value: 10500 },
    { date: 'Mar', value: 11000 },
    { date: 'Apr', value: 11500 },
    { date: 'May', value: 12000 },
    { date: 'Jun', value: 12500 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load dashboard data</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your financial overview.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Portfolio Value</h3>
          <p className="text-3xl font-bold text-green-600">
            ${dashboardData.portfolio?.total_value?.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Cash Balance</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${dashboardData.portfolio?.virtual_cash?.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Learning Progress</h3>
          <p className="text-3xl font-bold text-purple-600">
            {dashboardData.learning_progress?.completed_modules}/{dashboardData.learning_progress?.total_modules}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Learning Points</h3>
          <p className="text-3xl font-bold text-orange-600">
            {dashboardData.user?.learning_points}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Portfolio Performance */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Portfolio Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Market Overview */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Market Overview</h2>
          <div className="space-y-3">
            {marketData.map((stock, index) => (
              <div key={index} className="flex justify-between items-center p-3 border-b">
                <div>
                  <p className="font-semibold">{stock.symbol}</p>
                  <p className="text-sm text-gray-600">${stock.price}</p>
                </div>
                <p className={`font-semibold ${
                  stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-3">Stock Analysis</h3>
          <p className="text-blue-600 mb-4">Get AI-powered predictions and technical analysis</p>
          <a href="/stocks" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block">
            Explore Stocks
          </a>
        </div>
        
        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <h3 className="text-xl font-semibold text-green-800 mb-3">Learn Trading</h3>
          <p className="text-green-600 mb-4">Master stock market concepts with courses</p>
          <a href="/education" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-block">
            Start Learning
          </a>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
          <h3 className="text-xl font-semibold text-purple-800 mb-3">Practice Trading</h3>
          <p className="text-purple-600 mb-4">Test strategies with virtual money</p>
          <a href="/simulation" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 inline-block">
            Start Trading
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard