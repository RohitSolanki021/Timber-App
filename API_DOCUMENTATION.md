# Timber & Plywood - Mobile App API Documentation

This document provides details on RESTful API endpoints available for Android customer and sales representative apps, including **request body examples** and **JSON response shapes** returned by each API.

## Response Conventions

Most endpoints return JSON. Typical success/error envelopes are:

```json
{ "success": true, "message": "..." }
```

```json
{ "success": false, "message": "..." }
```

Some read/list endpoints return arrays or objects directly (without a `success` wrapper), as noted below.

> **Pricing tier note:** Product, cart, order and invoice responses now include `pricing_type` (1-4) and tier-aware pricing values where applicable.

---

## Authentication

The API uses bearer-token authentication.

1. **Obtain a token:** Send a `POST` request to `/api/login.php`.
2. **Use the token:** Include in all protected requests as:
   `Authorization: Bearer <token>`

### `POST /api/login.php`
Authenticate customer/sub-user/sales users.

- **Request Body:** form-data or JSON
  - `email` (required)
  - `password` (required)
  - `app_role` (optional, e.g. `Customer`, `Sub-user`, `Sales Person`)

**Example request body**
```json
{
  "email": "customer@example.com",
  "password": "secret123",
  "app_role": "Customer"
}
```

**Success response (200)**
```json
{
  "success": true,
  "token": "<64-char-hex-token>",
  "expires_in": 3600,
  "user": {
    "id": 12,
    "name": "Acme Customer",
    "email": "customer@example.com",
    "role": "Customer",
    "status": "Active",
    "customer_id": 5
  }
}
```

**Error responses**
- `400`: `{"success":false,"message":"Email and password are required."}`
- `401`: `{"success":false,"message":"Invalid credentials."}`
- `403`: `{"success":false,"message":"This account does not have access to the requested app role."}`

### `POST /api/logout.php`
Revoke current access token.

- **Auth:** Bearer token required.

**Success response (200)**
```json
{ "success": true, "message": "Logged out successfully." }
```

### `POST /api/token/refresh.php`
Rotate current access token and return a new one.

- **Auth:** Bearer token required.

**Success response (200)**
```json
{
  "success": true,
  "token": "<new-64-char-hex-token>",
  "expires_in": 3600
}
```

### `GET /api/me.php`
Return currently authenticated user profile.

- **Auth:** Bearer token required.

**Success response (200)**
```json
{
  "success": true,
  "user": {
    "id": 12,
    "name": "Acme Customer",
    "email": "customer@example.com",
    "role": "Customer"
  }
}
```

### `POST /api/forgot-password.php`
Generate password reset token.

- **Request Body:** JSON or form-data
  - `email` (required)

**Example request body**
```json
{ "email": "customer@example.com" }
```

**Success response when user exists (200)**
```json
{
  "success": true,
  "message": "If your email is registered, password reset instructions have been generated.",
  "reset_token": "<raw-reset-token>",
  "expires_in": 1800
}
```

**Success response when user does not exist (200)**
```json
{
  "success": true,
  "message": "If your email is registered, password reset instructions have been generated."
}
```

### `POST /api/reset-password.php`
Reset password using reset token.

- **Request Body:** JSON or form-data
  - `token` (required)
  - `new_password` (required, min 8 chars)

**Example request body**
```json
{
  "token": "<raw-reset-token>",
  "new_password": "newPassword123"
}
```

**Success response (200)**
```json
{ "success": true, "message": "Password has been reset successfully." }
```

### `POST /api/register.php`
Register a new **primary customer** account (status starts as pending approval).

- **Request Body:** form-data
  - `name` (required, customer name)
  - `contactPerson` (required)
  - `phone` (required)
  - `email` (required)
  - `password` (required)
  - `pricing_type` (optional, integer `1..4`, default `1`)

**Success response (200)**
```json
{ "success": true, "message": "Registration successful. Your account is pending approval." }
```

**Error responses**
- `400`: missing required form fields
- `409`: `{"success":false,"message":"An account with this email already exists."}`

### `GET /api/verify_gstin.php?gstin=...`
Validate GSTIN format and return a mocked legal name/address payload.

