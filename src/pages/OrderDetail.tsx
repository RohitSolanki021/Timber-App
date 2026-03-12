import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Order } from "../types";
import { ArrowLeft } from "lucide-react";
import { resolveImageUrl } from "../utils/images";

const ORDER_WORKFLOW = ["Approved", "Invoiced", "Dispatched", "Completed", "Cancelled"];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const loadOrder = async () => {
    const data = await apiProxy.getOrder(id!);
    setOrder(data);
  };

  useEffect(() => {
    loadOrder().finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    setUpdatingStatus(status);
    try {
      await apiProxy.updateOrderStatus(order.id, status);
      await loadOrder();
    } catch (error) {
      console.error(error);
      alert("Failed to update order status.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-dark">Loading Order...</div>;
  if (!order) return <div className="p-8 text-center text-text-dark">Order not found</div>;

  return (
    <div className="bg-white min-h-screen pb-24">
      <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/orders"))} className="w-10 h-10 flex items-center justify-center text-text-dark">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-text-dark">Order Admin</h1>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-text-dark text-2xl font-extrabold">{order.customerName || "Customer"}</p>
          <p className="text-text-dark/60 text-sm font-medium">Order #{order.id}</p>
          <p className="text-[10px] mt-2 px-2 py-1 inline-block rounded-full bg-slate-100 text-slate-700 font-black uppercase tracking-widest">{order.status}</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-text-dark text-sm font-bold uppercase tracking-wider">Workflow Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {ORDER_WORKFLOW.map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={updatingStatus !== null || order.status?.toLowerCase() === status.toLowerCase()}
                className="py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest disabled:opacity-40 hover:bg-slate-50"
              >
                {updatingStatus === status ? `Setting ${status}...` : status}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-text-dark text-sm font-bold uppercase tracking-wider">Order Images</h2>
          <div className="grid grid-cols-3 gap-2">
            {(order.images || []).map((img, idx) => (
              <img key={`${img.image_path}-${idx}`} src={resolveImageUrl(img.image_path)} alt={`order-${idx}`} className="h-24 w-full rounded-xl object-cover border border-slate-200" />
            ))}
          </div>
          {(!order.images || order.images.length === 0) && <p className="text-xs text-slate-400">No images uploaded yet.</p>}
        </section>

        <section className="space-y-4">
          <h2 className="text-text-dark text-sm font-bold uppercase tracking-wider">Order Materials</h2>
          <div className="space-y-4">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background-light rounded-xl border border-gray-200">
                <div className="flex-1">
                  <p className="text-text-dark font-bold text-sm">{item.productName || item.name || "Product"}</p>
                  <p className="text-text-dark/60 text-xs">{item.quantity} Units • ₹{item.unitPrice ?? item.price ?? 0}/ea</p>
                </div>
                <p className="text-text-dark font-bold">₹{((item.unitPrice ?? item.price ?? 0) * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
