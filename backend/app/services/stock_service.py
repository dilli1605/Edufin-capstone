import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import requests
import logging
import numpy as np
import asyncio
import aiohttp
from typing import Dict, List, Optional
import time

logger = logging.getLogger(__name__)

class RealTimeStockService:
    def __init__(self):
        self.cache = {}
        self.cache_duration = timedelta(minutes=1)  # Shorter cache for real-time
        self.price_history_cache = {}
        self.real_time_subscriptions = {}
    
    async def get_real_time_price(self, symbol: str) -> Optional[Dict]:
        """Get real-time price with enhanced data"""
        symbol = symbol.upper()
        cache_key = f"price_{symbol}"
        
        # Check cache
        if cache_key in self.cache:
            data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < timedelta(seconds=30):  # 30-second cache
                return data
        
        try:
            stock = yf.Ticker(symbol)
            
            # Get both info and fast history
            info_task = asyncio.to_thread(lambda: stock.info)
            history_task = asyncio.to_thread(lambda: stock.history(period="1d", interval="1m"))
            
            info, history = await asyncio.gather(info_task, history_task)
            
            if history.empty:
                history = await asyncio.to_thread(lambda: stock.history(period="2d"))
                if history.empty:
                    return self._generate_mock_price(symbol)
            
            # Calculate current price and changes
            current_price = float(history['Close'].iloc[-1])
            
            if len(history) > 1:
                prev_close = float(history['Close'].iloc[-2])
            else:
                prev_close = info.get('previousClose', current_price)
            
            change = current_price - prev_close
            change_percent = (change / prev_close) * 100
            
            # Volume data
            current_volume = int(history['Volume'].iloc[-1]) if 'Volume' in history and not history.empty else 0
            avg_volume = info.get('averageVolume', current_volume)
            
            data = {
                "symbol": symbol,
                "price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "volume": current_volume,
                "avg_volume": avg_volume,
                "volume_ratio": round(current_volume / avg_volume, 2) if avg_volume > 0 else 1.0,
                "day_high": round(float(history['High'].max() if not history.empty else current_price), 2),
                "day_low": round(float(history['Low'].min() if not history.empty else current_price), 2),
                "open": round(float(history['Open'].iloc[-1] if not history.empty else current_price), 2),
                "prev_close": round(prev_close, 2),
                "timestamp": datetime.now().isoformat(),
                "source": "yfinance"
            }
            
            self.cache[cache_key] = (data, datetime.now())
            return data
            
        except Exception as e:
            logger.error(f"Error fetching real-time price for {symbol}: {e}")
            return self._generate_mock_price(symbol)
    
    def _generate_mock_price(self, symbol: str) -> Dict:
        """Generate realistic mock price data when API fails"""
        base_price = 100 + (sum(ord(c) for c in symbol) % 200)
        change = (np.random.random() - 0.5) * 4  # -2 to +2 change
        price = max(1, base_price + change)
        change_percent = (change / base_price) * 100
        
        return {
            "symbol": symbol,
            "price": round(price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "volume": np.random.randint(1000000, 50000000),
            "avg_volume": np.random.randint(2000000, 40000000),
            "volume_ratio": round(np.random.uniform(0.5, 2.0), 2),
            "day_high": round(price * 1.02, 2),
            "day_low": round(price * 0.98, 2),
            "open": round(price * 0.995, 2),
            "prev_close": round(price - change, 2),
            "timestamp": datetime.now().isoformat(),
            "source": "mock"
        }
    
    async def get_chart_data(self, symbol: str, period: str = "1mo") -> Dict:
        """Get enhanced chart data for different time periods"""
        cache_key = f"chart_{symbol}_{period}"
        
        if cache_key in self.price_history_cache:
            data, timestamp = self.price_history_cache[cache_key]
            if datetime.now() - timestamp < self.cache_duration:
                return data
        
        try:
            stock = yf.Ticker(symbol.upper())
            
            # Map frontend periods to yfinance periods
            period_map = {
                "1D": "1d", "1W": "1wk", "1M": "1mo", 
                "3M": "3mo", "1Y": "1y"
            }
            
            yf_period = period_map.get(period, "1mo")
            interval = "1m" if period == "1D" else "1d"
            
            history = await asyncio.to_thread(
                lambda: stock.history(period=yf_period, interval=interval)
            )
            
            if history.empty:
                return self._generate_mock_chart_data(symbol, period)
            
            # Process chart data
            labels = []
            prices = []
            
            for index, row in history.iterrows():
                if period == "1D":
                    labels.append(index.strftime('%H:%M'))
                else:
                    labels.append(index.strftime('%Y-%m-%d'))
                
                prices.append(round(float(row['Close']), 2))
            
            data = {
                "symbol": symbol,
                "period": period,
                "labels": labels,
                "prices": prices,
                "timestamp": datetime.now().isoformat()
            }
            
            self.price_history_cache[cache_key] = (data, datetime.now())
            return data
            
        except Exception as e:
            logger.error(f"Error fetching chart data for {symbol}: {e}")
            return self._generate_mock_chart_data(symbol, period)
    
    def _generate_mock_chart_data(self, symbol: str, period: str) -> Dict:
        """Generate realistic mock chart data"""
        base_price = 100 + (sum(ord(c) for c in symbol) % 200)
        
        period_configs = {
            "1D": {"points": 78, "volatility": 0.5},  # 6.5 hours * 12 points/hour
            "1W": {"points": 5, "volatility": 2},
            "1M": {"points": 20, "volatility": 5},
            "3M": {"points": 12, "volatility": 8},
            "1Y": {"points": 12, "volatility": 15}
        }
        
        config = period_configs.get(period, period_configs["1M"])
        labels = self._generate_labels(period, config["points"])
        prices = self._generate_realistic_prices(config["points"], base_price, config["volatility"])
        
        return {
            "symbol": symbol,
            "period": period,
            "labels": labels,
            "prices": prices,
            "timestamp": datetime.now().isoformat(),
            "source": "mock"
        }
    
    def _generate_labels(self, period: str, points: int) -> List[str]:
        """Generate labels for different time periods"""
        if period == "1D":
            return [f"{9 + i//12}:{str((i % 12) * 5).zfill(2)}" for i in range(points)]
        elif period == "1W":
            return ["Mon", "Tue", "Wed", "Thu", "Fri"]
        elif period == "1M":
            return [f"Day {i+1}" for i in range(points)]
        elif period == "3M":
            return ["Jan", "Feb", "Mar"]
        elif period == "1Y":
            return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return [f"Point {i+1}" for i in range(points)]
    
    def _generate_realistic_prices(self, length: int, base_price: float, volatility: float) -> List[float]:
        """Generate realistic price data with momentum"""
        prices = [base_price]
        momentum = 0
        
        for i in range(1, length):
            # Incorporate previous momentum
            random_change = (np.random.random() - 0.5 + momentum * 0.3) * volatility
            new_price = max(0.01, prices[-1] + random_change)
            
            # Update momentum (dampened)
            momentum = momentum * 0.7 + random_change * 0.3
            
            prices.append(round(new_price, 2))
        
        return prices
    
    async def search_stocks(self, query: str) -> List[Dict]:
        """Enhanced stock search with real data"""
        if len(query) < 2:
            return []
        
        # Common stocks database
        common_stocks = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla Inc.',
            'AMZN': 'Amazon.com Inc.',
            'META': 'Meta Platforms Inc.',
            'NVDA': 'NVIDIA Corporation',
            'JPM': 'JPMorgan Chase & Co.',
            'JNJ': 'Johnson & Johnson',
            'V': 'Visa Inc.',
            'WMT': 'Walmart Inc.',
            'DIS': 'The Walt Disney Company',
            'NFLX': 'Netflix Inc.',
            'AMD': 'Advanced Micro Devices Inc.',
            'INTC': 'Intel Corporation',
            'CSCO': 'Cisco Systems Inc.',
            'PEP': 'PepsiCo Inc.',
            'KO': 'The Coca-Cola Company',
            'XOM': 'Exxon Mobil Corporation',
            'BAC': 'Bank of America Corporation',
            'SPY': 'SPDR S&P 500 ETF',
            'QQQ': 'Invesco QQQ Trust'
        }
        
        query = query.upper()
        results = []
        
        for symbol, name in common_stocks.items():
            if query in symbol or query in name.upper():
                try:
                    price_data = await self.get_real_time_price(symbol)
                    if price_data:
                        results.append({
                            "symbol": symbol,
                            "name": name,
                            "price": price_data["price"],
                            "change": price_data["change"],
                            "change_percent": price_data["change_percent"]
                        })
                    if len(results) >= 8:  # Limit results
                        break
                except Exception as e:
                    logger.error(f"Error in search for {symbol}: {e}")
                    continue
        
        return results
    
    async def get_market_status(self) -> Dict:
        """Check if US market is open"""
        now = datetime.now()
        # Simple check for NYSE hours (9:30 AM - 4:00 PM EST, Mon-Fri)
        # Note: This is simplified - in production, use proper market calendar
        is_open = (1 <= now.weekday() <= 5 and 
                  ((now.hour == 9 and now.minute >= 30) or 
                   (10 <= now.hour < 16)))
        
        return {
            "is_open": is_open,
            "status": "OPEN" if is_open else "CLOSED",
            "timestamp": now.isoformat(),
            "next_open": self._get_next_market_open(now)
        }
    
    def _get_next_market_open(self, current_time: datetime) -> str:
        """Calculate next market open time"""
        if current_time.weekday() >= 5:  # Weekend
            days_until_monday = (7 - current_time.weekday()) % 7
            next_open = current_time + timedelta(days=days_until_monday)
            next_open = next_open.replace(hour=9, minute=30, second=0, microsecond=0)
        else:
            if current_time.hour >= 16:  # After market close
                next_open = current_time + timedelta(days=1)
                next_open = next_open.replace(hour=9, minute=30, second=0, microsecond=0)
            else:  # Before market open
                next_open = current_time.replace(hour=9, minute=30, second=0, microsecond=0)
        
        return next_open.isoformat()

# Global instance
real_time_stock_service = RealTimeStockService()