**Success response (200)**
```json
{
  "name": "Mock Legal Business Name Pvt Ltd",
  "address": "123 Mock Address, Mock City, Mock State - 110011"
}
```

**Error response**
- `400`: `{"error":"Invalid GSTIN format."}`

---

## Customer App Endpoints

_Requires Customer or Sub-user token._

### Products

#### `GET /api/products.php`
Fetch active products with pagination, search and filters.

- **Query Params (optional):**
  - `page` (default `1`)
  - `per_page` (default `20`, max `100`)
  - `search` (matches product id/name/category)
  - `category` (exact category name)
  - `stock_status` (`in_stock` / `out_of_stock`)
  - `sort` (`created_at_desc`, `price_asc`, `price_desc`, `name_asc`)

**Success response (200, customer/sub-user)**
```json
{
  "success": true,
  "data": [
    {
      "id": "PLY-001",
      "name": "Marine Plywood",
      "category": "Plywood",
      "price": 1500,
      "priceUnit": "sheet",
      "pricing_type": 2,
      "pricing_rates": {
        "1": 1600,
        "2": 1500,
        "3": 1450,
        "4": 1400
      },
      "primary_image": "uploads/product-images/img_abc123.webp",
      "images": [
        {
          "id": 10,
          "image_path": "uploads/product-images/img_xyz456.jpg",
          "created_at": "2026-01-10 09:21:33"
        }
      ],
      "stock_status": "In Stock"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 120,
    "total_pages": 6
  }
}
```


#### `POST /api/products.php?action=upload_images`
Upload/update product images.

- **Auth:** `Super Admin`, `Admin / Owner`, `Manager`, or `Sales Person`
- **Request Body:** `multipart/form-data`
  - `product_id` (required)
  - `primary_image` (optional, single JPG/PNG/WEBP up to 5MB)
  - `product_images[]` (optional, multiple JPG/PNG/WEBP up to 5MB each)

**Success response (200)**
```json
{
  "success": true,
  "message": "Product images uploaded successfully.",
  "product_id": "PLY-001",
  "primary_image": "uploads/product-images/img_abc123.webp",
  "gallery_images": [
    "uploads/product-images/img_def456.jpg"
  ]
}
```

**Error responses**
- `400`: missing `product_id` or files, invalid image, upload validation errors
- `403`: unauthorized role
- `404`: product not found

### Cart

#### `GET /api/cart.php`
Gets the logged-in user cart.

- **Sales Person support:** pass `customer_id` in query string to fetch cart for an assigned customer.

**Success response (200)**
```json
{
  "items": [
    {
      "product_id": "PLY-001",
      "name": "Marine Plywood",
      "price": "1500.00",
      "quantity": 10,
      "line_total": "15000.00"
    }
  ],
  "total": 15000,
  "pricing_type": 2
}
```

#### `POST /api/cart.php`
Adds/updates a cart item.

- **Sales Person support:** include `customer_id` in body when managing assigned customer cart.

- **Request Body (JSON):**
```json
{ "product_id": "PLY-001", "quantity": 10, "customer_id": 5 }
```

**Success response (200)**
```json
{ "success": true, "message": "Cart updated successfully." }
```

#### `DELETE /api/cart.php?product_id=PLY-001`
Removes one product from cart.

- **Sales Person support:** include `customer_id` query param as well.

**Success response (200)**
```json
{ "success": true, "message": "Item removed from cart." }
```

#### `DELETE /api/cart.php`
Clears the whole cart.

- **Sales Person support:** include `customer_id` query param.

**Success response (200)**
```json
{ "success": true, "message": "Cart cleared." }
```

### Checkout & Orders

#### `POST /api/checkout.php`
Creates an order from cart items and clears the cart.

- **Sales Person support:** include `customer_id` in request JSON (or query) to checkout cart for an assigned customer. Orders created this way set `sales_person_id` to the authenticated sales user.

**Success response (201)**
```json
{
  "success": true,
  "message": "Checkout completed successfully.",
  "order_id": "ORD-20250101-0001",
  "amount": 25000,
  "pricing_type": 2
}
```

#### `POST /api/orders.php`
Creates a direct order (without cart).

- **Roles:** `Customer`, `Sub-user`, `Sales Person`.
- **Sales Person support:** include `customer_id` in request JSON to create an order on behalf of an assigned customer.
- **sales_person_id behavior:** this field is set only when a sales person creates the order; for customer/sub-user created orders it remains `null`.

- **Request Body (JSON):**
  ```json
  {
    "customer_id": 5,
    "items": [
      { "product_id": "PLY-001", "quantity": 10 },
      { "product_id": "TIM-001", "quantity": 5 }
    ]
  }
  ```

**Success response (201)**
```json
{
  "success": true,
  "message": "Order created successfully.",
  "order_id": "ORD-20250101-0002",
  "amount": 32500,
  "pricing_type": 2
}
```


#### `POST /api/orders.php?action=upload_image`
Uploads an image for an existing order (customer owner, assigned sales rep, or admin roles).

- **Request Body:** `multipart/form-data`
  - `order_id` (required)
  - `image` (required, JPG/PNG/WEBP, max 5MB)

**Success response (200)**
```json
{ "success": true, "message": "Image uploaded successfully.", "image_path": "uploads/order-images/img_abc123.jpg" }
```

#### `GET /api/orders.php`
Fetches customer orders with pagination and filters.

- **Query Params (optional):**
  - `page` (default `1`)
  - `per_page` (default `20`, max `100`)
  - `status` (exact order status)
  - `search` (matches order id/customer name)
  - `from_date` (`YYYY-MM-DD`)
  - `to_date` (`YYYY-MM-DD`)

**Success response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-20250101-0002",
      "customer_id": 5,
      "customerName": "Acme Pvt Ltd",
      "pricing_type": 2,
      "status": "Pending",
      "order_date": "2025-01-01 10:00:00",
      "grand_total": "32500.00"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

#### `GET /api/orders.php?id=ORD-...`
Fetches one order with order items.

**Success response (200)**
```json
{
  "id": "ORD-20250101-0002",
  "customer_id": 5,
  "customerName": "Acme Pvt Ltd",
  "pricing_type": 2,
  "status": "Pending",
  "items": [
    { "product_id": "PLY-001", "productName": "Marine Plywood", "quantity": 10, "unitPrice": "1500.00" }
  ],
  "images": [
    { "id": 1, "image_path": "uploads/order-images/img_abc123.jpg", "uploaded_by_name": "Customer User", "created_at": "2026-03-04 10:00:00" }
  ]
}
```

### Invoices

#### `GET /api/invoices.php`
Fetches invoices for the authenticated user scope:
- Customer/Sub-user: own invoices
- Sales Person: assigned customers
- Manager/Super Admin/Admin / Owner: all invoices

- **Query Params (optional):** `page`, `per_page`, `status`, `search`, `from_date`, `to_date`, and for sales reps `customer_id`.

**Success response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "INV-0001",
      "order_id": "ORD-20250101-0002",
      "issue_date": "2025-01-02",
      "due_date": "2025-01-30",
      "grand_total": "32500.00",
      "status": "Due",
      "pricing_type": 2
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

#### `GET /api/invoices.php?id=INV-...`
Fetches full invoice details for a single invoice, including line items and company info.

- Access control:
  - Customer/Sub-user: only own invoice
  - Sales Person: invoice for assigned customer/order
  - Manager/Super Admin/Admin / Owner: any invoice

**Success response (200)**
```json
{
  "success": true,
  "data": {
    "id": "INV-0001",
    "order_id": "ORD-20250101-0002",
    "customer_name": "Acme Pvt Ltd",
    "pricing_type": 2,
    "items": [
      { "product_id": "PLY-001", "productName": "Marine Plywood", "quantity": 10, "unitPrice": "1500.00" }
    ],
    "company_info": {
      "name": "Natural Plylam",
      "address": "Head Office Address"
    },
    "can_mark_paid": true
  }
}
```

#### `POST /api/invoices.php?action=mark_paid`
Marks an invoice as paid.

- **Allowed roles:** `Manager`, `Super Admin`, `Admin / Owner`
- **Request Body (JSON or form-data):**
  - `invoice_id` (required)
- **Side effect:** also updates related `orders.paymentStatus` to `Paid` for consistency.

**Success response (200)**
```json
{ "success": true, "message": "Invoice marked as paid.", "invoice_id": "INV-0001" }
```

### Profile

#### `GET /api/customers.php?action=me`
Fetches customer profile and linked customer users.

**Success response (200)**
```json
{
  "id": 5,
  "name": "Acme Pvt Ltd",
  "contactPerson": "John Doe",
  "phone": "+91-9000000000",
  "email": "accounts@acme.com",
  "users": [
    { "id": 12, "name": "John Doe", "email": "customer@example.com", "phone": "+91-9000000000", "role": "Customer", "status": "Active" }
  ],
  "images": [
    { "id": 2, "image_path": "uploads/customer-images/img_xyz789.png", "uploaded_by_name": "John Doe", "created_at": "2026-03-04 10:05:00" }
  ]
}
```

#### `PATCH /api/customers.php?action=update_profile`
Updates customer profile details.

- **Request Body (JSON, partial update allowed):**
```json
{
  "name": "John Doe",
  "contactPerson": "John Doe",
  "phone": "+91-9000000001",
  "email": "updated@acme.com",
  "address": "Mumbai"
}
```

**Success response (200)**
```json
{ "success": true, "message": "Profile updated successfully." }
```

#### `POST /api/customers.php?action=change_password`
Change password for current customer/sub-user.

- **Request Body:** JSON or form-data
  - `current_password`
  - `new_password` (min 8 chars)

**Success response (200)**
```json
{ "success": true, "message": "Password changed successfully. Please login again." }
```

#### `POST /api/customers.php?action=create_sub_user`
Creates sub-user under primary customer account.

- **Request Body:** form-data
  - `name` (required)
  - `email` (required)
  - `phone` (optional)
  - `password` (required)

**Success response (200)**
```json
{ "success": true, "message": "Sub-user created successfully." }
```


#### `POST /api/customers.php?action=upload_image`
Uploads an image for a customer profile.

- **Request Body:** `multipart/form-data`
  - `image` (required, JPG/PNG/WEBP, max 5MB)
  - `customer_id` (optional for customer/sub-user; required for sales/admin)

**Success response (200)**
```json
{ "success": true, "message": "Image uploaded successfully.", "image_path": "uploads/customer-images/img_xyz789.png" }
```

---

## Sales Representative App Endpoints

_Requires Sales Person token._

### Dashboard

#### `GET /api/dashboard.php`
Returns sales representative dashboard summary metrics.

**Success response (200)**
```json
{
  "monthly_sales": 125000,
  "new_orders_week": 8,
  "assigned_customers": 14,
  "pending_orders_count": 5,
  "total_outstanding": 89000,
  "due_invoices_count": 3
}
```

- `pending_orders_count`: orders assigned to the sales rep where status is not `Completed` or `Cancelled`.
- `total_outstanding`: sum of `customers.outstandingBalance` across customers assigned to the sales rep.
- `due_invoices_count`: count of invoices with status `Due` for customers assigned to the sales rep.

### Customers & Notes

#### `GET /api/customers.php`
Lists customers assigned to logged-in sales representative.

- **Query Params (optional):** `search`, `page`, `per_page`.

**Success response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Acme Pvt Ltd",
      "contactPerson": "John Doe",
      "phone": "+91-9000000000",
      "email": "accounts@acme.com",
      "outstandingBalance": "10000.00",
      "pricing_type": 2,
      "status": "Approved"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

#### `GET /api/customers.php?id={customer_id}`
Gets one assigned customer profile and notes.

**Success response (200)**
```json
{
  "id": 5,
  "name": "Acme Pvt Ltd",
  "contactPerson": "John Doe",
  "notes": [
    {
      "id": 10,
      "customer_id": 5,
      "user_id": 21,
      "note": "Follow-up on payment due",
      "created_at": "2025-01-05 09:00:00"
    }
  ]
}
```

#### `POST /api/customers.php?action=add_note`
Adds a note for a customer.

- **Request Body:** form-data
  - `customer_id` (required)
  - `note` (required)

