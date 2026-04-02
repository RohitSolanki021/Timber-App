import React, { useEffect, useState, useCallback } from "react";
import { 
  ClipboardList, ChevronRight, ChevronLeft, Search, Package,
  CheckCircle2, XCircle, TreePine, Eye, Edit3, Save, X
} from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const API_BASE = (() => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) return configured.endsWith('/') ? configured.slice(0, -1) : configured;
  return `${window.location.origin}/api`;
})();

interface OrderItem {
  product_group: string;
  product_id: string;
  product_name: string;
  thickness: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderV2 {
  id: string;
  customer_id: number;
  customerName: string;
  order_type: 'Plywood' | 'Timber';
  status: string;
  items: OrderItem[];
  total_quantity: number;
  sub_total: number;
  cgst: number;
  sgst: number;
  grand_total: number;
  pricing_tier: string;
  is_editable: boolean;
  placed_by?: string;
  transport?: {
    transport_mode?: string;
    vehicle_number?: string;
    driver_name?: string;
    driver_phone?: string;
  };
  order_date: string;
  created_at: string;
  confirmed_at?: string;
  notes?: string;
}

const ORDERS_PER_PAGE = 10;

// Simplified statuses
const ORDER_STATUSES = ["All", "Pending", "Approved", "Delivered", "Cancelled"];

export default function OrdersV2() {
  const toast = useToast();
  const [orders, setOrders] = useState<OrderV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Action states
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; order: OrderV2 | null; action: 'approve' | 'cancel' }>({ 
    open: false, order: null, action: 'approve' 
  });
  const [actionLoading, setActionLoading] = useState(false);
  
  // Edit order modal
  const [editOrder, setEditOrder] = useState<OrderV2 | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  
  // View order detail
  const [selectedOrder, setSelectedOrder] = useState<OrderV2 | null>(null);

  const getToken = () => localStorage.getItem('token');

