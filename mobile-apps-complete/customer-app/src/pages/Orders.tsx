import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../apiService';
import { Loader2, ClipboardList, ChevronRight, Package } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customer_id: number;
  status: string;
  amount: number;
  order_date: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await apiService.getOrders({ status: filter });
        setOrders(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Dispatched': return 'bg-blue-100 text-blue-700';
      case 'Approved': return 'bg-purple-100 text-purple-700';
      case 'Created': return 'bg-amber-100 text-amber-700';
      case 'Invoiced': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filters = ['', 'Created', 'Approved', 'Dispatched', 'Invoiced', 'Completed'];

  return (
    <div className="p-5 space-y-5 pb-24">
      <h1 className="text-xl font-bold text-slate-900">Orders</h1>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f || 'all'}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-300 hover:border-primary'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">{order.id}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{order.customerName}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">₹{order.amount.toLocaleString()}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
