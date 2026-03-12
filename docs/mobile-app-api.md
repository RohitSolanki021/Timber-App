# Timber & Plywood Mobile App API

This document describes the RESTful endpoints used by the Timber & Plywood customer and sales representative mobile applications. Each endpoint includes required authentication, request body expectations, and example JSON responses. Unless noted otherwise, responses are JSON and typically wrapped in the `{ "success": ..., "message": ... }` envelope shown below.

```json
{ "success": true, "message": "..." }
```

```json
{ "success": false, "message": "..." }
```

Some read/list endpoints return raw arrays or objects without the success wrapper; those cases are highlighted individually.

> **Pricing tier note:** Product, cart, order, and invoice responses include `pricing_type` (1-4) and tier-aware pricing values when applicable.

---

## Authentication

Bearer tokens secure all protected endpoints. Authenticate via `POST /api/login.php` and send the token as `Authorization: Bearer <token>` in subsequent requests.

### `POST /api/login.php`

- **Request body:** JSON or form-data
  ```json
  {
    "email": "customer@example.com",
    "password": "secret123",
    "app_role": "Customer"
  }
  ```
- **Success (200):**
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
- **Errors:**
  - `400`: Missing credentials.
  - `401`: Invalid credentials.
  - `403`: Unauthorized app role.

### `POST /api/logout.php`

- **Auth:** Bearer required.
- **Success (200):**
  ```json
  { "success": true, "message": "Logged out successfully." }
  ```

### `POST /api/token/refresh.php`

- **Auth:** Bearer required.
- **Success (200):**
  ```json
  {
    "success": true,
    "token": "<new-64-char-hex-token>",
    "expires_in": 3600
  }
  ```

### `GET /api/me.php`

- **Auth:** Bearer required.
- **Success (200):**
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

- **Request body:** `{ "email": "customer@example.com" }`
- **Success (200) when user exists or not:**
  ```json
  {
    "success": true,
    "message": "If your email is registered, password reset instructions have been generated.",
    "reset_token": "<raw-reset-token>",
    "expires_in": 1800
  }
  ```
  (When the email is unregistered, the same message is returned without `reset_token/expires_in`.)

### `POST /api/reset-password.php`

- **Request body:**
  ```json
  {
    "token": "<raw-reset-token>",
    "new_password": "newPassword123"
  }
  ```
- **Success (200):**
  ```json
  { "success": true, "message": "Password has been reset successfully." }
  ```

### `POST /api/register.php`

- **Request body:** form-data
  - `name`, `contactPerson`, `phone`, `email`, `password` (required)
  - `pricing_type` (optional, `1..4`, defaults to `1`)
- **Success (200):**
  ```json
  { "success": true, "message": "Registration successful. Your account is pending approval." }
  ```
- **Errors:**
  - `400`: Missing fields.
  - `409`: Email already exists.

### `GET /api/verify_gstin.php?gstin=...`

- **Success (200):**
  ```json
  {
    "name": "Mock Legal Business Name Pvt Ltd",
    "address": "123 Mock Address, Mock City, Mock State - 110011"
  }
  ```
- **Error (400):** Invalid GSTIN format.

---

## Customer App Endpoints

_(Customer or Sub-user token required unless otherwise noted.)_

### Products

#### `GET /api/products.php`

- **Query params:** `page`, `per_page`, `search`, `category`, `stock_status` (`in_stock` / `out_of_stock`), `sort`.
- **Success (200):**
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

- **Auth:** Super Admin/Admin/Owner/Manager/Sales Person.
- **Request body:** multipart form with `product_id`, optional `primary_image`, optional `product_images[]`.
- **Success (200):**
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
- **Errors:** `400` (validation), `403`, `404`.

### Cart

#### `GET /api/cart.php`

- **Sales support:** add `customer_id` query param.
- **Success (200):**
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

- **Sales support:** include `customer_id` in JSON.
- **Request body:**
  ```json
  { "product_id": "PLY-001", "quantity": 10, "customer_id": 5 }
  ```
- **Success (200):**
  ```json
  { "success": true, "message": "Cart updated successfully." }
  ```

#### `DELETE /api/cart.php?product_id=PLY-001`

- **Sales support:** include `customer_id` query param.
- **Success (200):**
  ```json
  { "success": true, "message": "Item removed from cart." }
  ```

#### `DELETE /api/cart.php`

- Clears the cart for the auth scope (add `customer_id` when managing assigned customer).
- **Success (200):**
  ```json
  { "success": true, "message": "Cart cleared." }
  ```

### Checkout & Orders

#### `POST /api/checkout.php`

- **Sales support:** include `customer_id` in JSON or query; sets `sales_person_id` when coming from sales rep.
- **Success (201):**
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

- **Roles:** Customer, Sub-user, Sales Person.
- **Request body:**
  ```json
  {
    "customer_id": 5,
    "items": [
      { "product_id": "PLY-001", "quantity": 10 },
      { "product_id": "TIM-001", "quantity": 5 }
    ]
  }
  ```
- **Success (201):**
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

- **Request body:** `order_id`, `image` (multipart).
- **Success (200):**
  ```json
  {
    "success": true,
    "message": "Image uploaded successfully.",
    "image_path": "uploads/order-images/img_abc123.jpg"
  }
  ```

