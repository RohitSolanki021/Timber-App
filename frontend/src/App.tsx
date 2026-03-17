import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import InvoiceDetail from "./pages/InvoiceDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";

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
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customer/:id" element={<CustomerDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoice/:id" element={<InvoiceDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
