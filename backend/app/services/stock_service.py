import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import requests
import logging
import numpy as np

logger = logging.getLogger(__name__)

class StockService:
    def __init__(self):
        self.cache = {}
        self.cache_duration = timedelta(minutes=5)
    
    def get_stock_data(self, symbol):
        """Get real-time stock data from Yahoo Finance"""
        symbol = symbol.upper()
        now = datetime.now()
        
        if symbol in self.cache:
            data, timestamp = self.cache[symbol]
            if now - timestamp < self.cache_duration:
                return data
        
        try:
            stock = yf.Ticker(symbol)
            info = stock.info
            history = stock.history(period="1d", interval="1m")
            
            if history.empty:
                # Try with longer period
                history = stock.history(period="5d")
                if history.empty:
                    return None
            
            # Get current price from the latest data
            current_price = float(history['Close'].iloc[-1])
            
            # Calculate change from previous close
            if len(history) > 1:
                prev_close = float(history['Close'].iloc[-2])
            else:
                prev_close = info.get('previousClose', current_price)
            
            change = current_price - prev_close
            change_percent = (change / prev_close) * 100
            
            # Get additional info
            market_cap = info.get('marketCap')
            volume = info.get('volume', history['Volume'].iloc[-1] if 'Volume' in history else 0)
            pe_ratio = info.get('trailingPE')
            day_high = info.get('dayHigh', history['High'].max() if len(history) > 0 else current_price)
            day_low = info.get('dayLow', history['Low'].min() if len(history) > 0 else current_price)
            
            data = {
                "symbol": symbol,
                "name": info.get('longName', info.get('shortName', symbol)),
                "price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "volume": int(volume),
                "market_cap": market_cap,
                "pe_ratio": round(pe_ratio, 2) if pe_ratio else None,
                "day_high": round(day_high, 2),
                "day_low": round(day_low, 2),
                "prev_close": round(prev_close, 2),
                "open": info.get('open', history['Open'].iloc[-1] if len(history) > 0 else current_price),
                "sector": info.get('sector', 'N/A'),
                "industry": info.get('industry', 'N/A'),
                "timestamp": datetime.now().isoformat()
            }
            
            self.cache[symbol] = (data, now)
            return data
            
        except Exception as e:
            logger.error(f"Error fetching stock data for {symbol}: {e}")
            return None
    
    def get_stock_history(self, symbol, period="1mo"):
        """Get historical stock data"""
        try:
            stock = yf.Ticker(symbol.upper())
            data = stock.history(period=period)
            
            if data.empty:
                return None
            
            history = []
            for index, row in data.iterrows():
                history.append({
                    "date": index.strftime('%Y-%m-%d'),
                    "open": round(float(row['Open']), 2),
                    "high": round(float(row['High']), 2),
                    "low": round(float(row['Low']), 2),
                    "close": round(float(row['Close']), 2),
                    "volume": int(row['Volume']) if 'Volume' in row else 0,
                    "timestamp": index.isoformat()
                })
            
            return history
        except Exception as e:
            logger.error(f"Error fetching history for {symbol}: {e}")
            return None
    
    def get_technical_indicators(self, symbol, period="3mo"):
        """Calculate technical indicators"""
        try:
            stock = yf.Ticker(symbol.upper())
            data = stock.history(period=period)
            
            if data.empty or len(data) < 20:
                return None
            
            # Calculate indicators
            closes = data['Close']
            
            # Moving Averages
            sma_20 = closes.rolling(window=20).mean().iloc[-1]
            sma_50 = closes.rolling(window=50).mean().iloc[-1]
            ema_20 = closes.ewm(span=20).mean().iloc[-1]
            
            # RSI
            delta = closes.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs)).iloc[-1]
            
            # MACD
            exp1 = closes.ewm(span=12).mean()
            exp2 = closes.ewm(span=26).mean()
            macd = exp1 - exp2
            macd_signal = macd.ewm(span=9).mean()
            macd_histogram = macd - macd_signal
            
            # Bollinger Bands
            bb_middle = closes.rolling(window=20).mean()
            bb_std = closes.rolling(window=20).std()
            bb_upper = bb_middle + (bb_std * 2)
            bb_lower = bb_middle - (bb_std * 2)
            
            # Volume
            volume_sma = data['Volume'].rolling(window=20).mean().iloc[-1]
            current_volume = data['Volume'].iloc[-1]
            
            return {
                "sma_20": round(float(sma_20), 2),
                "sma_50": round(float(sma_50), 2),
                "ema_20": round(float(ema_20), 2),
                "rsi": round(float(rsi), 2),
                "macd": round(float(macd.iloc[-1]), 3),
                "macd_signal": round(float(macd_signal.iloc[-1]), 3),
                "macd_histogram": round(float(macd_histogram.iloc[-1]), 3),
                "bb_upper": round(float(bb_upper.iloc[-1]), 2),
                "bb_middle": round(float(bb_middle.iloc[-1]), 2),
                "bb_lower": round(float(bb_lower.iloc[-1]), 2),
                "volume": int(current_volume),
                "volume_sma": int(volume_sma),
                "volume_ratio": round(current_volume / volume_sma, 2) if volume_sma > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error calculating indicators for {symbol}: {e}")
            return None
    
    def get_multiple_stocks(self, symbols):
        """Get data for multiple stocks"""
        results = []
        for symbol in symbols:
            data = self.get_stock_data(symbol)
            if data:
                results.append(data)
        return results
    
    def search_stocks(self, query):
        """Search for stocks by symbol or name"""
        # Common stocks for demo - in production, use a proper stock search API
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
            'BAC': 'Bank of America Corporation'
        }
        
        query = query.upper()
        results = []
        
        for symbol, name in common_stocks.items():
            if query in symbol or query in name.upper():
                stock_data = self.get_stock_data(symbol)
                if stock_data:
                    results.append(stock_data)
                if len(results) >= 10:  # Limit results
                    break
        
        return results

stock_service = StockService()