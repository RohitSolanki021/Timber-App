# Natural Plylam B2B Ordering System

A complete B2B ordering system for Plywood and Timber products with Admin, Sales, and Customer portals.

## Project Structure

```
├── backend/           # FastAPI Python Backend
│   ├── server.py      # Main API server
│   ├── requirements.txt
│   ├── .env.example   # Environment template
│   ├── start_server.bat   # Windows batch script
│   └── start_server.ps1   # PowerShell script
│
├── frontend/          # Admin Portal (React + Vite)
├── customer-portal/   # Customer Portal (React + Vite)
├── sales-portal/      # Sales Portal (React + Vite)
└── DEPLOYMENT_GUIDE.md
```

## Quick Start (Windows)

### Backend
1. Open Command Prompt or PowerShell
2. Navigate to `backend` folder
3. Run `start_server.bat` or `.\start_server.ps1`
4. Update `.env` with your MongoDB connection string

### Frontend
1. Open Command Prompt in each frontend folder
2. Run `npm install`
3. Run `npm run dev` (development) or `npm run build` (production)

## Requirements

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

## Default Credentials

- **Admin**: admin@naturalplylam.com / admin123
- **Sales**: sales@naturalplylam.com / sales123
- **Customer**: customer1@example.com / customer123

## Features

### Admin Portal
- Dashboard with pending orders (Plywood/Timber split)
- Order management (Edit, Approve, Cancel)
- Product management with image upload
- Customer management with tier pricing
- Invoice management
- Banner management
- Staff management

### Sales Portal
- Customer-specific ordering
- Order history per customer
- Invoice viewing and sharing (WhatsApp)
- Dashboard with sales metrics

### Customer Portal
- Fast ordering system
- Product catalog with pricing
- Order tracking
- Invoice viewing

## API Documentation

Start the backend and visit: `http://localhost:8001/docs`

## Support

For deployment assistance, refer to `DEPLOYMENT_GUIDE.md`
