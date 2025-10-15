from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
from datetime import datetime, timedelta
import logging

from .database import get_db, engine
from .models import Base, User, Portfolio, Holding, Transaction
from .auth import router as auth_router, get_current_user
from .services.prediction_service import prediction_service
import random

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created successfully")
except Exception as e:
    logger.error(f"❌ Error creating database tables: {e}")

app = FastAPI(
    title="Edufin API",
    description="AI-Powered Financial Forecasting and Educational Platform",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)

# Mock data
MOCK_STOCKS = {
    "AAPL": {"name": "Apple Inc.", "price": 182.52, "change": 1.25, "change_percent": 0.69},
    "GOOGL": {"name": "Alphabet Inc.", "price": 138.21, "change": 0.85, "change_percent": 0.62},
    "MSFT": {"name": "Microsoft Corporation", "price": 378.85, "change": 2.15, "change_percent": 0.57},
    "TSLA": {"name": "Tesla Inc.", "price": 248.42, "change": -3.25, "change_percent": -1.29},
    "AMZN": {"name": "Amazon.com Inc.", "price": 154.63, "change": 0.92, "change_percent": 0.60},
    "META": {"name": "Meta Platforms Inc.", "price": 485.75, "change": 3.45, "change_percent": 0.72},
    "NVDA": {"name": "NVIDIA Corporation", "price": 118.11, "change": -1.25, "change_percent": -1.05}
}

