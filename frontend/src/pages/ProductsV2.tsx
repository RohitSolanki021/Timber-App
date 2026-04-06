import React, { useEffect, useState, useCallback } from "react";
import { 
  Package, Plus, Upload, Download, Search, ChevronRight, ChevronLeft,
  TreePine, Edit3, Trash2, X, Save, FileSpreadsheet, AlertCircle
} from "lucide-react";
import { useToast } from "../components/ui/Toast";

const API_BASE = (() => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) return configured.endsWith('/') ? configured.slice(0, -1) : configured;
  return `${window.location.origin}/api`;
})();

interface ProductVariant {
  thickness: string;
  size: string;
  stock: number;
  prices: Record<string, number>;
}

interface ProductV2 {
  id: string;
  name: string;
  group: 'Plywood' | 'Timber';
  description: string;
  base_price: number;
  thicknesses: string[];
  sizes: string[];
  pricing_tiers: Record<string, number>;
  is_active: boolean;
}

const PRODUCTS_PER_PAGE = 10;
const TIERS = [
  { num: 1, name: 'Standard' },
  { num: 2, name: 'Dealer' },
  { num: 3, name: 'Wholesale' },
  { num: 4, name: 'Premium' },
  { num: 5, name: 'VIP' },
  { num: 6, name: 'Enterprise' }
];

// No more hardcoded sizes/thicknesses - admin can input any value

