# Natural Plylam B2B - Windows/Hostinger Deployment Guide

## Prerequisites
1. Python 3.10+ installed on your system
2. MongoDB database (MongoDB Atlas recommended for Hostinger)
3. Node.js 18+ (for building frontend)

## Backend Deployment

### Step 1: Setup Environment
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Step 2: Create .env file in backend folder
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/plylam_admin
DB_NAME=plylam_admin
JWT_SECRET=your_secure_secret_key_here
```

### Step 3: Run the server
```bash
# Development
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Production (Windows)
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1
```

## Frontend Deployment

### Step 1: Build all frontends
```bash
# Admin Frontend
cd frontend
npm install
npm run build

# Customer Portal
cd ../customer-portal
npm install
npm run build

# Sales Portal
cd ../sales-portal
npm install
npm run build
```

### Step 2: Configure API URL
Edit `.env` files in each frontend folder:
```
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### Step 3: Deploy static files
Upload the `dist` folders to your Hostinger:
- `frontend/dist` → Main admin site
- `customer-portal/dist` → /portal path
- `sales-portal/dist` → /sales path

## Hostinger Specific Setup

### For Python Backend (VPS or Cloud Hosting):
1. SSH into your Hostinger VPS
2. Install Python and dependencies
3. Use `supervisor` or `systemd` to run uvicorn
4. Setup Nginx as reverse proxy

### For Static Frontend (Shared Hosting):
1. Build frontends locally
2. Upload dist folders via File Manager or FTP
3. Configure .htaccess for SPA routing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## MongoDB Atlas Setup (Recommended)
1. Create free cluster at mongodb.com
2. Add your IP to whitelist (or 0.0.0.0/0 for all IPs)
3. Create database user
4. Get connection string and update MONGO_URL

## Troubleshooting

### CORS Issues
The backend allows all origins. If issues persist, update the frontend .env with correct backend URL.

### MongoDB Connection
- Ensure IP whitelist includes your server IP
- Check connection string format
- Verify database user credentials

### Port Issues on Windows
If port 8001 is blocked, change it in uvicorn command and update frontend .env files.
