from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'ggs-super-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="GGS - Game Gear Swap API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Kerala Districts
KERALA_CITIES = [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", 
    "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", 
    "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
]

# Profanity filter - basic blocked words list
BLOCKED_WORDS = [
    "abuse", "scam", "fraud", "cheat", "fake", "stupid", "idiot", "fool",
    "hate", "kill", "die", "threat", "violence", "racist", "sexist"
]
# Add more words as needed - this is a basic filter

def filter_message(text: str) -> tuple[str, bool]:
    """Filter message for profanity. Returns (filtered_text, is_flagged)"""
    lower_text = text.lower()
    is_flagged = False
    filtered_text = text
    
    for word in BLOCKED_WORDS:
        if word in lower_text:
            is_flagged = True
            # Replace with asterisks
            import re
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            filtered_text = pattern.sub('*' * len(word), filtered_text)
    
    return filtered_text, is_flagged

# WebSocket connection manager for real-time chat
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.typing_status: Dict[str, Dict[str, bool]] = {}  # conv_id -> {user_id: is_typing}
    
    async def connect(self, websocket: WebSocket, user_id: str, conv_id: str):
        await websocket.accept()
        key = f"{conv_id}"
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append((websocket, user_id))
    
    def disconnect(self, websocket: WebSocket, user_id: str, conv_id: str):
        key = f"{conv_id}"
        if key in self.active_connections:
            self.active_connections[key] = [
                (ws, uid) for ws, uid in self.active_connections[key] 
                if ws != websocket
            ]
    
    async def broadcast_to_conversation(self, conv_id: str, message: dict, exclude_user: str = None):
        key = f"{conv_id}"
        if key in self.active_connections:
            for websocket, user_id in self.active_connections[key]:
                if exclude_user and user_id == exclude_user:
                    continue
                try:
                    await websocket.send_json(message)
                except:
                    pass
    
    def set_typing(self, conv_id: str, user_id: str, is_typing: bool):
        if conv_id not in self.typing_status:
            self.typing_status[conv_id] = {}
        self.typing_status[conv_id][user_id] = is_typing
    
    def get_typing(self, conv_id: str, user_id: str) -> bool:
        return self.typing_status.get(conv_id, {}).get(user_id, False)

manager = ConnectionManager()

# ============== MODELS ==============

# Auth Models
class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    name: str
    username: str
    auth_type: str = "email"  # email, google, phone

class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    auth_type: str = "email"

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class GoogleAuthRequest(BaseModel):
    token: str
    email: str
    name: str
    username: str
    avatar: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    name: str
    username: str
    auth_type: str = "email"
    role: str
    is_verified: bool
    is_seller_verified: bool
    verification_status: Optional[str] = None
    avatar: Optional[str] = None
    location: Optional[str] = None
    location_district: Optional[str] = None
    location_taluk: Optional[str] = None
    location_area: Optional[str] = None
    rating_avg: float
    rating_count: int
    created_at: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    location: Optional[str] = None
    location_district: Optional[str] = None
    location_taluk: Optional[str] = None
    location_area: Optional[str] = None
    bio: Optional[str] = None

# Category Models
class SubCategory(BaseModel):
    id: str
    name: str
    slug: str

class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon: str
    image_url: Optional[str] = None
    description: str
    subcategories: List[SubCategory] = []

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    icon: str
    image_url: Optional[str] = None
    description: str
    subcategories: List[dict] = []

# Listing Models
class ListingCreate(BaseModel):
    title: str
    description: str
    category_id: str
    subcategory_id: Optional[str] = None
    price: float
    price_type: str = "fixed"  # fixed, negotiable, exchange, free
    condition: str
    item_type: str = "physical"  # physical, digital
    location: str
    location_district: Optional[str] = None
    location_taluk: Optional[str] = None
    location_area: Optional[str] = None
    address_details: Optional[str] = None
    contact_phone: str
    contact_method: str = "both"  # phone, chat, both
    hide_phone: bool = False
    images: List[str] = []
    specifications: List[dict] = []
    brand: Optional[str] = None
    model: Optional[str] = None

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    subcategory_id: Optional[str] = None
    price: Optional[float] = None
    price_type: Optional[str] = None
    condition: Optional[str] = None
    item_type: Optional[str] = None
    location: Optional[str] = None
    location_district: Optional[str] = None
    location_taluk: Optional[str] = None
    location_area: Optional[str] = None
    address_details: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_method: Optional[str] = None
    hide_phone: Optional[bool] = None
    images: Optional[List[str]] = None
    specifications: Optional[List[dict]] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None

class ListingResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    category_id: str
    category_name: Optional[str] = None
    subcategory_id: Optional[str] = None
    subcategory_name: Optional[str] = None
    price: float
    price_type: str
    condition: str
    item_type: str
    location: str
    location_district: Optional[str] = None
    location_taluk: Optional[str] = None
    location_area: Optional[str] = None
    address_details: Optional[str] = None
    contact_phone: str
    contact_method: str
    hide_phone: bool = False
    images: List[str]
    specifications: List[dict]
    brand: Optional[str] = None
    model: Optional[str] = None
    seller_id: str
    seller_name: Optional[str] = None
    seller_avatar: Optional[str] = None
    seller_verified: bool = False
    seller_rating: float = 0
    status: str
    payment_status: str
    featured: bool
    views_count: int
    created_at: str

# Payment Models
class PaymentCreate(BaseModel):
    listing_id: str

class PaymentResponse(BaseModel):
    id: str
    user_id: str
    listing_id: str
    amount: float
    status: str
    payment_method: Optional[str] = None
    created_at: str

# Message Models
class ConversationCreate(BaseModel):
    listing_id: str
    seller_id: str

class MessageCreate(BaseModel):
    conversation_id: str
    text: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None  # image, file

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_avatar: Optional[str] = None
    text: str
    original_text: Optional[str] = None  # Original before filtering
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    is_read: bool
    is_flagged: bool = False
    flagged_reason: Optional[str] = None
    created_at: str

# KYC/Verification Models
class KYCSubmission(BaseModel):
    document_type: str  # aadhaar, pan, driving_license, voter_id
    document_number: str  # Last 4 digits only for display
    document_image_url: str

class KYCResponse(BaseModel):
    id: str
    user_id: str
    document_type: str
    document_number: str  # Masked
    document_image_url: str
    status: str  # pending, approved, rejected
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str

# Review Models
class ReviewCreate(BaseModel):
    listing_id: str
    seller_id: str
    rating: int  # 1-5 stars
    comment: str

class ReviewResponse(BaseModel):
    id: str
    reviewer_id: str
    reviewer_name: str
    reviewer_avatar: Optional[str] = None
    seller_id: str
    listing_id: str
    listing_title: Optional[str] = None
    rating: int
    comment: str
    seller_response: Optional[str] = None
    seller_response_at: Optional[str] = None
    created_at: str

class ReviewReply(BaseModel):
    response: str

# Chat Report Models
class ChatReportCreate(BaseModel):
    conversation_id: str
    message_id: Optional[str] = None  # If reporting specific message
    reason: str  # spam, harassment, scam, inappropriate, other
    details: Optional[str] = None

# Report Models
class ReportCreate(BaseModel):
    target_type: str  # listing, user, message, conversation
    target_id: str
    reason: str
    details: Optional[str] = None

# Blog Models
class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    cover_image: str
    tags: List[str] = []

class BlogPostResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    cover_image: str
    tags: List[str]
    author_id: str
    author_name: str
    views_count: int
    created_at: str

# Static Page Models
class StaticPageCreate(BaseModel):
    slug: str
    title: str
    content: str

class StaticPageResponse(BaseModel):
    id: str
    slug: str
    title: str
    content: str
    updated_at: str

# Admin Models
class AdminUserUpdate(BaseModel):
    is_verified: Optional[bool] = None
    is_seller_verified: Optional[bool] = None
    is_suspended: Optional[bool] = None
    role: Optional[str] = None
    verification_status: Optional[str] = None

class AdminListingUpdate(BaseModel):
    status: Optional[str] = None
    featured: Optional[bool] = None

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_slug(title: str) -> str:
    import re
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return f"{slug}-{uuid.uuid4().hex[:8]}"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("is_suspended"):
        raise HTTPException(status_code=403, detail="Account is suspended")
    return user

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    # Check existing
    if user.email:
        existing = await db.users.find_one({"email": user.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    if user.phone:
        existing = await db.users.find_one({"phone": user.phone})
        if existing:
            raise HTTPException(status_code=400, detail="Phone already registered")
    
    if user.username:
        existing = await db.users.find_one({"username": user.username})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "phone": user.phone,
        "password": hash_password(user.password) if user.password else None,
        "name": user.name,
        "username": user.username,
        "auth_type": user.auth_type,
        "role": "user",
        "is_verified": False,
        "is_seller_verified": False,
        "is_suspended": False,
        "avatar": None,
        "location": None,
        "location_district": None,
        "location_taluk": None,
        "location_area": None,
        "bio": None,
        "rating_avg": 0,
        "rating_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["role"])
    
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "phone": user_doc["phone"],
            "name": user_doc["name"],
            "username": user_doc["username"],
            "role": user_doc["role"],
            "is_verified": user_doc["is_verified"],
            "is_seller_verified": user_doc["is_seller_verified"],
            "avatar": user_doc["avatar"],
            "location": user_doc["location"],
            "location_district": user_doc.get("location_district"),
            "location_taluk": user_doc.get("location_taluk"),
            "location_area": user_doc.get("location_area"),
            "rating_avg": user_doc["rating_avg"],
            "rating_count": user_doc["rating_count"],
            "created_at": user_doc["created_at"]
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user: UserLogin):
    query = {}
    if user.email:
        query["email"] = user.email
    elif user.phone:
        query["phone"] = user.phone
    else:
        raise HTTPException(status_code=400, detail="Email or phone required")
    
    db_user = await db.users.find_one(query, {"_id": 0})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.password and db_user.get("password"):
        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if db_user.get("is_suspended"):
        raise HTTPException(status_code=403, detail="Account is suspended")
    
    token = create_token(db_user["id"], db_user["role"])
    return {
        "token": token,
        "user": {
            "id": db_user["id"],
            "email": db_user.get("email"),
            "phone": db_user.get("phone"),
            "name": db_user["name"],
            "username": db_user.get("username", ""),
            "role": db_user["role"],
            "is_verified": db_user.get("is_verified", False),
            "is_seller_verified": db_user.get("is_seller_verified", False),
            "avatar": db_user.get("avatar"),
            "location": db_user.get("location"),
            "location_district": db_user.get("location_district"),
            "location_taluk": db_user.get("location_taluk"),
            "location_area": db_user.get("location_area"),
            "rating_avg": db_user.get("rating_avg", 0),
            "rating_count": db_user.get("rating_count", 0),
            "created_at": db_user["created_at"]
        }
    }

@api_router.post("/auth/google", response_model=dict)
async def google_auth(data: GoogleAuthRequest):
    """Mock Google OAuth - in production, verify token with Google"""
    # Check if user exists
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    if existing:
        token = create_token(existing["id"], existing["role"])
        return {
            "token": token,
            "user": {
                "id": existing["id"],
                "email": existing.get("email"),
                "phone": existing.get("phone"),
                "name": existing["name"],
                "username": existing.get("username", ""),
                "role": existing["role"],
                "is_verified": existing.get("is_verified", False),
                "is_seller_verified": existing.get("is_seller_verified", False),
                "avatar": existing.get("avatar"),
                "location": existing.get("location"),
                "location_district": existing.get("location_district"),
                "location_taluk": existing.get("location_taluk"),
                "location_area": existing.get("location_area"),
                "rating_avg": existing.get("rating_avg", 0),
                "rating_count": existing.get("rating_count", 0),
                "created_at": existing["created_at"]
            }
        }
    
    # Create new user
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "phone": None,
        "password": None,
        "name": data.name,
        "username": data.username,
        "auth_type": "google",
        "role": "user",
        "is_verified": True,  # Google users are auto-verified
        "is_seller_verified": False,
        "is_suspended": False,
        "avatar": data.avatar,
        "location": None,
        "location_district": None,
        "location_taluk": None,
        "location_area": None,
        "bio": None,
        "rating_avg": 0,
        "rating_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["role"])
    
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "phone": user_doc["phone"],
            "name": user_doc["name"],
            "username": user_doc["username"],
            "role": user_doc["role"],
            "is_verified": user_doc["is_verified"],
            "is_seller_verified": user_doc["is_seller_verified"],
            "avatar": user_doc["avatar"],
            "location": user_doc["location"],
            "location_district": user_doc.get("location_district"),
            "location_taluk": user_doc.get("location_taluk"),
            "location_area": user_doc.get("location_area"),
            "rating_avg": user_doc["rating_avg"],
            "rating_count": user_doc["rating_count"],
            "created_at": user_doc["created_at"]
        }
    }

