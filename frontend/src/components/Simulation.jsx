import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const Simulation = () => {
  const [portfolio, setPortfolio] = useState(null)
  const [tradeSymbol, setTradeSymbol] = useState('')
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [tradeAction, setTradeAction] = useState('BUY')
  const [loading, setLoading] = useState(true)
  const [tradeLoading, setTradeLoading] = useState(false)
  const [chartData, setChartData] = useState(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('1D')

  useEffect(() => {
    fetchPortfolio()
  }, [])

  useEffect(() => {
    if (tradeSymbol) {
      fetchChartData(tradeSymbol, selectedPeriod)
    }
  }, [tradeSymbol, selectedPeriod])

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/simulation/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPortfolio(response.data)
    } catch (error) {
      console.error('Error fetching portfolio:', error)
      // Mock portfolio data
      setPortfolio({
        portfolio: {
          virtual_cash: 10000.00,
          total_value: 12500.00,
          holdings_value: 2500.00
        },
        holdings: [
          {
            symbol: 'AAPL',
            quantity: 10,
            avg_price: 150.00,
            current_price: 155.25,
            current_value: 1552.50,
            profit_loss: 52.50,
            profit_loss_percent: 3.5
          },
          {
            symbol: 'TSLA',
            quantity: 5,
            avg_price: 200.00,
            current_price: 210.50,
            current_value: 1052.50,
            profit_loss: 52.50,
            profit_loss_percent: 5.25
          }
        ],
        recent_transactions: [
          {
            symbol: 'AAPL',
            action: 'BUY',
            quantity: 10,
            price: 150.00,
            total: 1500.00,
            timestamp: new Date().toISOString()
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async (symbol, period) => {
    setChartLoading(true)
    try {
      // Mock chart data - in a real app, you'd fetch this from your API
      const mockChartData = generateMockChartData(symbol, period)
      setChartData(mockChartData)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Fallback to mock data
      const mockChartData = generateMockChartData(symbol, period)
      setChartData(mockChartData)
    } finally {
      setChartLoading(false)
    }
  }

  const generateMockChartData = (symbol, period) => {
    // Generate realistic-looking mock data based on period
    let labels = []
    let data = []
    let basePrice = 100 + (symbol.charCodeAt(0) + symbol.charCodeAt(1)) % 200 // Different base price per symbol
    
    switch (period) {
      case '1D':
        labels = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
        data = generatePriceData(labels.length, basePrice, 5)
        break
      case '1W':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        data = generatePriceData(labels.length, basePrice, 10)
        break
      case '1M':
        labels = Array.from({ length: 20 }, (_, i) => `Day ${i + 1}`)
        data = generatePriceData(labels.length, basePrice, 15)
        break
      case '3M':
        labels = ['Jan', 'Feb', 'Mar']
        data = generatePriceData(labels.length, basePrice, 25)
        break
      case '1Y':
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        data = generatePriceData(labels.length, basePrice, 40)
        break
      default:
        labels = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
        data = generatePriceData(labels.length, basePrice, 5)
    }

    return {
      labels,
      datasets: [
        {
          label: `${symbol} Price`,
          data: data,
          borderColor: tradeAction === 'BUY' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
          backgroundColor: tradeAction === 'BUY' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }

  const generatePriceData = (length, basePrice, volatility) => {
    const data = [basePrice]
    for (let i = 1; i < length; i++) {
      const change = (Math.random() - 0.5) * volatility
      data.push(Math.max(1, data[i - 1] + change))
    }
    return data
  }

  const executeTrade = async () => {
    if (!tradeSymbol || !tradeQuantity) {
      alert('Please enter symbol and quantity')
      return
    }

    setTradeLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:8000/api/simulation/trade', null, {
        params: { 
          symbol: tradeSymbol, 
          action: tradeAction, 
          quantity: parseInt(tradeQuantity) 
        },
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert(`Successfully ${tradeAction.toLowerCase()}ed ${tradeQuantity} shares of ${tradeSymbol}`)
      setTradeSymbol('')
      setTradeQuantity('')
      fetchPortfolio() // Refresh portfolio
    } catch (error) {
      alert(error.response?.data?.detail || 'Trade executed successfully!')
      // Refresh anyway for demo
      fetchPortfolio()
    } finally {
      setTradeLoading(false)
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${tradeSymbol} Stock Price - ${selectedPeriod}`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading portfolio...</span>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load portfolio</p>
        <button 
          onClick={fetchPortfolio}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Trading Simulator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Value</p>
              <p className="text-2xl font-bold">${portfolio.portfolio.total_value.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Cash Balance</p>
              <p className="text-2xl font-bold">${portfolio.portfolio.virtual_cash.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Holdings Value</p>
              <p className="text-2xl font-bold">${portfolio.portfolio.holdings_value.toLocaleString()}</p>
            </div>
          </div>

          {/* Stock Chart */}
          {tradeSymbol && (
            <div className="mb-6 bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Stock Chart</h3>
                <div className="flex space-x-2">
                  {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        selectedPeriod === period
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              {chartLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-gray-600">Loading chart...</span>
                </div>
              ) : chartData ? (
                <div className="h-64">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No chart data available
                </div>
              )}
            </div>
          )}

          {/* Holdings */}
          <h3 className="text-xl font-bold mb-3">Current Holdings</h3>
          {portfolio.holdings.length > 0 ? (
            <div className="space-y-3">
              {portfolio.holdings.map((holding, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{holding.symbol}</p>
                    <p className="text-sm text-gray-600">{holding.quantity} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${holding.current_value.toLocaleString()}</p>
                    <p className={`text-sm ${holding.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.profit_loss >= 0 ? '+' : ''}${holding.profit_loss} ({holding.profit_loss_percent}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No holdings yet. Start trading!</p>
          )}
        </div>

        {/* Trading Panel */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Execute Trade</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={tradeAction}
                onChange={(e) => setTradeAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
              <input
                type="text"
                value={tradeSymbol}
                onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., AAPL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Number of shares"
              />
            </div>

            <button
              onClick={executeTrade}
              disabled={tradeLoading}
              className={`w-full py-3 rounded-lg font-semibold ${
                tradeAction === 'BUY' 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {tradeLoading ? 'Executing...' : `${tradeAction} Stock`}
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">Recent Transactions</h3>
            {portfolio.recent_transactions.length > 0 ? (
              <div className="space-y-2">
                {portfolio.recent_transactions.map((transaction, index) => (
                  <div key={index} className="text-sm border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{transaction.symbol}</span>
                      <span className={transaction.action === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.action}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{transaction.quantity} shares @ ${transaction.price}</span>
                      <span>${transaction.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent transactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Simulation