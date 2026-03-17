# Natural Plylam Admin Panel - PRD

## Original Problem Statement
1. Import PHP-Admin-Panel-Natural-Plylam GitHub repository
2. Full audit of existing codebase
3. Fix broken, incomplete, or dummy parts
4. Add complete Customer CRUD management
5. Create reusable CRUD architecture with professional components
6. Improve UX with loading states, toasts, confirmation dialogs
7. Keep code modular and scalable

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
- [x] Customer management (FULL CRUD)
- [x] Order management (list, filter, status updates)
- [x] Invoice management (list, filter, mark as paid)
- [x] Product catalog
- [x] Profile management

## Implemented Features

### Phase 1 (March 17, 2026) - Initial Setup
- FastAPI backend with MongoDB
- React frontend with Vite
- JWT authentication
- Basic admin panel layout
- Dashboard, Orders, Invoices, Products pages

### Phase 2 (March 17, 2026) - Customer CRUD & Reusable Components

#### Backend Enhancements
- `GET /api/customers` - List with search, filter, sort, pagination
- `GET /api/customers/{id}` - Get single customer with orders/invoices
- `POST /api/customers` - Create new customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}?hard_delete=bool` - Soft/hard delete
- `POST /api/admin?action=approve_customer` - Approve pending
- `POST /api/admin?action=reject_customer` - Reject customer
- `POST /api/admin?action=toggle_customer_status` - Activate/deactivate

#### Reusable UI Components Created
1. **Toast Notifications** (`/src/components/ui/Toast.tsx`)
   - Success, error, warning, info variants
   - Auto-dismiss with configurable duration
   - Context-based API for easy use

2. **Confirm Dialog** (`/src/components/ui/ConfirmDialog.tsx`)
   - Danger, warning, info variants
   - Loading state support
   - Customizable text

3. **SlideOver Drawer** (`/src/components/ui/SlideOver.tsx`)
   - Multiple sizes (sm, md, lg, xl)
   - Header with title/subtitle
   - Footer for action buttons
   - Smooth animations

4. **DataTable** (`/src/components/ui/DataTable.tsx`)
   - Sortable columns
   - Pagination with first/last page
   - Loading state
   - Empty state with custom icon/message
   - Row click handler
   - Responsive

#### Customer Management Features
- **List View**: Search, status filters, sort by column, pagination
- **Add Customer**: SlideOver form with validation
- **Edit Customer**: Pre-filled form with all fields
- **View Details**: Full customer profile with orders history
- **Status Actions**: Approve, reject, activate, deactivate
- **Delete Options**: Soft delete (archive) or hard delete

#### Customer Form Fields
- Company Name, GST Number
- Contact Person, Phone, Email
- Street Address, City, State, Pincode
- Pricing Tier (1-3), Credit Limit
- Notes, Active Status

### Files Changed
- `/app/backend/server.py` - Complete CRUD endpoints
- `/app/frontend/src/App.tsx` - Routes, ToastProvider
- `/app/frontend/src/apiService.ts` - API methods
- `/app/frontend/src/types.ts` - Type definitions
- `/app/frontend/src/pages/Customers.tsx` - Full CRUD page
- `/app/frontend/src/pages/CustomerDetail.tsx` - Detail page
- `/app/frontend/src/components/ui/` - Reusable components

## Testing Results
- Backend: 100% pass rate
- Frontend: 100% pass rate
- All CRUD operations verified
- All UI components working

## Credentials for Testing
- **Admin**: admin@naturalplylam.com / admin123
- **Manager**: manager@naturalplylam.com / manager123

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Complete Customer CRUD
- [x] Reusable components
- [x] Toast notifications
- [x] Confirm dialogs

### P1 (High)
- [ ] Order creation for admin
- [ ] Product management CRUD
- [ ] Invoice generation from orders
- [ ] Customer import/export (CSV)

### P2 (Medium)
- [ ] Reports/analytics dashboard
- [ ] Email notifications
- [ ] Audit log for actions
- [ ] User roles management

### P3 (Low)
- [ ] Dark mode
- [ ] Print invoice PDF
- [ ] Bulk actions on customers/orders
- [ ] Customer portal

## Next Tasks
1. Add Product CRUD (similar pattern to customers)
2. Order creation workflow for admin
3. Invoice generation from completed orders
4. Customer import from CSV
