import React, { useState, useEffect } from 'react'
import axios from 'axios'

const RiskAnalysis = () => {
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRiskData()
  }, [])

  const fetchRiskData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/risk/analysis', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRiskData(response.data)
    } catch (error) {
      console.error('Error fetching risk data:', error)
      // Mock risk data
      setRiskData({
        portfolio_value: 12500.00,
        risk_metrics: {
          value_at_risk_95: -250.00,
          value_at_risk_99: -450.00,
          sharpe_ratio: 1.25,
          max_drawdown: -12.5,
          volatility: 15.2,
          risk_level: "Medium",
          recommendations: [
            "Diversify across more sectors",
            "Consider adding bonds for stability",
            "Monitor high-volatility positions",
            "Rebalance portfolio quarterly"
          ]
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading risk analysis...</span>
      </div>
    )
  }

  if (!riskData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load risk analysis</p>
        <button 
          onClick={fetchRiskData}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  const { risk_metrics } = riskData

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Risk Analysis</h1>
      <p className="text-gray-600 mb-8">Comprehensive risk assessment using advanced metrics</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Portfolio Risk Metrics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Portfolio Value</span>
              <span className="font-semibold">${riskData.portfolio_value.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Value at Risk (95%)</span>
              <span className="font-semibold text-red-600">-${risk_metrics.value_at_risk_95}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Value at Risk (99%)</span>
              <span className="font-semibold text-red-600">-${risk_metrics.value_at_risk_99}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sharpe Ratio</span>
              <span className={`font-semibold ${
                risk_metrics.sharpe_ratio > 1 ? 'text-green-600' : 
                risk_metrics.sharpe_ratio > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {risk_metrics.sharpe_ratio}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Maximum Drawdown</span>
              <span className="font-semibold text-red-600">{risk_metrics.max_drawdown}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Volatility</span>
              <span className="font-semibold">{risk_metrics.volatility}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Risk Level</span>
              <span className={`font-semibold ${
                risk_metrics.risk_level === 'Low' ? 'text-green-600' :
                risk_metrics.risk_level === 'Medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {risk_metrics.risk_level}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Risk Management Recommendations</h3>
          
          <ul className="space-y-3">
            {risk_metrics.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Risk Level Guide</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Low Risk</span>
                <span className="text-green-600">Sharpe Ratio &gt; 1.5</span>
              </div>
              <div className="flex justify-between">
                <span>Medium Risk</span>
                <span className="text-yellow-600">Sharpe Ratio 0.5 - 1.5</span>
              </div>
              <div className="flex justify-between">
                <span>High Risk</span>
                <span className="text-red-600">Sharpe Ratio &lt; 0.5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">About Risk Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <p className="font-semibold">Value at Risk (VaR):</p>
            <p className="text-sm">Maximum potential loss over a specific time period at a given confidence level.</p>
          </div>
          <div>
            <p className="font-semibold">Sharpe Ratio:</p>
            <p className="text-sm">Measures risk-adjusted returns. Higher values indicate better performance.</p>
          </div>
          <div>
            <p className="font-semibold">Maximum Drawdown:</p>
            <p className="text-sm">Largest peak-to-trough decline in portfolio value.</p>
          </div>
          <div>
            <p className="font-semibold">Volatility:</p>
            <p className="text-sm">Statistical measure of the dispersion of returns for a given security or market index.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskAnalysis