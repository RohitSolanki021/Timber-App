import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Order, User as UserType } from "../types";
import { 
  ClipboardList, 
  FileText, 
  ChevronRight, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  TreePine,
  Edit3,
  XCircle
} from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const API_BASE = (() => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) return configured.endsWith('/') ? configured.slice(0, -1) : configured;
  return `${window.location.origin}/api`;
})();

export default function Dashboard() {
  const toast = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; order: any | null; action: 'approve' | 'cancel' }>({ 
    open: false, order: null, action: 'approve' 
  });

  const getToken = () => localStorage.getItem('token');

  const fetchDashboard = async () => {
    try {
      const [userData, ordersResponse, dashboardResponse] = await Promise.all([
        apiProxy.getMe(),
        apiProxy.getOrders({ page: 1, per_page: 20 }),
        apiProxy.getAdminDashboard()
      ]);
      setUser(userData);
      setOrders(ordersResponse.data);
      setDashboardData(dashboardResponse);
      
      // Fetch pending orders
      const pendingRes = await fetch(`${API_BASE}/orders/v2?status=Pending&per_page=10`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const pendingData = await pendingRes.json();
      setPendingOrders(pendingData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApprove = async (order: any) => {
    setActionLoading(order.id);
    try {
      const res = await fetch(`${API_BASE}/orders/v2/${order.id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to approve');
      toast.success(`Order ${order.id} approved`);
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to approve order');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, order: null, action: 'approve' });
    }
  };

  const handleCancel = async (order: any) => {
    setActionLoading(order.id);
    try {
      const res = await fetch(`${API_BASE}/orders/v2/${order.id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to cancel');
      toast.success(`Order ${order.id} cancelled`);
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to cancel order');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, order: null, action: 'cancel' });
    }
  };

  const summary = useMemo(() => {
    const pendingApproval = orders.filter((order) => ["created", "pending"].includes(order.status.toLowerCase())).length;
    const invoiced = orders.filter((order) => order.status.toLowerCase() === "invoiced").length;
    const dispatched = orders.filter((order) => order.status.toLowerCase() === "dispatched").length;
    const completed = orders.filter((order) => order.status.toLowerCase() === "completed").length;
    return { pendingApproval, invoiced, dispatched, completed };
  }, [orders]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]" data-testid="dashboard-loading">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Use V2 dashboard data
  const totalOrders = (dashboardData?.plywood_orders_count || 0) + (dashboardData?.timber_orders_count || 0);

  const statCards = [
    {
      label: "Pending Orders",
      value: dashboardData?.pending_orders ?? summary.pendingApproval,
      icon: Clock,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      link: "/orders"
    },
    {
      label: "Total Orders",
      value: totalOrders || orders.length,
      icon: ClipboardList,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/orders"
    },
    {
      label: "Pending Invoices",
      value: dashboardData?.pending_invoices ?? 0,
      icon: FileText,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      link: "/invoices"
    },
    {
      label: "Customers",
      value: dashboardData?.total_customers ?? 0,
      icon: Users,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      link: "/customers"
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      created: 'bg-blue-100 text-blue-700',
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-indigo-100 text-indigo-700',
      invoiced: 'bg-purple-100 text-purple-700',
      dispatched: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return styles[status.toLowerCase()] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="dashboard-title">
            Welcome back, {user?.name?.split(" ")[0] || 'Admin'}
          </h1>
          <p className="text-slate-500 mt-1">Manage approvals, orders, and invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            System Online
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" data-testid="stats-grid">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
            data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending Plywood Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="pending-plywood-orders">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-orange-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            <h2 className="font-semibold text-slate-900">Pending Plywood Orders</h2>
          </div>
          <Link to="/orders?status=Pending&type=Plywood" className="text-sm text-primary font-medium hover:underline">
            View All →
          </Link>
        </div>
        {pendingOrders.filter(o => o.order_type === 'Plywood').length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Estimated</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingOrders.filter(o => o.order_type === 'Plywood').slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/orders`} className="font-medium text-primary hover:underline">{order.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-500">Tier {order.pricing_tier}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {order.items?.slice(0, 2).map((item: any, i: number) => (
                          <p key={i} className="text-slate-600 truncate max-w-[200px]">
                            {item.product_name} - {item.thickness}mm × {item.quantity}
                          </p>
                        ))}
                        {order.items?.length > 2 && (
                          <p className="text-xs text-slate-400">+{order.items.length - 2} more</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-orange-600">₹{Number(order.grand_total || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/orders`}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit Order"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setConfirmDialog({ open: true, order, action: 'approve' })}
                          disabled={actionLoading === order.id}
                          className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          title="Approve Order"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDialog({ open: true, order, action: 'cancel' })}
                          disabled={actionLoading === order.id}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Cancel Order"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No pending plywood orders</p>
          </div>
        )}
      </div>

      {/* Pending Timber Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="pending-timber-orders">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900">Pending Timber Orders</h2>
          </div>
          <Link to="/orders?status=Pending&type=Timber" className="text-sm text-primary font-medium hover:underline">
            View All →
          </Link>
        </div>
        {pendingOrders.filter(o => o.order_type === 'Timber').length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingOrders.filter(o => o.order_type === 'Timber').slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/orders`} className="font-medium text-primary hover:underline">{order.id}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-500">Tier {order.pricing_tier}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {order.items?.slice(0, 2).map((item: any, i: number) => (
                          <p key={i} className="text-slate-600 truncate max-w-[200px]">
                            {item.product_name} - {item.thickness}mm × {item.quantity}
                          </p>
                        ))}
                        {order.items?.length > 2 && (
                          <p className="text-xs text-slate-400">+{order.items.length - 2} more</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-emerald-600">₹{Number(order.grand_total || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/orders`}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit Order"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setConfirmDialog({ open: true, order, action: 'approve' })}
                          disabled={actionLoading === order.id}
                          className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          title="Approve Order"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDialog({ open: true, order, action: 'cancel' })}
                          disabled={actionLoading === order.id}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Cancel Order"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <TreePine className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No pending timber orders</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="quick-actions">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dashboardData?.pending_customers > 0 && (
                <Link
                  to="/customers?status=pending"
                  className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group border border-amber-200"
                  data-testid="quick-action-pending-customers"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Pending Approvals</p>
                    <p className="text-xs text-amber-600 font-medium">{dashboardData.pending_customers} customers waiting</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400" />
                </Link>
              )}
              <Link
                to="/customers"
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                data-testid="quick-action-customers"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Manage Customers</p>
                  <p className="text-xs text-slate-500">{dashboardData?.total_customers || 0} active</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              
              <Link
                to="/orders"
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                data-testid="quick-action-orders"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Process Orders</p>
                  <p className="text-xs text-slate-500">{dashboardData?.pending_orders || 0} pending</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              
              <Link
                to="/invoices"
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                data-testid="quick-action-invoices"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Manage Invoices</p>
                  <p className="text-xs text-slate-500">{dashboardData?.pending_invoices || 0} pending</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.open && confirmDialog.order && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {confirmDialog.action === 'approve' ? 'Approve Order' : 'Cancel Order'}
            </h3>
            <p className="text-slate-600 mb-4">
              {confirmDialog.action === 'approve' 
                ? `Are you sure you want to approve order ${confirmDialog.order.id}?`
                : `Are you sure you want to cancel order ${confirmDialog.order.id}? This action cannot be undone.`
              }
            </p>
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Customer:</span> {confirmDialog.order.customerName}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Amount:</span> ₹{Number(confirmDialog.order.grand_total || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog({ open: false, order: null, action: 'approve' })}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDialog.action === 'approve' ? handleApprove(confirmDialog.order) : handleCancel(confirmDialog.order)}
                disabled={actionLoading === confirmDialog.order.id}
                className={`flex-1 py-2.5 font-semibold rounded-xl disabled:opacity-50 ${
                  confirmDialog.action === 'approve'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {actionLoading === confirmDialog.order.id ? 'Processing...' : (confirmDialog.action === 'approve' ? 'Approve' : 'Cancel Order')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
