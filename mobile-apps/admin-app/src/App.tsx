import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductsV2 from "./pages/ProductsV2";
import ProductDetail from "./pages/ProductDetail";
import OrdersV2 from "./pages/OrdersV2";
import OrderDetail from "./pages/OrderDetail";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import InvoiceDetail from "./pages/InvoiceDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Users from "./pages/Users";
import Banners from "./pages/Banners";

// Check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Check if user has admin role
const isAdmin = () => {
  try {
    const profile = localStorage.getItem("profile");
    if (!profile) return false;
    const user = JSON.parse(profile);
    const role = String(user.role || "").toLowerCase();
    return ["manager", "super admin", "admin"].includes(role);
  } catch {
    return false;
  }
};

// Check if user is Super Admin
const isSuperAdmin = () => {
  try {
    const profile = localStorage.getItem("profile");
    if (!profile) return false;
    const user = JSON.parse(profile);
    return String(user.role || "").toLowerCase() === "super admin";
  } catch {
    return false;
  }
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<AdminRoute><Layout /></AdminRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<ProductsV2 />} />
            <Route path="/products-old" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customer/:id" element={<CustomerDetail />} />
            <Route path="/orders" element={<OrdersV2 />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoice/:id" element={<InvoiceDetail />} />
            <Route path="/profile" element={<Profile />} />
            {/* Super Admin Only Routes */}
            <Route path="/users" element={<SuperAdminRoute><Users /></SuperAdminRoute>} />
            <Route path="/banners" element={<SuperAdminRoute><Banners /></SuperAdminRoute>} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
