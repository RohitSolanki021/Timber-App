# Natural Plylam B2B API - PHP + MySQL Backend

A complete PHP + MySQL implementation of the Natural Plylam B2B Ordering System API.

## Requirements

- PHP 7.4+ (recommended: PHP 8.0+)
- MySQL 5.7+ or MariaDB 10.3+
- Apache/Nginx with URL rewriting enabled

## Installation

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
source /path/to/backend-mysql/config/schema.sql
```

Or import directly:
```bash
mysql -u root -p plylam_b2b < config/schema.sql
```

### 2. Configure Environment

Copy and edit the `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_NAME=plylam_b2b
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your_secret_key
```

### 3. Apache Configuration

Ensure `mod_rewrite` is enabled:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

Set document root to the `backend-mysql` folder or configure a virtual host.

### 4. Nginx Configuration

```nginx
location /api {
    try_files $uri $uri/ /api/index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}
```

## API Endpoints

### Authentication
- `POST /api/login` - Login (Admin/Sales/Customer)
- `POST /api/register` - Customer registration
- `GET /api/me` - Get current user
- `POST /api/mpin/set` - Set MPIN for quick login
- `POST /api/mpin/login` - Login with phone + MPIN

### Products
- `GET /api/products-v2` - List products (with ?group=Plywood/Timber)
- `GET /api/products-v2/{id}` - Get product details
- `POST /api/admin/products-v2` - Create product (Admin)
- `PUT /api/admin/products-v2/{id}` - Update product (Admin)

### Orders
- `POST /api/orders/direct` - Create order
- `GET /api/orders/v2` - List orders
- `GET /api/orders/v2/{id}` - Get order details
- `PUT /api/orders/v2/{id}/approve` - Approve order (Admin)
- `PUT /api/orders/v2/{id}/cancel` - Cancel order (Admin)
- `PUT /api/orders/v2/{id}/dispatch` - Dispatch order (Admin)

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `POST /api/customers/{id}/approve` - Approve customer (Admin)

### Invoices
- `GET /api/invoices/v2` - List invoices
- `GET /api/invoices/v2/{id}` - Get invoice details
- `PUT /api/invoices/{id}` - Update invoice
- `POST /api/invoices/v2/{id}/mark-paid` - Mark invoice as paid

### Banners
- `GET /api/banners` - Get active banners (public)
- `GET /api/admin/banners` - List all banners (Admin)
- `POST /api/admin/banners` - Create banner
- `PUT /api/admin/banners/{id}` - Update banner
- `DELETE /api/admin/banners/{id}` - Delete banner

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List staff users
- `POST /api/admin/users` - Create staff user

### Sales Portal
- `GET /api/sales/dashboard` - Sales dashboard
- `GET /api/sales/customers` - Assigned customers
- `GET /api/sales/orders` - Sales orders
- `GET /api/sales/invoices` - Customer invoices

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@naturalplylam.com | admin123 |
| Manager | manager@naturalplylam.com | manager123 |
| Admin | worker@naturalplylam.com | worker123 |
| Sales Person | sales@naturalplylam.com | sales123 |
| Customer | customer1@example.com | customer123 |

## Directory Structure

```
backend-mysql/
├── api/
│   ├── index.php           # Main router
│   ├── routes_orders.php   # Order endpoints
│   ├── routes_customers.php # Customer endpoints
│   ├── routes_invoices.php # Invoice endpoints
│   ├── routes_admin.php    # Admin endpoints
│   └── routes_sales.php    # Sales portal endpoints
├── config/
│   ├── config.php          # Configuration
│   ├── database.php        # Database connection
│   └── schema.sql          # MySQL schema
├── middleware/
│   └── auth.php            # JWT authentication
├── helpers.php             # Helper functions
├── .env                    # Environment variables
├── .htaccess              # Apache rewrite rules
└── README.md              # This file
```

## Pricing Tiers

The system supports 6 pricing tiers:
1. Standard
2. Dealer
3. Wholesale
4. Premium
5. VIP
6. Enterprise

Each customer is assigned a tier, and product prices are calculated based on their tier.

## License

Private - Natural Plylam