**Success response (200)**
```json
{ "success": true, "message": "Note added." }
```

#### `POST /api/customers.php?action=change_password`
Change password for current sales representative account.

- **Request Body:** same as customer password change.

### Orders

#### `GET /api/orders.php`
Lists orders from assigned customers.

#### `GET /api/orders.php?scope=mine`
Lists orders created under the sales representative.

#### `GET /api/orders.php?id=ORD-...`
Gets one visible order and order items.

#### `GET /api/orders.php` filtering/pagination
Supports `page`, `per_page`, `status`, `search`, `from_date`, `to_date` and (for sales) `scope`.

**Response shape:** same as customer order list/detail responses shown above.

### Invoices

#### `GET /api/invoices.php`
Lists invoices visible to the authenticated user role with pagination.

#### `GET /api/invoices.php?customer_id={customer_id}`
For Sales Person users, lists invoices for one assigned customer.

#### `GET /api/invoices.php` filters/pagination
Supports `page`, `per_page`, `status`, `search`, `from_date`, `to_date` and (for sales) `customer_id`.

#### `POST /api/invoices.php?action=mark_paid`
For `Manager`, `Super Admin`, `Admin / Owner` only. Marks invoice as paid and updates related order `paymentStatus` to `Paid`.

**GET success response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "INV-0001",
      "order_id": "ORD-20250101-0002",
      "issue_date": "2025-01-02",
      "due_date": "2025-01-30",
      "grand_total": "32500.00",
      "status": "Due",
      "customer_name": "Acme Pvt Ltd",
      "pricing_type": 2
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

**POST success response (200)**
```json
{ "success": true, "message": "Invoice marked as paid.", "invoice_id": "INV-0001" }
```

### Products

#### `GET /api/products.php`
Lists active products with stock quantity for sales users, including pagination/search/filter support.

**Success response (200, sales user)**
```json
{
  "success": true,
  "data": [
    {
      "id": "PLY-001",
      "name": "Marine Plywood",
      "category": "Plywood",
      "price": 1500,
      "priceUnit": "sheet",
      "pricing_type": 1,
      "pricing_rates": {
        "1": 1500,
        "2": 1450,
        "3": 1400,
        "4": 1350
      },
      "stock": 120
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 120,
    "total_pages": 6
  }
}
```

#### `POST /api/invoices.php?action=mark_paid`
Marks an invoice as paid.

- **Allowed roles:** `Manager`, `Super Admin`, `Admin / Owner`
- **Request Body (JSON or form-data):**
  - `invoice_id` (required)
- **Side effect:** also updates related `orders.paymentStatus` to `Paid` for consistency.

**Success response (200)**
```json
{ "success": true, "message": "Invoice marked as paid.", "invoice_id": "INV-0001" }
```

### Profile

#### `PATCH /api/customers.php?action=update_profile`
Updates logged-in sales profile (`name`, `phone`).

- **Request Body (JSON):**
```json
{ "name": "Sales User", "phone": "+91-9999999999" }
```

**Success response (200)**
```json
{ "success": true, "message": "Sales profile updated successfully." }
```

---

## Admin App Support APIs

All admin app APIs are exposed via `GET/POST /api/admin.php` with either:

- `resource` query parameter for read/list endpoints.
- `action` query parameter for state-changing endpoints.

> Auth required: Bearer token. These endpoints support `Super Admin`, `Admin / Owner`, `Manager`, and where noted, `Sales Person`.

### Dashboard

#### `GET /api/admin.php?resource=dashboard`
Returns dashboard KPIs for admin roles and salesperson-specific KPI values for `Sales Person` role.

**Success response (200)**
```json
{
  "monthly_sales": 125000,
  "new_orders_week": 23,
  "assigned_customers": 48,
  "pending_orders_count": 9,
  "total_outstanding": 340000,
  "due_invoices_count": 12
}
```

### Customers

#### `GET /api/admin.php?resource=customers`
List customers for admin app, with optional filtering.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`, `Sales Person`
- **Query params (optional):** `search`, `status`

**Success response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "name": "Acme Traders",
      "contactPerson": "John",
      "phone": "+91-9999999999",
      "email": "acme@example.com",
      "outstandingBalance": "25000.00",
      "status": "Approved",
      "pricing_type": 2,
      "sales_person_id": 8,
      "sales_person_name": "Sales User"
    }
  ]
}
```

