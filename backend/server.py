from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
from datetime import datetime
import aiohttp
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Trading Models
class WalletConnection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    address: str
    wallet_type: str  # "metamask" or "binance"
    chain_id: int
    connected_at: datetime = Field(default_factory=datetime.utcnow)

class Memecoin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    symbol: str
    contract_address: str
    total_supply: str
    decimals: int
    description: Optional[str] = ""
    creator_address: str
    chain_id: int
    transaction_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CreateMemecoinRequest(BaseModel):
    name: str
    symbol: str
    contract_address: str
    total_supply: str
    decimals: int
    description: Optional[str] = ""
    creator_address: str
    chain_id: int
    transaction_hash: Optional[str] = None

class Portfolio(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_address: str
    tokens: List[Dict] = []
    total_value_usd: float = 0.0
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class Trade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_address: str
    token_symbol: str
    token_address: str
    trade_type: str  # "buy" or "sell"
    amount: float
    price_usd: float
    transaction_hash: Optional[str] = None
    status: str = "pending"  # "pending", "completed", "failed"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TradeRequest(BaseModel):
    wallet_address: str
    token_symbol: str
    token_address: str
    trade_type: str
    amount: float

# Crypto price API helpers
async def fetch_crypto_prices(symbols: List[str]) -> Dict:
    """Fetch crypto prices from CoinGecko API"""
    try:
        symbol_string = ",".join(symbols).lower()
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={symbol_string}&vs_currencies=usd&include_24hr_change=true"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {}
    except Exception as e:
        logger.error(f"Error fetching crypto prices: {e}")
        return {}

async def search_tokens(query: str) -> List[Dict]:
    """Search for tokens by name/symbol"""
    try:
        url = f"https://api.coingecko.com/api/v3/search?query={query}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('coins', [])[:20]  # Return top 20 results
                else:
                    return []
    except Exception as e:
        logger.error(f"Error searching tokens: {e}")
        return []

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "MemeForge Trading API - Ready for Real Trading! 🚀"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Trading API Routes
@api_router.get("/crypto/prices")
async def get_crypto_prices(symbols: str = "bitcoin,ethereum,binancecoin,dogecoin,shiba-inu,pepe"):
    """Get current prices for specified cryptocurrencies"""
    symbol_list = symbols.split(",")
    prices = await fetch_crypto_prices(symbol_list)
    return {"prices": prices, "timestamp": datetime.utcnow().isoformat()}

@api_router.get("/crypto/search")
async def search_crypto_tokens(q: str):
    """Search for crypto tokens by name or symbol"""
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters long")
    
    tokens = await search_tokens(q)
    return {"tokens": tokens}

@api_router.get("/crypto/trending")
async def get_trending_coins():
    """Get trending cryptocurrencies"""
    try:
        url = "https://api.coingecko.com/api/v3/search/trending"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return {"trending": data.get('coins', [])}
                else:
                    raise HTTPException(status_code=500, detail="Failed to fetch trending coins")
    except Exception as e:
        logger.error(f"Error fetching trending coins: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/wallet/connect")
async def connect_wallet(wallet_data: WalletConnection):
    """Connect a wallet (MetaMask or Binance)"""
    try:
        # Store wallet connection
        await db.wallets.insert_one(wallet_data.dict())
        return {"message": "Wallet connected successfully", "wallet": wallet_data}
    except Exception as e:
        logger.error(f"Error connecting wallet: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect wallet")

@api_router.get("/wallet/{address}/portfolio")
async def get_portfolio(address: str):
    """Get portfolio for a wallet address"""
    try:
        portfolio = await db.portfolios.find_one({"wallet_address": address})
        if not portfolio:
            # Create empty portfolio
            new_portfolio = Portfolio(wallet_address=address, tokens=[], total_value_usd=0.0)
            await db.portfolios.insert_one(new_portfolio.dict())
            return new_portfolio.dict()
        
        return portfolio
    except Exception as e:
        logger.error(f"Error fetching portfolio: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch portfolio")

@api_router.post("/trade")
async def create_trade(trade_request: TradeRequest):
    """Create a new trade order"""
    try:
        # Get current price for the token
        trade = Trade(**trade_request.dict(), price_usd=0.0)  # Price will be updated in real implementation
        
        # Store trade in database
        await db.trades.insert_one(trade.dict())
        
        return {"message": "Trade order created", "trade_id": trade.id, "trade": trade}
    except Exception as e:
        logger.error(f"Error creating trade: {e}")
        raise HTTPException(status_code=500, detail="Failed to create trade")

@api_router.get("/wallet/{address}/trades")
async def get_wallet_trades(address: str):
    """Get trade history for a wallet"""
    try:
        trades = await db.trades.find({"wallet_address": address}).to_list(100)
        return {"trades": trades}
    except Exception as e:
        logger.error(f"Error fetching trades: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trades")

# Memecoin Creation API Routes
@api_router.post("/memecoin/create")
async def create_memecoin(memecoin_data: CreateMemecoinRequest):
    """Create a new memecoin entry after blockchain deployment"""
    try:
        memecoin = Memecoin(**memecoin_data.dict())
        
        # Store memecoin in database
        await db.memecoins.insert_one(memecoin.dict())
        
        return {"message": "Memecoin created successfully", "memecoin": memecoin}
    except Exception as e:
        logger.error(f"Error creating memecoin: {e}")
        raise HTTPException(status_code=500, detail="Failed to create memecoin")

@api_router.get("/memecoin/list")
async def list_memecoins():
    """Get list of all created memecoins"""
    try:
        memecoins = await db.memecoins.find().to_list(100)
        return {"memecoins": memecoins}
    except Exception as e:
        logger.error(f"Error fetching memecoins: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch memecoins")

@api_router.get("/memecoin/user/{creator_address}")
async def get_user_memecoins(creator_address: str):
    """Get memecoins created by a specific user"""
    try:
        memecoins = await db.memecoins.find({"creator_address": creator_address}).to_list(50)
        return {"memecoins": memecoins}
    except Exception as e:
        logger.error(f"Error fetching user memecoins: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user memecoins")

@api_router.get("/memecoin/{contract_address}")
async def get_memecoin_details(contract_address: str):
    """Get details of a specific memecoin"""
    try:
        memecoin = await db.memecoins.find_one({"contract_address": contract_address})
        if not memecoin:
            raise HTTPException(status_code=404, detail="Memecoin not found")
        
        return {"memecoin": memecoin}
    except Exception as e:
        logger.error(f"Error fetching memecoin details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch memecoin details")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
