import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { CartItem, User as UserType } from "../types";
import { ChevronLeft, MapPin, CheckCircle2 } from "lucide-react";

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCheckoutData = async () => {
      const profileRaw = localStorage.getItem("profile");
      if (profileRaw) {
        try {
          setUser(JSON.parse(profileRaw));
        } catch {
          // Ignore malformed profile in storage.
        }
      }

      const [cartData, profileData] = await Promise.all([
        apiProxy.getCart(),
        apiProxy.getMe(),
      ]);

      setItems(cartData);
      setUser(profileData);
      localStorage.setItem("profile", JSON.stringify(profileData));
    };

    fetchCheckoutData();
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const shippingAddress = user?.address?.trim() || "";
      const res = await apiProxy.checkout(shippingAddress);
      navigate(`/order/${res.order_id}`);
    } catch (err) {
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const customerName = user?.businessName || user?.business_name || user?.name || "Customer";
  const shippingAddress = user?.address?.trim() || "No shipping address on file";

  return (
    <div className="p-6 flex flex-col min-h-screen bg-slate-50">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <ChevronLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Checkout</h1>
      </header>

      <div className="flex-1 space-y-8">
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipping Address</h2>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex gap-4 items-start">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{customerName}</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{shippingAddress}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Order Summary</h2>
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{item.quantity} {item.priceUnit}s</p>
                  </div>
                  <p className="text-sm font-black text-slate-900">&#8377;{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-sm font-black text-slate-900">&#8377;{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipping</span>
                <span className="text-sm font-black text-primary uppercase tracking-widest">FREE</span>
              </div>
              <div className="pt-4 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 uppercase tracking-[0.15em]">Grand Total</span>
                <span className="text-2xl font-black text-slate-900">&#8377;{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 sticky bottom-6">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? "Processing..." : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Place Order
            </>
          )}
        </button>
      </div>
    </div>
  );
}
