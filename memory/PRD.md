# Natural Plylam Business Management System - PRD

## Original Problem Statement
1. Import PHP-Admin-Panel-Natural-Plylam GitHub repository
2. Full audit of existing codebase
3. Complete Customer CRUD management
4. Complete Product CRUD management with manual tier pricing
5. Invoice status editing functionality
6. Reusable CRUD architecture with professional components
7. **Customer Portal** - Build a separate customer-facing portal for order management
8. **Sales Portal** - Build a sales team portal for managing assigned customers
9. **Standalone Admin App** - Build a new standalone admin app from user's GitHub repo
10. **Role-Based Access Control** - Super Admin vs Normal Admin (Worker)

## Architecture
- **Admin Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (port 3000)
- **Customer Portal**: React 19 + TypeScript + Vite + Tailwind CSS (served at /portal/)
- **Sales Portal**: React 19 + TypeScript + Vite + Tailwind CSS (served at /sales/)
- **Standalone Admin App**: `/app/admin-app-standalone/` - Independent admin app
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based authentication with role-based access
- **Database**: MongoDB (local)

## User Roles & Permissions

### Super Admin
- Full access to all features
- **Exclusive**: Staff Management (Add/Edit/Delete admins, customers, sales persons)
- Customer Management (Full CRUD, approve/reject, activate/deactivate)
- All other admin features

### Admin (Worker/Normal Admin)
- Dashboard access
- Orders management
- Invoices management
- Products management
- Customers: **VIEW ONLY** (no add/edit/delete/approve)
- **NO Access**: Staff Management

### Sales Person
- Dashboard with assigned customers
- Manage assigned customers only
- Place orders on behalf of customers

### Customer
- Browse products (with tier-based pricing)
- Place orders, manage cart
- View orders and invoices

## Implemented Features (March 17, 2026)

### Role-Based Access Control
- **Backend**: User management API endpoints (`/api/users` - CRUD)
- **Super Admin check**: `require_super_admin()` middleware
- **Login fixes**: Support email-based user_id in JWT tokens
- **Frontend**: Conditional navigation (Staff menu only for Super Admin)
- **Customers page**: View-only mode for normal Admin

### Staff Management Page (Super Admin Only)
- Located at `/users` route
- List all staff members (Super Admin, Admin, Manager, Sales Person)
- Add new staff with role selection
- Edit staff details
- Delete staff (with protection for last Super Admin and self-deletion)
- Role filter and search functionality

### Test Credentials
- **Super Admin**: admin@naturalplylam.com / admin123
- **Worker Admin**: worker@naturalplylam.com / worker123
- **Manager**: manager@naturalplylam.com / manager123
- **Sales Person**: sales1@naturalplylam.com / sales123
- **Customer**: customer1@example.com / customer123

## URLs
- **Admin Panel**: https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/
- **Customer Portal**: https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/portal/
- **Sales Portal**: https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/sales/
- **Standalone Admin App (Dev)**: http://localhost:3001

## API Endpoints

### User Management (Super Admin Only)
- `GET /api/users` - List staff users with pagination, search, role filter
- `GET /api/users/{email}` - Get specific user
- `POST /api/users` - Create new staff user
- `PUT /api/users/{email}` - Update staff user
- `DELETE /api/users/{email}` - Delete staff user

## Files Modified/Created

### Backend
- `/app/backend/server.py`:
  - Added Worker Admin to initial data
  - Added User Management CRUD endpoints
  - Fixed `/api/me` to support email-based user_id

### Original Admin Panel (`/app/frontend/`)
- `src/App.tsx` - Added Users route with SuperAdminRoute protection
- `src/components/Layout.tsx` - Conditional Staff nav for Super Admin
- `src/pages/Customers.tsx` - View-only mode for non-Super Admin
- `src/pages/Users.tsx` - New Staff Management page
- `src/apiService.ts` - Added user management API methods

### Standalone Admin App (`/app/admin-app-standalone/`)
- Same changes as original admin panel

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Customer CRUD
- [x] Product CRUD with manual tier pricing
- [x] Invoice status editing
- [x] Reusable components
- [x] Customer Portal with all features
- [x] Sales Portal implementation
- [x] Standalone Admin App
- [x] Role-Based Access Control (Super Admin vs Admin)

### P1 (High)
- [ ] Order creation for admin
- [ ] Invoice generation from orders
- [ ] Customer/Product import from CSV
- [ ] Password change for users

### P2 (Medium)
- [ ] Reports/analytics dashboard
- [ ] Email notifications
- [ ] Audit log for actions

### P3 (Low)
- [ ] Dark mode
- [ ] Print invoice PDF from admin
- [ ] Bulk actions

## Next Tasks
1. Order creation workflow for admin
2. Invoice generation from completed orders
3. Import customers/products from CSV
