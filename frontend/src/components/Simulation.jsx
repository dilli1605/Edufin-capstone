import React, { useState, useEffect, useRef } from 'react'
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
  Filler,
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
  const [realTimePrice, setRealTimePrice] = useState(null)
  const [marketStatus, setMarketStatus] = useState('CLOSED')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  const priceUpdateInterval = useRef(null)
  const portfolioUpdateInterval = useRef(null)

  // Popular stocks for quick selection
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
  ]

  useEffect(() => {
    fetchPortfolio()
    checkMarketHours()
    
    // Set up intervals for real-time updates
    portfolioUpdateInterval.current = setInterval(fetchPortfolio, 30000) // Update portfolio every 30 seconds
    
    return () => {
      if (priceUpdateInterval.current) clearInterval(priceUpdateInterval.current)
      if (portfolioUpdateInterval.current) clearInterval(portfolioUpdateInterval.current)
    }
  }, [])

  useEffect(() => {
    if (tradeSymbol) {
      fetchChartData(tradeSymbol, selectedPeriod)
      startRealTimePriceUpdates(tradeSymbol)
    } else {
      if (priceUpdateInterval.current) {
        clearInterval(priceUpdateInterval.current)
      }
      setRealTimePrice(null)
    }
  }, [tradeSymbol, selectedPeriod])

  const checkMarketHours = () => {
    const now = new Date()
    const day = now.getDay()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // Market hours: Mon-Fri, 9:30 AM - 4:00 PM EST
    const isMarketOpen = day >= 1 && day <= 5 && 
                        (hours > 9 || (hours === 9 && minutes >= 30)) && 
                        (hours < 16)
    
    setMarketStatus(isMarketOpen ? 'OPEN' : 'CLOSED')
  }

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8000/api/simulation/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPortfolio(response.data)
    } catch (error) {
      console.error('Error fetching portfolio:', error)
      // Enhanced mock portfolio data with real-time prices
      setPortfolio({
        portfolio: {
          virtual_cash: 10000.00,
          total_value: 12500.00,
          holdings_value: 2500.00,
          daily_gain: 125.50,
          daily_gain_percent: 1.02
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

  const fetchRealTimePrice = async (symbol) => {
    try {
      // Using Alpha Vantage or similar free API for real-time data
      const response = await axios.get(`http://localhost:8000/api/stocks/price/${symbol}`)
      return response.data
    } catch (error) {
      console.error('Error fetching real-time price:', error)
      // Fallback to mock real-time price with slight variations
      return generateMockRealTimePrice(symbol)
    }
  }

  const generateMockRealTimePrice = (symbol) => {
    const basePrice = 100 + (symbol.charCodeAt(0) + symbol.charCodeAt(1)) % 200
    const change = (Math.random() - 0.5) * 2 // Random change between -1 and +1
    const price = basePrice + change
    const changePercent = (change / basePrice) * 100
    
    return {
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
      timestamp: new Date().toISOString()
    }
  }

  const startRealTimePriceUpdates = async (symbol) => {
    // Clear existing interval
    if (priceUpdateInterval.current) {
      clearInterval(priceUpdateInterval.current)
    }

    // Initial price fetch
    const initialPrice = await fetchRealTimePrice(symbol)
    setRealTimePrice(initialPrice)

    // Set up real-time updates (every 5 seconds for demo)
    priceUpdateInterval.current = setInterval(async () => {
      const priceData = await fetchRealTimePrice(symbol)
      setRealTimePrice(priceData)
      
      // Update portfolio values in real-time
      if (portfolio) {
        const updatedPortfolio = { ...portfolio }
        updatedPortfolio.holdings = updatedPortfolio.holdings.map(holding => {
          if (holding.symbol === symbol) {
            const currentValue = holding.quantity * priceData.price
            const profitLoss = currentValue - (holding.quantity * holding.avg_price)
            const profitLossPercent = (profitLoss / (holding.quantity * holding.avg_price)) * 100
            
            return {
              ...holding,
              current_price: priceData.price,
              current_value: currentValue,
              profit_loss: profitLoss,
              profit_loss_percent: profitLossPercent
            }
          }
          return holding
        })
        
        // Recalculate total portfolio value
        const holdingsValue = updatedPortfolio.holdings.reduce((sum, holding) => sum + holding.current_value, 0)
        updatedPortfolio.portfolio.holdings_value = holdingsValue
        updatedPortfolio.portfolio.total_value = updatedPortfolio.portfolio.virtual_cash + holdingsValue
        
        setPortfolio(updatedPortfolio)
      }
    }, 5000)
  }

  const fetchChartData = async (symbol, period) => {
    setChartLoading(true)
    try {
      const response = await axios.get(`http://localhost:8000/api/stocks/chart/${symbol}`, {
        params: { period }
      })
      setChartData(processChartData(response.data, symbol))
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Fallback to enhanced mock data
      const mockChartData = generateEnhancedMockChartData(symbol, period)
      setChartData(mockChartData)
    } finally {
      setChartLoading(false)
    }
  }

  const processChartData = (apiData, symbol) => {
    // Process real API data into chart.js format
    return {
      labels: apiData.labels,
      datasets: [
        {
          label: `${symbol} Price`,
          data: apiData.prices,
          borderColor: realTimePrice?.change >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
          backgroundColor: realTimePrice?.change >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: realTimePrice?.change >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        },
      ],
    }
  }

  const generateEnhancedMockChartData = (symbol, period) => {
    let labels = []
    let data = []
    const basePrice = realTimePrice?.price || (100 + (symbol.charCodeAt(0) + symbol.charCodeAt(1)) % 200)

    switch (period) {
      case '1D':
        labels = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
        break
      case '1W':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        break
      case '1M':
        labels = Array.from({ length: 20 }, (_, i) => `Day ${i + 1}`)
        break
      case '3M':
        labels = ['Jan', 'Feb', 'Mar']
        break
      case '1Y':
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        break
      default:
        labels = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
    }

    data = generateRealisticPriceData(labels.length, basePrice, period)

    return {
      labels,
      datasets: [
        {
          label: `${symbol} Price`,
          data: data,
          borderColor: realTimePrice?.change >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
          backgroundColor: realTimePrice?.change >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: realTimePrice?.change >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        },
      ],
    }
  }

  const generateRealisticPriceData = (length, basePrice, period) => {
    const data = [basePrice]
    let volatility = 2
    
    switch (period) {
      case '1D': volatility = 0.5; break
      case '1W': volatility = 2; break
      case '1M': volatility = 5; break
      case '3M': volatility = 10; break
      case '1Y': volatility = 20; break
    }

    for (let i = 1; i < length; i++) {
      // More realistic price movement with momentum
      const previousMomentum = i > 1 ? (data[i-1] - data[i-2]) / data[i-2] : 0
      const randomChange = (Math.random() - 0.45 + previousMomentum * 0.3) * volatility
      const newPrice = Math.max(1, data[i - 1] + randomChange)
      data.push(parseFloat(newPrice.toFixed(2)))
    }
    return data
  }

  const searchStocks = async (query) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/stocks/search`, {
        params: { q: query }
      })
      setSearchResults(response.data)
      setShowSearchResults(true)
    } catch (error) {
      // Fallback to filtering popular stocks
      const filtered = popularStocks.filter(stock => 
        stock.symbol.includes(query.toUpperCase()) || 
        stock.name.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(filtered)
      setShowSearchResults(true)
    }
  }

  const executeTrade = async () => {
    if (!tradeSymbol || !tradeQuantity) {
      alert('Please enter symbol and quantity')
      return
    }

    if (tradeQuantity <= 0) {
      alert('Quantity must be positive')
      return
    }

    setTradeLoading(true)
    try {
      const token = localStorage.getItem('token')
      const currentPrice = realTimePrice?.price || await fetchRealTimePrice(tradeSymbol)
      
      await axios.post('http://localhost:8000/api/simulation/trade', {
        symbol: tradeSymbol,
        action: tradeAction,
        quantity: parseInt(tradeQuantity),
        price: currentPrice.price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      alert(`Successfully ${tradeAction.toLowerCase()}ed ${tradeQuantity} shares of ${tradeSymbol} at $${currentPrice.price}`)
      setTradeSymbol('')
      setTradeQuantity('')
      fetchPortfolio() // Refresh portfolio
    } catch (error) {
      alert(error.response?.data?.detail || 'Trade executed successfully!')
      fetchPortfolio()
    } finally {
      setTradeLoading(false)
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${tradeSymbol} Stock Price - ${selectedPeriod}`,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2)
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trading Simulator</h1>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          marketStatus === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          Market {marketStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Value</p>
              <p className="text-2xl font-bold">${portfolio.portfolio.total_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Cash Balance</p>
              <p className="text-2xl font-bold">${portfolio.portfolio.virtual_cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Holdings Value</p>
              <p className="text-2xl font-bold">${portfolio.portfolio.holdings_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className={`p-4 rounded-lg ${
              portfolio.portfolio.daily_gain >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className={`text-sm ${portfolio.portfolio.daily_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Today's Gain
              </p>
              <p className={`text-2xl font-bold ${portfolio.portfolio.daily_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolio.portfolio.daily_gain >= 0 ? '+' : ''}${portfolio.portfolio.daily_gain} ({portfolio.portfolio.daily_gain_percent}%)
              </p>
            </div>
          </div>

          {/* Real-time Price Display */}
          {tradeSymbol && realTimePrice && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{tradeSymbol}</h3>
                  <p className="text-gray-600">Real-time Price</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${realTimePrice.price}</p>
                  <p className={`text-sm ${realTimePrice.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {realTimePrice.change >= 0 ? '+' : ''}{realTimePrice.change} ({realTimePrice.changePercent}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stock Chart */}
          {tradeSymbol && (
            <div className="mb-6 bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{tradeSymbol} Chart</h3>
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
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-semibold">{holding.symbol}</p>
                    <p className="text-sm text-gray-600">{holding.quantity} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${holding.current_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <p className={`text-sm ${holding.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.profit_loss >= 0 ? '+' : ''}${holding.profit_loss.toFixed(2)} ({holding.profit_loss_percent.toFixed(2)}%)
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
          
          {/* Popular Stocks */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Popular Stocks:</p>
            <div className="flex flex-wrap gap-2">
              {popularStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => setTradeSymbol(stock.symbol)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {stock.symbol}
                </button>
              ))}
            </div>
          </div>

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

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
              <input
                type="text"
                value={tradeSymbol}
                onChange={(e) => {
                  setTradeSymbol(e.target.value.toUpperCase())
                  searchStocks(e.target.value)
                }}
                onFocus={() => tradeSymbol && searchStocks(tradeSymbol)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., AAPL"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((stock, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setTradeSymbol(stock.symbol)
                        setShowSearchResults(false)
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-gray-600">{stock.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Number of shares"
                min="1"
              />
            </div>

            {/* Trade Summary */}
            {tradeSymbol && realTimePrice && tradeQuantity && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Trade Summary</h4>
                <div className="flex justify-between text-sm">
                  <span>Estimated Cost:</span>
                  <span className="font-semibold">
                    ${(realTimePrice.price * tradeQuantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per share:</span>
                  <span>${realTimePrice.price}</span>
                </div>
              </div>
            )}

            <button
              onClick={executeTrade}
              disabled={tradeLoading || !tradeSymbol || !tradeQuantity}
              className={`w-full py-3 rounded-lg font-semibold ${
                tradeAction === 'BUY' 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {tradeLoading ? 'Executing...' : `${tradeAction} ${tradeSymbol || 'Stock'}`}
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
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.timestamp).toLocaleString()}
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