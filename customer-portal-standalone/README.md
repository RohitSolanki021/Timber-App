# Natural Plylam - Sales Portal

A mobile-first sales portal for Natural Plylam sales representatives to manage customers and create orders.

## Features

- **Dashboard** - View monthly sales, customer count, pending orders, and outstanding balances
- **Customer Management** - View assigned customers, add new customers, filter by approval status
- **Product Catalog** - Browse products with tier-based pricing per customer
- **Cart & Checkout** - Create orders for customers with credit-based payment
- **Orders** - Track order history and status
- **Invoices** - View customer invoices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Routing**: React Router v6

## Prerequisites

- Node.js 18+
- Yarn or npm
- Backend API running (see Backend Setup below)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/rahulasolanki-rgb/Sales-Plylam.git
   cd Sales-Plylam
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and set your backend API URL
   ```

4. **Start development server**
   ```bash
   yarn dev
   # or
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8001/api` |

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server on port 3000 |
| `yarn build` | Build for production |
| `yarn preview` | Preview production build |
| `yarn lint` | Run TypeScript type checking |

## Backend API Requirements

This frontend requires a backend API with the following endpoints:

### Authentication
- `POST /api/login` - Login with email, password, and app_role="Sales Person"
- `POST /api/logout` - Logout
- `GET /api/me` - Get current user profile

### Dashboard
- `GET /api/sales/dashboard` - Get sales metrics

### Customers
- `GET /api/sales/customers` - List assigned customers (with search, status filters)
- `GET /api/sales/customers/:id` - Get customer details
- `POST /api/sales/customers` - Create new customer

### Products
- `GET /api/products` - List all products (with search, category filters)

### Cart
- `GET /api/sales/cart?customer_id=` - Get cart for customer
- `POST /api/sales/cart` - Add/update cart item
- `DELETE /api/sales/cart` - Remove item or clear cart

### Orders
- `POST /api/sales/checkout` - Create order from cart
- `GET /api/sales/orders` - List orders (with status filter)
- `GET /api/sales/orders/:id` - Get order details

### Invoices
- `GET /api/sales/invoices` - List invoices (with status filter)

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Sales Person | sales@naturalplylam.com | sales123 |

## Project Structure

```
src/
├── components/
│   └── Layout.tsx          # Main layout with bottom navigation
├── context/
│   └── CartContext.tsx     # Cart state management
├── pages/
│   ├── Login.tsx           # Login page
│   ├── Dashboard.tsx       # Home dashboard
│   ├── Customers.tsx       # Customer list
│   ├── AddCustomer.tsx     # Add new customer form
│   ├── Products.tsx        # Product catalog
│   ├── Cart.tsx            # Shopping cart
│   ├── Checkout.tsx        # Order checkout
│   ├── Orders.tsx          # Order history
│   ├── OrderDetail.tsx     # Order details
│   ├── Invoices.tsx        # Invoice list
│   └── Profile.tsx         # User profile
├── apiService.ts           # API client
├── App.tsx                 # Routes and providers
└── index.css               # Global styles
```

## Building for Production

```bash
yarn build
```

The built files will be in the `dist/` directory, ready to be deployed to any static hosting service.

## License

Private - Natural Plylam
