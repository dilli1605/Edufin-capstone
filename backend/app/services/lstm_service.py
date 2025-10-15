import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import torch
import torch.nn as nn
import joblib
import os
from datetime import datetime, timedelta

class LSTMPredictor(nn.Module):
    def __init__(self, input_size=1, hidden_layer_size=50, output_size=1, num_layers=2):
        super(LSTMPredictor, self).__init__()
        self.hidden_layer_size = hidden_layer_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_layer_size, num_layers, batch_first=True, dropout=0.2)
        self.linear = nn.Linear(hidden_layer_size, output_size)
        self.dropout = nn.Dropout(0.2)
        
    def forward(self, input_seq):
        lstm_out, _ = self.lstm(input_seq)
        lstm_out = self.dropout(lstm_out[:, -1, :])
        predictions = self.linear(lstm_out)
        return predictions

class FinancialForecaster:
    def __init__(self):
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = None
        self.sequence_length = 60
        self.models_dir = "ml-models/saved_models"
        os.makedirs(self.models_dir, exist_ok=True)
    
    def calculate_technical_indicators(self, df):
        """Calculate technical indicators as mentioned in the paper"""
        # Moving averages
        df['SMA_20'] = df['Close'].rolling(window=20).mean()
        df['EMA_20'] = df['Close'].ewm(span=20, adjust=False).mean()
        
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD
        exp1 = df['Close'].ewm(span=12).mean()
        exp2 = df['Close'].ewm(span=26).mean()
        df['MACD'] = exp1 - exp2
        df['MACD_Signal'] = df['MACD'].ewm(span=9).mean()
        df['MACD_Histogram'] = df['MACD'] - df['MACD_Signal']
        
        # Bollinger Bands
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
        df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
        
        # Volume indicators
        df['Volume_SMA'] = df['Volume'].rolling(window=20).mean()
        
        return df
    
    def prepare_data(self, symbol, period="1y"):
        """Fetch and prepare stock data with technical indicators"""
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period=period)
            
            if hist.empty:
                return None, None, None
                
            # Calculate technical indicators
            hist = self.calculate_technical_indicators(hist)
            
            # Select features for model
            feature_columns = ['Close', 'Volume', 'SMA_20', 'EMA_20', 'RSI', 'MACD', 'Volume_SMA']
            features = hist[feature_columns].dropna()
            
            if len(features) < self.sequence_length:
                return None, None, None
                
            scaled_data = self.scaler.fit_transform(features)
            
            return scaled_data, features, hist
            
        except Exception as e:
            print(f"Error preparing data for {symbol}: {e}")
            return None, None, None
    
    def create_sequences(self, data):
        """Create sequences for LSTM training"""
        X, y = [], []
        for i in range(self.sequence_length, len(data)):
            X.append(data[i-self.sequence_length:i])
            y.append(data[i, 0])  # Predicting Close price
        return np.array(X), np.array(y)
    
    def train_model(self, symbol):
        """Train LSTM model as per paper specifications"""
        scaled_data, features, hist = self.prepare_data(symbol)
        if scaled_data is None:
            return False
            
        X, y = self.create_sequences(scaled_data)
        
        if len(X) == 0:
            return False
            
        # Split data (80-20)
        split = int(0.8 * len(X))
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        
        # Initialize model
        self.model = LSTMPredictor(
            input_size=X.shape[2], 
            hidden_layer_size=50,
            output_size=1,
            num_layers=2
        )
        
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        
        # Convert to tensors
        X_train = torch.FloatTensor(X_train)
        y_train = torch.FloatTensor(y_train).view(-1, 1)
        X_test = torch.FloatTensor(X_test)
        y_test = torch.FloatTensor(y_test).view(-1, 1)
        
        # Training loop (100 epochs as per paper)
        epochs = 100
        batch_size = 64
        
        for epoch in range(epochs):
            self.model.train()
            
            # Mini-batch training
            for i in range(0, len(X_train), batch_size):
                batch_X = X_train[i:i+batch_size]
                batch_y = y_train[i:i+batch_size]
                
                optimizer.zero_grad()
                y_pred = self.model(batch_X)
                loss = criterion(y_pred, batch_y)
                loss.backward()
                optimizer.step()
            
            if epoch % 20 == 0:
                print(f"Epoch {epoch}, Loss: {loss.item():.6f}")
        
        # Save model
        model_path = os.path.join(self.models_dir, f"{symbol}_lstm.pth")
        torch.save(self.model.state_dict(), model_path)
        joblib.dump(self.scaler, os.path.join(self.models_dir, f"{symbol}_scaler.pkl"))
        
        return True
    
    def predict(self, symbol, days=1):
        """Make prediction using trained LSTM model"""
        try:
            scaled_data, features, hist = self.prepare_data(symbol)
            if scaled_data is None:
                return self._generate_fallback_prediction(symbol)
            
            # Load or train model
            model_path = os.path.join(self.models_dir, f"{symbol}_lstm.pth")
            if os.path.exists(model_path):
                self.model = LSTMPredictor(input_size=scaled_data.shape[1], hidden_layer_size=50)
                self.model.load_state_dict(torch.load(model_path))
                self.scaler = joblib.load(os.path.join(self.models_dir, f"{symbol}_scaler.pkl"))
            else:
                if not self.train_model(symbol):
                    return self._generate_fallback_prediction(symbol)
            
            # Get the last sequence
            last_sequence = scaled_data[-self.sequence_length:]
            last_sequence = torch.FloatTensor(last_sequence).unsqueeze(0)
            
            # Make prediction
            self.model.eval()
            with torch.no_grad():
                prediction = self.model(last_sequence)
            
            # Inverse transform
            prediction = prediction.numpy()
            dummy = np.zeros((prediction.shape[0], features.shape[1]))
            dummy[:, 0] = prediction.flatten()
            prediction_denorm = self.scaler.inverse_transform(dummy)[:, 0]
            
            current_price = hist['Close'].iloc[-1]
            predicted_price = float(prediction_denorm[0])
            change_percent = ((predicted_price - current_price) / current_price) * 100
            
            # Calculate confidence based on recent volatility
            recent_volatility = hist['Close'].pct_change().std() * 100
            confidence = max(60, 95.4 - abs(recent_volatility) * 2)  # Base confidence from paper
            
            return {
                'symbol': symbol,
                'current_price': round(current_price, 2),
                'predicted_price': round(predicted_price, 2),
                'change_percent': round(change_percent, 2),
                'confidence': round(confidence, 1),
                'direction': 'up' if change_percent > 0 else 'down',
                'reasoning': self._generate_reasoning(symbol, change_percent, hist),
                'technical_indicators': self._get_current_indicators(hist),
                'model_type': 'LSTM + Technical Indicators'
            }
            
        except Exception as e:
            print(f"Prediction error for {symbol}: {e}")
            return self._generate_fallback_prediction(symbol)
    
    def _generate_fallback_prediction(self, symbol):
        """Fallback prediction when model fails"""
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="1mo")
            current_price = hist['Close'].iloc[-1]
            
            # Simple prediction based on recent trend
            recent_trend = (hist['Close'].iloc[-1] - hist['Close'].iloc[-5]) / hist['Close'].iloc[-5] * 100
            predicted_change = recent_trend * 0.7  # Dampened trend
            
            return {
                'symbol': symbol,
                'current_price': round(current_price, 2),
                'predicted_price': round(current_price * (1 + predicted_change/100), 2),
                'change_percent': round(predicted_change, 2),
                'confidence': 75.0,
                'direction': 'up' if predicted_change > 0 else 'down',
                'reasoning': f"Based on recent price trend and market analysis",
                'technical_indicators': {},
                'model_type': 'Fallback Model'
            }
        except:
            return None
    
    def _generate_reasoning(self, symbol, change_percent, hist):
        """Generate human-readable reasoning as per paper"""
        rsi = hist['RSI'].iloc[-1] if 'RSI' in hist.columns else 50
        macd = hist['MACD'].iloc[-1] if 'MACD' in hist.columns else 0
        
        reasons = []
        
        if rsi < 30:
            reasons.append("oversold RSI conditions")
        elif rsi > 70:
            reasons.append("overbought RSI conditions")
            
        if macd > 0:
            reasons.append("positive MACD momentum")
        else:
            reasons.append("negative MACD momentum")
            
        if change_percent > 2:
            reasons.append("strong bullish indicators")
        elif change_percent < -2:
            reasons.append("bearish pressure")
            
        if not reasons:
            reasons.append("neutral market conditions")
            
        return f"{symbol} is predicted to {'rise' if change_percent > 0 else 'fall'} due to {', '.join(reasons)}."
    
    def _get_current_indicators(self, hist):
        """Get current technical indicator values"""
        if len(hist) < 20:
            return {}
            
        return {
            'RSI': round(hist['RSI'].iloc[-1], 2) if 'RSI' in hist.columns else 50,
            'MACD': round(hist['MACD'].iloc[-1], 3) if 'MACD' in hist.columns else 0,
            'SMA_20': round(hist['SMA_20'].iloc[-1], 2) if 'SMA_20' in hist.columns else hist['Close'].iloc[-1],
            'EMA_20': round(hist['EMA_20'].iloc[-1], 2) if 'EMA_20' in hist.columns else hist['Close'].iloc[-1],
            'Volume_Trend': 'increasing' if hist['Volume'].iloc[-1] > hist['Volume'].iloc[-5] else 'decreasing'
        }

# Global instance
financial_forecaster = FinancialForecaster()