### Users

#### `GET /api/admin.php?resource=users`
List users for admin management UI.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`
- **Query params (optional):** `search`

#### `POST /api/admin.php?action=save_user`
Create or update user record.

- **Allowed roles:** `Super Admin`, `Manager`
- **Request body (JSON):**
  - `id` (optional; send to update existing user)
  - `name` (required)
  - `email` (required)
  - `role` (required)
  - `phone` (optional)
  - `status` (optional, default `Active`)
  - `password` (required for create, optional for update)

### Orders

#### `GET /api/admin.php?resource=orders`
List orders for admin app with pagination and filters.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`, `Sales Person`
- **Query params (optional):** `page`, `per_page`, `search`, `status`, `payment_status`, `from_date`, `to_date`

#### `POST /api/admin.php?action=update_order_status`
Update order status and optionally auto-create invoice when status becomes `Invoiced`.

- **Allowed roles:**
  - `Approved`: `Sales Person`, `Manager`, `Super Admin`
  - `Invoiced`: `Manager`, `Super Admin`
- **Request body (JSON):**
```json
{ "order_id": "ORD-20250101-0002", "status": "Approved" }
```

### Invoices

#### `GET /api/admin.php?resource=invoices`
List invoices for admin app with pagination and filters.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`, `Sales Person`
- **Query params (optional):** `page`, `per_page`, `search`, `status`

#### `POST /api/admin.php?action=mark_invoice_paid`
Mark invoice as paid and sync order payment status.

- **Allowed roles:** `Manager`, `Super Admin`, `Admin / Owner`
- **Request body (JSON):**
```json
{ "invoice_id": "INV-0001" }
```

### Products & Categories

#### `GET /api/admin.php?resource=products`
List products for admin catalog screens.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`, `Sales Person`
- **Query params (optional):** `page`, `per_page`, `search`, `status`, `category_id`, `low_stock_only`

#### `POST /api/admin.php?action=save_product`
Create or update a product.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`
- **Request body (JSON):**
  - Required: `id`, `name`, `category_id`
  - Common fields: `stock`, `price`, `price_tier_1..4`, `status`, `priceUnit`, `gstRate`, `reorderLevel`

#### `POST /api/admin.php?action=delete_product`
Delete a product if it is not referenced in `order_items`.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`
- **Request body (JSON):**
```json
{ "product_id": "PLY-009" }
```

#### `GET /api/admin.php?resource=categories`
Get all categories in ascending name order.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`, `Sales Person`

#### `POST /api/admin.php?action=save_category`
Create or update category.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`
- **Request body (JSON):**
```json
{ "name": "Laminates" }
```
or update:
```json
{ "id": 3, "name": "Decorative Laminates" }
```

### Settings

#### `GET /api/admin.php?resource=settings`
Fetch company/tally/pricing-label settings.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`

#### `POST /api/admin.php?action=save_settings`
Update settings with `type` based payload.

- **Allowed roles:** `Super Admin`, `Admin / Owner`, `Manager`
- **`type` values:** `general`, `tally`, `pricing_labels`

### Customer Approval

#### `POST /api/admin.php?action=approve_customer`
Approves a pending customer and activates related `Customer` and `Sub-user` users.

- **Allowed roles:** `Manager`, `Super Admin`
- **Request body (JSON):**
```json
{ "customer_id": 12 }
```

---

## Service Health

### `GET /api/health.php`
Service compatibility and readiness endpoint.

**Success response (200)**
```json
{
  "success": true,
  "status": "ok",
  "api_version": "1.1.0",
  "php_version": "8.x.x",
  "database": "up",
  "timestamp": "2025-01-06T12:00:00+00:00"
}
```

**Degraded response (503)**
```json
{
  "success": false,
  "status": "degraded",
  "api_version": "1.1.0",
  "php_version": "8.x.x",
  "database": "down",
  "timestamp": "2025-01-06T12:00:00+00:00"
}
```
