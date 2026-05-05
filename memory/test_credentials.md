# Test Credentials

## PHP Backend / All Mobile Apps

| Field | Value |
| --- | --- |
| Email | `admin@naturalplylam.com` |
| Password | `admin123` |
| Role | Admin |

These credentials are seeded by the PHP backend on first run (see `/app/backend/config/schema.sql` and the admin seed routine). They authenticate against all three mobile apps (Admin, Sales, Customer) when `API_BASE_URL` points to the live PHP backend.
