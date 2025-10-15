import numpy as np
import pandas as pd
from scipy import stats
from datetime import datetime, timedelta

class RiskAnalyzer:
    def __init__(self):
        pass
    
    def calculate_var(self, returns, confidence_level=0.95):
        """Calculate Value at Risk"""
        return np.percentile(returns, (1 - confidence_level) * 100)
    
    def calculate_sharpe_ratio(self, returns, risk_free_rate=0.02):
        """Calculate Sharpe Ratio"""
        excess_returns = returns - risk_free_rate / 252
        return np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)
    
    def calculate_max_drawdown(self, returns):
        """Calculate maximum drawdown"""
        cumulative = (1 + returns).cumprod()
        peak = cumulative.expanding().max()
        drawdown = (cumulative - peak) / peak
        return drawdown.min()
    
    def analyze_portfolio_risk(self, holdings, portfolio_value):
        """Comprehensive portfolio risk analysis"""
        # Mock implementation - in production, use real portfolio data
        np.random.seed(42)
        mock_returns = np.random.normal(0.001, 0.02, 1000)  # Daily returns
        
        var_95 = self.calculate_var(mock_returns, 0.95)
        var_99 = self.calculate_var(mock_returns, 0.99)
        sharpe = self.calculate_sharpe_ratio(mock_returns)
        max_dd = self.calculate_max_drawdown(mock_returns)
        volatility = np.std(mock_returns) * np.sqrt(252)
        
        # Risk assessment
        if abs(max_dd) > 0.25:
            risk_level = "High"
        elif abs(max_dd) > 0.15:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        return {
            'value_at_risk_95': round(var_95 * portfolio_value, 2),
            'value_at_risk_99': round(var_99 * portfolio_value, 2),
            'sharpe_ratio': round(sharpe, 3),
            'max_drawdown': round(max_dd * 100, 2),
            'volatility': round(volatility * 100, 2),
            'risk_level': risk_level,
            'recommendations': self.generate_recommendations(risk_level, sharpe, max_dd)
        }
    
    def generate_recommendations(self, risk_level, sharpe, max_dd):
        """Generate risk management recommendations"""
        recommendations = []
        
        if risk_level == "High":
            recommendations.extend([
                "Consider reducing position sizes",
                "Implement strict stop-loss orders",
                "Diversify across uncorrelated assets",
                "Increase cash allocation"
            ])
        elif risk_level == "Medium":
            recommendations.extend([
                "Maintain current diversification strategy",
                "Monitor positions regularly",
                "Consider hedging strategies",
                "Rebalance portfolio quarterly"
            ])
        else:
            recommendations.extend([
                "Current risk level is appropriate",
                "Continue disciplined approach",
                "Consider slight increase in equity exposure",
                "Maintain emergency fund"
            ])
        
        if sharpe < 1:
            recommendations.append("Consider strategies to improve risk-adjusted returns")
        
        if abs(max_dd) > 20:
            recommendations.append("Implement drawdown control measures")
        
        return recommendations

# Global instance
risk_analyzer = RiskAnalyzer()