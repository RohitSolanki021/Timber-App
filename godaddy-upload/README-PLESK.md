# Plesk Deployment - Natural Plylam B2B

## Your Domain
`http://natural.eduglobal.co.in`

## Quick Setup for Plesk

### Step 1: Create MySQL Database
1. In Plesk, go to **Databases** → **Add Database**
2. Note down:
   - Database name: `plylam_b2b`
   - Username
   - Password

### Step 2: Import Database
1. Click on your database → **phpMyAdmin**
2. Click **Import** tab
3. Upload `api/config/schema.sql`
4. Click **Go**

### Step 3: Configure API
Edit `api/config/config.php` and update these lines:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');  // e.g., plylam_b2b
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
define('JWT_SECRET', 'change_this_to_random_string');
```

### Step 4: Upload Files
Upload ALL contents of this folder to your domain's document root (httpdocs):
```
httpdocs/
├── index.html
├── assets/
├── portal/
├── sales/
├── plylam.png
├── .htaccess
└── api/
    ├── index.php
    ├── routes_*.php
    ├── config/
    └── middleware/
```

### Step 5: Test
1. Visit `http://natural.eduglobal.co.in/api/health`
   - Should return: `{"status":"ok","database":"mysql"}`
2. Visit `http://natural.eduglobal.co.in`
   - Should show login page

### Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@naturalplylam.com | admin123 |
| Sales | sales@naturalplylam.com | sales123 |
| Customer | customer1@example.com | customer123 |

## Troubleshooting

### API returns 404
- Check `.htaccess` was uploaded
- In Plesk, ensure Apache is set (not Nginx only)
- Go to **Apache & nginx Settings** → enable "Additional directives" or "Proxy mode"

### API returns 500 error
- Check database credentials in `api/config/config.php`
- Check PHP error logs in Plesk

### React pages show 404 on refresh
- Make sure `.htaccess` is in document root
- Enable mod_rewrite in Apache

## File Structure After Upload
```
httpdocs/
├── index.html          ← Admin Portal
├── assets/             ← CSS/JS
├── portal/             ← Customer Portal  
├── sales/              ← Sales Portal
├── plylam.png          ← Logo
├── .htaccess           ← Routing rules
└── api/                ← PHP Backend
    ├── index.php       ← Main API router
    ├── config/
    │   ├── config.php  ← DATABASE CREDENTIALS HERE
    │   ├── database.php
    │   └── schema.sql  ← Import this first
    └── middleware/
        └── auth.php
```
