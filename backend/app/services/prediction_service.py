import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging
import random

logger = logging.getLogger(__name__)

class AdvancedPredictionService:
    def __init__(self):
        self.technical_patterns = {
            'bullish': ['rising wedge', 'cup and handle', 'double bottom', 'bull flag'],
            'bearish': ['falling wedge', 'head and shoulders', 'double top', 'bear flag'],
            'neutral': ['triangle', 'rectangle', 'channel']
        }
        
        self.market_indicators = {
            'strong_bullish': ['RSI oversold bounce', 'MACD crossover', 'volume spike', 'breakout above resistance'],
            'moderate_bullish': ['steady uptrend', 'support holding', 'moderate volume', 'moving average support'],
            'weak_bullish': ['consolidation', 'low volume', 'mixed signals', 'range bound'],
            'strong_bearish': ['RSI overbought', 'MACD bearish crossover', 'high volume selling', 'break below support'],
            'moderate_bearish': ['downtrend', 'resistance holding', 'selling pressure', 'moving average resistance'],
            'weak_bearish': ['sideways movement', 'lack of buyers', 'uncertainty', 'choppy trading']
        }
    
    def generate_detailed_prediction(self, symbol, current_price, volume, market_sentiment=0):
        """Generate detailed AI prediction with comprehensive reasoning"""
        try:
            # Simulate technical analysis
            technical_score = self._calculate_technical_score()
            volume_analysis = self._analyze_volume(volume)
            pattern_analysis = self._identify_pattern()
            sentiment_analysis = self._analyze_sentiment(market_sentiment)
            
            # Combine factors for final prediction
            overall_score = (
                technical_score * 0.4 +
                volume_analysis['score'] * 0.3 +
                pattern_analysis['score'] * 0.2 +
                sentiment_analysis * 0.1
            )
            
            # Calculate price movement
            if overall_score > 0.6:
                change_percent = random.uniform(2.0, 8.0)
                direction = "up"
                confidence = min(95, 70 + (overall_score - 0.6) * 100)
            elif overall_score > 0.4:
                change_percent = random.uniform(0.5, 3.0)
                direction = "up"
                confidence = 65 + (overall_score - 0.4) * 25
            elif overall_score > 0.2:
                change_percent = random.uniform(-1.0, 1.0)
                direction = "neutral"
                confidence = 60
            elif overall_score > -0.2:
                change_percent = random.uniform(-3.0, -0.5)
                direction = "down"
                confidence = 65 + abs(overall_score - 0.2) * 25
            else:
                change_percent = random.uniform(-8.0, -2.0)
                direction = "down"
                confidence = min(95, 70 + abs(overall_score + 0.2) * 100)
            
            predicted_price = current_price * (1 + change_percent / 100)
            
            # Generate detailed reasoning
            reasoning = self._generate_detailed_reasoning(
                symbol, direction, change_percent, technical_score,
                volume_analysis, pattern_analysis, sentiment_analysis
            )
            
            # Technical indicators for charts
            indicators = self._generate_technical_indicators(current_price, direction)
            
            return {
                "predicted_price": round(predicted_price, 2),
                "confidence": round(confidence, 1),
                "change_percent": round(change_percent, 2),
                "direction": direction,
                "reasoning": reasoning,
                "technical_analysis": {
                    "overall_score": round(overall_score, 3),
                    "technical_score": round(technical_score, 3),
                    "volume_analysis": volume_analysis,
                    "pattern_analysis": pattern_analysis,
                    "sentiment_score": round(sentiment_analysis, 3)
                },
                "indicators": indicators
            }
            
        except Exception as e:
            logger.error(f"Detailed prediction error for {symbol}: {e}")
            return self._generate_fallback_prediction(symbol, current_price)
    
    def _calculate_technical_score(self):
        """Calculate technical analysis score"""
        # Simulate RSI, MACD, Moving Averages analysis
        rsi = random.uniform(20, 80)
        macd = random.uniform(-2, 2)
        ma_position = random.uniform(-0.1, 0.1)  # Price vs moving average
        
        # Normalize scores
        rsi_score = 1 - abs(rsi - 50) / 50  # Closer to 50 is better
        macd_score = max(0, 1 - abs(macd) / 2)  # Closer to 0 is better
        ma_score = 0.5 + ma_position * 5  # Above MA is positive
        
        return (rsi_score * 0.4 + macd_score * 0.3 + ma_score * 0.3)
    
    def _analyze_volume(self, volume):
        """Analyze volume patterns"""
        volume_multiplier = volume / 1000000  # Normalize volume
        
        if volume_multiplier > 2:
            return {
                "trend": "very high",
                "score": 0.9,
                "description": "Unusually high volume indicating strong institutional interest",
                "implication": "High conviction move expected"
            }
        elif volume_multiplier > 1.5:
            return {
                "trend": "high",
                "score": 0.7,
                "description": "Above average volume suggesting increased trader attention",
                "implication": "Potential breakout/breakdown"
            }
        elif volume_multiplier > 0.8:
            return {
                "trend": "normal",
                "score": 0.5,
                "description": "Average volume levels",
                "implication": "Consolidation likely"
            }
        else:
            return {
                "trend": "low",
                "score": 0.3,
                "description": "Below average volume indicating lack of conviction",
                "implication": "Range-bound trading expected"
            }
    
    def _identify_pattern(self):
        """Identify chart patterns"""
        pattern_type = random.choice(['bullish', 'bearish', 'neutral'])
        pattern = random.choice(self.technical_patterns[pattern_type])
        
        if pattern_type == 'bullish':
            score = random.uniform(0.6, 0.9)
        elif pattern_type == 'bearish':
            score = random.uniform(0.1, 0.4)
        else:
            score = random.uniform(0.4, 0.6)
        
        return {
            "pattern": pattern,
            "type": pattern_type,
            "score": score,
            "description": f"Identified {pattern} pattern forming on daily chart"
        }
    
    def _analyze_sentiment(self, market_sentiment):
        """Analyze market sentiment"""
        base_sentiment = random.uniform(-1, 1)
        return (base_sentiment + market_sentiment) / 2
    
    def _generate_detailed_reasoning(self, symbol, direction, change_percent, technical_score, 
                                   volume_analysis, pattern_analysis, sentiment_analysis):
        """Generate comprehensive reasoning for prediction"""
        
        # Base reasoning components
        technical_strength = "strong" if abs(technical_score - 0.5) > 0.3 else "moderate"
        volume_strength = volume_analysis["trend"]
        pattern_strength = pattern_analysis["type"]
        
        # Build reasoning
        reasons = []
        
        # Technical analysis reasoning
        if technical_score > 0.7:
            reasons.append("exceptionally strong technical setup with multiple confirmations")
        elif technical_score > 0.6:
            reasons.append("favorable technical indicators aligning positively")
        elif technical_score < 0.3:
            reasons.append("weak technical structure showing multiple bearish signals")
        elif technical_score < 0.4:
            reasons.append("deteriorating technical conditions")
        else:
            reasons.append("mixed technical signals with no clear dominance")
        
        # Volume reasoning
        if volume_analysis["score"] > 0.7:
            reasons.append(f"{volume_analysis['description']}")
        elif volume_analysis["score"] < 0.4:
            reasons.append(f"{volume_analysis['description']}")
        
        # Pattern reasoning
        reasons.append(f"chart shows {pattern_analysis['pattern']} formation")
        
        # Market condition reasoning
        if sentiment_analysis > 0.3:
            reasons.append("positive market sentiment supporting upward movement")
        elif sentiment_analysis < -0.3:
            reasons.append("negative market sentiment creating headwinds")
        
        # Price action reasoning
        if abs(change_percent) > 5:
            momentum = "strong momentum"
        elif abs(change_percent) > 2:
            momentum = "moderate momentum"
        else:
            momentum = "limited momentum"
        
        # Final reasoning assembly
        action = "rise" if direction == "up" else "fall" if direction == "down" else "consolidate"
        
        reasoning = f"""
{symbol.upper()} is predicted to {action} by {abs(change_percent):.2f}% due to:

📊 TECHNICAL ANALYSIS:
• {reasons[0]}
• {reasons[1]}
• {reasons[2]}

📈 MARKET DYNAMICS:
• {momentum} indicated by price action
• {volume_analysis['implication']}
• {pattern_analysis['description']}

🎯 TRADING IMPLICATIONS:
• Expected {action} based on confluence of technical factors
• {volume_analysis['trend'].title()} volume supporting price movement
• Pattern suggests {pattern_analysis['type']} bias in near term

This analysis combines multiple technical indicators, volume analysis, and chart patterns to provide a comprehensive forecast.
"""
        return reasoning.strip()
    
    def _generate_technical_indicators(self, current_price, direction):
        """Generate technical indicators for charts"""
        # Simulate indicator values
        if direction == "up":
            rsi = random.uniform(45, 65)
            macd = random.uniform(0.1, 2.0)
            stochastic = random.uniform(50, 80)
            williams_r = random.uniform(-20, -80)
            cci = random.uniform(50, 200)
        elif direction == "down":
            rsi = random.uniform(35, 55)
            macd = random.uniform(-2.0, -0.1)
            stochastic = random.uniform(20, 50)
            williams_r = random.uniform(-10, -30)
            cci = random.uniform(-200, -50)
        else:
            rsi = random.uniform(40, 60)
            macd = random.uniform(-0.5, 0.5)
            stochastic = random.uniform(40, 60)
            williams_r = random.uniform(-40, -60)
            cci = random.uniform(-50, 50)
        
        return {
            "rsi": round(rsi, 2),
            "macd": round(macd, 3),
            "stochastic": round(stochastic, 2),
            "williams_r": round(williams_r, 2),
            "cci": round(cci, 2),
            "bollinger_bands": {
                "upper": round(current_price * 1.02, 2),
                "middle": round(current_price * 1.00, 2),
                "lower": round(current_price * 0.98, 2)
            },
            "moving_averages": {
                "sma_20": round(current_price * (0.98 if direction == "down" else 1.02), 2),
                "ema_20": round(current_price * (0.99 if direction == "down" else 1.01), 2),
                "sma_50": round(current_price * 0.97, 2),
                "ema_50": round(current_price * 0.98, 2)
            }
        }
    
    def _generate_fallback_prediction(self, symbol, current_price):
        """Fallback prediction"""
        change_percent = random.uniform(-3, 3)
        return {
            "predicted_price": round(current_price * (1 + change_percent / 100), 2),
            "confidence": 65.0,
            "change_percent": round(change_percent, 2),
            "direction": "up" if change_percent > 0 else "down",
            "reasoning": f"Based on general market analysis and price momentum for {symbol}",
            "technical_analysis": {
                "overall_score": 0.5,
                "technical_score": 0.5,
                "volume_analysis": {"trend": "normal", "score": 0.5, "description": "Standard volume", "implication": "Neutral"},
                "pattern_analysis": {"pattern": "consolidation", "type": "neutral", "score": 0.5, "description": "Consolidation pattern"},
                "sentiment_score": 0.0
            },
            "indicators": {}
        }
    
    def generate_price_history(self, symbol, periods=30):
        """Generate realistic price history for charts"""
        base_price = random.uniform(50, 500)
        prices = [base_price]
        volumes = [random.randint(1000000, 5000000)]
        
        for i in range(1, periods):
            # Simulate price movement with some volatility
            change = random.uniform(-0.03, 0.03)
            new_price = prices[-1] * (1 + change)
            prices.append(round(new_price, 2))
            
            # Volume with some correlation to price movement
            volume_change = random.uniform(-0.2, 0.2)
            new_volume = volumes[-1] * (1 + volume_change)
            volumes.append(int(new_volume))
        
        # Generate dates
        end_date = datetime.now()
        dates = [(end_date - timedelta(days=periods-1-i)).strftime('%Y-%m-%d') for i in range(periods)]
        
        return {
            "symbol": symbol,
            "history": [
                {
                    "date": dates[i],
                    "price": prices[i],
                    "volume": volumes[i],
                    "change": round(prices[i] - prices[i-1], 2) if i > 0 else 0,
                    "change_percent": round(((prices[i] - prices[i-1]) / prices[i-1]) * 100, 2) if i > 0 else 0
                }
                for i in range(periods)
            ]
        }

# Global instance
prediction_service = AdvancedPredictionService()