from fastapi import FastAPI, HTTPException, Depends, Header, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
import os
import jwt
import hashlib
import secrets
import re

app = FastAPI(title="Natural Plylam Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "plylam_admin")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

JWT_SECRET = os.environ.get("JWT_SECRET", "plylam_secret_key_2024")
JWT_ALGORITHM = "HS256"

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id", ""))
    return doc

def get_next_customer_id():
    max_id = db.customers.find_one(sort=[("id", -1)])
    return (max_id["id"] + 1) if max_id and "id" in max_id else 1

# Pydantic Models
class LoginRequest(BaseModel):
    email: str
    password: str
    app_role: Optional[str] = None

class RegisterRequest(BaseModel):
    name: str
    contactPerson: str
    phone: str
    email: str
    password: str

class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contactPerson: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=1, max_length=20)
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    pricing_type: int = Field(default=1, ge=1, le=5)
    credit_limit: Optional[float] = 0
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contactPerson: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    pricing_type: Optional[int] = Field(None, ge=1, le=5)
    credit_limit: Optional[float] = None
    notes: Optional[str] = None
    approval_status: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    approval_status: Optional[str] = None
    pricing_type: Optional[int] = 1

class OrderStatusUpdate(BaseModel):
    order_id: str
    status: str

class InvoicePaidRequest(BaseModel):
    invoice_id: str

class ApproveCustomerRequest(BaseModel):
    customer_id: int

