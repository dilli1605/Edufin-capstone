import requests
import logging
from textblob import TextBlob
import random
from datetime import datetime

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        self.positive_words = {
            'bullish', 'growth', 'profit', 'gain', 'positive', 'strong', 'buy', 'outperform',
            'earnings', 'beat', 'surge', 'rally', 'optimistic', 'recovery', 'upside', 'strong',
            'robust', 'impressive', 'success', 'win', 'opportunity', 'potential'
        }
        self.negative_words = {
            'bearish', 'loss', 'decline', 'negative', 'weak', 'sell', 'underperform',
            'miss', 'drop', 'fall', 'crash', 'pessimistic', 'downturn', 'risk', 'weak',
            'disappoint', 'concern', 'warning', 'trouble', 'problem', 'challenge'
        }
    
    def analyze_text(self, text):
        """Analyze sentiment of text using TextBlob and keyword analysis"""
        if not text:
            return {'sentiment': 'neutral', 'score': 0.5, 'polarity': 0, 'subjectivity': 0}
        
        try:
            # TextBlob analysis
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # Keyword analysis
            text_lower = text.lower()
            pos_count = sum(1 for word in self.positive_words if word in text_lower)
            neg_count = sum(1 for word in self.negative_words if word in text_lower)
            
            # Combined score (weighted average)
            keyword_score = (pos_count - neg_count) / max(1, (pos_count + neg_count))
            combined_score = (polarity + keyword_score) / 2
            
            # Determine sentiment
            if combined_score > 0.1:
                sentiment = 'positive'
            elif combined_score < -0.1:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            return {
                'sentiment': sentiment,
                'score': abs(combined_score),
                'polarity': round(polarity, 3),
                'subjectivity': round(subjectivity, 3),
                'positive_words': pos_count,
                'negative_words': neg_count
            }
            
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {'sentiment': 'neutral', 'score': 0.5, 'polarity': 0, 'subjectivity': 0}
    
    def analyze_news_sentiment(self, symbol):
        """Analyze sentiment for a stock symbol with mock news data"""
        try:
            # Mock news data - in production, integrate with NewsAPI
            mock_news_items = self._generate_mock_news(symbol)
            
            sentiment_results = []
            overall_sentiment_score = 0
            
            for headline in mock_news_items:
                analysis = self.analyze_text(headline)
                sentiment_results.append({
                    'headline': headline,
                    'sentiment': analysis['sentiment'],
                    'confidence': round(analysis['score'], 3),
                    'polarity': analysis['polarity']
                })
                
                # Weight the sentiment score
                if analysis['sentiment'] == 'positive':
                    overall_sentiment_score += analysis['score']
                elif analysis['sentiment'] == 'negative':
                    overall_sentiment_score -= analysis['score']
            
            # Normalize overall sentiment
            if sentiment_results:
                overall_sentiment_score /= len(sentiment_results)
            
            # Determine overall sentiment
            if overall_sentiment_score > 0.1:
                overall_sentiment = 'positive'
            elif overall_sentiment_score < -0.1:
                overall_sentiment = 'negative'
            else:
                overall_sentiment = 'neutral'
            
            return {
                'symbol': symbol,
                'overall_sentiment': overall_sentiment,
                'sentiment_score': round(overall_sentiment_score, 3),
                'news_count': len(sentiment_results),
                'news_items': sentiment_results,
                'analyzed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"News sentiment analysis error for {symbol}: {e}")
            return self._generate_fallback_sentiment(symbol)
    
    def _generate_mock_news(self, symbol):
        """Generate realistic mock news headlines"""
        templates = {
            'positive': [
                f"{symbol} shows strong quarterly earnings growth",
                f"Analysts remain bullish on {symbol} future prospects",
                f"{symbol} announces new product launch to drive growth",
                f"Market reacts positively to {symbol} leadership changes",
                f"{symbol} expands into new markets with promising outlook",
                f"Institutional investors increasing positions in {symbol}",
                f"{symbol} declares higher dividend than expected"
            ],
            'negative': [
                f"{symbol} faces regulatory challenges in key markets",
                f"Competition intensifies for {symbol} in core segments",
                f"{symbol} reports weaker than expected guidance",
                f"Supply chain issues affecting {symbol} production",
                f"Analysts downgrade {symbol} on valuation concerns",
                f"{symbol} faces lawsuit over business practices"
            ],
            'neutral': [
                f"{symbol} holds annual shareholder meeting",
                f"{symbol} appoints new board member",
                f"Market watches {symbol} technical levels closely",
                f"{symbol} to present at investor conference",
                f"Trading volume normalizes for {symbol} after earnings"
            ]
        }
        
        # Mix of sentiment in news
        news_mix = (
            ['positive'] * 3 + ['negative'] * 2 + ['neutral'] * 2 +
            ['positive'] * 2 + ['negative'] * 1 + ['neutral'] * 1
        )
        
        selected_news = []
        for sentiment in news_mix[:8]:  # Get 8 news items
            template = random.choice(templates[sentiment])
            selected_news.append(template)
        
        return selected_news
    
    def _generate_fallback_sentiment(self, symbol):
        """Fallback sentiment analysis"""
        return {
            'symbol': symbol,
            'overall_sentiment': 'neutral',
            'sentiment_score': 0.0,
            'news_count': 0,
            'news_items': [],
            'analyzed_at': datetime.now().isoformat()
        }

# Global instance
sentiment_analyzer = SentimentAnalyzer()