@api_router.post("/auth/otp/send")
async def send_otp(data: OTPRequest):
    """Mock OTP sending - stores OTP in DB for verification"""
    otp = str(random.randint(100000, 999999))
    
    # Store OTP (expires in 5 minutes)
    await db.otps.update_one(
        {"phone": data.phone},
        {
            "$set": {
                "phone": data.phone,
                "otp": otp,
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
            }
        },
        upsert=True
    )
    
    # In production, send SMS here
    logger.info(f"Mock OTP for {data.phone}: {otp}")
    
    return {"message": "OTP sent successfully", "mock_otp": otp}  # Remove mock_otp in production

@api_router.post("/auth/otp/verify", response_model=dict)
async def verify_otp(data: OTPVerify):
    """Verify OTP and login/register user"""
    otp_doc = await db.otps.find_one({"phone": data.phone})
    
    if not otp_doc or otp_doc["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.fromisoformat(otp_doc["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Delete used OTP
    await db.otps.delete_one({"phone": data.phone})
    
    # Check if user exists
    existing = await db.users.find_one({"phone": data.phone}, {"_id": 0})
    
    if existing:
        token = create_token(existing["id"], existing["role"])
        return {
            "token": token,
            "user": {
                "id": existing["id"],
                "email": existing.get("email"),
                "phone": existing.get("phone"),
                "name": existing["name"],
                "role": existing["role"],
                "is_verified": existing.get("is_verified", False),
                "is_seller_verified": existing.get("is_seller_verified", False),
                "avatar": existing.get("avatar"),
                "location": existing.get("location"),
                "location_district": existing.get("location_district"),
                "location_taluk": existing.get("location_taluk"),
                "location_area": existing.get("location_area"),
                "rating_avg": existing.get("rating_avg", 0),
                "rating_count": existing.get("rating_count", 0),
                "created_at": existing["created_at"]
            },
            "is_new_user": False
        }
    
    # New user - needs to complete registration
    return {
        "token": None,
        "user": None,
        "is_new_user": True,
        "phone": data.phone
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user.get("email"),
        phone=user.get("phone"),
        name=user["name"],
        username=user.get("username", ""),
        auth_type=user.get("auth_type", "email"),
        role=user["role"],
        is_verified=user.get("is_verified", False),
        is_seller_verified=user.get("is_seller_verified", False),
        verification_status=user.get("verification_status"),
        avatar=user.get("avatar"),
        location=user.get("location"),
        location_district=user.get("location_district"),
        location_taluk=user.get("location_taluk"),
        location_area=user.get("location_area"),
        rating_avg=user.get("rating_avg", 0),
        rating_count=user.get("rating_count", 0),
        created_at=user["created_at"]
    )

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(update: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # Check username uniqueness if updating
    if "username" in update_data:
        existing = await db.users.find_one({"username": update_data["username"], "id": {"$ne": user["id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return UserResponse(**updated)

@api_router.put("/profile")
async def update_profile_simple(data: dict, user: dict = Depends(get_current_user)):
    """Simple profile update for avatar etc"""
    allowed_fields = ['avatar', 'name', 'email', 'location', 'location_district', 'location_taluk', 'location_area']
    update_data = {k: v for k, v in data.items() if k in allowed_fields and v is not None}
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    return {"success": True}

class PhoneUpdateRequest(BaseModel):
    phone: str
    otp: str

@api_router.post("/profile/update-phone")
async def update_phone(data: PhoneUpdateRequest, user: dict = Depends(get_current_user)):
    """Update phone number with OTP verification (mocked)"""
    # In real implementation, verify OTP here
    # For now, accept any 6-digit OTP
    if len(data.otp) != 6 or not data.otp.isdigit():
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.users.update_one({"id": user["id"]}, {"$set": {"phone": data.phone}})
    return {"success": True}

class PasswordChangeRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str

@api_router.post("/profile/change-password")
async def change_password(data: PasswordChangeRequest, user: dict = Depends(get_current_user)):
    db_user = await db.users.find_one({"id": user["id"]})
    
    # Verify current password if user has one
    if db_user.get("password"):
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required")
        if not bcrypt.checkpw(data.current_password.encode('utf-8'), db_user["password"].encode('utf-8')):
            raise HTTPException(status_code=400, detail="Invalid current password")
            
    # Hash new password
    hashed_password = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    await db.users.update_one({"id": user["id"]}, {"$set": {"password": hashed_password}})
    return {"success": True, "message": "Password updated successfully"}

@api_router.post("/profile/disconnect-google")
async def disconnect_google(user: dict = Depends(get_current_user)):
    db_user = await db.users.find_one({"id": user["id"]})
    
    # Cannot disconnect if no password is set (user would be locked out)
    if not db_user.get("password"):
        raise HTTPException(status_code=400, detail="Please set a password before disconnecting Google")
        
    if db_user.get("auth_type") != "google":
        raise HTTPException(status_code=400, detail="Account is not connected via Google")
        
    await db.users.update_one({"id": user["id"]}, {"$set": {"auth_type": "email"}})
    return {"success": True, "message": "Google account disconnected successfully"}

@api_router.post("/verification/apply")
async def apply_verification(user: dict = Depends(get_current_user)):
    """Apply for seller verification"""
    if user.get("is_seller_verified"):
        raise HTTPException(status_code=400, detail="Already verified")
    if user.get("verification_status") == "pending":
        raise HTTPException(status_code=400, detail="Verification already pending")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"verification_status": "pending"}}
    )
    
    # Create verification request record
    await db.verification_requests.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "message": "Verification application submitted"}

# ============== LOCATION ROUTES ==============

@api_router.get("/locations")
async def get_locations():
    """Get available locations (Kerala cities)"""
    return {"locations": KERALA_CITIES}

# ============== CATEGORY ROUTES ==============

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.get("/categories/{slug}", response_model=CategoryResponse)
async def get_category(slug: str):
    category = await db.categories.find_one({"slug": slug}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@api_router.post("/admin/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, user: dict = Depends(get_admin_user)):
    cat_doc = {
        "id": str(uuid.uuid4()),
        **category.model_dump()
    }
    await db.categories.insert_one(cat_doc)
    return CategoryResponse(**cat_doc)

@api_router.put("/admin/categories/{cat_id}", response_model=CategoryResponse)
async def update_category(cat_id: str, category: CategoryCreate, user: dict = Depends(get_admin_user)):
    await db.categories.update_one({"id": cat_id}, {"$set": category.model_dump()})
    updated = await db.categories.find_one({"id": cat_id}, {"_id": 0})
    return CategoryResponse(**updated)

@api_router.delete("/admin/categories/{cat_id}")
async def delete_category(cat_id: str, user: dict = Depends(get_admin_user)):
    await db.categories.delete_one({"id": cat_id})
    return {"message": "Category deleted"}

# ============== LISTING ROUTES ==============

@api_router.get("/listings", response_model=List[ListingResponse])
async def get_listings(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    condition: Optional[str] = None,
    item_type: Optional[str] = None,
    location: Optional[str] = None,
    location_district: Optional[str] = None,
    location_taluk: Optional[str] = None,
    location_area: Optional[str] = None,
    price_type: Optional[str] = None,
    seller_verified: Optional[bool] = None,
    featured: Optional[bool] = None,
    sort: Optional[str] = "latest",
    limit: int = 50,
    skip: int = 0
):
    query = {"status": "active", "payment_status": "completed"}
    
    if category:
        cat = await db.categories.find_one({"slug": category}, {"_id": 0})
        if cat:
            query["category_id"] = cat["id"]
    
    if subcategory:
        query["subcategory_id"] = subcategory
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    if condition:
        query["condition"] = condition
    
    if item_type:
        query["item_type"] = item_type
    
    if location:
        query["location"] = location
        
    if location_district:
        query["location_district"] = location_district
        
    if location_taluk:
        query["location_taluk"] = location_taluk
        
    if location_area:
        query["location_area"] = location_area
    
    if price_type:
        query["price_type"] = price_type
    
    if featured:
        query["featured"] = True
    
    # Sort options
    sort_field = [("created_at", -1)]
    if sort == "price_low":
        sort_field = [("price", -1)]
    elif sort == "price_high":
        sort_field = [("price", 1)]
    elif sort == "views":
        sort_field = [("views_count", -1)]
    
    listings = await db.listings.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with category, subcategory, and seller info
    for listing in listings:
        cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
        listing["category_name"] = cat["name"] if cat else "Unknown"
        
        if listing.get("subcategory_id") and cat:
            subcat = next((s for s in cat.get("subcategories", []) if s["id"] == listing["subcategory_id"]), None)
            listing["subcategory_name"] = subcat["name"] if subcat else None
        else:
            listing["subcategory_name"] = None
        
        seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0})
        if seller:
            listing["seller_name"] = seller["name"]
            listing["seller_avatar"] = seller.get("avatar")
            listing["seller_verified"] = seller.get("is_seller_verified", False)
            listing["seller_rating"] = seller.get("rating_avg", 0)
        
        # Filter by verified seller if requested
        if seller_verified and not listing.get("seller_verified"):
            continue
    
    if seller_verified:
        listings = [l for l in listings if l.get("seller_verified")]
    
    return listings

@api_router.get("/listings/featured", response_model=List[ListingResponse])
async def get_featured_listings():
    listings = await db.listings.find(
        {"status": "active", "payment_status": "completed", "featured": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(8).to_list(8)
    
    for listing in listings:
        cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
        listing["category_name"] = cat["name"] if cat else "Unknown"
        listing["subcategory_name"] = None
        seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0})
        if seller:
            listing["seller_name"] = seller["name"]
            listing["seller_avatar"] = seller.get("avatar")
            listing["seller_verified"] = seller.get("is_seller_verified", False)
            listing["seller_rating"] = seller.get("rating_avg", 0)
    
    return listings

@api_router.get("/listings/latest", response_model=List[ListingResponse])
async def get_latest_listings():
    listings = await db.listings.find(
        {"status": "active", "payment_status": "completed"},
        {"_id": 0}
    ).sort("created_at", -1).limit(12).to_list(12)
    
    for listing in listings:
        cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
        listing["category_name"] = cat["name"] if cat else "Unknown"
        listing["subcategory_name"] = None
        seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0})
        if seller:
            listing["seller_name"] = seller["name"]
            listing["seller_avatar"] = seller.get("avatar")
            listing["seller_verified"] = seller.get("is_seller_verified", False)
            listing["seller_rating"] = seller.get("rating_avg", 0)
    
    return listings

