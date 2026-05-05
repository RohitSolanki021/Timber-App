import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { useCart } from "../context/CartContext";
import { isSalesUser } from "../utils/profile";

export default function CreateOrder() {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { customerId, setCustomerId } = useCart();

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSalesUser() && !customerId) {
      alert("Customer ID is required for sales orders.");
      return;
    }
    setCreating(true);
    try {
      const response = await apiProxy.createOrder([{ product_id: productId, quantity }], customerId ?? undefined);
      alert(response?.message ?? "Order created");
      navigate("/orders");
    } catch {
      alert("Unable to create order");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-black mb-4">Create Order</h1>
      <form onSubmit={onCreate} className="bg-white border rounded-2xl p-4 space-y-3">
        {isSalesUser() && (
          <input
            className="w-full border rounded-xl px-3 py-2"
            type="number"
            min={1}
            placeholder="Customer ID (required for sales)"
            value={customerId ?? ""}
            onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}
            required
          />
        )}
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Product ID (e.g. PLY-001)" value={productId} onChange={(e) => setProductId(e.target.value)} required />
        <input className="w-full border rounded-xl px-3 py-2" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
        <button disabled={creating} className="w-full py-3 rounded-xl bg-primary text-white font-bold">{creating ? "Creating..." : "Create Order"}</button>
      </form>
    </div>
  );
}
