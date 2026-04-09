# GoDaddy Deployment - Natural Plylam B2B System

## What's Inside

```
godaddy-upload/
├── index.html          <- React App (main page)
├── assets/             <- React CSS/JS files
├── portal/             <- Customer Portal
├── sales/              <- Sales Portal
├── plylam.png          <- Logo
├── .htaccess           <- URL routing rules
└── api/                <- PHP Backend
    ├── index.php       <- Main API router
    ├── routes_*.php    <- API endpoints
    ├── helpers.php     <- Utility functions
    ├── config/
    │   ├── config.php  <- DATABASE SETTINGS (EDIT THIS!)
    │   ├── database.php
    │   └── schema.sql  <- Import this to MySQL
    └── middleware/
        └── auth.php    <- JWT authentication
```

## Step-by-Step GoDaddy Setup

### 1. Create MySQL Database in cPanel
1. Login to GoDaddy cPanel
2. Go to **MySQL Databases**
3. Create a new database (e.g., `plylam_b2b`)
4. Create a database user with password
5. Add user to database with **ALL PRIVILEGES**
6. Note down:
   - Database name
   - Username  
   - Password
   - Host (usually `localhost`)

### 2. Import Database Schema
1. Go to **phpMyAdmin** in cPanel
2. Select your database
3. Click **Import** tab
4. Upload `api/config/schema.sql`
5. Click **Go**

### 3. Configure Database Connection
Edit `api/config/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_cpanel_username_plylam_b2b');
define('DB_USER', 'your_cpanel_username_dbuser');
define('DB_PASS', 'your_database_password');
define('JWT_SECRET', 'change_this_to_a_long_random_string');
```

### 4. Upload Files
1. Go to **File Manager** in cPanel
2. Navigate to `public_html` folder
3. Upload ALL contents of `godaddy-upload/` folder
4. Make sure `.htaccess` is uploaded (enable "Show Hidden Files")

### 5. Test the API
Visit: `https://yourdomain.com/api/health`

Should return:
```json
{"status":"ok","timestamp":"...","database":"mysql"}
```

### 6. Test Login
Visit: `https://yourdomain.com`

Login with:
- **Admin:** admin@naturalplylam.com / admin123
- **Sales:** sales@naturalplylam.com / sales123
- **Customer:** customer1@example.com / customer123

## Troubleshooting

### "500 Internal Server Error"
- Check `api/config/config.php` has correct database credentials
- Check PHP version is 7.4+ in cPanel

### "404 Not Found" on pages
- Make sure `.htaccess` was uploaded
- Enable `mod_rewrite` in cPanel (usually enabled by default)

### API returns "Database connection failed"
- Verify database credentials in `config.php`
- GoDaddy database names are usually prefixed with your cPanel username

## File Permissions
If needed, set these permissions:
- Folders: 755
- PHP files: 644
- .htaccess: 644
