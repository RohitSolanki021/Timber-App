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
  Package
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<UserType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kpis, setKpis] = useState<{ pending_orders_count?: number; new_orders_week?: number; due_invoices_count?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, ordersResponse, dashboardResponse] = await Promise.all([
          apiProxy.getMe(),
          apiProxy.getOrders({ page: 1, per_page: 20 }),
          apiProxy.getAdminDashboard()
        ]);
        setUser(userData);
        setOrders(ordersResponse.data);
        setKpis(dashboardResponse);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const statCards = [
    {
      label: "Awaiting Approval",
      value: kpis?.pending_orders_count ?? summary.pendingApproval,
      icon: Clock,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      link: "/orders"
    },
    {
      label: "Total Orders",
      value: kpis?.new_orders_week ?? orders.length,
      icon: ClipboardList,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/orders"
    },
    {
      label: "Due Invoices",
      value: kpis?.due_invoices_count ?? 0,
      icon: FileText,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      link: "/invoices"
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      link: "/orders"
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="latest-orders-section">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Latest Orders</h2>
            <Link 
              to="/orders" 
              className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              data-testid="view-all-orders"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                data-testid={`order-row-${order.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{order.id}</p>
                    <p className="text-sm text-slate-500">{order.customerName || "Customer"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="font-semibold text-slate-900">₹{Number(order.amount || order.grand_total || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.order_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
            {orders.length === 0 && (
              <div className="px-6 py-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No orders available</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="quick-actions">
            <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
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
                  <p className="text-xs text-slate-500">Approve pending customers</p>
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
                  <p className="text-xs text-slate-500">Update order statuses</p>
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
                  <p className="text-xs text-slate-500">Mark invoices as paid</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Order Status Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="order-status-summary">
            <h2 className="font-semibold text-slate-900 mb-4">Order Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pending</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                  {summary.pendingApproval}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Invoiced</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                  {summary.invoiced}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Dispatched</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-medium">
                  {summary.dispatched}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completed</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                  {summary.completed}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
