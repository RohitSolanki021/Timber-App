import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../apiService';
import { ShoppingCart, Package, ClipboardList, FileText, Loader2, ChevronRight } from 'lucide-react';

interface CustomerData {
  name: string;
  business_name?: string;
  outstanding_balance: number;
  credit_limit: number;
}

interface OrderStats {
  plywood_count: number;
  timber_count: number;
  pending_count: number;
}

export default function Dashboard() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({ plywood_count: 0, timber_count: 0, pending_count: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get customer profile
        const profile = await apiService.getMe();
        setCustomer(profile);
        localStorage.setItem('customer_profile', JSON.stringify(profile));

        // Get orders to calculate stats
        const ordersRes = await apiService.getOrders({ per_page: 100 });
        const orders = ordersRes.data || [];
        
        const plywood = orders.filter((o: any) => o.order_type === 'Plywood').length;
        const timber = orders.filter((o: any) => o.order_type === 'Timber').length;
        const pending = orders.filter((o: any) => o.status === 'Pending').length;
        
        setOrderStats({ plywood_count: plywood, timber_count: timber, pending_count: pending });
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const firstName = customer?.name?.split(' ')[0] || customer?.business_name?.split(' ')[0] || 'Customer';

  return (
    <div className="p-5 space-y-6 pb-24">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Hello, {firstName}!</h2>
        <p className="text-sm text-white/80 mt-1">Welcome to Natural Plylam</p>
      </div>

      {/* Quick Order Card */}
      <Link 
        to="/products" 
        data-testid="quick-order-btn"
        className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Quick Order</h3>
              <p className="text-sm text-slate-500">Browse products & place order</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </Link>

      {/* Order Type Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <Package className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-700">{orderStats.plywood_count}</p>
          <p className="text-xs text-amber-600 font-medium">Plywood Orders</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <Package className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-700">{orderStats.timber_count}</p>
          <p className="text-xs text-emerald-600 font-medium">Timber Orders</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/products"
            data-testid="order-action-btn"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Order</span>
          </Link>
          <Link
            to="/orders"
            data-testid="history-action-btn"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">History</span>
          </Link>
          <Link
            to="/invoices"
            data-testid="invoices-action-btn"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Invoices</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">Recent Orders</h3>
          <Link to="/orders" className="text-xs text-emerald-600 font-semibold">View All →</Link>
        </div>
        <div className="space-y-2">
          {recentOrders.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-6 text-center">
              <p className="text-slate-500 text-sm">No orders yet</p>
              <Link to="/products" className="text-emerald-600 text-sm font-semibold mt-2 inline-block">
                Place your first order →
              </Link>
            </div>
          ) : (
            recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{order.id}</p>
                  <p className="text-xs text-slate-500">{order.order_type} • {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">₹{(order.grand_total || 0).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'Dispatched' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
