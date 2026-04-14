# Plesk/IIS Deployment - Natural Plylam B2B

## Your Server Uses IIS (Windows)

Since your server runs IIS (not Apache), `.htaccess` won't work. You have two options:

---

## Option 1: Direct PHP Access (Simplest - No Config Needed)

Access the API directly via PHP files:

```
http://92.204.70.5/plesk-site-preview/natural.eduglobal.co.in/api/index.php/health
http://92.204.70.5/plesk-site-preview/natural.eduglobal.co.in/api/index.php/login
```

The frontend needs to be updated to use this URL pattern.

---

## Option 2: Enable URL Rewrite in IIS (Recommended)

1. In Plesk, go to your domain settings
2. Look for **"URL Rewrite"** or **"Hosting Settings"**
3. Upload the `web.config` file to your document root
4. Make sure IIS URL Rewrite module is installed

---

## Database Setup (Required for Both Options)

### Step 1: Create MySQL Database in Plesk
1. Go to **Databases** → **Add Database**
2. Create database: `plylam_b2b`
3. Create user with password
4. Note your credentials

### Step 2: Import Schema
1. Open **phpMyAdmin**
2. Select your database
3. Click **Import**
4. Upload `api/config/schema.sql`

### Step 3: Configure API
Edit `api/config/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_username');  
define('DB_PASS', 'your_password');
define('JWT_SECRET', 'change_this_random_string');
```

---

## Test the API

After setup, test with:
```
http://92.204.70.5/plesk-site-preview/natural.eduglobal.co.in/api/index.php/health
```

Should return:
```json
{"status":"ok","timestamp":"...","database":"mysql"}
```

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | admin@naturalplylam.com | admin123 |
| **Manager** | manager@naturalplylam.com | manager123 |
| **Sales Person** | sales@naturalplylam.com | sales123 |
| **Customer** | customer1@example.com | customer123 |

---

## File Structure

```
httpdocs/
├── index.html          ← Admin Portal
├── web.config          ← IIS routing rules
├── assets/
├── portal/             ← Customer Portal
├── sales/              ← Sales Portal
└── api/
    ├── index.php       ← Main API (access directly)
    ├── config/
    │   ├── config.php  ← UPDATE DATABASE CREDENTIALS
    │   └── schema.sql  ← Import to MySQL
    └── middleware/
```

---

## Troubleshooting

### "404 Not Found"
- Try accessing `api/index.php/health` directly
- Check if PHP is enabled in Plesk

### "500 Internal Server Error"  
- Check database credentials in `api/config/config.php`
- Check PHP error logs in Plesk

### Database connection failed
- Verify MySQL credentials
- Check if database exists and schema was imported