#### `GET /api/orders.php`

- **Query params:** `page`, `per_page`, `status`, `search`, `from_date`, `to_date`.
- **Success (200):**
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

- **Success (200):**
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
      {
        "id": 1,
        "image_path": "uploads/order-images/img_abc123.jpg",
        "uploaded_by_name": "Customer User",
        "created_at": "2026-03-04 10:00:00"
      }
    ]
  }
  ```

### Invoices

#### `GET /api/invoices.php`

- **Scope:** Customers/Sub-users see their own invoices; sales reps see assigned customers; managers/admins see all.
- **Query params:** `page`, `per_page`, `status`, `search`, `from_date`, `to_date`, `customer_id`.
- **Success (200):**
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

#### `POST /api/invoices.php?action=mark_paid`

- **Roles:** Manager, Super Admin, Admin/Owner only.
- **Request body:** `{ "invoice_id": "INV-0001" }`
- **Success (200):**
  ```json
  { "success": true, "message": "Invoice marked as paid.", "invoice_id": "INV-0001" }
  ```
- **Side effect:** updates the related order's `paymentStatus` to `Paid`.

### Profile

#### `GET /api/customers.php?action=me`

- **Success (200):**
  ```json
  {
    "id": 5,
    "name": "Acme Pvt Ltd",
    "contactPerson": "John Doe",
    "phone": "+91-9000000000",
    "email": "accounts@acme.com",
    "users": [
      {
        "id": 12,
        "name": "John Doe",
        "email": "customer@example.com",
        "phone": "+91-9000000000",
        "role": "Customer",
        "status": "Active"
      }
    ],
    "images": [
      {
        "id": 2,
        "image_path": "uploads/customer-images/img_xyz789.png",
        "uploaded_by_name": "John Doe",
        "created_at": "2026-03-04 10:05:00"
      }
    ]
  }
  ```

#### `PATCH /api/customers.php?action=update_profile`

- **Request body:** partial JSON updates.
  ```json
  {
    "name": "John Doe",
    "contactPerson": "John Doe",
    "phone": "+91-9000000001",
    "email": "updated@acme.com",
    "address": "Mumbai"
  }
  ```
- **Success (200):**
  ```json
  { "success": true, "message": "Profile updated successfully." }
  ```

#### `POST /api/customers.php?action=change_password`

- **Request body:** `current_password`, `new_password`.
- **Success (200):**
  ```json
  { "success": true, "message": "Password changed successfully. Please login again." }
  ```

#### `POST /api/customers.php?action=create_sub_user`

- **Request body:** `name`, `email`, `phone` (optional), `password`.
- **Success (200):**
  ```json
  { "success": true, "message": "Sub-user created successfully." }
  ```

#### `POST /api/customers.php?action=upload_image`

- **Request body:** multipart form with `image` (required) and `customer_id` (optional for customer/sub-user; required for admin/sales).
- **Success (200):**
  ```json
  {
    "success": true,
    "message": "Image uploaded successfully.",
    "image_path": "uploads/customer-images/img_xyz789.png"
  }
  ```

---

## Sales Representative App Endpoints

_(Sales Person token required unless otherwise stated.)_

### Customers & Notes

#### `GET /api/customers.php`

- **Query params:** `search`, `page`, `per_page`.
- **Success (200):**
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

- **Success (200):**
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

- **Request body:** `customer_id`, `note`.
- **Success (200):**
  ```json
  { "success": true, "message": "Note added." }
  ```

#### `POST /api/customers.php?action=change_password`

- **Request body:** same as customer password change.

### Orders

#### `GET /api/orders.php`

- Lists orders from assigned customers.
- **Success response shape:** same as customer order list.

#### `GET /api/orders.php?scope=mine`

- Lists orders created by the sales rep.

#### `GET /api/orders.php?id=ORD-...`

- Returns the order and items (same shape as customer endpoint).

#### `GET /api/orders.php` filtering/pagination

- Supports `page`, `per_page`, `status`, `search`, `from_date`, `to_date`, `scope`.

### Invoices

#### `GET /api/invoices.php`

- Lists invoices visible to the authenticated role (supports pagination and filters as above).

#### `GET /api/invoices.php?customer_id={customer_id}`

- Lists invoices for one assigned customer (Sales Persons only).

#### `POST /api/invoices.php?action=mark_paid`

- **Roles:** Manager, Super Admin, Admin/Owner.
- **Request body:** `{ "invoice_id": "INV-0001" }`
- **Success (200):**
  ```json
  { "success": true, "message": "Invoice marked as paid.", "invoice_id": "INV-0001" }
  ```
- Updates related order `paymentStatus` to `Paid`.

### Products

#### `GET /api/products.php`

- Returns products with stock and tier pricing for sales users.
- **Success (200):**
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

### Profile

#### `PATCH /api/customers.php?action=update_profile`

- **Request body:**
  ```json
  { "name": "Sales User", "phone": "+91-9999999999" }
  ```
- **Success (200):**
  ```json
  { "success": true, "message": "Sales profile updated successfully." }
  ```

---

## Service Health

### `GET /api/health.php`

- **Success (200):**
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
- **Degraded (503):**
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