@api_router.get("/listings/{listing_id}", response_model=ListingResponse)
async def get_listing(listing_id: str):
    # Try by ID first, then by slug
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        listing = await db.listings.find_one({"slug": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Increment views
    await db.listings.update_one({"id": listing["id"]}, {"$inc": {"views_count": 1}})
    listing["views_count"] = listing.get("views_count", 0) + 1
    
    cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
    listing["category_name"] = cat["name"] if cat else "Unknown"
    
    if listing.get("subcategory_id") and cat:
        subcat = next((s for s in cat.get("subcategories", []) if s["id"] == listing["subcategory_id"]), None)
        listing["subcategory_name"] = subcat["name"] if subcat else None
    else:
        listing["subcategory_name"] = None
    
    seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0})
    if seller:
        listing["seller_name"] = seller["name"]
        listing["seller_avatar"] = seller.get("avatar")
        listing["seller_verified"] = seller.get("is_seller_verified", False)
        listing["seller_rating"] = seller.get("rating_avg", 0)
    
    return listing

@api_router.post("/listings", response_model=ListingResponse)
async def create_listing(listing: ListingCreate, user: dict = Depends(get_current_user)):
    listing_doc = {
        "id": str(uuid.uuid4()),
        "slug": generate_slug(listing.title),
        **listing.model_dump(),
        "seller_id": user["id"],
        "status": "pending_payment",  # Requires ₹10 payment to go live
        "payment_status": "pending",
        "featured": False,
        "views_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.listings.insert_one(listing_doc)
    
    cat = await db.categories.find_one({"id": listing.category_id}, {"_id": 0})
    listing_doc["category_name"] = cat["name"] if cat else "Unknown"
    listing_doc["subcategory_name"] = None
    listing_doc["seller_name"] = user["name"]
    listing_doc["seller_avatar"] = user.get("avatar")
    listing_doc["seller_verified"] = user.get("is_seller_verified", False)
    listing_doc["seller_rating"] = user.get("rating_avg", 0)
    
    return listing_doc

@api_router.put("/listings/{listing_id}", response_model=ListingResponse)
async def update_listing(listing_id: str, update: ListingUpdate, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    cat = await db.categories.find_one({"id": updated["category_id"]}, {"_id": 0})
    updated["category_name"] = cat["name"] if cat else "Unknown"
    updated["subcategory_name"] = None
    seller = await db.users.find_one({"id": updated["seller_id"]}, {"_id": 0})
    if seller:
        updated["seller_name"] = seller["name"]
        updated["seller_avatar"] = seller.get("avatar")
        updated["seller_verified"] = seller.get("is_seller_verified", False)
        updated["seller_rating"] = seller.get("rating_avg", 0)
    
    return updated

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.delete_one({"id": listing_id})
    return {"message": "Listing deleted"}

@api_router.post("/listings/{listing_id}/mark-sold")
async def mark_listing_sold(listing_id: str, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "sold"}})
    return {"message": "Listing marked as sold"}

@api_router.get("/my-listings", response_model=List[ListingResponse])
async def get_my_listings(
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"seller_id": user["id"]}
    if status:
        query["status"] = status
    
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for listing in listings:
        cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
        listing["category_name"] = cat["name"] if cat else "Unknown"
        listing["subcategory_name"] = None
        listing["seller_name"] = user["name"]
        listing["seller_avatar"] = user.get("avatar")
        listing["seller_verified"] = user.get("is_seller_verified", False)
        listing["seller_rating"] = user.get("rating_avg", 0)
    
    return listings

# ============== SELLER STORE ROUTES ==============

