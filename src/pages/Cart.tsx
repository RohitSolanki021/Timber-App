import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { apiService } from "../apiService";
import { apiProxy } from "../apiProxy";
import { CartItem } from "../types";
import { Trash2, ShoppingBag, ChevronRight, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cartItems: items, removeFromCart: removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  return (
    <div className="p-6 flex flex-col min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">My Cart</h1>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          {items.length} Items
        </span>
      </header>
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Your cart is empty</p>
          <Link to="/products" className="text-primary font-bold text-sm">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product_id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4"
                >
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.name}</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">ID: {item.product_id}</p>
                      </div>
                      <button onClick={() => removeItem(item.product_id)} className="w-8 h-8 bg-red-50 text-red-400 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-black text-slate-900">₹{item.price}</p>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">/ {item.priceUnit}</span>
                      </div>
                      <div className="flex items-center bg-slate-100 rounded-2xl p-1">
                        <button 
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Subtotal</p>
              <p className="text-slate-900 font-black">₹{subtotal.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Shipping</p>
              <p className="text-primary font-black text-sm uppercase tracking-widest">FREE</p>
            </div>
            <div className="flex justify-between items-center pt-4">
              <p className="text-slate-900 font-black text-lg uppercase tracking-widest">Total Amount</p>
              <p className="text-3xl font-black text-slate-900">₹{subtotal.toLocaleString()}</p>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              Proceed to Checkout
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