export default function ProductsV2() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductV2 | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    group: 'Plywood' as 'Plywood' | 'Timber',
    description: '',
    variants: [] as ProductVariant[]
  });
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const authHeaders = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  });

  // Handle edit product - populate form and open modal
  const handleEditProduct = (product: ProductV2) => {
    // Convert product to form data with variants
    const variants: ProductVariant[] = [];
    for (const thickness of product.thicknesses) {
      for (const size of product.sizes) {
        variants.push({
          thickness,
          size,
          stock: 0, // Stock is managed separately
          prices: product.pricing_tiers || {}
        });
      }
    }
    
    // If no variants created, add at least one with the existing data
    if (variants.length === 0) {
      variants.push({
        thickness: product.thicknesses[0] || '',
        size: product.sizes[0] || '',
        stock: 0,
        prices: product.pricing_tiers || {}
      });
    }
    
    setFormData({
      name: product.name,
      group: product.group,
      description: product.description || '',
      variants
    });
    setEditingProduct(product);
    setShowAddModal(true);
  };

  // Close modal and reset
  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      group: 'Plywood',
      description: '',
      variants: []
    });
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products-v2`, { headers: authHeaders() });
      const data = await res.json();
      
      let filtered = data.products || [];
      
      if (groupFilter !== 'all') {
        filtered = filtered.filter((p: ProductV2) => p.group === groupFilter);
      }
      
      if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter((p: ProductV2) => 
          p.name.toLowerCase().includes(s) || 
          p.id.toLowerCase().includes(s)
        );
      }
      
      setProducts(filtered);
      setTotalPages(Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, groupFilter]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  // Add variant row
  const addVariant = () => {
    const defaultPrices = TIERS.reduce((acc, t) => ({ ...acc, [String(t.num)]: 0 }), {});
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { thickness: '', size: '', stock: 0, prices: defaultPrices }]
    }));
  };

  // Remove variant
  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Update variant
  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== index) return v;
        return { ...v, [field]: value };
      })
    }));
  };

  // Update variant price
  const updateVariantPrice = (index: number, tier: string, price: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== index) return v;
        return { ...v, prices: { ...v.prices, [tier]: price } };
      })
    }));
  };

  // Auto-fill prices based on tier 1
  const autoFillPrices = (index: number) => {
    const tier1Price = formData.variants[index]?.prices['1'] || 0;
    const discounts = [0, 0.05, 0.10, 0.15, 0.20, 0.25]; // Tier discounts
    
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== index) return v;
        const newPrices: Record<string, number> = {};
        TIERS.forEach((t, idx) => {
          newPrices[String(t.num)] = Math.round(tier1Price * (1 - discounts[idx]));
        });
        return { ...v, prices: newPrices };
      })
    }));
  };

  // Save product (create or update)
  const handleSaveProduct = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (formData.variants.length === 0) {
      toast.error('Add at least one variant');
      return;
    }
    
    const hasInvalidVariant = formData.variants.some(v => !v.thickness || !v.size);
    if (hasInvalidVariant) {
      toast.error('All variants must have thickness and size');
      return;
    }
    
    setSaving(true);
    try {
      const url = editingProduct 
        ? `${API_BASE}/admin/products-v2/${editingProduct.id}`
        : `${API_BASE}/admin/products-v2`;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }
      
      toast.success(
        editingProduct ? 'Product Updated' : 'Product Created', 
        editingProduct ? 'Product has been updated successfully' : 'Product with variants has been created'
      );
      closeModal();
      loadProducts();
    } catch (err: any) {
      toast.error('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Download template
  const downloadTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/products-v2/template`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (!res.ok) throw new Error('Failed to download template');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template Downloaded', 'Fill in the template and upload');
    } catch (err: any) {
      toast.error('Download Failed', err.message);
    }
  };

  // Export products
  const exportProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/products-v2/export`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (!res.ok) throw new Error('Failed to export products');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export Complete', 'Products exported to Excel');
    } catch (err: any) {
      toast.error('Export Failed', err.message);
    }
  };

  // Upload Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadProgress('Uploading...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_BASE}/admin/products-v2/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.detail || 'Import failed');
      }
      
      toast.success('Import Complete', 
        `${result.products_created} products, ${result.variants_created} variants created`
      );
      
      if (result.errors?.length > 0) {
        console.warn('Import errors:', result.errors);
      }
      
      loadProducts();
    } catch (err: any) {
      toast.error('Import Failed', err.message);
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const paginatedProducts = products.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

  return (
    <div className="p-6 lg:p-8" data-testid="products-v2-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Product Management</h1>
          <p className="text-slate-500 mt-1">Manage products with thickness, size & tier pricing</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            data-testid="download-template-btn"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Template
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploadProgress || 'Upload Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={exportProducts}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            data-testid="export-btn"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => { setShowAddModal(true); addVariant(); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md"
            data-testid="add-product-btn"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              data-testid="search-input"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All', icon: Package },
              { value: 'Plywood', label: 'Plywood', icon: Package },
              { value: 'Timber', label: 'Timber', icon: TreePine }
            ].map(g => (
              <button
                key={g.value}
                onClick={() => { setGroupFilter(g.value); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  groupFilter === g.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <g.icon className="w-4 h-4" />
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedProducts.map(product => (
            <div
              key={product.id}
              onClick={() => handleEditProduct(product)}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
              data-testid={`product-card-${product.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    product.group === 'Plywood' ? 'bg-orange-50' : 'bg-emerald-50'
                  }`}>
                    {product.group === 'Plywood' 
                      ? <Package className="w-6 h-6 text-orange-600" />
                      : <TreePine className="w-6 h-6 text-emerald-600" />
                    }
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-xs text-slate-500">{product.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    product.group === 'Plywood' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {product.group}
                  </span>
                  <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Thicknesses</p>
                  <div className="flex flex-wrap gap-1">
                    {product.thicknesses.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700">{t}mm</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Sizes</p>
                  <div className="flex flex-wrap gap-1">
                    {product.sizes.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Base Price (Tier 1)</p>
                  <p className="text-lg font-bold text-primary">₹{Number(product.base_price).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to edit product →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-900 font-medium">No products found</p>
          <p className="text-slate-500 text-sm mt-1">
            {search || groupFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first product or import from Excel'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && products.length > PRODUCTS_PER_PAGE && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={closeModal}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., MR Plywood"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="product-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Group *</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value as 'Plywood' | 'Timber' }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    data-testid="product-group-select"
                  >
                    <option value="Plywood">Plywood</option>
                    <option value="Timber">Timber</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              
              {/* Variants Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Product Variants (Thickness × Size × Pricing)</h3>
                  <button
                    onClick={addVariant}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variant
                  </button>
                </div>
                
                {formData.variants.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No variants added. Click "Add Variant" to start.</p>
                  </div>
                )}
                
                {formData.variants.map((variant, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Variant {index + 1}</span>
                      <button
                        onClick={() => removeVariant(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Thickness (mm)</label>
                        <input
                          type="text"
                          value={variant.thickness}
                          onChange={(e) => updateVariant(index, 'thickness', e.target.value)}
                          placeholder="e.g., 12 or 18.5"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Size</label>
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => updateVariant(index, 'size', e.target.value)}
                          placeholder="e.g., 8x4 or 2.44x1.22"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Stock Qty</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Tier Pricing */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-slate-500">Tier Pricing</label>
                        <button
                          onClick={() => autoFillPrices(index)}
                          className="text-xs text-primary hover:underline"
                        >
                          Auto-fill from Tier 1
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {TIERS.map(tier => (
                          <div key={tier.num}>
                            <label className="block text-[10px] text-slate-400 mb-0.5">T{tier.num}</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={variant.prices[String(tier.num)] || ''}
                                onChange={(e) => updateVariantPrice(index, String(tier.num), parseFloat(e.target.value) || 0)}
                                className="w-full pl-5 pr-2 py-1.5 bg-white border border-slate-200 rounded text-sm text-center"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={saving}
                  className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingProduct ? 'Save Changes' : 'Create Product'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
