import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

const Stocks = () => {
    const [symbol, setSymbol] = useState('AAPL')
    const [stockData, setStockData] = useState(null)
    const [prediction, setPrediction] = useState(null)
    const [priceHistory, setPriceHistory] = useState([])
    const [realtimeAnalysis, setRealtimeAnalysis] = useState(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')

    const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA']

    useEffect(() => {
        fetchStockData()
    }, [symbol])

    const fetchStockData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const [stockResponse, predictionResponse, analysisResponse] = await Promise.all([
                axios.get(`http://localhost:8000/api/stocks/${symbol}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`http://localhost:8000/api/predictions/${symbol}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`http://localhost:8000/api/analysis/${symbol}/realtime`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])
            
            setStockData(stockResponse.data)
            setPrediction(predictionResponse.data)
            setPriceHistory(predictionResponse.data.price_history?.history || [])
            setRealtimeAnalysis(analysisResponse.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const renderTechnicalIndicators = () => {
        if (!prediction?.indicators) return null
        
        const { indicators } = prediction
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600">RSI</p>
                    <p className="text-lg font-bold">{indicators.rsi}</p>
                    <p className={`text-xs ${
                        indicators.rsi > 70 ? 'text-red-600' : 
                        indicators.rsi < 30 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                        {indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                    </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-600">MACD</p>
                    <p className="text-lg font-bold">{indicators.macd}</p>
                    <p className={`text-xs ${
                        indicators.macd > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {indicators.macd > 0 ? 'Bullish' : 'Bearish'}
                    </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-600">Stochastic</p>
                    <p className="text-lg font-bold">{indicators.stochastic}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-orange-600">Williams %R</p>
                    <p className="text-lg font-bold">{indicators.williams_r}</p>
                </div>
            </div>
        )
    }

    const renderPriceChart = () => {
        if (!priceHistory.length) return null

        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-4">Price Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={priceHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="price" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                        <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )
    }

    const renderVolumeChart = () => {
        if (!priceHistory.length) return null

        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-4">Volume Analysis</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={priceHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="volume" fill="#82ca9d" fillOpacity={0.6} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    const renderTechnicalRadarChart = () => {
        if (!prediction?.technical_analysis) return null

        const radarData = [
            { subject: 'Technical', A: prediction.technical_analysis.technical_score * 100, fullMark: 100 },
            { subject: 'Volume', A: prediction.technical_analysis.volume_analysis.score * 100, fullMark: 100 },
            { subject: 'Pattern', A: prediction.technical_analysis.pattern_analysis.score * 100, fullMark: 100 },
            { subject: 'Sentiment', A: (prediction.technical_analysis.sentiment_score + 1) * 50, fullMark: 100 },
            { subject: 'Momentum', A: Math.abs(prediction.change_percent) * 10, fullMark: 100 },
        ]

        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-4">Technical Analysis Radar</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis />
                        <Radar name="Analysis" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="loading-spinner"></div>
                <span className="ml-2 text-gray-600">Loading advanced analysis...</span>
            </div>
        )
    }

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Advanced Stock Analysis</h1>
            
            {/* Stock Selection */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                    {popularStocks.map(stock => (
                        <button
                            key={stock}
                            onClick={() => setSymbol(stock)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                symbol === stock 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {stock}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {['overview', 'charts', 'analysis', 'prediction'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium capitalize ${
                                activeTab === tab 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {stockData && prediction && (
                <div className="space-y-6">
                    {/* Stock Overview */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">{stockData.symbol}</h2>
                                        <p className="text-gray-600">{stockData.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold">${stockData.price}</p>
                                        <p className={`text-lg ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {stockData.change >= 0 ? '+' : ''}{stockData.change} ({stockData.change_percent}%)
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Volume</p>
                                        <p className="font-semibold">{stockData.volume?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Market Cap</p>
                                        <p className="font-semibold">
                                            ${(stockData.market_cap / 1e9).toFixed(2)}B
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">P/E Ratio</p>
                                        <p className="font-semibold">{stockData.pe_ratio}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Day Range</p>
                                        <p className="font-semibold">
                                            ${stockData.day_low} - ${stockData.day_high}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Real-time Analysis */}
                            {realtimeAnalysis && (
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-xl font-bold mb-4">Real-time Market Analysis</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-600">Trend</p>
                                            <p className="text-xl font-bold capitalize">{realtimeAnalysis.market_summary.trend}</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-600">Volatility</p>
                                            <p className="text-xl font-bold">{realtimeAnalysis.market_summary.volatility}</p>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <p className="text-sm text-purple-600">Momentum</p>
                                            <p className="text-xl font-bold">{realtimeAnalysis.market_summary.momentum}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Key Levels</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Support:</span>
                                                    <span className="text-green-600">${realtimeAnalysis.key_levels.immediate_support}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Resistance:</span>
                                                    <span className="text-red-600">${realtimeAnalysis.key_levels.immediate_resistance}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Trading Signals</h4>
                                            <ul className="text-sm space-y-1">
                                                {realtimeAnalysis.trading_signals.map((signal, index) => (
                                                    <li key={index} className="flex items-center">
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                        {signal}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Charts Tab */}
                    {activeTab === 'charts' && (
                        <div className="space-y-6">
                            {renderPriceChart()}
                            {renderVolumeChart()}
                            {renderTechnicalRadarChart()}
                            {renderTechnicalIndicators()}
                        </div>
                    )}

                    {/* Analysis Tab */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold mb-4">Technical Analysis Dashboard</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-3">Moving Averages</h4>
                                        {prediction.indicators?.moving_averages && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>SMA 20:</span>
                                                    <span className="font-semibold">${prediction.indicators.moving_averages.sma_20}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>EMA 20:</span>
                                                    <span className="font-semibold">${prediction.indicators.moving_averages.ema_20}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>SMA 50:</span>
                                                    <span className="font-semibold">${prediction.indicators.moving_averages.sma_50}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-3">Bollinger Bands</h4>
                                        {prediction.indicators?.bollinger_bands && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Upper Band:</span>
                                                    <span className="text-red-600 font-semibold">${prediction.indicators.bollinger_bands.upper}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Middle Band:</span>
                                                    <span className="font-semibold">${prediction.indicators.bollinger_bands.middle}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Lower Band:</span>
                                                    <span className="text-green-600 font-semibold">${prediction.indicators.bollinger_bands.lower}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Risk Assessment */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold mb-4">Risk Assessment</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                        <p className="text-sm text-yellow-600">Volatility Score</p>
                                        <p className="text-2xl font-bold">{Math.abs(prediction.change_percent * 10).toFixed(1)}</p>
                                        <p className="text-xs text-yellow-600">Medium Risk</p>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-600">Liquidity</p>
                                        <p className="text-2xl font-bold">High</p>
                                        <p className="text-xs text-blue-600">Easy to Trade</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-green-600">Trend Strength</p>
                                        <p className="text-2xl font-bold">
                                            {Math.abs(prediction.change_percent) > 5 ? 'Strong' : 
                                             Math.abs(prediction.change_percent) > 2 ? 'Moderate' : 'Weak'}
                                        </p>
                                        <p className="text-xs text-green-600">Based on Momentum</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Prediction Tab */}
                    {activeTab === 'prediction' && prediction && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold mb-4">AI Forecasting Analysis</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-600">Predicted Price</p>
                                        <p className="text-2xl font-bold">${prediction.predicted_price}</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-green-600">Confidence</p>
                                        <p className="text-2xl font-bold">{prediction.confidence}%</p>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <p className="text-sm text-purple-600">Expected Change</p>
                                        <p className={`text-2xl font-bold ${
                                            prediction.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {prediction.change_percent >= 0 ? '+' : ''}{prediction.change_percent}%
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                        <p className="text-sm text-orange-600">Direction</p>
                                        <p className={`text-2xl font-bold ${
                                            prediction.direction === 'up' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {prediction.direction === 'up' ? '📈 Bullish' : '📉 Bearish'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-3 text-lg">📊 Detailed AI Reasoning:</h4>
                                    <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                                        {prediction.reasoning}
                                    </div>
                                </div>
                            </div>

                            {/* Technical Analysis Breakdown */}
                            {prediction.technical_analysis && (
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-xl font-bold mb-4">Technical Analysis Breakdown</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold mb-2">Analysis Scores</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Technical Score</span>
                                                        <span className="text-sm font-semibold">
                                                            {(prediction.technical_analysis.technical_score * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-blue-600 h-2 rounded-full" 
                                                            style={{width: `${prediction.technical_analysis.technical_score * 100}%`}}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Volume Analysis</span>
                                                        <span className="text-sm font-semibold">
                                                            {(prediction.technical_analysis.volume_analysis.score * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-green-600 h-2 rounded-full" 
                                                            style={{width: `${prediction.technical_analysis.volume_analysis.score * 100}%`}}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Pattern Strength</span>
                                                        <span className="text-sm font-semibold">
                                                            {(prediction.technical_analysis.pattern_analysis.score * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-purple-600 h-2 rounded-full" 
                                                            style={{width: `${prediction.technical_analysis.pattern_analysis.score * 100}%`}}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Pattern Analysis</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Identified Pattern:</span>
                                                    <span className="font-semibold capitalize">
                                                        {prediction.technical_analysis.pattern_analysis.pattern}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Pattern Type:</span>
                                                    <span className={`font-semibold ${
                                                        prediction.technical_analysis.pattern_analysis.type === 'bullish' ? 'text-green-600' :
                                                        prediction.technical_analysis.pattern_analysis.type === 'bearish' ? 'text-red-600' : 'text-gray-600'
                                                    }`}>
                                                        {prediction.technical_analysis.pattern_analysis.type}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Volume Trend:</span>
                                                    <span className="font-semibold capitalize">
                                                        {prediction.technical_analysis.volume_analysis.trend}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Trading Recommendations */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold mb-4">Trading Recommendations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-2 text-green-600">✅ Potential Opportunities</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                Strong technical alignment with predicted direction
                                            </li>
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                Volume confirmation supporting price movement
                                            </li>
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                Clear chart pattern providing entry/exit signals
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2 text-red-600">⚠️ Risk Considerations</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                                Monitor key support/resistance levels
                                            </li>
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                                Consider market volatility in position sizing
                                            </li>
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                                Have stop-loss strategies in place
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default Stocks