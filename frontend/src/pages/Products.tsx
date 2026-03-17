import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Product } from "../types";
import { Search, ChevronRight, LayoutGrid, Package, TreePine } from "lucide-react";
import { motion } from "motion/react";
import { getEffectiveProductPrice } from "../utils/pricing";
import { resolveImageUrl } from "../utils/images";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [pricingType, setPricingType] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const [res, profile] = await Promise.all([apiProxy.getProducts({ search, category }), apiProxy.getMe()]);
        setProducts(res.data || res.products || []);
        setPricingType(profile?.pricing_type || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  const categories = [
    { name: "All", icon: LayoutGrid, color: "bg-slate-100 text-slate-600" },
    { name: "Plywood", icon: Package, color: "bg-orange-100 text-orange-600" },
    { name: "Timber", icon: TreePine, color: "bg-emerald-100 text-emerald-600" }
  ];

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search timber, plywood..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background-light border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name === "All" ? "" : cat.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                (cat.name === "All" && !category) || category === cat.name
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-white text-slate-500 border border-slate-100"
              }`}
            >
              <cat.icon className={`w-4 h-4 ${((cat.name === "All" && !category) || category === cat.name) ? "text-white" : cat.color.split(' ')[1]}`} />
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-slate-100 h-24 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const displayPrice = getEffectiveProductPrice(product, pricingType);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between group hover:border-primary/20 transition-all gap-3"
              >
                <Link to={`/product/${product.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={resolveImageUrl(product.primary_image) || 'https://placehold.co/96x96?text=No+Image'}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-100"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {product.category}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">ID: {product.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-extrabold text-slate-900">₹{displayPrice}</p>
                      <span className="text-[10px] text-slate-400 font-medium">/ {product.priceUnit}</span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Link to={`/product/${product.id}`} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-slate-400">No products found</p>
        </div>
      )}
    </div>
  );
}
