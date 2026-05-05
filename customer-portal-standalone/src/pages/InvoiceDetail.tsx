import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { InvoiceDetails, OrderDetails} from "../types";
import { ArrowLeft, Share2, CheckCircle2, Clock } from "lucide-react";
import { getStoredProfile } from "../utils/profile";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiProxy.getInvoice(id!);
        const inv = res?.data ?? null;
        setInvoice(inv);
        if (inv) {
          const ord = await apiProxy.getOrder(inv.order_id);
          setOrder(ord);
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Invoice...</div>;
  if (!invoice || !order) return <div className="p-8 text-center text-slate-500">Invoice not found</div>;

  const profile = getStoredProfile();

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white p-6 flex justify-between items-center sticky top-0 z-10 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">Invoice Details</h1>
        <button
          className="w-10 h-10 flex items-center justify-center text-slate-900"
          onClick={async () => {
            if (!invoice || !order) return;
            const jsPDF = (await import('jspdf')).jsPDF;
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`Invoice Receipt`, 10, 15);
            doc.setFontSize(12);
            doc.text(`Invoice ID: ${invoice.id}`, 10, 30);
            doc.text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 10, 40);
            doc.text(`Status: ${invoice.status}`, 10, 50);
            doc.text(`Bill To: ${order.customerName ?? profile?.name ?? "Customer"}`, 10, 60);
            doc.text(`Address: ${order.customerName ? "On file" : "N/A"}`, 10, 70);
            doc.text(`Items:`, 10, 80);
            let y = 90;
            order.items.forEach((item, idx) => {
              doc.text(
                `${item.productName ?? item.product_id} x${item.quantity} @ â‚¹${item.unitPrice ?? "0"}`,
                15,
                y + idx * 10
              );
            });
            doc.text(`Total: â‚¹${Number(invoice.grand_total).toLocaleString()}`, 10, y + order.items.length * 10 + 10);
            doc.save(`Invoice_${invoice.id}.pdf`);
          }}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      <div className="p-6 space-y-6">
        {/* Status Banner */}
        <div className={`p-6 rounded-[32px] border flex items-center justify-between ${
          invoice.status === 'Paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
        }`}>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</p>
            <p className={`text-2xl font-black ${
              invoice.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
            }`}>{invoice.status.toUpperCase()}</p>
          </div>
          {invoice.status === 'Paid' ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          ) : (
            <Clock className="w-10 h-10 text-amber-500" />
          )}
        </div>

        {/* Invoice Summary */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Number</p>
              <p className="text-lg font-black text-slate-900">{invoice.id}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Issued</p>
              <p className="text-sm font-bold text-slate-900">{new Date(invoice.issue_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="h-px bg-slate-50"></div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill To</p>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900">{order.customerName ?? invoice.customer_name ?? profile?.name ?? "Customer"}</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Address not available
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-50"></div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</p>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">{item.productName ?? item.product_id}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{item.quantity} units x â‚¹{item.unitPrice ?? "0"}</p>
                  </div>
                  <p className="text-sm font-black text-slate-900">â‚¹{(Number(item.unitPrice ?? 0) * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
              <span className="text-sm font-black text-slate-900">₹{Number(invoice.sub_total ?? 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax (0%)</span>
              <span className="text-sm font-black text-slate-900">
                ₹{(Number(invoice.cgst ?? "0") + Number(invoice.sgst ?? "0")).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="pt-4 flex justify-between items-center">
              <span className="text-sm font-black text-slate-900 uppercase tracking-[0.15em]">Total Amount</span>
              <span className="text-3xl font-black text-slate-900">₹{Number(invoice.grand_total ?? 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