@api_router.get("/sellers/{seller_id}")
async def get_seller_profile(seller_id: str):
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "password": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    # Get seller's listings
    listings = await db.listings.find(
        {"seller_id": seller_id, "status": "active", "payment_status": "completed"},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    for listing in listings:
        cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
        listing["category_name"] = cat["name"] if cat else "Unknown"
        listing["subcategory_name"] = None
        listing["seller_name"] = seller["name"]
        listing["seller_avatar"] = seller.get("avatar")
        listing["seller_verified"] = seller.get("is_seller_verified", False)
        listing["seller_rating"] = seller.get("rating_avg", 0)
    
    # Get reviews
    reviews = await db.reviews.find({"seller_id": seller_id}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    for review in reviews:
        reviewer = await db.users.find_one({"id": review["reviewer_id"]}, {"_id": 0})
        if reviewer:
            review["reviewer_name"] = reviewer["name"]
            review["reviewer_avatar"] = reviewer.get("avatar")
    
    return {
        "seller": seller,
        "listings": listings,
        "reviews": reviews
    }

@api_router.get("/sellers/{seller_id}/listings")
async def get_seller_listings_only(seller_id: str):
    """Get only seller's listings"""
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    listings = await db.listings.find(
        {"seller_id": seller_id, "payment_status": "completed"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    for listing in listings:
        cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
        listing["category_name"] = cat["name"] if cat else "Unknown"
        listing["subcategory_name"] = None
        listing["seller_name"] = seller["name"]
        listing["seller_avatar"] = seller.get("avatar")
        listing["seller_verified"] = seller.get("is_seller_verified", False)
        listing["seller_rating"] = seller.get("rating_avg", 0)
    
    return listings

# ============== PAYMENT ROUTES (MOCK) ==============

LISTING_FEE = 10.0  # ₹10 per listing

class PaymentComplete(BaseModel):
    listing_id: str
    payment_method: str = "upi"

@api_router.post("/payments/complete")
async def complete_payment_direct(data: PaymentComplete, user: dict = Depends(get_current_user)):
    """Direct payment completion - creates and completes payment in one step"""
    listing = await db.listings.find_one({"id": data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if listing["payment_status"] == "completed":
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    # Create payment record
    payment_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "listing_id": data.listing_id,
        "amount": LISTING_FEE,
        "status": "completed",
        "payment_method": data.payment_method,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_doc)
    
    # Update listing status to active
    await db.listings.update_one(
        {"id": data.listing_id},
        {"$set": {"payment_status": "completed", "status": "active"}}
    )
    
    return {"success": True, "payment_id": payment_doc["id"], "message": "Payment completed successfully"}

@api_router.post("/payments/create", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": payment.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if listing["payment_status"] == "completed":
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    payment_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "listing_id": payment.listing_id,
        "amount": LISTING_FEE,
        "status": "pending",
        "payment_method": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_doc)
    return payment_doc

@api_router.post("/payments/{payment_id}/complete", response_model=PaymentResponse)
async def complete_payment(
    payment_id: str,
    payment_method: str = "upi",
    user: dict = Depends(get_current_user)
):
    """Mock payment completion"""
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update payment
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {"status": "completed", "payment_method": payment_method}}
    )
    
    # Update listing status
    await db.listings.update_one(
        {"id": payment["listing_id"]},
        {"$set": {"payment_status": "completed", "status": "active"}}
    )
    
    payment["status"] = "completed"
    payment["payment_method"] = payment_method
    return payment

@api_router.get("/payments/history", response_model=List[PaymentResponse])
async def get_payment_history(user: dict = Depends(get_current_user)):
    payments = await db.payments.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return payments

# ============== MESSAGING ROUTES ==============

@api_router.post("/conversations")
async def create_conversation(data: ConversationCreate, user: dict = Depends(get_current_user)):
    # Check if conversation already exists
    existing = await db.conversations.find_one({
        "listing_id": data.listing_id,
        "buyer_id": user["id"],
        "seller_id": data.seller_id
    }, {"_id": 0})
    
    if existing:
        return existing
    
    conv_doc = {
        "id": str(uuid.uuid4()),
        "listing_id": data.listing_id,
        "buyer_id": user["id"],
        "seller_id": data.seller_id,
        "last_message": None,
        "last_message_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.conversations.insert_one(conv_doc)
    # Remove MongoDB _id from response
    conv_doc.pop("_id", None)
    return conv_doc

@api_router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find({
        "$or": [{"buyer_id": user["id"]}, {"seller_id": user["id"]}]
    }, {"_id": 0}).sort("last_message_at", -1).to_list(100)
    
    # Enrich with listing and user info
    for conv in conversations:
        listing = await db.listings.find_one({"id": conv["listing_id"]}, {"_id": 0})
        if listing:
            conv["listing_title"] = listing["title"]
            conv["listing_image"] = listing["images"][0] if listing.get("images") else None
            conv["listing_price"] = listing["price"]
        
        # Get other user info
        other_user_id = conv["seller_id"] if conv["buyer_id"] == user["id"] else conv["buyer_id"]
        other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0, "password": 0})
        if other_user:
            conv["other_user_name"] = other_user["name"]
            conv["other_user_avatar"] = other_user.get("avatar")
            conv["other_user_id"] = other_user["id"]
        
        # Get unread count
        unread = await db.messages.count_documents({
            "conversation_id": conv["id"],
            "sender_id": {"$ne": user["id"]},
            "is_read": False
        })
        conv["unread_count"] = unread
    
    return conversations

@api_router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user["id"] not in [conv["buyer_id"], conv["seller_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Enrich with info
    listing = await db.listings.find_one({"id": conv["listing_id"]}, {"_id": 0})
    if listing:
        conv["listing_title"] = listing["title"]
        conv["listing_image"] = listing["images"][0] if listing.get("images") else None
        conv["listing_price"] = listing["price"]
    
    other_user_id = conv["seller_id"] if conv["buyer_id"] == user["id"] else conv["buyer_id"]
    other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0, "password": 0})
    if other_user:
        conv["other_user_name"] = other_user["name"]
        conv["other_user_avatar"] = other_user.get("avatar")
        conv["other_user_id"] = other_user["id"]
    
    return conv

@api_router.get("/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, user: dict = Depends(get_current_user)):
    # Verify user is part of conversation
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user["id"] not in [conv["buyer_id"], conv["seller_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await db.messages.find({"conversation_id": conv_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    
    # Mark messages as read
    await db.messages.update_many(
        {"conversation_id": conv_id, "sender_id": {"$ne": user["id"]}, "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Enrich with sender names
    for msg in messages:
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0})
        msg["sender_name"] = sender["name"] if sender else "Unknown"
        msg["sender_avatar"] = sender.get("avatar") if sender else None
    
    return messages

@api_router.post("/messages")
async def send_message(data: MessageCreate, user: dict = Depends(get_current_user)):
    # Verify user is part of conversation
    conv = await db.conversations.find_one({"id": data.conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user["id"] not in [conv["buyer_id"], conv["seller_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Filter message for profanity
    filtered_text, is_flagged = filter_message(data.text)
    
    msg_doc = {
        "id": str(uuid.uuid4()),
        "conversation_id": data.conversation_id,
        "sender_id": user["id"],
        "text": filtered_text,
        "original_text": data.text if is_flagged else None,
        "attachment_url": data.attachment_url,
        "attachment_type": data.attachment_type,
        "is_read": False,
        "is_flagged": is_flagged,
        "flagged_reason": "Contains blocked words" if is_flagged else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(msg_doc)
    
    # Remove MongoDB _id from response
    msg_doc.pop("_id", None)
    
    # If flagged, add to moderation queue
    if is_flagged:
        flagged_doc = {
            "id": str(uuid.uuid4()),
            "message_id": msg_doc["id"],
            "conversation_id": data.conversation_id,
            "sender_id": user["id"],
            "original_text": data.text,
            "filtered_text": filtered_text,
            "status": "pending",  # pending, reviewed, dismissed
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.flagged_messages.insert_one(flagged_doc)
    
    # Update conversation
    await db.conversations.update_one(
        {"id": data.conversation_id},
        {"$set": {"last_message": filtered_text[:50], "last_message_at": msg_doc["created_at"]}}
    )
    
    msg_doc["sender_name"] = user["name"]
    msg_doc["sender_avatar"] = user.get("avatar")
    
    # Broadcast to WebSocket clients
    await manager.broadcast_to_conversation(
        data.conversation_id,
        {"type": "new_message", "message": msg_doc},
        exclude_user=user["id"]
    )
    
    return msg_doc

@api_router.post("/messages/{message_id}/read")
async def mark_message_read(message_id: str, user: dict = Depends(get_current_user)):
    """Mark a specific message as read"""
    msg = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if msg["sender_id"] == user["id"]:
        return {"success": True}  # Can't mark own message as read
    
    await db.messages.update_one(
        {"id": message_id},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Broadcast read status
    await manager.broadcast_to_conversation(
        msg["conversation_id"],
        {"type": "message_read", "message_id": message_id, "read_by": user["id"]},
        exclude_user=user["id"]
    )
    
    return {"success": True}

@api_router.post("/conversations/{conv_id}/typing")
async def set_typing_status(conv_id: str, is_typing: bool = True, user: dict = Depends(get_current_user)):
    """Set typing status for a conversation"""
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user["id"] not in [conv["buyer_id"], conv["seller_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    manager.set_typing(conv_id, user["id"], is_typing)
    
    # Broadcast typing status
    await manager.broadcast_to_conversation(
        conv_id,
        {"type": "typing", "user_id": user["id"], "user_name": user["name"], "is_typing": is_typing},
        exclude_user=user["id"]
    )
    
    return {"success": True}

# WebSocket endpoint for real-time chat
@app.websocket("/ws/chat/{conv_id}")
async def websocket_chat(websocket: WebSocket, conv_id: str):
    """WebSocket endpoint for real-time chat"""
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["user_id"]
    except:
        await websocket.close(code=4001)
        return
    
    # Verify user is part of conversation
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv or user_id not in [conv["buyer_id"], conv["seller_id"]]:
        await websocket.close(code=4003)
        return
    
    await manager.connect(websocket, user_id, conv_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "typing":
                manager.set_typing(conv_id, user_id, data.get("is_typing", False))
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                await manager.broadcast_to_conversation(
                    conv_id,
                    {"type": "typing", "user_id": user_id, "user_name": user["name"], "is_typing": data.get("is_typing", False)},
                    exclude_user=user_id
                )
            
            elif data.get("type") == "read":
                message_id = data.get("message_id")
                if message_id:
                    await db.messages.update_one(
                        {"id": message_id},
                        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    await manager.broadcast_to_conversation(
                        conv_id,
                        {"type": "message_read", "message_id": message_id, "read_by": user_id},
                        exclude_user=user_id
                    )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, conv_id)
        manager.set_typing(conv_id, user_id, False)

# ============== KYC/VERIFICATION ROUTES ==============

@api_router.post("/kyc/submit")
async def submit_kyc(data: KYCSubmission, user: dict = Depends(get_current_user)):
    """Submit KYC documents for verification"""
    # Check if already has pending or approved KYC
    existing = await db.kyc_submissions.find_one({
        "user_id": user["id"],
        "status": {"$in": ["pending", "approved"]}
    }, {"_id": 0})
    
    if existing:
        if existing["status"] == "approved":
            raise HTTPException(status_code=400, detail="You are already verified")
        raise HTTPException(status_code=400, detail="You already have a pending KYC submission")
    
    kyc_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "document_type": data.document_type,
        "document_number": f"****{data.document_number[-4:]}" if len(data.document_number) >= 4 else "****",
        "document_image_url": data.document_image_url,
        "status": "pending",
        "rejection_reason": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kyc_submissions.insert_one(kyc_doc)
    
    # Update user verification status
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"verification_status": "pending"}}
    )
    
    return {"success": True, "message": "KYC documents submitted successfully", "kyc_id": kyc_doc["id"]}

@api_router.get("/kyc/status")
async def get_kyc_status(user: dict = Depends(get_current_user)):
    """Get user's KYC status"""
    kyc = await db.kyc_submissions.find_one(
        {"user_id": user["id"]},
        {"_id": 0}
    )
    
    if not kyc:
        return {"status": "not_submitted", "kyc": None}
    
    return {"status": kyc["status"], "kyc": kyc}

# Admin KYC management
@api_router.get("/admin/kyc")
async def get_kyc_submissions(
    status: Optional[str] = None,
    user: dict = Depends(get_admin_user)
):
    """Get all KYC submissions (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    submissions = await db.kyc_submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with user info
    for sub in submissions:
        usr = await db.users.find_one({"id": sub["user_id"]}, {"_id": 0, "password": 0})
        if usr:
            sub["user_name"] = usr["name"]
            sub["user_email"] = usr.get("email")
            sub["user_phone"] = usr.get("phone")
    
    return submissions

@api_router.put("/admin/kyc/{kyc_id}/approve")
async def approve_kyc(kyc_id: str, user: dict = Depends(get_admin_user)):
    """Approve a KYC submission (admin only)"""
    kyc = await db.kyc_submissions.find_one({"id": kyc_id}, {"_id": 0})
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC submission not found")
    
    await db.kyc_submissions.update_one(
        {"id": kyc_id},
        {"$set": {
            "status": "approved",
            "reviewed_by": user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update user verification status
    await db.users.update_one(
        {"id": kyc["user_id"]},
        {"$set": {
            "is_seller_verified": True,
            "verification_status": "approved",
            "verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "KYC approved"}

@api_router.put("/admin/kyc/{kyc_id}/reject")
async def reject_kyc(kyc_id: str, reason: str = "Document not clear or invalid", user: dict = Depends(get_admin_user)):
    """Reject a KYC submission (admin only)"""
    kyc = await db.kyc_submissions.find_one({"id": kyc_id}, {"_id": 0})
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC submission not found")
    
    await db.kyc_submissions.update_one(
        {"id": kyc_id},
        {"$set": {
            "status": "rejected",
            "rejection_reason": reason,
            "reviewed_by": user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update user verification status
    await db.users.update_one(
        {"id": kyc["user_id"]},
        {"$set": {"verification_status": "rejected"}}
    )
    
    return {"success": True, "message": "KYC rejected"}

# Admin flagged messages management
@api_router.get("/admin/flagged-messages")
async def get_flagged_messages(
    status: Optional[str] = None,
    user: dict = Depends(get_admin_user)
):
    """Get all flagged messages for moderation (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    flagged = await db.flagged_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with user info
    for msg in flagged:
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0, "password": 0})
        if sender:
            msg["sender_name"] = sender["name"]
            msg["sender_email"] = sender.get("email")
    
    return flagged

@api_router.put("/admin/flagged-messages/{flag_id}/review")
async def review_flagged_message(flag_id: str, action: str = "dismissed", user: dict = Depends(get_admin_user)):
    """Review a flagged message (admin only)"""
    await db.flagged_messages.update_one(
        {"id": flag_id},
        {"$set": {
            "status": action,  # reviewed, dismissed
            "reviewed_by": user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True}

# Admin reports management
@api_router.get("/admin/reports")
async def get_reports_admin(
    status: Optional[str] = None,
    user: dict = Depends(get_admin_user)
):
    """Get all reports (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with info
    for report in reports:
        reporter = await db.users.find_one({"id": report["reporter_id"]}, {"_id": 0, "password": 0})
        if reporter:
            report["reporter_name"] = reporter["name"]
        
        if report["target_type"] == "listing":
            listing = await db.listings.find_one({"id": report["target_id"]}, {"_id": 0})
            if listing:
                report["listing_title"] = listing["title"]
    
    return reports

@api_router.put("/admin/reports/{report_id}/review")
async def review_report(report_id: str, action: str = "resolved", user: dict = Depends(get_admin_user)):
    """Review a report (admin only)"""
    await db.reports.update_one(
        {"id": report_id},
        {"$set": {
            "status": action,  # resolved, dismissed
            "reviewed_by": user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True}

# ============== WISHLIST ROUTES ==============

@api_router.get("/wishlist", response_model=List[ListingResponse])
async def get_wishlist(user: dict = Depends(get_current_user)):
    wishlist = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    listing_ids = [w["listing_id"] for w in wishlist]
    
    listings = await db.listings.find({"id": {"$in": listing_ids}}, {"_id": 0}).to_list(100)
    
    for listing in listings:
        cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
        listing["category_name"] = cat["name"] if cat else "Unknown"
        listing["subcategory_name"] = None
        seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0})
        if seller:
            listing["seller_name"] = seller["name"]
            listing["seller_avatar"] = seller.get("avatar")
            listing["seller_verified"] = seller.get("is_seller_verified", False)
            listing["seller_rating"] = seller.get("rating_avg", 0)
    
    return listings

@api_router.post("/wishlist")
async def add_to_wishlist(listing_id: str, user: dict = Depends(get_current_user)):
    existing = await db.wishlist.find_one({"user_id": user["id"], "listing_id": listing_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already in wishlist")
    
    await db.wishlist.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "listing_id": listing_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{listing_id}")
async def remove_from_wishlist(listing_id: str, user: dict = Depends(get_current_user)):
    await db.wishlist.delete_one({"user_id": user["id"], "listing_id": listing_id})
    return {"message": "Removed from wishlist"}

@api_router.get("/wishlist/check/{listing_id}")
async def check_wishlist(listing_id: str, user: dict = Depends(get_current_user)):
    existing = await db.wishlist.find_one({"user_id": user["id"], "listing_id": listing_id})
    return {"in_wishlist": existing is not None}

# ============== REVIEW ROUTES ==============

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, user: dict = Depends(get_current_user)):
    # Validate rating
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({
        "reviewer_id": user["id"],
        "listing_id": review.listing_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this listing")
    
    # Check if user has interacted with seller (had a conversation)
    conversation = await db.conversations.find_one({
        "listing_id": review.listing_id,
        "$or": [{"buyer_id": user["id"]}, {"seller_id": user["id"]}]
    })
    
    # Get listing title
    listing = await db.listings.find_one({"id": review.listing_id}, {"_id": 0})
    listing_title = listing["title"] if listing else "Unknown Listing"
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "reviewer_id": user["id"],
        "seller_id": review.seller_id,
        "listing_id": review.listing_id,
        "listing_title": listing_title,
        "rating": review.rating,
        "comment": review.comment,
        "seller_response": None,
        "seller_response_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    # Update seller rating
    all_reviews = await db.reviews.find({"seller_id": review.seller_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.users.update_one(
        {"id": review.seller_id},
        {"$set": {"rating_avg": round(avg_rating, 1), "rating_count": len(all_reviews)}}
    )
    
    review_doc["reviewer_name"] = user["name"]
    review_doc["reviewer_avatar"] = user.get("avatar")
    review_doc.pop("_id", None)
    return review_doc

@api_router.post("/reviews/{review_id}/reply")
async def reply_to_review(review_id: str, reply: ReviewReply, user: dict = Depends(get_current_user)):
    """Seller can respond to a review"""
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only the seller can respond to this review")
    
    if review.get("seller_response"):
        raise HTTPException(status_code=400, detail="You have already responded to this review")
    
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": {
            "seller_response": reply.response,
            "seller_response_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Response added successfully"}

@api_router.get("/reviews/listing/{listing_id}")
async def get_listing_reviews(listing_id: str):
    reviews = await db.reviews.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for review in reviews:
        reviewer = await db.users.find_one({"id": review["reviewer_id"]}, {"_id": 0})
        if reviewer:
            review["reviewer_name"] = reviewer["name"]
            review["reviewer_avatar"] = reviewer.get("avatar")
        # Get listing title if not present
        if not review.get("listing_title"):
            listing = await db.listings.find_one({"id": review["listing_id"]}, {"_id": 0})
            review["listing_title"] = listing["title"] if listing else "Unknown"
    return reviews

@api_router.get("/reviews/seller/{seller_id}")
async def get_seller_reviews(seller_id: str):
    reviews = await db.reviews.find({"seller_id": seller_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for review in reviews:
        reviewer = await db.users.find_one({"id": review["reviewer_id"]}, {"_id": 0})
        if reviewer:
            review["reviewer_name"] = reviewer["name"]
            review["reviewer_avatar"] = reviewer.get("avatar")
        # Get listing title if not present
        if not review.get("listing_title"):
            listing = await db.listings.find_one({"id": review["listing_id"]}, {"_id": 0})
            review["listing_title"] = listing["title"] if listing else "Unknown"
    return reviews

@api_router.get("/reviews/my-reviews")
async def get_my_reviews(user: dict = Depends(get_current_user)):
    """Get reviews left by the current user"""
    reviews = await db.reviews.find({"reviewer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for review in reviews:
        seller = await db.users.find_one({"id": review["seller_id"]}, {"_id": 0})
        if seller:
            review["seller_name"] = seller["name"]
        listing = await db.listings.find_one({"id": review["listing_id"]}, {"_id": 0})
        if listing:
            review["listing_title"] = listing["title"]
    return reviews

@api_router.get("/reviews/received")
async def get_received_reviews(user: dict = Depends(get_current_user)):
    """Get reviews received by the current user (as seller)"""
    reviews = await db.reviews.find({"seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for review in reviews:
        reviewer = await db.users.find_one({"id": review["reviewer_id"]}, {"_id": 0})
        if reviewer:
            review["reviewer_name"] = reviewer["name"]
            review["reviewer_avatar"] = reviewer.get("avatar")
        listing = await db.listings.find_one({"id": review["listing_id"]}, {"_id": 0})
        if listing:
            review["listing_title"] = listing["title"]
    return reviews

# ============== CHAT REPORT ROUTES ==============

@api_router.post("/chat-reports")
async def report_chat(report: ChatReportCreate, user: dict = Depends(get_current_user)):
    """Report a conversation or specific message"""
    # Verify user is part of conversation
    conv = await db.conversations.find_one({"id": report.conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user["id"] not in [conv["buyer_id"], conv["seller_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the other user's info
    other_user_id = conv["seller_id"] if conv["buyer_id"] == user["id"] else conv["buyer_id"]
    other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0})
    
    # If reporting specific message, verify it exists
    reported_message = None
    if report.message_id:
        msg = await db.messages.find_one({"id": report.message_id}, {"_id": 0})
        if not msg or msg["conversation_id"] != report.conversation_id:
            raise HTTPException(status_code=404, detail="Message not found")
        reported_message = msg["text"]
    
    report_doc = {
        "id": str(uuid.uuid4()),
        "reporter_id": user["id"],
        "conversation_id": report.conversation_id,
        "message_id": report.message_id,
        "reported_message": reported_message,
        "reported_user_id": other_user_id,
        "reported_user_name": other_user["name"] if other_user else "Unknown",
        "reason": report.reason,
        "details": report.details,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_reports.insert_one(report_doc)
    
    return {"success": True, "message": "Report submitted successfully", "report_id": report_doc["id"]}

@api_router.get("/admin/chat-reports")
async def get_chat_reports_admin(
    status: Optional[str] = None,
    user: dict = Depends(get_admin_user)
):
    """Get all chat reports (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    reports = await db.chat_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with reporter info
    for report in reports:
        reporter = await db.users.find_one({"id": report["reporter_id"]}, {"_id": 0, "password": 0})
        if reporter:
            report["reporter_name"] = reporter["name"]
    
    return reports

@api_router.put("/admin/chat-reports/{report_id}/review")
async def review_chat_report(report_id: str, action: str = "resolved", user: dict = Depends(get_admin_user)):
    """Review a chat report (admin only)"""
    await db.chat_reports.update_one(
        {"id": report_id},
        {"$set": {
            "status": action,  # resolved, dismissed
            "reviewed_by": user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True}

# ============== REPORT ROUTES ==============

@api_router.post("/reports")
async def create_report(report: ReportCreate, user: dict = Depends(get_current_user)):
    report_doc = {
        "id": str(uuid.uuid4()),
        "reporter_id": user["id"],
        "target_type": report.target_type,
        "target_id": report.target_id,
        "reason": report.reason,
        "details": report.details,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report_doc)
    # Remove MongoDB _id from response
    report_doc.pop("_id", None)
    return {"message": "Report submitted", "id": report_doc["id"]}

@api_router.get("/admin/reports")
async def get_reports(status: Optional[str] = None, user: dict = Depends(get_admin_user)):
    query = {}
    if status:
        query["status"] = status
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    for report in reports:
        reporter = await db.users.find_one({"id": report["reporter_id"]}, {"_id": 0})
        report["reporter_name"] = reporter["name"] if reporter else "Unknown"
    
    return reports

@api_router.put("/admin/reports/{report_id}")
async def update_report(report_id: str, status: str, user: dict = Depends(get_admin_user)):
    await db.reports.update_one({"id": report_id}, {"$set": {"status": status}})
    return {"message": "Report updated"}

# ============== BLOG ROUTES ==============

@api_router.get("/blog/posts")
async def get_blog_posts(category: Optional[str] = None, limit: int = 10):
    query = {}
    if category:
        query["category"] = category
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for post in posts:
        author = await db.users.find_one({"id": post["author_id"]}, {"_id": 0})
        post["author_name"] = author["name"] if author else "Unknown"
    
    return posts

@api_router.get("/blog/posts/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment views
    await db.blog_posts.update_one({"slug": slug}, {"$inc": {"views_count": 1}})
    
    author = await db.users.find_one({"id": post["author_id"]}, {"_id": 0})
    post["author_name"] = author["name"] if author else "Unknown"
    
    return post

@api_router.post("/admin/blog/posts", response_model=BlogPostResponse)
async def create_blog_post(post: BlogPostCreate, user: dict = Depends(get_admin_user)):
    post_doc = {
        "id": str(uuid.uuid4()),
        **post.model_dump(),
        "author_id": user["id"],
        "views_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.blog_posts.insert_one(post_doc)
    post_doc["author_name"] = user["name"]
    return post_doc

# ============== STATIC PAGES ROUTES ==============

@api_router.get("/pages", response_model=List[StaticPageResponse])
async def get_pages():
    pages = await db.pages.find({}, {"_id": 0}).to_list(100)
    return pages

@api_router.get("/pages/{slug}", response_model=StaticPageResponse)
async def get_page(slug: str):
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@api_router.post("/admin/pages", response_model=StaticPageResponse)
async def create_page(page: StaticPageCreate, user: dict = Depends(get_admin_user)):
    page_doc = {
        "id": str(uuid.uuid4()),
        **page.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pages.insert_one(page_doc)
    return page_doc

@api_router.put("/admin/pages/{page_id}", response_model=StaticPageResponse)
async def update_page(page_id: str, page: StaticPageCreate, user: dict = Depends(get_admin_user)):
    await db.pages.update_one(
        {"id": page_id},
        {"$set": {**page.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.pages.find_one({"id": page_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/pages/{page_id}")
async def delete_page(page_id: str, user: dict = Depends(get_admin_user)):
    await db.pages.delete_one({"id": page_id})
    return {"message": "Page deleted"}

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/users")
async def admin_get_users(user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, update: AdminUserUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return updated

@api_router.get("/admin/listings")
async def admin_get_listings(status: Optional[str] = None, user_id: Optional[str] = None, user: dict = Depends(get_admin_user)):
    query = {}
    if status:
        query["status"] = status
    if user_id:
        query["seller_id"] = user_id
    
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for listing in listings:
        cat = await db.categories.find_one({"id": listing["category_id"]}, {"_id": 0})
        listing["category_name"] = cat["name"] if cat else "Unknown"
        listing["subcategory_name"] = None
        seller = await db.users.find_one({"id": listing["seller_id"]}, {"_id": 0})
        if seller:
            listing["seller_name"] = seller["name"]
            listing["seller_avatar"] = seller.get("avatar")
            listing["seller_verified"] = seller.get("is_seller_verified", False)
            listing["seller_rating"] = seller.get("rating_avg", 0)
    
    return listings

@api_router.put("/admin/listings/{listing_id}")
async def admin_update_listing(listing_id: str, update: AdminListingUpdate, user: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    cat = await db.categories.find_one({"id": updated["category_id"]}, {"_id": 0})
    updated["category_name"] = cat["name"] if cat else "Unknown"
    updated["subcategory_name"] = None
    seller = await db.users.find_one({"id": updated["seller_id"]}, {"_id": 0})
    if seller:
        updated["seller_name"] = seller["name"]
        updated["seller_avatar"] = seller.get("avatar")
        updated["seller_verified"] = seller.get("is_seller_verified", False)
        updated["seller_rating"] = seller.get("rating_avg", 0)
    
    return updated

@api_router.get("/admin/payments")
async def admin_get_payments(user_id: Optional[str] = None, user: dict = Depends(get_admin_user)):
    query = {}
    if user_id:
        query["user_id"] = user_id
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return payments

@api_router.get("/admin/stats")
async def admin_get_stats(user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    banned_users = await db.users.count_documents({"is_suspended": True})
    verified_users = await db.users.count_documents({"is_seller_verified": True})
    total_listings = await db.listings.count_documents({})
    active_listings = await db.listings.count_documents({"status": "active"})
    pending_listings = await db.listings.count_documents({"status": "pending_payment"})
    total_payments = await db.payments.count_documents({"status": "completed"})
    pending_reports = await db.reports.count_documents({"status": "pending"})
    pending_chat_reports = await db.chat_reports.count_documents({"status": "pending"})
    pending_kyc = await db.kyc_submissions.count_documents({"status": "pending"})
    
    # Calculate revenue
    payments = await db.payments.find({"status": "completed"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(p["amount"] for p in payments)
    
    return {
        "total_users": total_users,
        "banned_users": banned_users,
        "verified_users": verified_users,
        "total_listings": total_listings,
        "active_listings": active_listings,
        "pending_listings": pending_listings,
        "total_payments": total_payments,
        "total_revenue": total_revenue,
        "pending_reports": pending_reports,
        "pending_chat_reports": pending_chat_reports,
        "pending_kyc": pending_kyc
    }

# ============== ENHANCED ADMIN ROUTES ==============

# Admin: Ban user
@api_router.post("/admin/users/{user_id}/ban")
async def admin_ban_user(user_id: str, user: dict = Depends(get_admin_user)):
    """Ban a user (disable login)"""
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot ban admin users")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_suspended": True, "banned_at": datetime.now(timezone.utc).isoformat(), "banned_by": user["id"]}})
    return {"message": "User banned successfully"}

# Admin: Unban user
@api_router.post("/admin/users/{user_id}/unban")
async def admin_unban_user(user_id: str, user: dict = Depends(get_admin_user)):
    """Unban a user"""
    await db.users.update_one({"id": user_id}, {"$set": {"is_suspended": False}, "$unset": {"banned_at": "", "banned_by": ""}})
    return {"message": "User unbanned successfully"}

# Admin: Delete user permanently
@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, user: dict = Depends(get_admin_user)):
    """Permanently delete a user and their data"""
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    # Delete user's listings
    await db.listings.delete_many({"seller_id": user_id})
    # Delete user's messages
    await db.messages.delete_many({"sender_id": user_id})
    # Delete user's conversations where they're a participant
    await db.conversations.delete_many({"participants": user_id})
    # Delete user's reviews
    await db.reviews.delete_many({"$or": [{"reviewer_id": user_id}, {"seller_id": user_id}]})
    # Delete user's KYC
    await db.kyc_submissions.delete_many({"user_id": user_id})
    # Delete the user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User and all related data deleted"}

# Admin: Verify user manually (after KYC approval)
@api_router.post("/admin/users/{user_id}/verify")
async def admin_verify_user(user_id: str, user: dict = Depends(get_admin_user)):
    """Manually verify a user"""
    await db.users.update_one({"id": user_id}, {"$set": {"is_seller_verified": True, "verification_status": "verified", "verified_at": datetime.now(timezone.utc).isoformat(), "verified_by": user["id"]}})
    return {"message": "User verified successfully"}

# Admin: Change user role
@api_router.post("/admin/users/{user_id}/role")
async def admin_change_role(user_id: str, role: str, user: dict = Depends(get_admin_user)):
    """Change user role (user, seller, admin)"""
    if role not in ["user", "seller", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be: user, seller, or admin")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$set": {"role": role, "role_changed_at": datetime.now(timezone.utc).isoformat(), "role_changed_by": user["id"]}})
    return {"message": f"User role changed to {role}"}

# Admin: Bulk user operations
class BulkUserAction(BaseModel):
    user_ids: List[str]
    action: str  # ban, unban, delete, verify, change_role
    role: Optional[str] = None  # Required if action is change_role

@api_router.post("/admin/users/bulk")
async def admin_bulk_user_action(data: BulkUserAction, user: dict = Depends(get_admin_user)):
    """Bulk user operations"""
    results = {"success": 0, "failed": 0, "errors": []}
    
    for user_id in data.user_ids:
        try:
            if data.action == "ban":
                await db.users.update_one({"id": user_id, "role": {"$ne": "admin"}}, {"$set": {"is_suspended": True, "banned_at": datetime.now(timezone.utc).isoformat()}})
            elif data.action == "unban":
                await db.users.update_one({"id": user_id}, {"$set": {"is_suspended": False}})
            elif data.action == "delete":
                target = await db.users.find_one({"id": user_id})
                if target and target.get("role") != "admin":
                    await db.listings.delete_many({"seller_id": user_id})
                    await db.users.delete_one({"id": user_id})
            elif data.action == "verify":
                await db.users.update_one({"id": user_id}, {"$set": {"is_seller_verified": True, "verification_status": "verified"}})
            elif data.action == "change_role" and data.role:
                await db.users.update_one({"id": user_id}, {"$set": {"role": data.role}})
            results["success"] += 1
        except Exception as e:
            results["failed"] += 1
            results["errors"].append({"user_id": user_id, "error": str(e)})
    
    return results

# Admin: Bulk listing operations
class BulkListingAction(BaseModel):
    listing_ids: List[str]
    action: str  # delete, approve, reject, feature, unfeature

@api_router.post("/admin/listings/bulk")
async def admin_bulk_listing_action(data: BulkListingAction, user: dict = Depends(get_admin_user)):
    """Bulk listing operations"""
    results = {"success": 0, "failed": 0}
    
    for listing_id in data.listing_ids:
        try:
            if data.action == "delete":
                await db.listings.update_one({"id": listing_id}, {"$set": {"status": "deleted"}})
            elif data.action == "approve":
                await db.listings.update_one({"id": listing_id}, {"$set": {"status": "active"}})
            elif data.action == "reject":
                await db.listings.update_one({"id": listing_id}, {"$set": {"status": "rejected"}})
            elif data.action == "feature":
                await db.listings.update_one({"id": listing_id}, {"$set": {"featured": True}})
            elif data.action == "unfeature":
                await db.listings.update_one({"id": listing_id}, {"$set": {"featured": False}})
            results["success"] += 1
        except:
            results["failed"] += 1
    
    return results

# Admin: Bulk report operations
class BulkReportAction(BaseModel):
    report_ids: List[str]
    action: str  # resolve, dismiss
    report_type: str  # ad, chat

@api_router.post("/admin/reports/bulk")
async def admin_bulk_report_action(data: BulkReportAction, user: dict = Depends(get_admin_user)):
    """Bulk report operations"""
    results = {"success": 0, "failed": 0}
    collection = db.chat_reports if data.report_type == "chat" else db.reports
    
    for report_id in data.report_ids:
        try:
            status = "resolved" if data.action == "resolve" else "dismissed"
            await collection.update_one({"id": report_id}, {"$set": {"status": status, "reviewed_at": datetime.now(timezone.utc).isoformat(), "reviewed_by": user["id"]}})
            results["success"] += 1
        except:
            results["failed"] += 1
    
    return results

# Admin: View all conversations
@api_router.get("/admin/conversations")
async def admin_get_all_conversations(user: dict = Depends(get_admin_user)):
    """Get all conversations for admin monitoring"""
    conversations = await db.conversations.find({}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    
    for conv in conversations:
        # Get participants info
        participants_info = []
        for pid in conv.get("participants", []):
            p_user = await db.users.find_one({"id": pid}, {"_id": 0, "password": 0})
            if p_user:
                participants_info.append({"id": p_user["id"], "name": p_user["name"], "avatar": p_user.get("avatar")})
        conv["participants_info"] = participants_info
        
        # Get listing info
        if conv.get("listing_id"):
            listing = await db.listings.find_one({"id": conv["listing_id"]}, {"_id": 0})
            if listing:
                conv["listing_title"] = listing.get("title")
                images = listing.get("images", [])
                conv["listing_image"] = images[0] if images else None
        
        # Get last message
        last_msg = await db.messages.find_one({"conversation_id": conv["id"]}, {"_id": 0}, sort=[("created_at", -1)])
        if last_msg:
            conv["last_message"] = last_msg.get("text", "")[:50]
            conv["last_message_at"] = last_msg.get("created_at")
        
        # Count total messages
        conv["message_count"] = await db.messages.count_documents({"conversation_id": conv["id"]})
    
    return conversations

# Admin: View specific conversation messages
@api_router.get("/admin/conversations/{conv_id}/messages")
async def admin_get_conversation_messages(conv_id: str, user: dict = Depends(get_admin_user)):
    """Get all messages in a conversation for admin review"""
    messages = await db.messages.find({"conversation_id": conv_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    for msg in messages:
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0, "password": 0})
        if sender:
            msg["sender_name"] = sender["name"]
            msg["sender_avatar"] = sender.get("avatar")
    
    return messages

# Admin: Export data to Excel (JSON format for frontend to convert)
@api_router.get("/admin/export/{export_type}")
async def admin_export_data(export_type: str, user: dict = Depends(get_admin_user)):
    """Export data for admin (users, payments, listings, reports)"""
    
    if export_type == "users":
        users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(10000)
        # Enrich with KYC info
        for u in users:
            kyc = await db.kyc_submissions.find_one({"user_id": u["id"]}, {"_id": 0})
            if kyc:
                u["kyc_status"] = kyc.get("status")
                u["kyc_document_type"] = kyc.get("document_type")
                u["kyc_submitted_at"] = kyc.get("created_at")
        return users
    
    elif export_type == "payments":
        payments = await db.payments.find({}, {"_id": 0}).to_list(10000)
        # Enrich with user and listing info
        for p in payments:
            user_info = await db.users.find_one({"id": p["user_id"]}, {"_id": 0, "password": 0})
            if user_info:
                p["user_name"] = user_info["name"]
                p["user_email"] = user_info.get("email")
                p["user_phone"] = user_info.get("phone")
            listing = await db.listings.find_one({"id": p["listing_id"]}, {"_id": 0})
            if listing:
                p["listing_title"] = listing.get("title")
                p["listing_category"] = listing.get("category_id")
        return payments
    
    elif export_type == "listings":
        listings = await db.listings.find({}, {"_id": 0}).to_list(10000)
        for l in listings:
            seller = await db.users.find_one({"id": l["seller_id"]}, {"_id": 0, "password": 0})
            if seller:
                l["seller_name"] = seller["name"]
                l["seller_email"] = seller.get("email")
            cat = await db.categories.find_one({"id": l["category_id"]}, {"_id": 0})
            if cat:
                l["category_name"] = cat["name"]
        return listings
    
    elif export_type == "reports":
        # Combine ad reports and chat reports
        ad_reports = await db.reports.find({}, {"_id": 0}).to_list(10000)
        for r in ad_reports:
            r["report_type"] = "ad"
            reporter = await db.users.find_one({"id": r.get("reported_by")}, {"_id": 0, "password": 0})
            if reporter:
                r["reporter_name"] = reporter["name"]
        
        chat_reports = await db.chat_reports.find({}, {"_id": 0}).to_list(10000)
        for r in chat_reports:
            r["report_type"] = "chat"
            reporter = await db.users.find_one({"id": r.get("reported_by")}, {"_id": 0, "password": 0})
            if reporter:
                r["reporter_name"] = reporter["name"]
        
        return {"ad_reports": ad_reports, "chat_reports": chat_reports}
    
    elif export_type == "kyc":
        kyc_submissions = await db.kyc_submissions.find({}, {"_id": 0}).to_list(10000)
        for k in kyc_submissions:
            user_info = await db.users.find_one({"id": k["user_id"]}, {"_id": 0, "password": 0})
            if user_info:
                k["user_name"] = user_info["name"]
                k["user_email"] = user_info.get("email")
                k["user_phone"] = user_info.get("phone")
        return kyc_submissions
    
    else:
        raise HTTPException(status_code=400, detail="Invalid export type")

# ============== INVOICE GENERATION ==============

@api_router.get("/payments/{payment_id}/invoice")
async def get_payment_invoice(payment_id: str, user: dict = Depends(get_current_user)):
    """Get invoice data for a payment"""
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify user owns this payment or is admin
    if payment["user_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get listing info
    listing = await db.listings.find_one({"id": payment["listing_id"]}, {"_id": 0})
    
    # Get user info
    payer = await db.users.find_one({"id": payment["user_id"]}, {"_id": 0, "password": 0})
    
    # Calculate GST breakdown (18% GST assumed)
    base_amount = round(payment["amount"] / 1.18, 2)
    gst_amount = round(payment["amount"] - base_amount, 2)
    
    invoice_data = {
        "invoice_number": f"GGS-INV-{payment_id[:8].upper()}",
        "invoice_date": payment.get("created_at", datetime.now(timezone.utc).isoformat()),
        "payment_id": payment_id,
        "transaction_id": payment.get("transaction_id", f"TXN-{payment_id[:12].upper()}"),
        "payment_method": payment.get("payment_method", "Online Payment"),
        "payment_status": payment.get("status", "completed"),
        
        # User details
        "user_id": payer["id"] if payer else None,
        "user_name": payer["name"] if payer else "Unknown",
        "user_email": payer.get("email") if payer else None,
        "user_phone": payer.get("phone") if payer else None,
        
        # Listing/Ad details
        "ad_id": listing["id"] if listing else None,
        "ad_title": listing["title"] if listing else "Unknown",
        "ad_category": listing.get("category_id") if listing else None,
        
        # Amount breakdown
        "base_amount": base_amount,
        "gst_rate": 18,
        "gst_amount": gst_amount,
        "total_amount": payment["amount"],
        
        # Company details
        "company_name": "Game Gear Swap (GGS)",
        "company_tagline": "Kerala's Trusted Gaming Marketplace",
        "company_address": "Kerala, India",
        "company_email": "support@ggs.com",
        "company_gstin": "GSTIN-PLACEHOLDER",  # Placeholder
        "copyright": "MALMER"
    }
    
    return invoice_data

# User: Get my payments with invoice capability
@api_router.get("/payments/my")
async def get_my_payments(user: dict = Depends(get_current_user)):
    """Get current user's payments"""
    payments = await db.payments.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for p in payments:
        listing = await db.listings.find_one({"id": p["listing_id"]}, {"_id": 0})
        if listing:
            p["listing_title"] = listing.get("title")
            images = listing.get("images", [])
            p["listing_image"] = images[0] if images else None
    
    return payments

# ============== IMAGE UPLOAD ==============

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    contents = await file.read()
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename
    
    with open(filepath, 'wb') as f:
        f.write(contents)
    
    return {"url": f"/api/uploads/{filename}"}

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_database():
    """Seed database with initial data"""
    
    # Check if already seeded
    admin = await db.users.find_one({"email": "admin@ggs.com"})
    if admin:
        return {"message": "Database already seeded"}
    
    # Create admin user
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": "admin@ggs.com",
        "phone": "+919876543210",
        "password": hash_password("admin123"),
        "name": "Admin",
        "auth_type": "email",
        "role": "admin",
        "is_verified": True,
        "is_seller_verified": True,
        "is_suspended": False,
        "avatar": None,
        "location": "Kochi",
        "bio": "GGS Administrator",
        "rating_avg": 5.0,
        "rating_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_doc)
    
    # Create test user
    test_user_doc = {
        "id": str(uuid.uuid4()),
        "email": "user@ggs.com",
        "phone": "+919876543211",
        "password": hash_password("user123"),
        "name": "Test Seller",
        "auth_type": "email",
        "role": "user",
        "is_verified": True,
        "is_seller_verified": True,
        "is_suspended": False,
        "avatar": None,
        "location": "Thiruvananthapuram",
        "bio": "Gaming enthusiast selling quality gear",
        "rating_avg": 4.5,
        "rating_count": 12,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(test_user_doc)
    
    # Create categories with subcategories
    categories = [
        {
            "id": str(uuid.uuid4()),
            "name": "PC Components",
            "slug": "pc-components",
            "icon": "Cpu",
            "description": "CPUs, GPUs, Motherboards, RAM, Storage, PSUs, Cooling, Cases",
            "subcategories": [
                {"id": str(uuid.uuid4()), "name": "CPUs / Processors", "slug": "cpus"},
                {"id": str(uuid.uuid4()), "name": "Graphics Cards", "slug": "gpus"},
                {"id": str(uuid.uuid4()), "name": "Motherboards", "slug": "motherboards"},
                {"id": str(uuid.uuid4()), "name": "RAM / Memory", "slug": "ram"},
                {"id": str(uuid.uuid4()), "name": "Storage (SSD/HDD)", "slug": "storage"},
                {"id": str(uuid.uuid4()), "name": "Power Supplies", "slug": "psu"},
                {"id": str(uuid.uuid4()), "name": "Cooling", "slug": "cooling"},
                {"id": str(uuid.uuid4()), "name": "Cases", "slug": "cases"},
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Gaming Peripherals",
            "slug": "peripherals",
            "icon": "Keyboard",
            "description": "Keyboards, Mice, Headsets, Controllers, Monitors",
            "subcategories": [
                {"id": str(uuid.uuid4()), "name": "Keyboards", "slug": "keyboards"},
                {"id": str(uuid.uuid4()), "name": "Mouse", "slug": "mouse"},
                {"id": str(uuid.uuid4()), "name": "Headsets", "slug": "headsets"},
                {"id": str(uuid.uuid4()), "name": "Controllers", "slug": "controllers"},
                {"id": str(uuid.uuid4()), "name": "Monitors", "slug": "monitors"},
                {"id": str(uuid.uuid4()), "name": "Capture Cards", "slug": "capture-cards"},
                {"id": str(uuid.uuid4()), "name": "Webcams", "slug": "webcams"},
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Gaming Consoles",
            "slug": "consoles",
            "icon": "Gamepad2",
            "description": "PlayStation, Xbox, Nintendo, Handhelds",
            "subcategories": [
                {"id": str(uuid.uuid4()), "name": "PlayStation", "slug": "playstation"},
                {"id": str(uuid.uuid4()), "name": "Xbox", "slug": "xbox"},
                {"id": str(uuid.uuid4()), "name": "Nintendo", "slug": "nintendo"},
                {"id": str(uuid.uuid4()), "name": "Handhelds", "slug": "handhelds"},
                {"id": str(uuid.uuid4()), "name": "Retro Consoles", "slug": "retro"},
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Full Systems",
            "slug": "systems",
            "icon": "Monitor",
            "description": "Pre-built PCs, Custom Builds, Gaming Laptops",
            "subcategories": [
                {"id": str(uuid.uuid4()), "name": "Pre-built PCs", "slug": "prebuilt"},
                {"id": str(uuid.uuid4()), "name": "Custom Builds", "slug": "custom"},
                {"id": str(uuid.uuid4()), "name": "Gaming Laptops", "slug": "laptops"},
                {"id": str(uuid.uuid4()), "name": "Mini PCs", "slug": "mini-pc"},
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Digital Goods",
            "slug": "digital",
            "icon": "Download",
            "description": "Game Accounts, In-game Items, Game Keys",
            "subcategories": [
                {"id": str(uuid.uuid4()), "name": "Game Accounts", "slug": "accounts"},
                {"id": str(uuid.uuid4()), "name": "In-game Items", "slug": "ingame"},
                {"id": str(uuid.uuid4()), "name": "Game Keys", "slug": "keys"},
                {"id": str(uuid.uuid4()), "name": "Gift Cards", "slug": "giftcards"},
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Accessories",
            "slug": "accessories",
            "icon": "Package",
            "description": "Cables, Stands, RGB Lighting, Gaming Chairs",
            "subcategories": [
                {"id": str(uuid.uuid4()), "name": "Cables & Adapters", "slug": "cables"},
                {"id": str(uuid.uuid4()), "name": "Stands & Mounts", "slug": "stands"},
                {"id": str(uuid.uuid4()), "name": "RGB Lighting", "slug": "rgb"},
                {"id": str(uuid.uuid4()), "name": "Gaming Chairs", "slug": "chairs"},
                {"id": str(uuid.uuid4()), "name": "Desks", "slug": "desks"},
            ]
        },
    ]
    await db.categories.insert_many(categories)
    
    # Create sample listings
    sample_images = {
        "gpu": "https://images.unsplash.com/photo-1757356747708-f11f10dbda7e?w=800",
        "console": "https://images.unsplash.com/photo-1622979138084-c03ae28968ed?w=800",
        "keyboard": "https://images.unsplash.com/photo-1763136469649-a2d3c15c7723?w=800",
        "headset": "https://images.unsplash.com/photo-1660391532247-4a8ad1060817?w=800",
        "pc": "https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800",
        "monitor": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    }
    
    listings = [
        {
            "id": str(uuid.uuid4()),
            "slug": generate_slug("RTX 4080 Super - Like New"),
            "title": "RTX 4080 Super - Like New",
            "description": "NVIDIA RTX 4080 Super, used for 3 months. Perfect condition with original box. Great for 4K gaming. Warranty valid till 2025.",
            "category_id": categories[0]["id"],
            "subcategory_id": categories[0]["subcategories"][1]["id"],
            "price": 85000,
            "price_type": "negotiable",
            "condition": "Like New",
            "item_type": "physical",
            "location": "Kochi",
            "contact_phone": "+919876543211",
            "contact_method": "both",
            "images": [sample_images["gpu"]],
            "specifications": [
                {"key": "Brand", "value": "NVIDIA"},
                {"key": "VRAM", "value": "16GB GDDR6X"},
                {"key": "Warranty", "value": "Till Dec 2025"}
            ],
            "brand": "NVIDIA",
            "seller_id": test_user_doc["id"],
            "status": "active",
            "payment_status": "completed",
            "featured": True,
            "views_count": 245,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": generate_slug("PlayStation 5 Disc Edition Bundle"),
            "title": "PlayStation 5 Disc Edition Bundle",
            "description": "PS5 Disc Edition with 2 controllers and 5 games including Spider-Man 2, God of War Ragnarok. Excellent condition, barely used.",
            "category_id": categories[2]["id"],
            "subcategory_id": categories[2]["subcategories"][0]["id"],
            "price": 42000,
            "price_type": "fixed",
            "condition": "Excellent",
            "item_type": "physical",
            "location": "Thiruvananthapuram",
            "contact_phone": "+919876543211",
            "contact_method": "chat",
            "images": [sample_images["console"]],
            "specifications": [
                {"key": "Storage", "value": "825GB SSD"},
                {"key": "Includes", "value": "2 Controllers, 5 Games"},
                {"key": "Warranty", "value": "6 months left"}
            ],
            "brand": "Sony",
            "seller_id": test_user_doc["id"],
            "status": "active",
            "payment_status": "completed",
            "featured": True,
            "views_count": 189,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": generate_slug("Logitech G Pro X Superlight"),
            "title": "Logitech G Pro X Superlight",
            "description": "Top-tier wireless gaming mouse, 63g ultralight. Perfect for competitive FPS gaming. Used for 6 months.",
            "category_id": categories[1]["id"],
            "subcategory_id": categories[1]["subcategories"][1]["id"],
            "price": 8500,
            "price_type": "negotiable",
            "condition": "Good",
            "item_type": "physical",
            "location": "Kozhikode",
            "contact_phone": "+919876543211",
            "contact_method": "phone",
            "images": [sample_images["keyboard"]],
            "specifications": [
                {"key": "Sensor", "value": "HERO 25K"},
                {"key": "Weight", "value": "63g"},
                {"key": "Battery", "value": "70 hours"}
            ],
            "brand": "Logitech",
            "seller_id": test_user_doc["id"],
            "status": "active",
            "payment_status": "completed",
            "featured": False,
            "views_count": 98,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": generate_slug("Custom Gaming PC - RTX 4070 Ti"),
            "title": "Custom Gaming PC - RTX 4070 Ti",
            "description": "High-end custom build. Intel i7-13700K, RTX 4070 Ti, 32GB DDR5, 2TB NVMe. Built 4 months ago. RGB everything!",
            "category_id": categories[3]["id"],
            "subcategory_id": categories[3]["subcategories"][1]["id"],
            "price": 145000,
            "price_type": "negotiable",
            "condition": "Like New",
            "item_type": "physical",
            "location": "Thrissur",
            "contact_phone": "+919876543211",
            "contact_method": "both",
            "images": [sample_images["pc"]],
            "specifications": [
                {"key": "CPU", "value": "Intel i7-13700K"},
                {"key": "GPU", "value": "RTX 4070 Ti"},
                {"key": "RAM", "value": "32GB DDR5"},
                {"key": "Storage", "value": "2TB NVMe SSD"}
            ],
            "brand": "Custom",
            "seller_id": test_user_doc["id"],
            "status": "active",
            "payment_status": "completed",
            "featured": True,
            "views_count": 312,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": generate_slug("SteelSeries Arctis Pro Wireless"),
            "title": "SteelSeries Arctis Pro Wireless",
            "description": "Premium wireless gaming headset with dual battery system. Hi-Res audio certified. Pristine condition.",
            "category_id": categories[1]["id"],
            "subcategory_id": categories[1]["subcategories"][2]["id"],
            "price": 18000,
            "price_type": "fixed",
            "condition": "Like New",
            "item_type": "physical",
            "location": "Kannur",
            "contact_phone": "+919876543211",
            "contact_method": "chat",
            "images": [sample_images["headset"]],
            "specifications": [
                {"key": "Type", "value": "Wireless"},
                {"key": "Battery", "value": "Dual Swappable"},
                {"key": "Audio", "value": "Hi-Res Certified"}
            ],
            "brand": "SteelSeries",
            "seller_id": test_user_doc["id"],
            "status": "active",
            "payment_status": "completed",
            "featured": True,
            "views_count": 156,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": generate_slug("ASUS ROG Swift 27\" 165Hz Monitor"),
            "title": "ASUS ROG Swift 27\" 165Hz Monitor",
            "description": "27 inch 1440p IPS gaming monitor. 165Hz, 1ms response, G-Sync compatible. Perfect for competitive gaming.",
            "category_id": categories[1]["id"],
            "subcategory_id": categories[1]["subcategories"][4]["id"],
            "price": 28000,
            "price_type": "negotiable",
            "condition": "Excellent",
            "item_type": "physical",
            "location": "Kochi",
            "contact_phone": "+919876543211",
            "contact_method": "both",
            "images": [sample_images["monitor"]],
            "specifications": [
                {"key": "Size", "value": "27 inch"},
                {"key": "Resolution", "value": "2560x1440"},
                {"key": "Refresh Rate", "value": "165Hz"},
                {"key": "Panel", "value": "IPS"}
            ],
            "brand": "ASUS",
            "seller_id": test_user_doc["id"],
            "status": "active",
            "payment_status": "completed",
            "featured": False,
            "views_count": 87,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
    ]
    await db.listings.insert_many(listings)
    
    # Create static pages
    pages = [
        {
            "id": str(uuid.uuid4()),
            "slug": "about",
            "title": "About GGS",
            "content": "# About Game Gear Swap\n\nGGS (Game Gear Swap) is Kerala's premier marketplace for buying and selling gaming gear. Founded by MALMER, we connect gamers to trade pre-owned gaming equipment safely.\n\n## Our Mission\n\nTo create a trusted community where gamers can buy and sell their equipment at fair prices.\n\n## Why Choose GGS?\n\n- **Verified Sellers**: All sellers can get verified through our KYC process\n- **Secure Messaging**: Chat directly with buyers/sellers\n- **Local Focus**: Currently serving all of Kerala\n- **Fair Pricing**: Community-driven prices",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "contact",
            "title": "Contact Us",
            "content": "# Contact Us\n\nWe'd love to hear from you!\n\n## Get in Touch\n\n- **Email**: support@ggs.com\n- **Phone**: +91 9876543210\n- **Location**: Kochi, Kerala, India\n\n## Business Hours\n\nMonday - Saturday: 10 AM - 7 PM IST\n\n## Response Time\n\nWe typically respond within 24 hours.",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "terms",
            "title": "Terms and Conditions",
            "content": "# Terms and Conditions\n\n**Last Updated**: January 2024\n\n## 1. Acceptance\n\nBy using GGS, you agree to these terms.\n\n## 2. User Responsibilities\n\n- Provide accurate information\n- Not post prohibited items\n- Complete transactions honestly\n\n## 3. Listing Fee\n\nA ₹10 service fee is charged per listing to maintain platform quality.\n\n## 4. Prohibited Items\n\n- Stolen goods\n- Counterfeit products\n- Illegal software\n- Pirated games\n\n## 5. Termination\n\nWe reserve the right to terminate accounts that violate these terms.",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "privacy-policy",
            "title": "Privacy Policy",
            "content": "# Privacy Policy\n\n**Last Updated**: January 2024\n\n## Information We Collect\n\n- Account information (name, email, phone)\n- Listing details\n- Transaction history\n\n## How We Use Your Information\n\n- To provide our services\n- To communicate with you\n- To ensure platform security\n\n## Data Security\n\nWe implement appropriate security measures to protect your personal information.\n\n## Contact\n\nFor privacy concerns, email us at privacy@ggs.com",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "refund-policy",
            "title": "Refund Policy",
            "content": "# Refund Policy\n\n**Last Updated**: January 2024\n\n## Listing Fee\n\nThe ₹10 listing fee is non-refundable once a listing goes live.\n\n## Disputes\n\nBuyer-seller disputes should be resolved between parties. GGS may assist in mediation.\n\n## Fraudulent Listings\n\nIf a listing is removed due to fraud, you may be eligible for a refund.\n\n## Contact\n\nFor refund requests, email support@ggs.com",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "prohibited-items",
            "title": "Prohibited Items",
            "content": "# Prohibited Items\n\nThe following items are not allowed on GGS:\n\n## Hardware\n- Stolen equipment\n- Counterfeit products\n- Damaged items sold as working\n\n## Digital\n- Stolen accounts\n- Pirated software\n- Cheats/hacks\n- Accounts obtained through fraud\n\n## General\n- Items from sanctioned countries\n- Illegal modifications\n\nViolating these rules will result in account termination.",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "verified-sellers",
            "title": "Verified Sellers",
            "content": "# Verified Sellers Program\n\n## What is Verification?\n\nVerified sellers have completed our KYC process, proving their identity and reliability.\n\n## Benefits\n\n- **Trust Badge**: Display on all your listings\n- **Priority Support**: Faster response from our team\n- **Featured Placement**: Higher visibility in search\n\n## How to Get Verified\n\n1. Go to Dashboard → Settings\n2. Click 'Apply for Verification'\n3. Submit required documents\n4. Wait 2-3 business days for review\n\n## Requirements\n\n- Valid government ID\n- Phone number verification\n- At least 3 successful transactions",
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
    ]
    await db.pages.insert_many(pages)
    
    # Create sample blog posts
    blog_posts = [
        {
            "id": str(uuid.uuid4()),
            "title": "How to Spot a Good GPU Deal",
            "slug": "how-to-spot-good-gpu-deal",
            "excerpt": "Learn the key indicators of a legitimate used GPU listing and avoid common scams.",
            "content": "# How to Spot a Good GPU Deal\n\nBuying a used graphics card can be tricky...\n\n## Check the Warranty\n\nAlways ask for warranty status...\n\n## Mining History\n\nBe cautious of cards that were used for mining...",
            "category": "Buying Guides",
            "cover_image": "https://images.unsplash.com/photo-1757356747708-f11f10dbda7e?w=800",
            "tags": ["GPU", "Buying Guide", "Tips"],
            "author_id": admin_doc["id"],
            "views_count": 523,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Top 5 Scams to Avoid When Buying Used Gaming Gear",
            "slug": "top-5-scams-avoid-buying-used-gaming-gear",
            "excerpt": "Protect yourself from common scams in the used gaming marketplace.",
            "content": "# Top 5 Scams to Avoid\n\n## 1. Too Good to Be True Prices\n\nIf a deal seems too good...\n\n## 2. No Original Box or Invoice\n\nAlways ask for proof of purchase...",
            "category": "Scam Awareness",
            "cover_image": "https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800",
            "tags": ["Safety", "Scams", "Tips"],
            "author_id": admin_doc["id"],
            "views_count": 892,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
    ]
    await db.blog_posts.insert_many(blog_posts)
    
    return {"message": "Database seeded successfully", "admin_email": "admin@ggs.com", "admin_password": "admin123"}

# Root route
@api_router.get("/")
async def root():
    return {"message": "GGS API - Game Gear Swap", "version": "2.0"}

# Include the router in the main app
app.include_router(api_router)

# Serve uploaded files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
