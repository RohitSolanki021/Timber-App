import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../apiService';
import { Search, Plus, Minus, LayoutGrid, Package, TreePine, Check, Loader2, AlertCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  priceUnit: string;
  stock: number;
  pricing_rates?: Record<string, number>;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const { getItemQuantity, updateQuantity, updatingItems, notification, selectedCustomer } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await apiService.getProducts({ search, category });
        setProducts(res.data || res.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  const getDisplayPrice = (product: Product) => {
    if (!selectedCustomer) return product.price;
    const tier = String(selectedCustomer.pricing_type || 1);
    return product.pricing_rates?.[tier] || product.price;
  };

  const categories = [
    { name: 'All', icon: LayoutGrid, color: 'text-slate-700' },
    { name: 'Plywood', icon: Package, color: 'text-orange-600' },
    { name: 'Timber', icon: TreePine, color: 'text-emerald-600' }
  ];

  return (
    <div className="p-5 space-y-5 pb-24">
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
            <Check className="w-4 h-4" />
            <span className="text-sm font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Selection Warning */}
      {!selectedCustomer && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">No customer selected</p>
            <p className="text-xs text-amber-700 mt-1">
              Please select a customer before adding products to cart.
            </p>
            <Link 
              to="/customers" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 mt-2 underline"
            >
              <Users className="w-3 h-3" />
              Select Customer →
            </Link>
          </div>
        </div>
      )}

      {/* Selected Customer Info */}
      {selectedCustomer && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-primary">{selectedCustomer.name}</p>
            <p className="text-xs text-primary/70">Tier {selectedCustomer.pricing_type} Pricing</p>
          </div>
          <Link 
            to="/customers" 
            className="text-xs font-semibold text-primary underline"
          >
            Change
          </Link>
        </div>
      )}

      <header className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Products</h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="product-search"
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm text-slate-900 placeholder:text-slate-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = (cat.name === 'All' && !category) || category === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name === 'All' ? '' : cat.name)}
                data-testid={`category-${cat.name.toLowerCase()}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-primary hover:text-primary'
                }`}
              >
                <cat.icon className={`w-4 h-4 ${isActive ? 'text-white' : cat.color}`} />
                {cat.name}
              </button>
            );
          })}
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 h-24 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-700 font-medium">No products found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const displayPrice = getDisplayPrice(product);
            const qty = getItemQuantity(product.id);
            const isUpdating = updatingItems.has(product.id);
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wide">
                    {product.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 truncate">{product.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-slate-900">₹{displayPrice}</span>
                    <span className="text-sm text-slate-600 font-medium">/ {product.priceUnit}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  {!selectedCustomer ? (
                    <div className="text-xs text-slate-400 text-right">
                      Select<br/>customer
                    </div>
                  ) : qty > 0 ? (
                    <div className="flex items-center bg-slate-100 rounded-xl border border-slate-300">
                      <button
                        onClick={() => updateQuantity(product.id, qty - 1)}
                        disabled={isUpdating}
                        data-testid={`decrease-qty-${product.id}`}
                        className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-primary hover:bg-slate-200 rounded-l-xl disabled:opacity-50 transition-colors"
                      >
                        <Minus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      <span className="w-10 text-center text-base font-bold text-slate-900">
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, qty + 1)}
                        disabled={isUpdating}
                        data-testid={`increase-qty-${product.id}`}
                        className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-primary hover:bg-slate-200 rounded-r-xl disabled:opacity-50 transition-colors"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateQuantity(product.id, 1)}
                      disabled={isUpdating}
                      data-testid={`add-to-cart-${product.id}`}
                      className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6 stroke-[2.5]" />}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