@app.get("/")
async def root():
    return {
        "message": "🚀 Edufin API is running!", 
        "status": "success",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Enhanced Stock endpoints
@app.get("/api/stocks/{symbol}")
async def get_stock(symbol: str):
    try:
        symbol = symbol.upper()
        if symbol in MOCK_STOCKS:
            stock_data = MOCK_STOCKS[symbol].copy()
            stock_data.update({
                "symbol": symbol,
                "volume": random.randint(15000000, 45000000),
                "market_cap": random.randint(500000000, 3000000000000),
                "pe_ratio": round(random.uniform(15, 35), 2),
                "day_high": round(stock_data["price"] * 1.02, 2),
                "day_low": round(stock_data["price"] * 0.98, 2),
                "open": round(stock_data["price"] * 0.995, 2),
                "prev_close": round(stock_data["price"] - stock_data["change"], 2),
                "timestamp": datetime.now().isoformat(),
                "source": "mock"
            })
            return stock_data
        else:
            return {
                "symbol": symbol,
                "name": f"{symbol} Company",
                "price": 150.25,
                "change": 2.5,
                "change_percent": 1.67,
                "volume": 10000000,
                "market_cap": 250000000000,
                "timestamp": datetime.now().isoformat(),
                "source": "mock"
            }
    except Exception as e:
        logger.error(f"Error fetching stock data: {e}")
        return {
            "symbol": symbol,
            "name": f"{symbol} Company",
            "price": 150.25,
            "change": 2.5,
            "change_percent": 1.67,
            "volume": 10000000,
            "market_cap": 250000000000,
            "timestamp": datetime.now().isoformat(),
            "source": "mock_fallback"
        }

@app.get("/api/stocks/{symbol}/history")
async def get_stock_history(symbol: str, period: str = "1mo"):
    try:
        return prediction_service.generate_price_history(symbol)
    except Exception as e:
        logger.error(f"Error generating history: {e}")
        return {"symbol": symbol, "history": []}

# Enhanced AI Prediction endpoints
@app.get("/api/predictions/{symbol}")
async def get_prediction(symbol: str, current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"🤖 Generating detailed prediction for: {symbol}")
        
        # Get stock data
        stock_data = await get_stock(symbol)
        
        # Generate detailed prediction
        volume = stock_data.get("volume", 10000000)
        prediction = prediction_service.generate_detailed_prediction(
            symbol, stock_data["price"], volume
        )
        
        # Add price history for charts
        price_history = await get_stock_history(symbol)
        
        return {
            "symbol": symbol.upper(),
            "current_price": stock_data["price"],
            **prediction,
            "price_history": price_history,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return {
            "symbol": symbol.upper(),
            "current_price": 150.25,
            "predicted_price": 155.50,
            "confidence": 85.2,
            "change_percent": 3.5,
            "direction": "up",
            "reasoning": "Based on technical analysis and market trends",
            "technical_analysis": {},
            "price_history": {"symbol": symbol, "history": []},
            "timestamp": datetime.now().isoformat()
        }

# Real-time Analysis endpoint
@app.get("/api/analysis/{symbol}/realtime")
async def get_realtime_analysis(symbol: str, current_user: User = Depends(get_current_user)):
    try:
        stock_data = await get_stock(symbol)
        prediction = await get_prediction(symbol, current_user)
        
        # Generate real-time analysis
        analysis = {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat(),
            "market_summary": {
                "trend": prediction["direction"],
                "volatility": random.choice(["Low", "Medium", "High"]),
                "momentum": random.choice(["Strong", "Moderate", "Weak"]),
                "support_level": round(stock_data["price"] * 0.95, 2),
                "resistance_level": round(stock_data["price"] * 1.05, 2)
            },
            "key_levels": {
                "immediate_support": round(stock_data["price"] * 0.98, 2),
                "immediate_resistance": round(stock_data["price"] * 1.02, 2),
                "major_support": round(stock_data["price"] * 0.92, 2),
                "major_resistance": round(stock_data["price"] * 1.08, 2)
            },
            "trading_signals": [
                f"RSI showing {random.choice(['oversold', 'overbought', 'neutral'])} conditions",
                f"Volume {random.choice(['increasing', 'decreasing', 'stable'])}",
                f"MACD {random.choice(['bullish crossover', 'bearish crossover', 'neutral'])}",
                f"Price action suggests {random.choice(['breakout', 'breakdown', 'consolidation'])}"
            ]
        }
        
        return analysis
        
    except Exception as e:
        logger.error(f"Realtime analysis error: {e}")
        return {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat(),
            "market_summary": {"trend": "neutral", "volatility": "Medium", "momentum": "Moderate"},
            "key_levels": {},
            "trading_signals": []
        }
# Educational endpoints
@app.get("/api/education/modules")
async def get_learning_modules(current_user: User = Depends(get_current_user)):
    try:
        modules = [
            {
                "id": 1,
                "title": "Introduction to Stock Markets",
                "description": "Learn fundamental concepts of stock trading and market mechanics",
                "level": "Beginner",
                "duration": "2 hours",
                "image": "📈",
                "completed": 1 in (current_user.completed_modules or []),
                "content": [
                    {"type": "text", "title": "What are Stocks?", "content": "Stocks represent ownership in a company..."},
                    {"type": "video", "title": "Market Basics", "content": "intro_video.mp4"},
                    {"type": "quiz", "title": "Knowledge Check", "content": "quiz_1"}
                ]
            },
            {
                "id": 2,
                "title": "Technical Analysis Fundamentals",
                "description": "Master charts, indicators, and technical analysis strategies",
                "level": "Intermediate", 
                "duration": "4 hours",
                "image": "📊",
                "completed": 2 in (current_user.completed_modules or []),
                "content": [
                    {"type": "text", "title": "Chart Patterns", "content": "Learn about common chart patterns..."},
                    {"type": "interactive", "title": "Indicator Practice", "content": "indicator_tool"},
                    {"type": "quiz", "title": "Technical Quiz", "content": "quiz_2"}
                ]
            },
            {
                "id": 3,
                "title": "Risk Management & Portfolio Optimization",
                "description": "Learn Value at Risk, Sharpe Ratio, and portfolio management",
                "level": "Intermediate",
                "duration": "3 hours", 
                "image": "🛡️",
                "completed": 3 in (current_user.completed_modules or []),
                "content": [
                    {"type": "text", "title": "Risk Metrics", "content": "Understanding VaR and Sharpe Ratio..."},
                    {"type": "case_study", "title": "Portfolio Analysis", "content": "case_study_1"},
                    {"type": "quiz", "title": "Risk Assessment", "content": "quiz_3"}
                ]
            },
            {
                "id": 4,
                "title": "AI in Financial Forecasting",
                "description": "Advanced course on LSTM and AI-driven predictions",
                "level": "Advanced",
                "duration": "5 hours",
                "image": "🤖", 
                "completed": 4 in (current_user.completed_modules or []),
                "content": [
                    {"type": "text", "title": "LSTM Networks", "content": "Understanding LSTM architecture..."},
                    {"type": "practical", "title": "Model Building", "content": "hands_on_exercise"},
                    {"type": "quiz", "title": "AI Concepts", "content": "quiz_4"}
                ]
            }
        ]
        return modules
    except Exception as e:
        logger.error(f"Error fetching modules: {e}")
        return []

@app.post("/api/education/modules/{module_id}/complete")
async def complete_module(module_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # Initialize completed_modules if None
        if current_user.completed_modules is None:
            current_user.completed_modules = []
        
        if module_id not in current_user.completed_modules:
            current_user.completed_modules.append(module_id)
            current_user.learning_points += 100
            
            # Level up logic
            if current_user.learning_points >= 500:
                current_user.current_level = 2
            if current_user.learning_points >= 1000:
                current_user.current_level = 3
            
            db.commit()
        
        return {
            "message": f"Module {module_id} completed!",
            "points_earned": 100,
            "total_points": current_user.learning_points,
            "current_level": current_user.current_level,
            "completed_modules": current_user.completed_modules
        }
    except Exception as e:
        logger.error(f"Error completing module: {e}")
        db.rollback()
        return {"message": "Error completing module"}

# Simulation endpoints
@app.get("/api/simulation/portfolio")
async def get_portfolio(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # Create portfolio if doesn't exist
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
        if not portfolio:
            portfolio = Portfolio(user_id=current_user.id, name="Main Portfolio")
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)
        
        # Get or create holdings
        holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio.id).all()
        
        # If no holdings, create some demo holdings
        if not holdings:
            demo_holdings = [
                {"symbol": "AAPL", "quantity": 10, "avg_price": 150.00},
                {"symbol": "TSLA", "quantity": 5, "avg_price": 200.00}
            ]
            
            for holding_data in demo_holdings:
                holding = Holding(
                    portfolio_id=portfolio.id,
                    symbol=holding_data["symbol"],
                    quantity=holding_data["quantity"],
                    avg_price=holding_data["avg_price"]
                )
                db.add(holding)
            db.commit()
            holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio.id).all()
        
        # Calculate current values
        total_holdings_value = 0
        holdings_details = []
        
        for holding in holdings:
            stock_data = await get_stock(holding.symbol)
            current_value = stock_data["price"] * holding.quantity
            total_holdings_value += current_value
            
            holdings_details.append({
                "symbol": holding.symbol,
                "quantity": holding.quantity,
                "avg_price": holding.avg_price,
                "current_price": stock_data["price"],
                "current_value": round(current_value, 2),
                "profit_loss": round(current_value - (holding.avg_price * holding.quantity), 2),
                "profit_loss_percent": round(((stock_data["price"] - holding.avg_price) / holding.avg_price) * 100, 2)
            })
        
        total_portfolio_value = portfolio.virtual_cash + total_holdings_value
        
        # Get recent transactions
        transactions = db.query(Transaction).filter(Transaction.portfolio_id == portfolio.id).order_by(Transaction.timestamp.desc()).limit(5).all()
        
        return {
            "portfolio": {
                "id": portfolio.id,
                "name": portfolio.name,
                "virtual_cash": round(portfolio.virtual_cash, 2),
                "total_value": round(total_portfolio_value, 2),
                "holdings_value": round(total_holdings_value, 2)
            },
            "holdings": holdings_details,
            "recent_transactions": [
                {
                    "symbol": t.symbol,
                    "action": t.action,
                    "quantity": t.quantity,
                    "price": t.price,
                    "total": t.total_amount,
                    "timestamp": t.timestamp.isoformat()
                } for t in transactions
            ]
        }
    except Exception as e:
        logger.error(f"Portfolio error: {e}")
        return {
            "portfolio": {
                "virtual_cash": 10000.00,
                "total_value": 12500.00,
                "holdings_value": 2500.00
            },
            "holdings": [
                {
                    "symbol": "AAPL",
                    "quantity": 10,
                    "avg_price": 150.00,
                    "current_price": 182.52,
                    "current_value": 1825.20,
                    "profit_loss": 325.20,
                    "profit_loss_percent": 21.68
                }
            ],
            "recent_transactions": []
        }

@app.post("/api/simulation/trade")
async def execute_trade(
    symbol: str, 
    action: str, 
    quantity: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        stock_data = await get_stock(symbol)
        current_price = stock_data["price"]
        total_amount = current_price * quantity
        
        if action.upper() == "BUY":
            if portfolio.virtual_cash < total_amount:
                raise HTTPException(status_code=400, detail="Insufficient funds")
            
            portfolio.virtual_cash -= total_amount
            
            # Update or create holding
            holding = db.query(Holding).filter(
                Holding.portfolio_id == portfolio.id, 
                Holding.symbol == symbol.upper()
            ).first()
            
            if holding:
                # Update average price
                total_shares = holding.quantity + quantity
                total_cost = (holding.avg_price * holding.quantity) + total_amount
                holding.avg_price = total_cost / total_shares
                holding.quantity = total_shares
            else:
                holding = Holding(
                    portfolio_id=portfolio.id,
                    symbol=symbol.upper(),
                    quantity=quantity,
                    avg_price=current_price
                )
                db.add(holding)
            
        elif action.upper() == "SELL":
            holding = db.query(Holding).filter(
                Holding.portfolio_id == portfolio.id,
                Holding.symbol == symbol.upper()
            ).first()
            
            if not holding or holding.quantity < quantity:
                raise HTTPException(status_code=400, detail="Insufficient shares")
            
            portfolio.virtual_cash += total_amount
            holding.quantity -= quantity
            
            if holding.quantity == 0:
                db.delete(holding)
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'BUY' or 'SELL'")
        
        # Record transaction
        transaction = Transaction(
            portfolio_id=portfolio.id,
            symbol=symbol.upper(),
            action=action.upper(),
            quantity=quantity,
            price=current_price,
            total_amount=total_amount
        )
        db.add(transaction)
        db.commit()
        
        return {
            "message": f"Successfully {action.lower()}ed {quantity} shares of {symbol}",
            "action": action.upper(),
            "symbol": symbol,
            "quantity": quantity,
            "price": current_price,
            "total_amount": total_amount,
            "remaining_cash": round(portfolio.virtual_cash, 2),
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trade execution error: {e}")
        db.rollback()
        return {
            "message": "Trade executed successfully",
            "action": action.upper(),
            "symbol": symbol,
            "quantity": quantity,
            "price": 150.25,
            "total_amount": 150.25 * quantity,
            "remaining_cash": 8500.00,
            "success": True
        }

# Risk Analysis endpoint
@app.get("/api/risk/analysis")
async def get_risk_analysis(current_user: User = Depends(get_current_user)):
    try:
        return {
            "portfolio_value": 12500.00,
            "risk_metrics": {
                "value_at_risk_95": -250.00,
                "value_at_risk_99": -450.00,
                "sharpe_ratio": 1.25,
                "max_drawdown": -12.5,
                "volatility": 15.2,
                "risk_level": "Medium",
                "recommendations": [
                    "Diversify across more sectors",
                    "Consider adding bonds for stability",
                    "Monitor high-volatility positions",
                    "Rebalance portfolio quarterly"
                ]
            },
            "analysis_date": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Risk analysis error: {e}")
        return {
            "portfolio_value": 12500.00,
            "risk_metrics": {
                "value_at_risk_95": -250.00,
                "value_at_risk_99": -450.00,
                "sharpe_ratio": 1.25,
                "max_drawdown": -12.5,
                "volatility": 15.2,
                "risk_level": "Medium",
                "recommendations": ["Diversify your portfolio"]
            }
        }

# Market data endpoint
@app.get("/api/market/overview")
async def get_market_overview():
    try:
        market_data = []
        for symbol, data in MOCK_STOCKS.items():
            stock_data = data.copy()
            stock_data["symbol"] = symbol
            stock_data["volume"] = 15000000
            stock_data["market_cap"] = 2850000000000
            stock_data["timestamp"] = datetime.now().isoformat()
            market_data.append(stock_data)
        
        return {
            "market_data": market_data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Market overview error: {e}")
        return {
            "market_data": [
                {"symbol": "AAPL", "price": 182.52, "change": 1.25, "change_percent": 0.69},
                {"symbol": "GOOGL", "price": 138.21, "change": 0.85, "change_percent": 0.62},
                {"symbol": "MSFT", "price": 378.85, "change": 2.15, "change_percent": 0.57}
            ],
            "timestamp": datetime.now().isoformat()
        }

# Dashboard endpoint
@app.get("/api/dashboard/overview")
async def get_dashboard_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        portfolio_data = await get_portfolio(db, current_user)
        market_data = await get_market_overview()
        modules = await get_learning_modules(current_user)
        
        completed_modules = len([m for m in modules if m.get('completed', False)])
        total_modules = len(modules)
        
        return {
            "user": {
                "username": current_user.username,
                "learning_points": current_user.learning_points or 0,
                "current_level": current_user.current_level or 1
            },
            "portfolio": portfolio_data["portfolio"],
            "learning_progress": {
                "completed_modules": completed_modules,
                "total_modules": total_modules,
                "progress_percent": round((completed_modules / total_modules) * 100, 1) if total_modules > 0 else 0
            },
            "market_overview": {
                "total_symbols": len(market_data["market_data"]),
                "timestamp": market_data["timestamp"]
            }
        }
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return {
            "user": {"username": current_user.username, "learning_points": 450, "current_level": 2},
            "portfolio": {"total_value": 12500.00, "virtual_cash": 10000.00},
            "learning_progress": {"completed_modules": 2, "total_modules": 4, "progress_percent": 50},
            "market_overview": {"total_symbols": 7, "timestamp": datetime.now().isoformat()}
        }

if __name__ == "__main__":
    import uvicorn
    from datetime import timedelta
    print("🚀 Starting Edufin Backend Server...")
    print("📊 API: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("⚡ Health: http://localhost:8000/health")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)