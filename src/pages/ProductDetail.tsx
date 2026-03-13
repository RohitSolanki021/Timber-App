import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Product } from "../types";
import { ChevronLeft, Share2 } from "lucide-react";
import { getEffectiveProductPrice } from "../utils/pricing";
import { resolveImageUrl } from "../utils/images";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingType, setPricingType] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [res, profile] = await Promise.all([apiProxy.getProducts(), apiProxy.getMe()]);
        const p = (res.data || []).find((item: Product) => item.id === id);
        setProduct(p || null);
        setPricingType(profile?.pricing_type || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!product) return <div className="p-8 text-center">Product not found</div>;
  const displayPrice = getEffectiveProductPrice(product, pricingType);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="p-6 flex justify-between items-center bg-white border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Product Details</h1>
        <button className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
          <Share2 className="w-5 h-5 text-slate-900" />
        </button>
      </div>

      <div className="flex-1 p-8 space-y-8">
        <img
          src={resolveImageUrl(product.primary_image) || 'https://placehold.co/800x400?text=No+Image'}
          alt={product.name}
          className="w-full h-56 object-cover rounded-3xl border border-slate-100"
        />
        <div className="grid grid-cols-4 gap-2">
          {(product.images || []).slice(0, 4).map((image, idx) => (
            <img key={`${image.image_path}-${idx}`} src={resolveImageUrl(image.image_path)} alt={`${product.name}-${idx}`} className="h-16 w-full rounded-xl object-cover border border-slate-100" />
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full inline-block uppercase tracking-widest">{product.category}</p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{product.name}</h1>
          <p className="text-xs font-medium text-slate-400">Product ID: {product.id}</p>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <p className="text-4xl font-black text-slate-900">₹{displayPrice} <span className="text-base font-medium text-slate-400">/ {product.priceUnit}</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Availability</p>
          <p className="text-sm font-black text-slate-900 mt-2">{product.stock_status || "In Stock"}</p>
        </div>
      </div>
    </div>
  );
}
