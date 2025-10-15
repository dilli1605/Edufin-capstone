from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
import bcrypt
from .database import get_db
from .models import User, Portfolio
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

SECRET_KEY = "edufin-super-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    message: str = "Authentication successful"

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise HTTPException(status_code=500, detail="Error processing password")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT token"""
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Token creation error: {e}")
        raise HTTPException(status_code=500, detail="Error creating access token")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        logger.info(f"Token received: {token[:20]}...")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            logger.error("Username not found in token payload")
            raise credentials_exception
            
        logger.info(f"Looking for user: {username}")
        user = db.query(User).filter(User.username == username).first()
        
        if user is None:
            logger.error(f"User {username} not found in database")
            raise credentials_exception
            
        logger.info(f"User found: {user.username}")
        return user
        
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:  # Catch all other JWT errors
        logger.error(f"JWT Error: {e}")
        raise credentials_exception

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """User registration endpoint"""
    try:
        logger.info(f"Registration attempt for username: {user_data.username}")
        
        # Validate input
        if len(user_data.username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
        
        if len(user_data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
        # Check if user exists
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            logger.warning(f"Username {user_data.username} already exists")
            raise HTTPException(status_code=400, detail="Username already registered")
        
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            logger.warning(f"Email {user_data.email} already exists")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        logger.info("Creating new user...")
        hashed_password = hash_password(user_data.password)
        
        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            completed_modules=[],
            learning_points=0,
            current_level=1,
            badges=[]
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"User created successfully: {user.username}")
        
        # Create default portfolio
        portfolio = Portfolio(user_id=user.id, name="Main Portfolio")
        db.add(portfolio)
        db.commit()
        logger.info("Default portfolio created")
        
        # Create token
        access_token = create_access_token(data={"sub": user.username})
        logger.info("Access token created successfully")
        
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "username": user.username,
            "message": "Registration successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error during registration")

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """User login endpoint"""
    try:
        logger.info(f"Login attempt for username: {user_data.username}")
        
        # Find user
        user = db.query(User).filter(User.username == user_data.username).first()
        if not user:
            logger.warning(f"User not found: {user_data.username}")
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        # Verify password
        logger.info("Verifying password...")
        if not verify_password(user_data.password, user.hashed_password):
            logger.warning(f"Invalid password for user: {user_data.username}")
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Inactive user attempted login: {user_data.username}")
            raise HTTPException(status_code=400, detail="Account is deactivated")
        
        # Create token
        logger.info("Creating access token...")
        access_token = create_access_token(data={"sub": user.username})
        logger.info(f"Login successful for user: {user.username}")
        
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "username": user.username,
            "message": "Login successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during login")

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "experience_level": current_user.experience_level,
        "learning_points": current_user.learning_points,
        "current_level": current_user.current_level,
        "completed_modules": current_user.completed_modules
    }