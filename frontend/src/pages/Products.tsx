import React, { useEffect, useState, useCallback } from "react";
import { apiProxy } from "../apiProxy";
import { Product } from "../types";
import { ProductFormData } from "../apiService";
import { useToast } from "../components/ui/Toast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { SlideOver } from "../components/ui/SlideOver";
import { DataTable, Column } from "../components/ui/DataTable";
import { 
  Search, Plus, MoreVertical, Eye, Edit2, Trash2,
  Package, TreePine, LayoutGrid, Box, IndianRupee
} from "lucide-react";

type CategoryFilter = '' | 'Plywood' | 'Timber';

const initialFormData: ProductFormData = {
  name: '',
  category: 'Plywood',
  price: 0,
  priceUnit: 'ea',
  stock_status: 'in_stock',
  stock_quantity: 0,
  description: '',
  primary_image: '',
};

export default function Products() {
  const toast = useToast();
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>('');
  
  // UI state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiProxy.getProducts({ search, category });
      setProducts(res.data || res.products || []);
    } catch (error: any) {
      toast.error('Failed to load products', error.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, toast]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (formData.price <= 0) errors.price = 'Price must be greater than 0';
    if (formData.stock_quantity !== undefined && formData.stock_quantity < 0) errors.stock_quantity = 'Stock cannot be negative';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedProduct(null);
    setSlideOverMode('add');
    setSlideOverOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      id: product.id,
      name: product.name || '',
      category: product.category || 'Plywood',
      price: product.price || 0,
      priceUnit: product.priceUnit || 'ea',
      stock_status: product.stock_status || 'in_stock',
      stock_quantity: product.stock_quantity || 0,
      description: product.description || '',
      primary_image: product.primary_image || '',
      pricing_rates: product.pricing_rates,
    });
    setFormErrors({});
    setSlideOverMode('edit');
    setSlideOverOpen(true);
    setOpenDropdownId(null);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setSlideOverMode('view');
    setSlideOverOpen(true);
    setOpenDropdownId(null);
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // Calculate pricing rates based on base price
      const pricingRates = {
        "1": formData.price,
        "2": Math.round(formData.price * 0.95 * 100) / 100,
        "3": Math.round(formData.price * 0.90 * 100) / 100,
      };
      
      const dataToSave = { ...formData, pricing_rates: pricingRates };
      
      if (slideOverMode === 'add') {
        await apiProxy.createProduct(dataToSave);
        toast.success('Product created', 'New product has been added successfully');
      } else {
        await apiProxy.updateProduct(selectedProduct!.id, dataToSave);
        toast.success('Product updated', 'Product details have been updated');
      }
      setSlideOverOpen(false);
      loadProducts();
    } catch (error: any) {
      toast.error('Operation failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setConfirmProduct(product);
    setConfirmOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmProduct) return;
    
    setConfirmLoading(true);
    try {
      await apiProxy.deleteProduct(confirmProduct.id);
      toast.success('Product deleted', `${confirmProduct.name} has been removed`);
      setConfirmOpen(false);
      loadProducts();
    } catch (error: any) {
      toast.error('Delete failed', error.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const categories = [
    { name: "All", value: '' as CategoryFilter, icon: LayoutGrid, color: "bg-slate-100 text-slate-600" },
    { name: "Plywood", value: 'Plywood' as CategoryFilter, icon: Package, color: "bg-orange-100 text-orange-600" },
    { name: "Timber", value: 'Timber' as CategoryFilter, icon: TreePine, color: "bg-emerald-100 text-emerald-600" }
  ];

  const getStockBadge = (status: string, quantity: number) => {
    if (status === 'out_of_stock' || quantity === 0) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>;
    }
    if (quantity < 20) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Low Stock ({quantity})</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">In Stock ({quantity})</span>;
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {product.primary_image ? (
              <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Box className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{product.name}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                product.category === 'Plywood' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {product.category}
              </span>
              <span className="text-xs text-slate-400">ID: {product.id}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (product) => (
        <div className="flex items-center gap-1">
          <IndianRupee className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-900">{Number(product.price).toLocaleString()}</span>
          <span className="text-xs text-slate-400">/{product.priceUnit}</span>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock Status',
      render: (product) => getStockBadge(product.stock_status || 'in_stock', product.stock_quantity || 0),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-12',
      render: (product) => (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === product.id ? null : product.id);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid={`product-menu-${product.id}`}
          >
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>
          
          {openDropdownId === product.id && (
            <div 
              className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50"
              data-testid={`product-dropdown-${product.id}`}
            >
              <button
                onClick={() => handleViewProduct(product)}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                data-testid={`view-product-${product.id}`}
              >
                <Eye className="w-4 h-4" /> View Details
              </button>
              <button
                onClick={() => handleEditProduct(product)}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                data-testid={`edit-product-${product.id}`}
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <div className="h-px bg-slate-200 my-1" />
              <button
                onClick={() => handleDeleteClick(product)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                data-testid={`delete-product-${product.id}`}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8" data-testid="products-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="products-title">
            Products
          </h1>
          <p className="text-slate-500 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
          data-testid="add-product-btn"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-4" data-testid="products-filters">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              data-testid="search-input"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2" data-testid="category-filters">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat.value
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : `${cat.color} hover:opacity-80`
              }`}
              data-testid={`filter-${cat.name.toLowerCase()}`}
            >
              <cat.icon className={`w-4 h-4 ${category === cat.value ? 'text-white' : ''}`} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        emptyIcon={<Package className="w-8 h-8 text-slate-400" />}
        emptyTitle="No products found"
        emptyMessage={search || category ? "Try adjusting your filters" : "Add your first product to get started"}
        onRowClick={handleViewProduct}
        rowKey={(product) => product.id}
      />

      {/* Add/Edit SlideOver */}
      <SlideOver
        isOpen={slideOverOpen && slideOverMode !== 'view'}
        onClose={() => setSlideOverOpen(false)}
        title={slideOverMode === 'add' ? 'Add Product' : 'Edit Product'}
        subtitle={slideOverMode === 'add' ? 'Create a new product' : `Editing ${selectedProduct?.name}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSlideOverOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              data-testid="cancel-product-btn"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProduct}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-50 transition-all"
              data-testid="save-product-btn"
            >
              {saving ? 'Saving...' : (slideOverMode === 'add' ? 'Create Product' : 'Save Changes')}
            </button>
          </div>
        }
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }}>
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.name ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Enter product name"
                  data-testid="input-name"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.category ? 'border-red-300' : 'border-slate-200'}`}
                  data-testid="input-category"
                >
                  <option value="Plywood">Plywood</option>
                  <option value="Timber">Timber</option>
                </select>
                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  placeholder="Enter product description"
                  data-testid="input-description"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Base Price (₹) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.price ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  data-testid="input-price"
                />
                {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price Unit</label>
                <select
                  value={formData.priceUnit}
                  onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  data-testid="input-unit"
                >
                  <option value="ea">Each (ea)</option>
                  <option value="sq.ft">Square Feet (sq.ft)</option>
                  <option value="cu.ft">Cubic Feet (cu.ft)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="m">Meter (m)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Tier 2 price: ₹{((formData.price || 0) * 0.95).toFixed(2)} | Tier 3 price: ₹{((formData.price || 0) * 0.90).toFixed(2)}
            </p>
          </div>

          {/* Stock */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Stock Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Status</label>
                <select
                  value={formData.stock_status}
                  onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  data-testid="input-stock-status"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.stock_quantity ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Enter quantity"
                  min="0"
                  data-testid="input-stock-qty"
                />
                {formErrors.stock_quantity && <p className="text-red-500 text-xs mt-1">{formErrors.stock_quantity}</p>}
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.primary_image}
              onChange={(e) => setFormData({ ...formData, primary_image: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="https://example.com/image.jpg"
              data-testid="input-image"
            />
          </div>
        </form>
      </SlideOver>

      {/* View Product SlideOver */}
      <SlideOver
        isOpen={slideOverOpen && slideOverMode === 'view'}
        onClose={() => setSlideOverOpen(false)}
        title="Product Details"
        subtitle={selectedProduct?.id}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSlideOverOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => selectedProduct && handleEditProduct(selectedProduct)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            >
              Edit Product
            </button>
          </div>
        }
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                {selectedProduct.primary_image ? (
                  <img src={selectedProduct.primary_image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <Box className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedProduct.category === 'Plywood' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedProduct.category}
                  </span>
                  <span className="text-xs text-slate-400">ID: {selectedProduct.id}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-slate-900">{selectedProduct.description || 'No description available'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Price</p>
                  <p className="text-xl font-bold text-slate-900">₹{Number(selectedProduct.price).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">per {selectedProduct.priceUnit}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Stock</p>
                  <p className="text-xl font-bold text-slate-900">{selectedProduct.stock_quantity || 0}</p>
                  {getStockBadge(selectedProduct.stock_status || 'in_stock', selectedProduct.stock_quantity || 0)}
                </div>
              </div>

              {selectedProduct.pricing_rates && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Pricing Tiers</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tier 1 (Standard)</span>
                      <span className="font-semibold">₹{selectedProduct.pricing_rates["1"] || selectedProduct.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tier 2 (Wholesale)</span>
                      <span className="font-semibold">₹{selectedProduct.pricing_rates["2"] || (selectedProduct.price * 0.95).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tier 3 (Premium)</span>
                      <span className="font-semibold">₹{selectedProduct.pricing_rates["3"] || (selectedProduct.price * 0.90).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={confirmLoading}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmProduct?.name}"? This action cannot be undone. Products used in orders cannot be deleted.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