# Initialize demo data
def init_demo_data():
    if db.users.count_documents({}) > 0:
        return
    
    admin = {
        "email": "admin@naturalplylam.com",
        "password": hash_password("admin123"),
        "name": "Admin User",
        "role": "Super Admin",
        "phone": "9876543210",
        "approval_status": "Approved",
        "pricing_type": 1,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.users.insert_one(admin)
    
    manager = {
        "email": "manager@naturalplylam.com",
        "password": hash_password("manager123"),
        "name": "Manager User",
        "role": "Manager",
        "phone": "9876543211",
        "approval_status": "Approved",
        "pricing_type": 1,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.users.insert_one(manager)
    
    # Sales Person
    sales_person = {
        "email": "sales@naturalplylam.com",
        "password": hash_password("sales123"),
        "name": "Rahul Sales",
        "role": "Sales Person",
        "phone": "9876543220",
        "approval_status": "Approved",
        "pricing_type": 1,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    sales_result = db.users.insert_one(sales_person)
    sales_person_id = str(sales_result.inserted_id)
    
    customers = [
        {"email": "customer1@example.com", "name": "ABC Furniture Works", "business_name": "ABC Furniture Works", "contactPerson": "John Doe", "phone": "9876543212", "role": "Customer", "approval_status": "Approved", "is_active": True, "pricing_type": 2, "outstanding_balance": 15000, "credit_limit": 50000, "sales_person_id": sales_person_id, "sales_person_name": "Rahul Sales", "gst_number": "27AABCU9603R1ZM", "address": "123 Industrial Area, Mumbai, Maharashtra - 400001", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"},
        {"email": "customer2@example.com", "name": "XYZ Interiors", "business_name": "XYZ Interiors", "contactPerson": "Jane Smith", "phone": "9876543213", "role": "Customer", "approval_status": "Pending", "is_active": True, "pricing_type": 1, "outstanding_balance": 0, "credit_limit": 25000, "sales_person_id": sales_person_id, "sales_person_name": "Rahul Sales", "address": "456 Commercial Complex, Delhi - 110001", "city": "Delhi", "state": "Delhi", "pincode": "110001"},
        {"email": "customer3@example.com", "name": "Modern Cabinets Ltd", "business_name": "Modern Cabinets Ltd", "contactPerson": "Mike Johnson", "phone": "9876543214", "role": "Customer", "approval_status": "Approved", "is_active": True, "pricing_type": 3, "outstanding_balance": 25000, "credit_limit": 100000, "sales_person_id": sales_person_id, "sales_person_name": "Rahul Sales", "gst_number": "09AAACH7409R1ZZ", "address": "789 Manufacturing Hub, Bangalore - 560001", "city": "Bangalore", "state": "Karnataka", "pincode": "560001"},
        {"email": "customer4@example.com", "name": "Elite Woodworks", "business_name": "Elite Woodworks", "contactPerson": "Sarah Williams", "phone": "9876543215", "role": "Customer", "approval_status": "Pending", "is_active": True, "pricing_type": 1, "outstanding_balance": 0, "credit_limit": 30000, "sales_person_id": sales_person_id, "sales_person_name": "Rahul Sales", "address": "321 Artisan Lane, Chennai - 600001", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600001"},
        {"email": "customer5@example.com", "name": "Premium Plyboards", "business_name": "Premium Plyboards", "contactPerson": "David Brown", "phone": "9876543216", "role": "Customer", "approval_status": "Approved", "is_active": True, "pricing_type": 2, "outstanding_balance": 8500, "credit_limit": 75000, "sales_person_id": sales_person_id, "sales_person_name": "Rahul Sales", "gst_number": "33AABCP1234A1ZX", "address": "567 Trade Center, Hyderabad - 500001", "city": "Hyderabad", "state": "Telangana", "pincode": "500001"},
        {"email": "customer6@example.com", "name": "Classic Interiors", "business_name": "Classic Interiors", "contactPerson": "Emily Davis", "phone": "9876543217", "role": "Customer", "approval_status": "Approved", "is_active": False, "pricing_type": 2, "outstanding_balance": 0, "credit_limit": 40000, "sales_person_id": sales_person_id, "sales_person_name": "Rahul Sales", "address": "890 Design District, Pune - 411001", "city": "Pune", "state": "Maharashtra", "pincode": "411001", "notes": "Account deactivated - payment issues"},
        {"email": "customer7@example.com", "name": "Royal Furnishings", "business_name": "Royal Furnishings", "contactPerson": "Robert Wilson", "phone": "9876543218", "role": "Customer", "approval_status": "Rejected", "is_active": False, "pricing_type": 1, "outstanding_balance": 0, "credit_limit": 0, "sales_person_id": sales_person_id, "sales_person_name": "Rahul Sales", "address": "234 Market Street, Kolkata - 700001", "city": "Kolkata", "state": "West Bengal", "pincode": "700001", "notes": "Rejected - incomplete documentation"},
    ]
    for i, cust in enumerate(customers, 1):
        cust["id"] = i
        cust["password"] = hash_password("customer123")
        cust["created_at"] = datetime.now(timezone.utc).isoformat()
        cust["updated_at"] = datetime.now(timezone.utc).isoformat()
    db.customers.insert_many(customers)
    
    products = [
        {"id": "PLY-001", "name": "Birch Veneer (3/4\")", "category": "Plywood", "price": 85.00, "priceUnit": "ea", "stock_status": "in_stock", "stock_quantity": 100, "description": "High-quality birch veneer plywood.", "pricing_rates": {"1": 85, "2": 80, "3": 75}},
        {"id": "PLY-002", "name": "Marine Plywood (1/2\")", "category": "Plywood", "price": 122.50, "priceUnit": "ea", "stock_status": "in_stock", "stock_quantity": 50, "description": "Water-resistant marine grade plywood.", "pricing_rates": {"1": 122.50, "2": 115, "3": 110}},
        {"id": "TIM-001", "name": "Oak Finish Trim", "category": "Timber", "price": 14.81, "priceUnit": "ea", "stock_status": "in_stock", "stock_quantity": 200, "description": "Solid oak finish trim for elegant interiors.", "pricing_rates": {"1": 14.81, "2": 13.50, "3": 12}},
        {"id": "TIM-002", "name": "Pine Stud (2x4)", "category": "Timber", "price": 5.50, "priceUnit": "ea", "stock_status": "in_stock", "stock_quantity": 500, "description": "Standard pine stud for construction.", "pricing_rates": {"1": 5.50, "2": 5.00, "3": 4.50}},
        {"id": "PLY-003", "name": "Teak Plywood", "category": "Plywood", "price": 150.00, "priceUnit": "ea", "stock_status": "in_stock", "stock_quantity": 30, "description": "Premium teak plywood for luxury furniture.", "pricing_rates": {"1": 150, "2": 140, "3": 130}},
        {"id": "TIM-003", "name": "Cedar Decking", "category": "Timber", "price": 24.99, "priceUnit": "ea", "stock_status": "in_stock", "stock_quantity": 120, "description": "Natural cedar decking boards for outdoor use.", "pricing_rates": {"1": 24.99, "2": 22.50, "3": 20}},
        {"id": "PLY-004", "name": "MDF Board (1/4\")", "category": "Plywood", "price": 18.50, "priceUnit": "ea", "stock_status": "in_stock", "stock_quantity": 300, "description": "Medium-density fibreboard for versatile projects.", "pricing_rates": {"1": 18.50, "2": 17, "3": 15.50}},
        {"id": "TIM-004", "name": "Walnut Hardwood", "category": "Timber", "price": 45.00, "priceUnit": "ea", "stock_status": "in_stock", "stock_quantity": 45, "description": "Rich walnut hardwood for high-end carpentry.", "pricing_rates": {"1": 45, "2": 42, "3": 38}},
    ]
    db.products.insert_many(products)
    
    orders = [
        {"id": "ORD-K9J2L4M1", "customer_id": 1, "customerName": "ABC Furniture Works", "status": "Dispatched", "amount": 10711.80, "grand_total": 10711.80, "order_date": "2024-01-15T09:15:00Z", "paymentStatus": "Credit", "sales_person_id": sales_person_id, "salesPerson": "Rahul Sales", "items": [{"product_id": "PLY-001", "productName": "Birch Veneer (3/4\")", "name": "Birch Veneer (3/4\")", "quantity": 48, "unitPrice": 85.00, "price": 85.00, "unit": "ea"}, {"product_id": "PLY-002", "productName": "Marine Plywood (1/2\")", "name": "Marine Plywood (1/2\")", "quantity": 36, "unitPrice": 122.50, "price": 122.50, "unit": "ea"}, {"product_id": "TIM-001", "productName": "Oak Finish Trim", "name": "Oak Finish Trim", "quantity": 150, "unitPrice": 14.81, "price": 14.81, "unit": "ea"}], "images": []},
        {"id": "ORD-A1B2C3D4", "customer_id": 1, "customerName": "ABC Furniture Works", "status": "Completed", "amount": 2500.00, "grand_total": 2500.00, "order_date": "2024-01-10T14:30:00Z", "paymentStatus": "Paid", "sales_person_id": sales_person_id, "salesPerson": "Rahul Sales", "items": [{"product_id": "PLY-003", "productName": "Teak Plywood", "name": "Teak Plywood", "quantity": 10, "unitPrice": 150.00, "price": 150.00, "unit": "ea"}, {"product_id": "TIM-002", "productName": "Pine Stud (2x4)", "name": "Pine Stud (2x4)", "quantity": 181, "unitPrice": 5.50, "price": 5.50, "unit": "ea"}], "images": []},
        {"id": "ORD-X7Y8Z9W0", "customer_id": 3, "customerName": "Modern Cabinets Ltd", "status": "Created", "amount": 1250.00, "grand_total": 1250.00, "order_date": "2024-01-20T11:00:00Z", "paymentStatus": "Credit", "sales_person_id": sales_person_id, "salesPerson": "Rahul Sales", "items": [{"product_id": "PLY-004", "productName": "MDF Board (1/4\")", "name": "MDF Board (1/4\")", "quantity": 50, "unitPrice": 18.50, "price": 18.50, "unit": "ea"}, {"product_id": "TIM-004", "productName": "Walnut Hardwood", "name": "Walnut Hardwood", "quantity": 5, "unitPrice": 45.00, "price": 45.00, "unit": "ea"}], "images": []},
        {"id": "ORD-P5Q6R7S8", "customer_id": 5, "customerName": "Premium Plyboards", "status": "Approved", "amount": 3450.00, "grand_total": 3450.00, "order_date": "2024-01-18T16:45:00Z", "paymentStatus": "Credit", "sales_person_id": sales_person_id, "salesPerson": "Rahul Sales", "items": [{"product_id": "PLY-001", "productName": "Birch Veneer (3/4\")", "name": "Birch Veneer (3/4\")", "quantity": 30, "unitPrice": 85.00, "price": 85.00, "unit": "ea"}, {"product_id": "TIM-003", "productName": "Cedar Decking", "name": "Cedar Decking", "quantity": 40, "unitPrice": 24.99, "price": 24.99, "unit": "ea"}], "images": []},
        {"id": "ORD-M2N3O4P5", "customer_id": 1, "customerName": "ABC Furniture Works", "status": "Invoiced", "amount": 5250.00, "grand_total": 5250.00, "order_date": "2024-01-12T10:30:00Z", "paymentStatus": "Credit", "sales_person_id": sales_person_id, "salesPerson": "Rahul Sales", "items": [{"product_id": "PLY-002", "productName": "Marine Plywood (1/2\")", "name": "Marine Plywood (1/2\")", "quantity": 30, "unitPrice": 122.50, "price": 122.50, "unit": "ea"}, {"product_id": "TIM-004", "productName": "Walnut Hardwood", "name": "Walnut Hardwood", "quantity": 30, "unitPrice": 45.00, "price": 45.00, "unit": "ea"}], "images": []}
    ]
    db.orders.insert_many(orders)
    
    invoices = [
        {"id": "INV-K9J2L4M1", "order_id": "ORD-K9J2L4M1", "customer_id": 1, "customerName": "ABC Furniture Works", "issue_date": "2024-01-15", "due_date": "2024-01-30", "sub_total": 9077.80, "cgst": 817.00, "sgst": 817.00, "grand_total": 10711.80, "status": "Paid", "pricing_type": 2},
        {"id": "INV-A1B2C3D4", "order_id": "ORD-A1B2C3D4", "customer_id": 1, "customerName": "ABC Furniture Works", "issue_date": "2024-01-10", "due_date": "2024-01-25", "sub_total": 2118.64, "cgst": 190.68, "sgst": 190.68, "grand_total": 2500.00, "status": "Paid", "pricing_type": 2},
        {"id": "INV-M2N3O4P5", "order_id": "ORD-M2N3O4P5", "customer_id": 1, "customerName": "ABC Furniture Works", "issue_date": "2024-01-12", "due_date": "2024-01-27", "sub_total": 4449.15, "cgst": 400.43, "sgst": 400.43, "grand_total": 5250.00, "status": "Pending", "pricing_type": 2},
        {"id": "INV-P5Q6R7S8", "order_id": "ORD-P5Q6R7S8", "customer_id": 5, "customerName": "Premium Plyboards", "issue_date": "2024-01-18", "due_date": "2024-02-02", "sub_total": 2923.73, "cgst": 263.14, "sgst": 263.14, "grand_total": 3450.00, "status": "Pending", "pricing_type": 2}
    ]
    db.invoices.insert_many(invoices)
    
    print("Demo data initialized successfully!")

@app.on_event("startup")
async def startup_event():
    init_demo_data()

# ============ AUTH ROUTES ============
@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/login")
async def login(request: LoginRequest):
    # Check if customer login
    if request.app_role == "Customer":
        customer = db.customers.find_one({"email": request.email, "password": hash_password(request.password)})
        if not customer:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if customer is active
        if not customer.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account is deactivated. Please contact support.")
        
        token = create_token(f"customer_{customer['id']}", "Customer")
        customer_data = {k: v for k, v in customer.items() if k not in ["_id", "password"]}
        
        return {"token": token, "user": customer_data}
    
    # Admin/Manager login
    user = db.users.find_one({"email": request.email, "password": hash_password(request.password)})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(str(user["_id"]), user["role"])
    user_data = serialize_doc(user)
    del user_data["password"]
    
    return {"token": token, "user": user_data}

@app.post("/api/logout")
async def logout(payload: dict = Depends(verify_token)):
    return {"success": True}

@app.post("/api/register")
async def register(request: RegisterRequest):
    existing = db.customers.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    customer = {
        "id": get_next_customer_id(),
        "name": request.name,
        "contactPerson": request.contactPerson,
        "phone": request.phone,
        "email": request.email,
        "password": hash_password(request.password),
        "role": "Customer",
        "approval_status": "Pending",
        "is_active": True,
        "pricing_type": 1,
        "outstanding_balance": 0,
        "credit_limit": 0,
        "sales_person_name": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    db.customers.insert_one(customer)
    return {"success": True, "message": "Registration submitted. Please wait for admin approval."}

@app.get("/api/me")
async def get_me(payload: dict = Depends(verify_token)):
    user_id = payload["user_id"]
    role = payload.get("role", "")
    
    # Check if customer
    if user_id.startswith("customer_"):
        customer_id = int(user_id.replace("customer_", ""))
        customer = db.customers.find_one({"id": customer_id}, {"_id": 0, "password": 0})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer
    
    # Admin/Manager
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = serialize_doc(user)
    del user_data["password"]
    return user_data

@app.post("/api/token/refresh")
async def refresh_token(payload: dict = Depends(verify_token)):
    new_token = create_token(payload["user_id"], payload["role"])
    return {"token": new_token}

# ============ PRODUCTS ROUTES ============
@app.get("/api/products")
async def get_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    payload: dict = Depends(verify_token)
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    
    products = list(db.products.find(query, {"_id": 0}))
    return {"data": products, "products": products}

def get_next_product_id(category: str) -> str:
    prefix = "PLY" if category == "Plywood" else "TIM"
    existing = list(db.products.find({"id": {"$regex": f"^{prefix}-"}}, {"id": 1}))
    if not existing:
        return f"{prefix}-001"
    max_num = 0
    for p in existing:
        try:
            num = int(p["id"].split("-")[1])
            if num > max_num:
                max_num = num
        except (ValueError, IndexError, KeyError):
            pass
    return f"{prefix}-{str(max_num + 1).zfill(3)}"

@app.get("/api/products/{product_id}")
async def get_product(
    product_id: str,
    payload: dict = Depends(verify_token)
):
    product = db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"data": product}

@app.post("/api/products")
async def create_product(
    body: dict = Body(...),
    payload: dict = Depends(verify_token)
):
    if not body.get("name") or not body.get("category"):
        raise HTTPException(status_code=400, detail="Name and category are required")
    
    # Check if product with same name exists
    existing = db.products.find_one({"name": body.get("name")})
    if existing:
        raise HTTPException(status_code=400, detail="Product with this name already exists")
    
    product_id = body.get("id") or get_next_product_id(body.get("category", "Plywood"))
    base_price = float(body.get("price", 0))
    
    # Use provided pricing_rates or calculate defaults
    provided_rates = body.get("pricing_rates", {})
    pricing_rates = {
        "1": float(provided_rates.get("1", base_price)),
        "2": float(provided_rates.get("2", base_price * 0.95)),
        "3": float(provided_rates.get("3", base_price * 0.90))
    }
    
    product = {
        "id": product_id,
        "name": body.get("name"),
        "category": body.get("category"),
        "price": base_price,
        "priceUnit": body.get("priceUnit", "ea"),
        "stock_status": body.get("stock_status", "in_stock"),
        "stock_quantity": int(body.get("stock_quantity", 0)),
        "description": body.get("description", ""),
        "primary_image": body.get("primary_image", ""),
        "pricing_rates": pricing_rates,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.products.insert_one(product)
    del product["_id"]
    
    return {"success": True, "message": "Product created successfully", "data": product}

@app.put("/api/products/{product_id}")
async def update_product(
    product_id: str,
    body: dict = Body(...),
    payload: dict = Depends(verify_token)
):
    existing = db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check name uniqueness if name is being updated
    if body.get("name") and body.get("name") != existing.get("name"):
        name_exists = db.products.find_one({"name": body.get("name"), "id": {"$ne": product_id}})
        if name_exists:
            raise HTTPException(status_code=400, detail="Product with this name already exists")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    allowed_fields = ["name", "category", "price", "priceUnit", "stock_status", 
                      "stock_quantity", "description", "primary_image", "pricing_rates"]
    
    for field in allowed_fields:
        if field in body:
            if field == "price":
                update_data[field] = float(body[field])
            elif field == "stock_quantity":
                update_data[field] = int(body[field])
            else:
                update_data[field] = body[field]
    
    db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = db.products.find_one({"id": product_id}, {"_id": 0})
    return {"success": True, "message": "Product updated successfully", "data": updated}

@app.delete("/api/products/{product_id}")
async def delete_product(
    product_id: str,
    payload: dict = Depends(verify_token)
):
    existing = db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product is used in any orders
    orders_with_product = db.orders.count_documents({"items.product_id": product_id})
    if orders_with_product > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete product used in {orders_with_product} orders"
        )
    
    db.products.delete_one({"id": product_id})
    return {"success": True, "message": "Product deleted successfully"}

# ============ ORDERS ROUTES ============
@app.get("/api/orders")
async def get_orders_endpoint(
    id: Optional[str] = None,
    payload: dict = Depends(verify_token)
):
    if id:
        order = db.orders.find_one({"id": id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    
    orders = list(db.orders.find({}, {"_id": 0}).sort("order_date", -1))
    return orders

# ============ INVOICES ROUTES ============
@app.get("/api/invoices")
async def get_invoices_endpoint(
    id: Optional[str] = None,
    payload: dict = Depends(verify_token)
):
    if id:
        invoice = db.invoices.find_one({"id": id}, {"_id": 0})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return {"data": invoice}
    
    invoices = list(db.invoices.find({}, {"_id": 0}).sort("issue_date", -1))
    return invoices

@app.put("/api/invoices/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    body: dict = Body(...),
    payload: dict = Depends(verify_token)
):
    existing = db.invoices.find_one({"id": invoice_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    allowed_fields = ["status", "due_date", "notes"]
    valid_statuses = ["Pending", "Paid", "Overdue", "Cancelled", "Partially Paid"]
    
    for field in allowed_fields:
        if field in body:
            if field == "status" and body[field] not in valid_statuses:
                raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
            update_data[field] = body[field]
    
    db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    
    updated = db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return {"success": True, "message": "Invoice updated successfully", "data": updated}

# ============ CUSTOMERS CRUD ROUTES ============
@app.get("/api/customers")
async def get_customers_list(
    action: Optional[str] = None,
    payload: dict = Depends(verify_token)
):
    if action == "me":
        user = db.users.find_one({"_id": ObjectId(payload["user_id"])})
        if user:
            user_data = serialize_doc(user)
            del user_data["password"]
            return user_data
        raise HTTPException(status_code=404, detail="User not found")
    
    customers = list(db.customers.find({}, {"_id": 0, "password": 0}))
    return customers

@app.get("/api/customers/{customer_id}")
async def get_customer(
    customer_id: int,
    payload: dict = Depends(verify_token)
):
    customer = db.customers.find_one({"id": customer_id}, {"_id": 0, "password": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get customer orders and invoices for stats
    orders = list(db.orders.find({"customer_id": customer_id}, {"_id": 0}))
    invoices = list(db.invoices.find({"customer_id": customer_id}, {"_id": 0}))
    
    customer["orders"] = orders
    customer["invoices"] = invoices
    customer["total_orders"] = len(orders)
    customer["total_invoices"] = len(invoices)
    
    return {"data": customer}

@app.post("/api/customers")
async def create_customer(
    action: Optional[str] = None,
    body: dict = Body(default={}),
    payload: dict = Depends(verify_token)
):
    if action == "change_password":
        current_password = body.get("current_password")
        new_password = body.get("new_password")
        
        user = db.users.find_one({"_id": ObjectId(payload["user_id"]), "password": hash_password(current_password)})
        if not user:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        db.users.update_one({"_id": ObjectId(payload["user_id"])}, {"$set": {"password": hash_password(new_password)}})
        return {"success": True, "message": "Password changed successfully"}
    
    # Create new customer
    if not body.get("name") or not body.get("email"):
        raise HTTPException(status_code=400, detail="Name and email are required")
    
    # Check if email already exists
    existing = db.customers.find_one({"email": body.get("email")})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    customer = {
        "id": get_next_customer_id(),
        "name": body.get("name"),
        "contactPerson": body.get("contactPerson", ""),
        "phone": body.get("phone", ""),
        "email": body.get("email"),
        "gst_number": body.get("gst_number", ""),
        "address": body.get("address", ""),
        "city": body.get("city", ""),
        "state": body.get("state", ""),
        "pincode": body.get("pincode", ""),
        "pricing_type": body.get("pricing_type", 1),
        "credit_limit": body.get("credit_limit", 0),
        "notes": body.get("notes", ""),
        "role": "Customer",
        "approval_status": body.get("approval_status", "Approved"),
        "is_active": body.get("is_active", True),
        "outstanding_balance": 0,
        "sales_person_name": None,
        "password": hash_password("customer123"),  # Default password
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.customers.insert_one(customer)
    del customer["_id"]
    del customer["password"]
    
    return {"success": True, "message": "Customer created successfully", "data": customer}

@app.put("/api/customers/{customer_id}")
async def update_customer(
    customer_id: int,
    body: dict = Body(...),
    payload: dict = Depends(verify_token)
):
    existing = db.customers.find_one({"id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check email uniqueness if email is being updated
    if body.get("email") and body.get("email") != existing.get("email"):
        email_exists = db.customers.find_one({"email": body.get("email"), "id": {"$ne": customer_id}})
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already in use by another customer")
    
    update_data = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    allowed_fields = ["name", "contactPerson", "phone", "email", "gst_number", "address", 
                      "city", "state", "pincode", "pricing_type", "credit_limit", "notes",
                      "approval_status", "is_active"]
    
    for field in allowed_fields:
        if field in body:
            update_data[field] = body[field]
    
    db.customers.update_one({"id": customer_id}, {"$set": update_data})
    
    updated = db.customers.find_one({"id": customer_id}, {"_id": 0, "password": 0})
    return {"success": True, "message": "Customer updated successfully", "data": updated}

@app.delete("/api/customers/{customer_id}")
async def delete_customer(
    customer_id: int,
    hard_delete: bool = Query(False),
    payload: dict = Depends(verify_token)
):
    existing = db.customers.find_one({"id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer has orders
    orders_count = db.orders.count_documents({"customer_id": customer_id})
    
    if hard_delete:
        if orders_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete customer with {orders_count} orders. Archive instead."
            )
        db.customers.delete_one({"id": customer_id})
        return {"success": True, "message": "Customer permanently deleted"}
    else:
        # Soft delete (archive)
        db.customers.update_one(
            {"id": customer_id}, 
            {"$set": {
                "is_active": False, 
                "approval_status": "Archived",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": True, "message": "Customer archived successfully"}

# ============ ADMIN ROUTES ============
@app.get("/api/admin")
async def admin_resource(
    resource: Optional[str] = None,
    action: Optional[str] = None,
    page: int = 1,
    per_page: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    payload: dict = Depends(verify_token)
):
    if resource == "dashboard":
        pending_orders = db.orders.count_documents({"status": {"$in": ["Created", "Pending"]}})
        new_orders_week = db.orders.count_documents({})
        due_invoices = db.invoices.count_documents({"status": {"$ne": "Paid"}})
        pending_customers = db.customers.count_documents({"approval_status": "Pending"})
        total_customers = db.customers.count_documents({})
        active_customers = db.customers.count_documents({"is_active": True, "approval_status": "Approved"})
        
        return {
            "pending_orders_count": pending_orders,
            "new_orders_week": new_orders_week,
            "due_invoices_count": due_invoices,
            "pending_customers": pending_customers,
            "total_customers": total_customers,
            "active_customers": active_customers
        }
    
    if resource == "orders":
        skip = (page - 1) * per_page
        query = {}
        if search:
            query["$or"] = [
                {"id": {"$regex": search, "$options": "i"}},
                {"customerName": {"$regex": search, "$options": "i"}}
            ]
        
        total = db.orders.count_documents(query)
        orders = list(db.orders.find(query, {"_id": 0}).sort("order_date", -1).skip(skip).limit(per_page))
        
        return {
            "data": orders,
            "pagination": {"page": page, "per_page": per_page, "total": total, "total_pages": (total + per_page - 1) // per_page}
        }
    
    if resource == "invoices":
        skip = (page - 1) * per_page
        query = {}
        if search:
            query["$or"] = [
                {"id": {"$regex": search, "$options": "i"}},
                {"customerName": {"$regex": search, "$options": "i"}}
            ]
        
        total = db.invoices.count_documents(query)
        invoices = list(db.invoices.find(query, {"_id": 0}).sort("issue_date", -1).skip(skip).limit(per_page))
        
        return {
            "data": invoices,
            "pagination": {"page": page, "per_page": per_page, "total": total, "total_pages": (total + per_page - 1) // per_page}
        }
    
    if resource == "customers":
        skip = (page - 1) * per_page
        query = {}
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"contactPerson": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"gst_number": {"$regex": search, "$options": "i"}}
            ]
        
        if status:
            if status == "active":
                query["is_active"] = True
                query["approval_status"] = "Approved"
            elif status == "inactive":
                query["is_active"] = False
            elif status == "pending":
                query["approval_status"] = "Pending"
            elif status == "archived":
                query["approval_status"] = "Archived"
            elif status == "rejected":
                query["approval_status"] = "Rejected"
        
        # Sorting
        sort_field = sort_by or "created_at"
        sort_direction = DESCENDING if sort_order == "desc" else ASCENDING
        
        # Map frontend sort fields to DB fields
        sort_map = {
            "name": "name",
            "email": "email", 
            "created_at": "created_at",
            "outstanding_balance": "outstanding_balance",
            "pricing_type": "pricing_type"
        }
        sort_field = sort_map.get(sort_field, "created_at")
        
        total = db.customers.count_documents(query)
        customers = list(db.customers.find(query, {"_id": 0, "password": 0}).sort(sort_field, sort_direction).skip(skip).limit(per_page))
        
        return {
            "data": customers,
            "pagination": {"page": page, "per_page": per_page, "total": total, "total_pages": (total + per_page - 1) // per_page}
        }
    
    return {"error": "Unknown resource"}

@app.post("/api/admin")
async def admin_action(
    action: Optional[str] = None,
    body: dict = Body(...),
    payload: dict = Depends(verify_token)
):
    if action == "update_order_status":
        order_id = body.get("order_id")
        status = body.get("status")
        result = db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"success": True, "message": f"Order status updated to {status}"}
    
    if action == "mark_invoice_paid":
        invoice_id = body.get("invoice_id")
        result = db.invoices.update_one({"id": invoice_id}, {"$set": {"status": "Paid"}})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return {"success": True, "message": "Invoice marked as paid"}
    
    if action == "approve_customer":
        customer_id = body.get("customer_id")
        result = db.customers.update_one(
            {"id": customer_id}, 
            {"$set": {"approval_status": "Approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        return {"success": True, "message": "Customer approved"}
    
    if action == "reject_customer":
        customer_id = body.get("customer_id")
        reason = body.get("reason", "")
        result = db.customers.update_one(
            {"id": customer_id}, 
            {"$set": {
                "approval_status": "Rejected", 
                "notes": reason,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        return {"success": True, "message": "Customer rejected"}
    
    if action == "toggle_customer_status":
        customer_id = body.get("customer_id")
        is_active = body.get("is_active")
        result = db.customers.update_one(
            {"id": customer_id}, 
            {"$set": {"is_active": is_active, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        status_text = "activated" if is_active else "deactivated"
        return {"success": True, "message": f"Customer {status_text}"}
    
    return {"error": "Unknown action"}



# ============ CUSTOMER PORTAL HELPER ============
def get_customer_id_from_token(payload: dict) -> int:
    """Extract customer ID from JWT payload"""
    user_id = payload.get("user_id", "")
    if not user_id.startswith("customer_"):
        raise HTTPException(status_code=403, detail="Customer access required")
    return int(user_id.replace("customer_", ""))

# ============ CUSTOMER CART ROUTES ============
@app.get("/api/cart")
async def get_cart(payload: dict = Depends(verify_token)):
    customer_id = get_customer_id_from_token(payload)
    cart = db.carts.find_one({"customer_id": customer_id}, {"_id": 0})
    if not cart:
        return []
    return cart.get("items", [])

@app.post("/api/cart")
async def add_to_cart(body: dict = Body(...), payload: dict = Depends(verify_token)):
    customer_id = get_customer_id_from_token(payload)
    product_id = body.get("product_id")
    quantity = int(body.get("quantity", 1))
    
    # Get product details
    product = db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get customer pricing type
    customer = db.customers.find_one({"id": customer_id})
    pricing_type = str(customer.get("pricing_type", 1))
    price = product.get("pricing_rates", {}).get(pricing_type, product.get("price", 0))
    
    # Get or create cart
    cart = db.carts.find_one({"customer_id": customer_id})
    if not cart:
        cart = {"customer_id": customer_id, "items": []}
        db.carts.insert_one(cart)
    
    items = cart.get("items", [])
    
    # Check if product already in cart
    found = False
    for item in items:
        if item["product_id"] == product_id:
            item["quantity"] = quantity
            item["price"] = float(price)
            found = True
            break
    
    if not found:
        items.append({
            "product_id": product_id,
            "name": product.get("name"),
            "quantity": quantity,
            "price": float(price),
            "unit": product.get("priceUnit", "ea"),
            "priceUnit": product.get("priceUnit", "ea")
        })
    
    db.carts.update_one(
        {"customer_id": customer_id}, 
        {"$set": {"items": items}},
        upsert=True
    )
    
    return {"success": True, "message": "Cart updated"}

@app.delete("/api/cart")
async def clear_or_remove_cart(
    product_id: Optional[str] = None,
    payload: dict = Depends(verify_token)
):
    customer_id = get_customer_id_from_token(payload)
    
    if product_id:
        # Remove specific product
        cart = db.carts.find_one({"customer_id": customer_id})
        if cart:
            items = [item for item in cart.get("items", []) if item["product_id"] != product_id]
            db.carts.update_one({"customer_id": customer_id}, {"$set": {"items": items}})
        return {"success": True, "message": "Item removed from cart"}
    else:
        # Clear entire cart
        db.carts.delete_one({"customer_id": customer_id})
        return {"success": True, "message": "Cart cleared"}

# ============ CUSTOMER CHECKOUT ROUTE ============
@app.post("/api/checkout")
async def customer_checkout(body: dict = Body(...), payload: dict = Depends(verify_token)):
    customer_id = get_customer_id_from_token(payload)
    shipping_address = body.get("shipping_address", "")
    
    # Get cart
    cart = db.carts.find_one({"customer_id": customer_id})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = cart.get("items", [])
    
    # Get customer details
    customer = db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer is approved
    if customer.get("approval_status") != "Approved":
        raise HTTPException(status_code=403, detail="Your account is pending approval")
    
    # Calculate total
    total = sum(item["price"] * item["quantity"] for item in items)
    
    # Generate order ID
    order_count = db.orders.count_documents({})
    order_id = f"ORD-{secrets.token_hex(4).upper()}"
    
    # Create order
    order = {
        "id": order_id,
        "customer_id": customer_id,
        "customerName": customer.get("name"),
        "status": "Created",
        "amount": total,
        "grand_total": total,
        "order_date": datetime.now(timezone.utc).isoformat(),
        "paymentStatus": "Credit",
        "sales_person_id": None,
        "salesPerson": None,
        "shipping_address": shipping_address or customer.get("address", ""),
        "pricing_type": customer.get("pricing_type", 1),
        "items": [
            {
                "product_id": item["product_id"],
                "productName": item["name"],
                "name": item["name"],
                "quantity": item["quantity"],
                "unitPrice": item["price"],
                "price": item["price"],
                "unit": item.get("unit", "ea")
            }
            for item in items
        ],
        "images": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.orders.insert_one(order)
    
    # Clear cart after checkout
    db.carts.delete_one({"customer_id": customer_id})
    
    return {"success": True, "order_id": order_id, "message": "Order placed successfully"}

# ============ CUSTOMER ORDERS ROUTES ============
@app.get("/api/customer/orders")
async def get_customer_orders(
    page: int = 1,
    per_page: int = 10,
    payload: dict = Depends(verify_token)
):
    customer_id = get_customer_id_from_token(payload)
    skip = (page - 1) * per_page
    
    query = {"customer_id": customer_id}
    total = db.orders.count_documents(query)
    orders = list(db.orders.find(query, {"_id": 0}).sort("order_date", -1).skip(skip).limit(per_page))
    
    return {
        "data": orders,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    }

@app.get("/api/customer/orders/{order_id}")
async def get_customer_order(order_id: str, payload: dict = Depends(verify_token)):
    customer_id = get_customer_id_from_token(payload)
    order = db.orders.find_one({"id": order_id, "customer_id": customer_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ============ CUSTOMER INVOICES ROUTES ============
@app.get("/api/customer/invoices")
async def get_customer_invoices(
    page: int = 1,
    per_page: int = 10,
    payload: dict = Depends(verify_token)
):
    customer_id = get_customer_id_from_token(payload)
    skip = (page - 1) * per_page
    
    query = {"customer_id": customer_id}
    total = db.invoices.count_documents(query)
    invoices = list(db.invoices.find(query, {"_id": 0}).sort("issue_date", -1).skip(skip).limit(per_page))
    
    return {
        "data": invoices,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    }

@app.get("/api/customer/invoices/{invoice_id}")
async def get_customer_invoice(invoice_id: str, payload: dict = Depends(verify_token)):
    customer_id = get_customer_id_from_token(payload)
    invoice = db.invoices.find_one({"id": invoice_id, "customer_id": customer_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"data": invoice}

# ============ CUSTOMER PROFILE ROUTES ============
@app.patch("/api/customer/profile")
async def update_customer_profile(body: dict = Body(...), payload: dict = Depends(verify_token)):
    customer_id = get_customer_id_from_token(payload)
    
    allowed_fields = ["name", "contactPerson", "phone", "address", "city", "state", "pincode", 
                      "gst_number", "business_name", "businessName"]
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for field in allowed_fields:
        if field in body:
            update_data[field] = body[field]
    
    # Handle businessName alias
    if "businessName" in body:
        update_data["business_name"] = body["businessName"]
    
    db.customers.update_one({"id": customer_id}, {"$set": update_data})
    
    customer = db.customers.find_one({"id": customer_id}, {"_id": 0, "password": 0})
    return {"success": True, "message": "Profile updated", "data": customer}

@app.post("/api/customer/change-password")
async def change_customer_password(body: dict = Body(...), payload: dict = Depends(verify_token)):
    customer_id = get_customer_id_from_token(payload)
    current_password = body.get("current_password")
    new_password = body.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new password required")
    
    customer = db.customers.find_one({"id": customer_id, "password": hash_password(current_password)})
    if not customer:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    db.customers.update_one({"id": customer_id}, {"$set": {"password": hash_password(new_password)}})
    return {"success": True, "message": "Password changed successfully"}



# ============ SALES PORTAL HELPER ============
def get_sales_user_id_from_token(payload: dict) -> str:
    """Extract sales user ID from JWT payload"""
    user_id = payload.get("user_id", "")
    role = payload.get("role", "")
    if role not in ["Sales Person", "Manager", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Sales access required")
    return user_id

# ============ SALES DASHBOARD ============
@app.get("/api/sales/dashboard")
async def sales_dashboard(payload: dict = Depends(verify_token)):
    user_id = get_sales_user_id_from_token(payload)
    
    # Get sales person's assigned customers
    assigned_customers = list(db.customers.find({"sales_person_id": user_id}, {"_id": 0}))
    customer_ids = [c["id"] for c in assigned_customers]
    
    # Calculate metrics
    orders = list(db.orders.find({"customer_id": {"$in": customer_ids}}, {"_id": 0}))
    invoices = list(db.invoices.find({"customer_id": {"$in": customer_ids}}, {"_id": 0}))
    
    # Monthly sales (current month)
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_orders = [o for o in orders if o.get("order_date", "") >= month_start.isoformat()]
    monthly_sales = sum(o.get("amount", 0) or o.get("grand_total", 0) for o in monthly_orders)
    
    # New orders this week
    week_ago = (now - timedelta(days=7)).isoformat()
    new_orders_week = len([o for o in orders if o.get("order_date", "") >= week_ago])
    
    # Pending orders
    pending_orders = [o for o in orders if o.get("status") not in ["Completed", "Cancelled", "Delivered"]]
    
    # Outstanding balance
    total_outstanding = sum(c.get("outstanding_balance", 0) for c in assigned_customers)
    
    # Due invoices
    due_invoices = [i for i in invoices if i.get("status") in ["Pending", "Overdue", "Due"]]
    
    return {
        "monthly_sales": monthly_sales,
        "new_orders_week": new_orders_week,
        "assigned_customers": len(assigned_customers),
        "pending_orders_count": len(pending_orders),
        "total_outstanding": total_outstanding,
        "due_invoices_count": len(due_invoices)
    }

# ============ SALES CUSTOMERS ============
@app.get("/api/sales/customers")
async def get_sales_customers(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    status: str = "",
    payload: dict = Depends(verify_token)
):
    user_id = get_sales_user_id_from_token(payload)
    skip = (page - 1) * per_page
    
    query: dict = {"sales_person_id": user_id}
    if status:
        if status.lower() == "approved":
            query["approval_status"] = "Approved"
        elif status.lower() == "pending":
            query["approval_status"] = "Pending"
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    total = db.customers.count_documents(query)
    customers = list(db.customers.find(query, {"_id": 0, "password": 0}).skip(skip).limit(per_page))
    
    return {
        "data": customers,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    }

@app.get("/api/sales/customers/{customer_id}")
async def get_sales_customer(customer_id: int, payload: dict = Depends(verify_token)):
    user_id = get_sales_user_id_from_token(payload)
    customer = db.customers.find_one({"id": customer_id, "sales_person_id": user_id}, {"_id": 0, "password": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.post("/api/sales/customers")
async def create_sales_customer(body: dict = Body(...), payload: dict = Depends(verify_token)):
    user_id = get_sales_user_id_from_token(payload)
    
    # Check for duplicate email
    if db.customers.find_one({"email": body.get("email")}):
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    
    # Get sales person name
    sales_user = db.users.find_one({"_id": ObjectId(user_id)})
    sales_person_name = sales_user.get("name", "Sales Person") if sales_user else "Sales Person"
    
    # Generate new customer ID
    last_customer = db.customers.find_one(sort=[("id", -1)])
    new_id = (last_customer["id"] + 1) if last_customer else 1
    
    customer = {
        "id": new_id,
        "email": body.get("email"),
        "name": body.get("name") or body.get("business_name"),
        "business_name": body.get("business_name") or body.get("name"),
        "contactPerson": body.get("contactPerson") or body.get("contact_person"),
        "phone": body.get("phone"),
        "address": body.get("address", ""),
        "city": body.get("city", ""),
        "state": body.get("state", ""),
        "pincode": body.get("pincode", ""),
        "gst_number": body.get("gst_number") or body.get("gstin", ""),
        "role": "Customer",
        "approval_status": "Pending",
        "is_active": True,
        "pricing_type": int(body.get("pricing_type", 1)),
        "outstanding_balance": 0,
        "credit_limit": int(body.get("credit_limit", 25000)),
        "sales_person_id": user_id,
        "sales_person_name": sales_person_name,
        "password": hash_password(body.get("password", "customer123")),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.customers.insert_one(customer)
    del customer["password"]
    customer.pop("_id", None)
    
    return {"success": True, "message": "Customer created successfully", "data": customer}

# ============ SALES CART ============
@app.get("/api/sales/cart")
async def get_sales_cart(customer_id: Optional[int] = None, payload: dict = Depends(verify_token)):
    user_id = get_sales_user_id_from_token(payload)
    
    if not customer_id:
        return {"items": [], "total": 0, "customer": None}
    
    # Verify customer belongs to this sales person
    customer = db.customers.find_one({"id": customer_id, "sales_person_id": user_id}, {"_id": 0, "password": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found or not assigned to you")
    
    cart = db.sales_carts.find_one({"sales_person_id": user_id, "customer_id": customer_id}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0, "customer": customer, "pricing_type": customer.get("pricing_type", 1)}
    
    items = cart.get("items", [])
    total = sum(item.get("price", 0) * item.get("quantity", 0) for item in items)
    
    return {
        "items": items,
        "total": total,
        "customer": customer,
        "pricing_type": customer.get("pricing_type", 1)
    }

@app.post("/api/sales/cart")
async def add_to_sales_cart(body: dict = Body(...), payload: dict = Depends(verify_token)):
    user_id = get_sales_user_id_from_token(payload)
    customer_id = body.get("customer_id")
    product_id = body.get("product_id")
    quantity = int(body.get("quantity", 1))
    
    if not customer_id:
        raise HTTPException(status_code=400, detail="Customer ID required")
    
    # Verify customer
    customer = db.customers.find_one({"id": customer_id, "sales_person_id": user_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found or not assigned to you")
    
    # Get product
    product = db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get customer's tier price
    pricing_type = str(customer.get("pricing_type", 1))
    price = product.get("pricing_rates", {}).get(pricing_type, product.get("price", 0))
    
    # Get or create cart
    cart = db.sales_carts.find_one({"sales_person_id": user_id, "customer_id": customer_id})
    if not cart:
        cart = {"sales_person_id": user_id, "customer_id": customer_id, "items": []}
        db.sales_carts.insert_one(cart)
    
    items = cart.get("items", [])
    
    # Update or add item
    found = False
    for item in items:
        if item["product_id"] == product_id:
            item["quantity"] = quantity
            item["price"] = float(price)
            found = True
            break
    
    if not found:
        items.append({
            "product_id": product_id,
            "name": product.get("name"),
            "quantity": quantity,
            "price": float(price),
            "unit": product.get("priceUnit", "ea")
        })
    
    db.sales_carts.update_one(
        {"sales_person_id": user_id, "customer_id": customer_id},
        {"$set": {"items": items}},
        upsert=True
    )
    
    return {"success": True, "message": "Cart updated"}

@app.delete("/api/sales/cart")
async def delete_sales_cart(
    product_id: Optional[str] = None,
    customer_id: Optional[int] = None,
    payload: dict = Depends(verify_token)
):
    user_id = get_sales_user_id_from_token(payload)
    
    if product_id and customer_id:
        # Remove specific item
        cart = db.sales_carts.find_one({"sales_person_id": user_id, "customer_id": customer_id})
        if cart:
            items = [item for item in cart.get("items", []) if item["product_id"] != product_id]
            db.sales_carts.update_one(
                {"sales_person_id": user_id, "customer_id": customer_id},
                {"$set": {"items": items}}
            )
        return {"success": True, "message": "Item removed"}
    elif customer_id:
        # Clear cart for customer
        db.sales_carts.delete_one({"sales_person_id": user_id, "customer_id": customer_id})
        return {"success": True, "message": "Cart cleared"}
    else:
        return {"success": False, "message": "Customer ID required"}

# ============ SALES CHECKOUT ============
@app.post("/api/sales/checkout")
async def sales_checkout(body: dict = Body(...), payload: dict = Depends(verify_token)):
    user_id = get_sales_user_id_from_token(payload)
    customer_id = body.get("customer_id")
    
    if not customer_id:
        raise HTTPException(status_code=400, detail="Customer ID required")
    
    # Get customer
    customer = db.customers.find_one({"id": customer_id, "sales_person_id": user_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found or not assigned to you")
    
    if customer.get("approval_status") != "Approved":
        raise HTTPException(status_code=403, detail="Customer is not approved yet")
    
    # Get cart
    cart = db.sales_carts.find_one({"sales_person_id": user_id, "customer_id": customer_id})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = cart.get("items", [])
    total = sum(item["price"] * item["quantity"] for item in items)
    
    # Get sales person name
    sales_user = db.users.find_one({"_id": ObjectId(user_id)})
    sales_person_name = sales_user.get("name", "Sales Person") if sales_user else "Sales Person"
    
    # Create order
    order_id = f"ORD-{secrets.token_hex(4).upper()}"
    order = {
        "id": order_id,
        "customer_id": customer_id,
        "customerName": customer.get("name"),
        "status": "Created",
        "amount": total,
        "grand_total": total,
        "order_date": datetime.now(timezone.utc).isoformat(),
        "paymentStatus": "Credit",
        "sales_person_id": user_id,
        "salesPerson": sales_person_name,
        "shipping_address": customer.get("address", ""),
        "pricing_type": customer.get("pricing_type", 1),
        "items": [
            {
                "product_id": item["product_id"],
                "productName": item["name"],
                "name": item["name"],
                "quantity": item["quantity"],
                "unitPrice": item["price"],
                "price": item["price"],
                "unit": item.get("unit", "ea")
            }
            for item in items
        ],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.orders.insert_one(order)
    
    # Clear cart
    db.sales_carts.delete_one({"sales_person_id": user_id, "customer_id": customer_id})
    
    return {"success": True, "order_id": order_id, "message": "Order placed successfully"}

# ============ SALES ORDERS ============
@app.get("/api/sales/orders")
async def get_sales_orders(
    page: int = 1,
    per_page: int = 10,
    status: str = "",
    payload: dict = Depends(verify_token)
):
    user_id = get_sales_user_id_from_token(payload)
    skip = (page - 1) * per_page
    
    query: dict = {"sales_person_id": user_id}
    if status:
        query["status"] = status
    
    total = db.orders.count_documents(query)
    orders = list(db.orders.find(query, {"_id": 0}).sort("order_date", -1).skip(skip).limit(per_page))
    
    return {
        "data": orders,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    }

@app.get("/api/sales/orders/{order_id}")
async def get_sales_order(order_id: str, payload: dict = Depends(verify_token)):
    user_id = get_sales_user_id_from_token(payload)
    order = db.orders.find_one({"id": order_id, "sales_person_id": user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ============ SALES INVOICES ============
@app.get("/api/sales/invoices")
async def get_sales_invoices(
    page: int = 1,
    per_page: int = 10,
    status: str = "",
    payload: dict = Depends(verify_token)
):
    user_id = get_sales_user_id_from_token(payload)
    skip = (page - 1) * per_page
    
    # Get sales person's customer IDs
    customers = list(db.customers.find({"sales_person_id": user_id}, {"id": 1}))
    customer_ids = [c["id"] for c in customers]
    
    query: dict = {"customer_id": {"$in": customer_ids}}
    if status:
        query["status"] = status
    
    total = db.invoices.count_documents(query)
    invoices = list(db.invoices.find(query, {"_id": 0}).sort("issue_date", -1).skip(skip).limit(per_page))
    
    return {
        "data": invoices,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    }

@app.get("/api/sales/invoices/{invoice_id}")
async def get_sales_invoice(invoice_id: str, payload: dict = Depends(verify_token)):
    user_id = get_sales_user_id_from_token(payload)
    
    # Get sales person's customer IDs
    customers = list(db.customers.find({"sales_person_id": user_id}, {"id": 1}))
    customer_ids = [c["id"] for c in customers]
    
    invoice = db.invoices.find_one({"id": invoice_id, "customer_id": {"$in": customer_ids}}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice
