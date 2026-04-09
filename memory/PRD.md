# Natural Plylam B2B Ordering System - PRD

## Original Problem Statement
Extract and convert the Timber-App repository from Python/MongoDB to PHP/MySQL while preserving all design and functionality.

**Repository Source:** https://github.com/RohitSolanki021/Timber-App.git

## Architecture

### Original Stack (Python/MongoDB)
- Backend: FastAPI (Python) on port 8001
- Database: MongoDB
- Frontend: React + TypeScript + Vite + Tailwind

### New Stack (PHP/MySQL) - COMPLETED
- Backend: Pure PHP with PDO
- Database: MySQL
- Frontend: React + TypeScript + Vite + Tailwind (unchanged)

## Implementation Status

### Completed (January 2026)

#### PHP + MySQL Backend Conversion ✅
- [x] MySQL database schema with all tables
- [x] User authentication with JWT (custom implementation)
- [x] MPIN authentication support
- [x] Product catalog with variants (thickness/size)
- [x] 6-tier pricing system
- [x] Order management (create, update, approve, cancel, dispatch)
- [x] Invoice generation and management
- [x] Customer management with approval workflow
- [x] Banner management
- [x] Admin dashboard with statistics
- [x] Sales portal endpoints
- [x] Stock management

#### Files Created
```
backend-mysql/
├── api/
│   ├── index.php           (663 lines) - Main router + auth/products
│   ├── routes_orders.php   (503 lines) - Order endpoints
│   ├── routes_customers.php (289 lines) - Customer endpoints
│   ├── routes_invoices.php (224 lines) - Invoice endpoints
│   ├── routes_admin.php    (269 lines) - Admin + banners + users
│   └── routes_sales.php    (289 lines) - Sales portal
├── config/
│   ├── config.php          - Configuration
│   ├── database.php        - PDO database connection
│   └── schema.sql          - MySQL schema + seed data
├── middleware/
│   └── auth.php            - JWT implementation
├── helpers.php             - Utility functions
├── .env                    - Environment variables
├── .htaccess              - Apache rewrite rules
└── README.md              - Documentation
```

**Total PHP Code:** ~2,700 lines
**SQL Schema:** ~300 lines

### Test Credentials (unchanged)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@naturalplylam.com | admin123 |
| Manager | manager@naturalplylam.com | manager123 |
| Admin | worker@naturalplylam.com | worker123 |
| Sales Person | sales@naturalplylam.com | sales123 |
| Customer | customer1@example.com | customer123 |

## Database Schema

### Tables
1. **users** - Admin, Manager, Sales Person accounts
2. **customers** - Customer accounts with pricing tier
3. **product_groups** - Plywood, Timber categories
4. **products** - Product catalog
5. **product_thicknesses** - Product thickness variants
6. **product_sizes** - Product size variants
7. **product_pricing** - 6-tier pricing per product
8. **product_images** - Product images (base64)
9. **stock** - Stock by product/thickness/size
10. **stock_pricing** - Variant-specific pricing
11. **orders** - Order headers
12. **order_items** - Order line items
13. **invoices** - Invoice headers
14. **invoice_items** - Invoice line items
15. **banners** - Promotional banners

## API Endpoints (40+ endpoints)

### Authentication
- POST /api/login
- POST /api/register
- GET /api/me
- POST /api/mpin/set
- POST /api/mpin/login
- GET /api/mpin/check

### Products
- GET /api/product-groups
- GET /api/products-v2
- GET /api/products-v2/{id}
- GET /api/products-v2/{id}/stock
- POST /api/admin/products-v2
- PUT /api/admin/products-v2/{id}
- POST /api/admin/products-v2/{id}/image
- DELETE /api/admin/products-v2/{id}/image/{index}

### Orders
- POST /api/orders/direct
- GET /api/orders/v2
- GET /api/orders/v2/{id}
- PUT /api/orders/v2/{id}
- PUT /api/orders/v2/{id}/items
- PUT /api/orders/v2/{id}/approve
- PUT /api/orders/v2/{id}/cancel
- PUT /api/orders/v2/{id}/dispatch
- GET /api/customer/orders
- GET /api/customer/orders/{id}

### Customers
- GET /api/customers
- GET /api/customers/{id}
- POST /api/customers
- PUT /api/customers/{id}
- POST /api/customers/{id}/approve

### Invoices
- GET /api/invoices/v2
- GET /api/invoices/v2/{id}
- PUT /api/invoices/{id}
- POST /api/invoices/v2/{id}/mark-paid

### Admin
- GET /api/admin/dashboard
- GET /api/admin/users
- POST /api/admin/users
- GET /api/banners
- GET /api/admin/banners
- POST /api/admin/banners
- PUT /api/admin/banners/{id}
- DELETE /api/admin/banners/{id}

### Sales Portal
- GET /api/sales/dashboard
- GET /api/sales/customers
- GET /api/sales/orders
- GET /api/sales/invoices
- GET /api/sales/invoices/{id}

## Next Steps

### To Deploy PHP Backend:
1. Set up MySQL server
2. Import schema: `mysql -u root -p < config/schema.sql`
3. Configure .env with database credentials
4. Point web server to backend-mysql folder
5. Enable Apache mod_rewrite or configure Nginx

### Frontend Changes Required:
- Update API base URL to point to PHP backend
- No other changes needed (API responses are identical)

## Backlog

### P1 - Future Enhancements
- [ ] PDF invoice generation (using TCPDF/FPDF)
- [ ] Email notifications
- [ ] Excel import/export for products

### P2 - Nice to Have
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Database migrations system
