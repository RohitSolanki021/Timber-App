# Natural Plylam - PHP Backend Deployment Guide

## Project Structure

```
backend-php/
├── api/
│   ├── index.php      # Main API router (all endpoints)
│   └── .htaccess      # URL rewriting
├── config/
│   ├── config.php     # Configuration & CORS
│   └── database.php   # MongoDB connection
├── middleware/
│   └── auth.php       # JWT authentication
├── helpers.php        # Utility functions
├── composer.json      # PHP dependencies
├── .env.example       # Environment template
└── .env               # Your configuration (create this)
```

## Requirements

- PHP 7.4+ (PHP 8.0+ recommended)
- MongoDB PHP Extension
- Composer (for dependencies)
- MongoDB database (Atlas recommended)

## Installation Steps

### 1. Install PHP MongoDB Extension

**Windows:**
1. Download php_mongodb.dll from https://pecl.php.net/package/mongodb
2. Place in PHP ext folder
3. Add to php.ini: `extension=mongodb`

**Linux/Mac:**
```bash
pecl install mongodb
echo "extension=mongodb.so" >> php.ini
```

### 2. Install Dependencies

```bash
cd backend-php
composer install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

**.env file contents:**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=plylam_admin
JWT_SECRET=your_secure_random_key_here
```

### 4. Test Locally

```bash
cd api
php -S localhost:8001
```

Visit: http://localhost:8001/health

## Hostinger Deployment

### Shared Hosting

1. **Upload files** via File Manager or FTP:
   - Upload entire `backend-php` folder to `public_html/api` or subdomain

2. **Configure .htaccess** in root:
```apache
RewriteEngine On
RewriteRule ^api/(.*)$ api/index.php [QSA,L]
```

3. **Install Composer dependencies** via SSH or Hostinger terminal:
```bash
cd public_html/api
composer install --no-dev
```

4. **Set permissions:**
```bash
chmod 644 .env
chmod 755 api/
```

### VPS Hosting

1. **Install requirements:**
```bash
sudo apt install php php-mongodb composer
```

2. **Configure Nginx:**
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

3. **Or Apache virtual host:**
```apache
<Directory /var/www/html/api>
    AllowOverride All
    Require all granted
</Directory>
```

## Frontend Configuration

Update frontend `.env` files to point to PHP backend:

```
VITE_API_BASE_URL=https://yourdomain.com/api
```

Build and upload frontend dist folders.

## MongoDB Atlas Setup

1. Create account at mongodb.com
2. Create free M0 cluster
3. Add database user (username/password)
4. Whitelist IP: 0.0.0.0/0 (or your server IP)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/
   ```
6. Update .env with connection string

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /login | User login |
| GET | /me | Current user |
| GET | /customers | List customers |
| POST | /customers | Create customer |
| GET | /products-v2 | List products |
| POST | /admin/products-v2 | Create product |
| GET | /orders/v2 | List orders |
| POST | /orders/direct | Create order |
| PUT | /orders/v2/{id}/approve | Approve order |
| PUT | /orders/v2/{id}/cancel | Cancel order |
| GET | /invoices/v2 | List invoices |
| GET | /banners | Public banners |
| GET | /admin/banners | Admin banners |
| POST | /admin/banners | Create banner |
| GET | /admin/dashboard | Admin stats |
| GET | /sales/dashboard | Sales stats |
| GET | /sales/customers | Sales customers |
| GET | /sales/orders | Sales orders |
| GET | /sales/invoices | Sales invoices |

## Troubleshooting

### MongoDB Connection Error
- Check connection string format
- Verify IP whitelist includes server IP
- Test connection with MongoDB Compass

### 500 Internal Server Error
- Check PHP error logs
- Verify MongoDB extension is loaded: `php -m | grep mongodb`
- Check file permissions

### CORS Errors
- Verify config.php has correct CORS headers
- Check .htaccess is being read (AllowOverride All)

### JWT Errors
- Ensure JWT_SECRET is set in .env
- Check token format in Authorization header