  const authHeaders = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(ORDERS_PER_PAGE),
        pending_first: 'true'
      });
      
      if (search) params.append('search', search);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('order_type', typeFilter);
      
      const res = await fetch(`${API_BASE}/orders/v2?${params.toString()}`, { 
        headers: authHeaders() 
      });
      const data = await res.json();
      
      setOrders(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(loadOrders, 300);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  // Open edit modal
  const handleEditOrder = (order: OrderV2) => {
    setEditOrder(order);
    setEditItems(order.items.map(item => ({ ...item })));
  };

  // Update item price in edit modal
  const updateItemPrice = (index: number, newPrice: number) => {
    setEditItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        unit_price: newPrice,
        total_price: newPrice * item.quantity
      };
    }));
  };

  // Update item quantity in edit modal
  const updateItemQuantity = (index: number, newQty: number) => {
    setEditItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        quantity: newQty,
        total_price: item.unit_price * newQty
      };
    }));
  };

  // Calculate totals for edit modal
  const editSubTotal = editItems.reduce((sum, item) => sum + item.total_price, 0);
  const editCgst = editSubTotal * 0.09;
  const editSgst = editSubTotal * 0.09;
  const editGrandTotal = editSubTotal + editCgst + editSgst;

  // Save edited order
  const handleSaveEdit = async () => {
    if (!editOrder) return;
    
    setEditSaving(true);
    try {
      const res = await fetch(`${API_BASE}/orders/v2/${editOrder.id}/items`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ items: editItems })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to update order');
      }
      
      toast.success('Order Updated', 'Prices have been updated successfully');
      setEditOrder(null);
      loadOrders();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // Approve order
  const handleApproveOrder = async () => {
    if (!confirmDialog.order) return;
    
    setActionLoading(true);
    try {
      const endpoint = confirmDialog.action === 'approve' 
        ? `/orders/v2/${confirmDialog.order.id}/confirm`
        : `/orders/v2/${confirmDialog.order.id}/cancel`;
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: authHeaders()
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Action failed');
      }
      
      toast.success(
        confirmDialog.action === 'approve' ? 'Order Approved' : 'Order Cancelled',
        confirmDialog.action === 'approve' 
          ? `Order ${confirmDialog.order.id} has been approved and invoice created`
          : `Order ${confirmDialog.order.id} has been cancelled`
      );
      
      setConfirmDialog({ open: false, order: null, action: 'approve' });
      loadOrders();
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const orderTypes = [
    { value: 'all', label: 'All Types', icon: ClipboardList },
    { value: 'Plywood', label: 'Plywood', icon: Package },
    { value: 'Timber', label: 'Timber', icon: TreePine }
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      delivered: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return styles[status.toLowerCase()] || 'bg-slate-100 text-slate-700';
  };

  const getTypeBadge = (type: string) => {
    return type === 'Plywood' 
      ? 'bg-orange-100 text-orange-700' 
      : 'bg-emerald-100 text-emerald-700';
  };

  return (
    <div className="p-6 lg:p-8" data-testid="orders-v2-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="orders-title">
            Orders (B2B)
          </h1>
          <p className="text-slate-500 mt-1">Manage orders - Edit prices & Approve pending orders</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
            {total} total orders
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-4" data-testid="orders-filters">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              data-testid="search-input"
            />
          </div>
          
          {/* Type Filter */}
          <div className="flex gap-2">
            {orderTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => { setTypeFilter(type.value); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  typeFilter === type.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                data-testid={`filter-type-${type.value}`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2" data-testid="status-filters">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              data-testid={`filter-${status.toLowerCase()}`}
            >
              {status === 'Pending' ? 'Order Placed' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20" data-testid="loading-state">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="orders-table">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className={`hover:bg-slate-50 transition-colors ${order.status === 'Pending' ? 'bg-amber-50/50' : ''}`}
                    data-testid={`order-row-${order.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          order.order_type === 'Plywood' ? 'bg-orange-50' : 'bg-emerald-50'
                        }`}>
                          {order.order_type === 'Plywood' 
                            ? <Package className="w-5 h-5 text-orange-600" />
                            : <TreePine className="w-5 h-5 text-emerald-600" />
                          }
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{order.id}</span>
                          <p className="text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { 
                              day: 'numeric', month: 'short' 
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-500">Tier {order.pricing_tier}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(order.order_type)}`}>
                        {order.order_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-900 font-medium">{order.total_quantity}</span>
                      <span className="text-xs text-slate-400 ml-1">qty</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        ₹{Number(order.grand_total).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {order.status === 'Pending' ? 'Order Placed' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleEditOrder(order)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                              data-testid={`edit-order-${order.id}`}
                              title="Edit prices before approving"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDialog({ open: true, order, action: 'approve' })}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
                              data-testid={`approve-order-${order.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmDialog({ open: true, order, action: 'cancel' })}
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                              data-testid={`cancel-order-${order.id}`}
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          data-testid={`view-order-${order.id}`}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`p-4 ${order.status === 'Pending' ? 'bg-amber-50/50' : ''}`}
                data-testid={`order-card-${order.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      order.order_type === 'Plywood' ? 'bg-orange-50' : 'bg-emerald-50'
                    }`}>
                      {order.order_type === 'Plywood' 
                        ? <Package className="w-5 h-5 text-orange-600" />
                        : <TreePine className="w-5 h-5 text-emerald-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{order.id}</p>
                      <p className="text-sm text-slate-500">{order.customerName}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                    {order.status === 'Pending' ? 'Order Placed' : order.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(order.order_type)}`}>
                      {order.order_type}
                    </span>
                    <span className="text-xs text-slate-500">{order.total_quantity} qty</span>
                  </div>
                  <span className="font-semibold text-slate-900">₹{Number(order.grand_total).toLocaleString()}</span>
                </div>
                
                {order.status === 'Pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="flex-1 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDialog({ open: true, order, action: 'approve' })}
                      className="flex-1 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setConfirmDialog({ open: true, order, action: 'cancel' })}
                      className="flex-1 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {orders.length === 0 && !loading && (
            <div className="py-20 text-center" data-testid="empty-state">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-900 font-medium">No orders found</p>
              <p className="text-slate-500 text-sm mt-1">
                {search || statusFilter !== "All" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "New orders will appear here"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center justify-between mt-6" data-testid="pagination">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <p className="text-sm text-slate-600">
            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
          </p>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="next-page"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Order Modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Order Prices</h2>
                <p className="text-sm text-slate-500">Order {editOrder.id} - {editOrder.customerName}</p>
              </div>
              <button 
                onClick={() => setEditOrder(null)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Variant</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Unit Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.product_name}</p>
                          <p className="text-xs text-slate-500">{item.product_group}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{item.thickness}mm × {item.size}</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-2 text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <span className="text-slate-400 mr-1">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                              className="w-24 px-3 py-2 text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-slate-900">₹{item.total_price.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Totals */}
              <div className="bg-slate-900 text-white rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Sub Total</span>
                  <span>₹{editSubTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">CGST (9%)</span>
                  <span>₹{editCgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">SGST (9%)</span>
                  <span>₹{editSgst.toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-700 my-3"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span>₹{editGrandTotal.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEditOrder(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {editSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save & Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Order {selectedOrder.id}</h2>
                <p className="text-sm text-slate-500">{selectedOrder.customerName}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase">Type</p>
                  <p className={`font-semibold ${selectedOrder.order_type === 'Plywood' ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {selectedOrder.order_type}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase">Status</p>
                  <p className="font-semibold text-slate-900">
                    {selectedOrder.status === 'Pending' ? 'Order Placed' : selectedOrder.status}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase">Pricing Tier</p>
                  <p className="font-semibold text-slate-900">Tier {selectedOrder.pricing_tier}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase">Total</p>
                  <p className="font-bold text-primary">₹{Number(selectedOrder.grand_total).toLocaleString()}</p>
                </div>
              </div>
              
              {/* Items */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Order Items</h3>
                <div className="bg-slate-50 rounded-xl divide-y divide-slate-200">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{item.product_name}</p>
                        <p className="text-sm text-slate-500">{item.thickness}mm × {item.size}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">₹{Number(item.total_price).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{item.quantity} × ₹{item.unit_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Transport */}
              {selectedOrder.transport && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Transport Details</h3>
                  <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Mode</p>
                      <p className="font-medium text-slate-900">{selectedOrder.transport.transport_mode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Vehicle</p>
                      <p className="font-medium text-slate-900">{selectedOrder.transport.vehicle_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Driver</p>
                      <p className="font-medium text-slate-900">{selectedOrder.transport.driver_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Phone</p>
                      <p className="font-medium text-slate-900">{selectedOrder.transport.driver_phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Totals */}
              <div className="bg-slate-900 text-white rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Sub Total</span>
                  <span>₹{Number(selectedOrder.sub_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">CGST (9%)</span>
                  <span>₹{Number(selectedOrder.cgst).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">SGST (9%)</span>
                  <span>₹{Number(selectedOrder.sgst).toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-700 my-3"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span>₹{Number(selectedOrder.grand_total).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Actions */}
              {selectedOrder.status === 'Pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      handleEditOrder(selectedOrder);
                    }}
                    className="flex-1 py-3 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-5 h-5" />
                    Edit Prices
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setConfirmDialog({ open: true, order: selectedOrder, action: 'approve' });
                    }}
                    className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Approve Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, order: null, action: 'approve' })}
        onConfirm={handleApproveOrder}
        loading={actionLoading}
        title={confirmDialog.action === 'approve' ? 'Approve Order' : 'Cancel Order'}
        message={
          confirmDialog.action === 'approve'
            ? `Are you sure you want to approve order ${confirmDialog.order?.id}? This will lock the order, deduct stock, and create an invoice.`
            : `Are you sure you want to cancel order ${confirmDialog.order?.id}? This action cannot be undone.`
        }
        confirmText={confirmDialog.action === 'approve' ? 'Approve Order' : 'Cancel Order'}
        variant={confirmDialog.action === 'approve' ? 'info' : 'danger'}
      />
    </div>
  );
}
