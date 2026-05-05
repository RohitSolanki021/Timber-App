import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ChevronRight, Minus, Plus, Loader2, ArrowLeft, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cartItems: items, removeFromCart, updateQuantity, updatingItems, cartTotal, notification, selectedCustomer, clearCart } = useCart();
  const navigate = useNavigate();

  if (!selectedCustomer) {
    return (
      <div className="p-5">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Customer Selected</h2>
          <p className="text-slate-600 mb-6">Please select a customer to view their cart</p>
          <Link 
            to="/customers" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
          >
            <Users className="w-5 h-5" />
            Select Customer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            <span className="text-sm font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-5 space-y-4 pb-52">
        {/* Customer Info */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-primary">{selectedCustomer.name}</p>
            <p className="text-xs text-primary/70">Cart for this customer</p>
          </div>
          <Link to="/customers" className="text-xs font-semibold text-primary underline">
            Change
          </Link>
        </div>

        <h1 className="text-xl font-bold text-slate-900">Cart ({items.length} items)</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Cart is empty</h2>
            <p className="text-slate-600 mb-6">Add products to create an order</p>
            <Link 
              to="/products" 
              data-testid="browse-products-btn"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const isUpdating = updatingItems.has(item.product_id);
                const itemTotal = item.price * item.quantity;
                
                return (
                  <motion.div
                    key={item.product_id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -100 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm ${isUpdating ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate">{item.name}</h3>
                        <p className="text-sm text-slate-600 font-medium mt-0.5">ID: {item.product_id}</p>
                        <p className="text-base font-bold text-slate-800 mt-2">
                          ₹{item.price.toLocaleString()} <span className="text-slate-600 font-medium">/ {item.unit}</span>
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.product_id)} 
                        disabled={isUpdating}
                        data-testid={`remove-item-${item.product_id}`}
                        className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center bg-slate-100 rounded-xl border border-slate-300">
                        <button 
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={isUpdating}
                          data-testid={`cart-decrease-${item.product_id}`}
                          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-primary hover:bg-slate-200 rounded-l-xl disabled:opacity-50 transition-all"
                        >
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <span className="w-12 text-center text-base font-bold text-slate-900">
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={isUpdating}
                          data-testid={`cart-increase-${item.product_id}`}
                          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-primary hover:bg-slate-200 rounded-r-xl disabled:opacity-50 transition-all"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-slate-600 font-medium">Item Total</p>
                        <p className="text-xl font-bold text-slate-900">₹{itemTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Clear Cart Button */}
            <button
              onClick={() => clearCart()}
              className="w-full py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Clear Cart
            </button>
          </>
        )}
      </div>

      {/* Fixed Bottom Summary */}
      {items.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-slate-300 px-5 py-5 shadow-2xl">
          <div className="space-y-2.5 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-700 font-medium">Subtotal ({items.length} items)</span>
              <span className="text-base font-bold text-slate-800">₹{cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-lg font-bold text-slate-900">Total</span>
              <span className="text-2xl font-extrabold text-slate-900">₹{cartTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/checkout')}
            data-testid="proceed-checkout-btn"
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
          >
            Proceed to Checkout
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
