from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import bcrypt

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    username = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    full_name = Column(String(200))
    experience_level = Column(String(50), default="beginner")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Learning progress
    completed_modules = Column(JSON, default=list)
    learning_points = Column(Integer, default=0)
    current_level = Column(Integer, default=1)
    badges = Column(JSON, default=list)

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    virtual_cash = Column(Float, default=100000.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="portfolios")

class Holding(Base):
    __tablename__ = "holdings"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    symbol = Column(String(50))
    quantity = Column(Integer)
    avg_price = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    portfolio = relationship("Portfolio", back_populates="holdings")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    symbol = Column(String(50))
    action = Column(String(10))  # BUY or SELL
    quantity = Column(Integer)
    price = Column(Float)
    total_amount = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), index=True)
    prediction_date = Column(DateTime)
    predicted_price = Column(Float)
    current_price = Column(Float)
    confidence = Column(Float)
    change_percent = Column(Float)
    direction = Column(String(10))
    reasoning = Column(Text)
    technical_indicators = Column(JSON)
    sentiment_analysis = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Add relationships
User.portfolios = relationship("Portfolio", back_populates="user")
Portfolio.holdings = relationship("Holding", back_populates="portfolio")
Portfolio.transactions = relationship("Transaction")