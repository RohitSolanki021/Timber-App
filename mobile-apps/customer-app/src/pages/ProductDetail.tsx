import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Product } from "../types";
import { ChevronLeft, ShoppingCart, Minus, Plus, Share2 } from "lucide-react";
import CustomerAutoComplete from "../components/CustomerAutoComplete";
import { useCart } from "../context/CartContext";
import { isSalesUser } from "../utils/profile";
import { getTieredProductPrice } from "../utils/pricing";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart, customerId, setCustomerId, customer, selectedCustomerName, selectedCustomerPricingType } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const params: Record<string, string | number | undefined> = {
          id,
          ...(customerId != null ? { customer_id: customerId } : {}),
          ...(selectedCustomerPricingType != null ? { pricing_type: selectedCustomerPricingType } : {}),
        };
        const res = await apiProxy.getProducts(params);
        const p = (res?.data ?? []).find((item) => item.id === id);
        setProduct(p || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, customerId, selectedCustomerPricingType]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (isSalesUser() && !customerId) {
      alert("Select a customer before adding items.");
      return;
    }
    try {
      await addToCart(product.id, quantity);
      navigate("/cart");
    } catch (err) {
      alert("Failed to add to cart");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!product) return <div className="p-8 text-center">Product not found</div>;
  const tieredPrice = getTieredProductPrice(product, selectedCustomerPricingType);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-white border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Product Details</h1>
        <button className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
          <Share2 className="w-5 h-5 text-slate-900" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        {isSalesUser() && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
          <CustomerAutoComplete
            selectedId={customerId ?? null}
            selectedName={selectedCustomerName ?? customer?.name}
            onSelect={(id, name, pricingType) => setCustomerId(id, name ?? null, pricingType ?? null)}
            placeholder="Search customers..."
            label="Customer"
            onlyApproved
          />
          {(customer?.name || selectedCustomerName) && (
            <p className="text-xs text-slate-500">Ordering for {customer?.name ?? selectedCustomerName}</p>
          )}
        </div>
        )}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full inline-block uppercase tracking-widest">
                {product.category}
              </p>
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{product.name}</h1>
              <p className="text-xs font-medium text-slate-400">Product ID: {product.id}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <p className="text-4xl font-black text-slate-900">₹{tieredPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })} <span className="text-base font-medium text-slate-400">/ {product.priceUnit ?? product.unit}</span></p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Specifications & Description</h2>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              {product.description ?? `Premium ${product.name} crafted to our quality standards.`}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Available</p>
                <p className="text-sm font-bold text-slate-900">{product.stock ?? product.stock_quantity ?? "N/A"} {product.priceUnit ?? product.unit}s</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Type</p>
                <p className="text-sm font-bold text-slate-900">{product.priceUnit ?? product.unit}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Quantity</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-14 text-center font-black text-xl text-slate-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-6 bg-white border-t border-slate-100 sticky bottom-0">
        <button
          onClick={handleAddToCart}
          className="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ShoppingCart className="w-5 h-5" />
          Add to Cart • ₹{(tieredPrice * quantity).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </button>
      </div>
    </div>
  );
}

