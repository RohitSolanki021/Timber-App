import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Invoice, Order } from "../types";
import { ArrowLeft, Share2, Download, Package, Truck, Check, Inbox, CheckCircle2, Upload } from "lucide-react";
import { resolveImageUrl } from "../utils/images";

const INVOICE_LOOKUP_PAGE_SIZE = 20;
const INVOICE_LOOKUP_MAX_PAGES = 5;

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const loadOrder = async () => {
    const data = await apiProxy.getOrder(id!);
    setOrder(data);
  };

  useEffect(() => {
    loadOrder().finally(() => setLoading(false));
  }, [id]);

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !order) return;
    setUploading(true);
    try {
      await apiProxy.uploadOrderImage(order.id, file);
      await loadOrder();
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      let orderInvoice: Invoice | undefined;
      let currentPage = 1;

      while (currentPage <= INVOICE_LOOKUP_MAX_PAGES) {
        const response = await apiProxy.getInvoices({
          page: currentPage,
          per_page: INVOICE_LOOKUP_PAGE_SIZE,
          search: order.id
        });
        orderInvoice = response.data.find((inv) => inv.order_id === order.id);
        if (orderInvoice) break;
        if (!response.pagination || currentPage >= response.pagination.total_pages) break;
        currentPage += 1;
      }

      if (orderInvoice) {
        navigate(`/invoice/${orderInvoice.id}`);
        return;
      }

      alert("Invoice is not available for this order yet.");
    } catch (error) {
      console.error(error);
      alert("Unable to fetch invoice right now.");
    }
  };

  if (loading) return <div className="p-8 text-center text-text-dark">Loading Order...</div>;
  if (!order) return <div className="p-8 text-center text-text-dark">Order not found</div>;

  const getStatusSteps = (status: string) => {
    const allSteps = [
      { label: "Order Placed", status: "Created", icon: Check },
      { label: "Approved", status: "Approved", icon: Check },
      { label: "Paid", status: "Paid", icon: Check },
      { label: "Shipped", status: "Dispatched", icon: Truck },
      { label: "Delivered", status: "Completed", icon: Inbox },
    ];

    const statusOrder = ["Created", "Approved", "Paid", "Dispatched", "Completed"];
    const currentIndex = statusOrder.indexOf(status);

    return allSteps.map((step) => ({ ...step, completed: statusOrder.indexOf(step.status) <= currentIndex, date: statusOrder.indexOf(step.status) <= currentIndex ? "Completed" : "Pending" }));
  };

  const steps = getStatusSteps(order.status);

  return (
    <div className="bg-white min-h-screen pb-24">
      <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/orders"))}
          className="w-10 h-10 flex items-center justify-center text-text-dark"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-text-dark">Order Receipt</h1>
        <button className="w-10 h-10 flex items-center justify-center text-text-dark"><Share2 className="w-5 h-5" /></button>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-dark text-2xl font-extrabold">{order.customerName || "Customer"}</p>
            <p className="text-text-dark/60 text-sm font-medium">Order #{order.id}</p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-text-dark text-sm font-bold uppercase tracking-wider">Track Progress</h2>
          <div className="grid grid-cols-[40px_1fr] gap-x-2">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step.completed ? "bg-primary text-white" : "bg-gray-100 text-text-dark/30"}`}><step.icon className="w-4 h-4" /></div>
                  {i < steps.length - 1 && <div className={`w-[2px] h-8 ${step.completed ? "bg-primary" : "bg-gray-200"}`}></div>}
                </div>
                <div className={`flex flex-col ${i < steps.length - 1 ? "pb-6" : ""}`}>
                  <p className={`text-base font-bold ${step.completed ? "text-text-dark" : "text-text-dark/40"}`}>{step.label}</p>
                  <p className={`text-xs mt-1 ${step.completed ? "text-text-dark/60" : "text-text-dark/40"}`}>{step.date}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-text-dark text-sm font-bold uppercase tracking-wider">Order Images</h2>
            <button onClick={() => uploadRef.current?.click()} className="text-xs bg-primary text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1" disabled={uploading}>
              <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload"}
            </button>
            <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
          </div>
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
                  <p className="text-text-dark/60 text-xs">{item.quantity} Units • ₹{(item.unitPrice ?? item.price ?? 0)}/ea</p>
                </div>
                <p className="text-text-dark font-bold">₹{((item.unitPrice ?? item.price ?? 0) * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-background-light rounded-2xl p-6 space-y-3">
          <div className="flex justify-between items-center"><span className="text-text-dark font-extrabold text-lg">Grand Total</span><span className="text-primary font-extrabold text-2xl">₹{Number(order.amount || order.grand_total || 0).toLocaleString()}</span></div>
        </div>

        <div className="fixed bottom-16 left-0 right-0 bg-white p-4 border-t border-gray-100 flex gap-3 z-40 max-w-md mx-auto">
          <button
            onClick={handleDownloadInvoice}
            className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
