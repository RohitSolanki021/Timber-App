# Natural Plylam Admin Panel - PRD

## Original Problem Statement
Import PHP-Admin-Panel-Natural-Plylam GitHub repository and create a fully functional admin panel with:
- Full audit of existing codebase
- Check all connections (buttons, forms, tables, filters, search, pagination, CRUD, navigation, API calls)
- Fix broken, incomplete, or dummy parts
- Restructure professionally with clean folder structure
- Upgrade UI to be more professional and advanced

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based authentication
- **Database**: MongoDB (local)

## User Personas
1. **Super Admin** - Full access to all features
2. **Manager** - Can manage orders, customers, invoices
3. **Customer** - Can view their orders (future scope)

## Core Requirements (Static)
- [x] User authentication (login/logout)
- [x] Dashboard with KPIs
- [x] Customer management (list, approve pending)
- [x] Order management (list, filter, status updates)
- [x] Invoice management (list, filter, mark as paid)
- [x] Product catalog
- [x] Profile management

## Implemented Features (March 17, 2026)

### Backend (FastAPI)
- JWT authentication with secure password hashing
- RESTful API endpoints for all resources
- MongoDB integration for data persistence
- Demo data seeding on startup
- Health check endpoint

### Frontend (React/TypeScript)
- Professional admin panel layout with sidebar navigation
- Responsive design (desktop + mobile)
- Dashboard with:
  - KPI cards (Awaiting Approval, Total Orders, Due Invoices, Completed)
  - Latest Orders section
  - Quick Actions panel
  - Order Status Summary
- Customers page with:
  - Table view with search
  - Approve pending customers functionality
  - Pagination
- Orders page with:
  - Status filters (All, Created, Approved, Invoiced, Dispatched, Completed, Cancelled)
  - Search functionality
  - Clickable rows navigation
  - Pagination
- Invoices page with:
  - Status filters (All, Paid, Pending)
  - Search functionality
  - Clickable rows navigation
  - Link to associated order
- Order Detail page with workflow actions
- Invoice Detail page with mark as paid
- Products page with category filters
- Profile page with password change

### Files Changed
- `/app/frontend/src/App.tsx` - Routes configuration
- `/app/frontend/src/apiService.ts` - API service layer
- `/app/frontend/src/components/Layout.tsx` - Admin panel layout
- `/app/frontend/src/pages/Dashboard.tsx` - Dashboard page
- `/app/frontend/src/pages/Customers.tsx` - Customers management
- `/app/frontend/src/pages/Orders.tsx` - Orders management
- `/app/frontend/src/pages/Invoices.tsx` - Invoices management
- `/app/frontend/src/pages/Profile.tsx` - Profile settings
- `/app/frontend/src/types.ts` - TypeScript types
- `/app/backend/server.py` - FastAPI backend

### Removed Unused Files
- Cart.tsx, Checkout.tsx, Register.tsx (not needed for admin panel)
- CartContext.tsx, ApiModeToggle.tsx, apiToggle.ts, api.ts

## Issues Found & Fixed

### Critical
1. ✅ Missing CartItem type definition
2. ✅ No backend API server (PHP was incompatible)
3. ✅ Mobile-first layout not suitable for admin panel
4. ✅ Unused cart/checkout functionality cluttering codebase
5. ✅ parseFloat used on number types in InvoiceDetail

### Medium
1. ✅ Table rows not clickable for navigation
2. ✅ Inconsistent data-testid attributes
3. ✅ Missing loading and empty states

### Low
1. ✅ Unused variable in backend (admin_result)

## Prioritized Backlog

### P0 (Critical)
- All done

### P1 (High)
- Add customer editing functionality
- Add order creation for admin
- Add product management (CRUD)
- Implement invoice generation from orders

### P2 (Medium)
- Add reports/analytics dashboard
- Implement search across all entities
- Add export to Excel/PDF functionality
- Add notifications system

## Credentials for Testing
- **Admin**: admin@naturalplylam.com / admin123
- **Manager**: manager@naturalplylam.com / manager123

## Next Tasks
1. Implement customer editing
2. Add product management CRUD
3. Add invoice generation workflow
4. Implement analytics/reports
