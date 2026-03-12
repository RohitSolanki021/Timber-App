import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import InvoiceDetail from "./pages/InvoiceDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import AwaitingApproval from "./pages/AwaitingApproval";
import { CartProvider } from "./context/CartContext";

import { isApproved, isProfileComplete } from "./utils/accessControl";

const PrivateRoute = ({
  children,
  allowPending = false,
  allowIncompleteProfile = false
}: {
  children: React.ReactNode;
  allowPending?: boolean;
  allowIncompleteProfile?: boolean;
}) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  const raw = localStorage.getItem("profile");
  const profile = raw ? JSON.parse(raw) : null;

  if (profile) {
    const role = String(profile.role || "").toLowerCase();
    const enforceCustomerChecks = ["customer", "sub-user"].includes(role);

    if (enforceCustomerChecks && !allowPending && !isApproved(profile)) {
      return <Navigate to="/awaiting-approval" />;
    }
    if (enforceCustomerChecks && !allowIncompleteProfile && isApproved(profile) && !isProfileComplete(profile)) {
      return <Navigate to="/profile?complete=1" />;
    }
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
                    <Route path="/awaiting-approval" element={<PrivateRoute allowPending allowIncompleteProfile><AwaitingApproval /></PrivateRoute>} />

          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoice/:id" element={<InvoiceDetail />} />
          </Route>

          <Route element={<PrivateRoute allowIncompleteProfile><Layout /></PrivateRoute>}>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
