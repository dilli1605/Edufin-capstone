import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os

class StockPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_dir = "saved_models"
        os.makedirs(self.model_dir, exist_ok=True)
    
    def create_features(self, data):
        """Create technical indicators as features"""
        df = data.copy()
        
        # Simple moving averages
        df['SMA_10'] = df['close'].rolling(window=10).mean()
        df['SMA_30'] = df['close'].rolling(window=30).mean()
        
        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD
        exp1 = df['close'].ewm(span=12).mean()
        exp2 = df['close'].ewm(span=26).mean()
        df['MACD'] = exp1 - exp2
        df['MACD_Signal'] = df['MACD'].ewm(span=9).mean()
        
        return df

# Example usage
if __name__ == "__main__":
    predictor = StockPredictor()
    print("✅ Stock predictor class created successfully!")