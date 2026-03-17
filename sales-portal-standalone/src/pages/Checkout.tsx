import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../apiService';
import { ChevronLeft, MapPin, CheckCircle2, Package, Loader2, AlertCircle, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { cartItems: items, cartTotal, selectedCustomer, refreshCart } = useCart();

  const handleCheckout = async () => {
    if (!selectedCustomer) return;
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiService.checkout(selectedCustomer.id);
      await refreshCart();
      navigate(`/orders/${res.order_id}`, { state: { justOrdered: true } });
    } catch (err: any) {
      const msg = err.message || 'Checkout failed';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.detail || msg);
      } catch {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedCustomer) {
    return (
      <div className="p-5">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Customer Selected</h2>
          <p className="text-slate-600 mb-6">Please select a customer first</p>
          <Link 
            to="/customers" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/30"
          >
            Select Customer
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-5">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Cart is Empty</h2>
          <p className="text-slate-600 mb-6">Add products to checkout</p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/30"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-44">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/cart')} 
            className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-300 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="text-sm text-red-700 hover:text-red-900 mt-1 font-medium underline"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {/* Customer Info */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Customer</h2>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
            <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-base">{selectedCustomer.name}</p>
              <p className="text-sm text-slate-600 mt-0.5">{selectedCustomer.phone}</p>
              {selectedCustomer.address && (
                <p className="text-sm text-slate-600 mt-1">{selectedCustomer.address}</p>
              )}
            </div>
          </div>
        </section>

        {/* Order Items */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
            Order Items ({items.length})
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {items.map((item, idx) => (
              <div 
                key={item.product_id} 
                className={`p-4 flex items-center gap-4 ${idx !== items.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 truncate">{item.name}</p>
                  <p className="text-sm text-slate-600 font-medium mt-0.5">
                    {item.quantity} × ₹{item.price.toLocaleString()}
                  </p>
                </div>
                <p className="text-base font-bold text-slate-900">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Order Summary */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Order Summary</h2>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-700 font-medium">Subtotal</span>
              <span className="text-base font-bold text-slate-800">₹{cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-700 font-medium">Payment</span>
              <span className="text-base font-bold text-amber-600">Credit</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-lg font-bold text-slate-900">Grand Total</span>
              <span className="text-2xl font-extrabold text-slate-900">₹{cartTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-slate-300 px-5 py-5 shadow-2xl">
        <button
          onClick={handleCheckout}
          disabled={submitting || items.length === 0}
          data-testid="place-order-btn"
          className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Place Order • ₹{cartTotal.toLocaleString()}
            </>
          )}
        </button>
        <p className="text-sm text-slate-600 text-center mt-3">
          Order will be placed on credit for {selectedCustomer.name}
        </p>
      </div>
    </div>
  );
}
