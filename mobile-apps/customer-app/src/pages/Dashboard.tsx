import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../apiService';
import { TrendingUp, Users, ClipboardList, IndianRupee, FileWarning, Loader2, UserPlus, Package } from 'lucide-react';

interface DashboardData {
  monthly_sales: number;
  new_orders_week: number;
  assigned_customers: number;
  pending_orders_count: number;
  total_outstanding: number;
  due_invoices_count: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const profile = JSON.parse(localStorage.getItem('sales_profile') || '{}');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiService.getDashboard();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const stats = [
    { 
      label: 'Monthly Sales', 
      value: `₹${(data?.monthly_sales || 0).toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-emerald-100 text-emerald-600' 
    },
    { 
      label: 'Customers', 
      value: data?.assigned_customers || 0, 
      icon: Users, 
      color: 'bg-blue-100 text-blue-600' 
    },
    { 
      label: 'Pending Orders', 
      value: data?.pending_orders_count || 0, 
      icon: ClipboardList, 
      color: 'bg-orange-100 text-orange-600' 
    },
    { 
      label: 'Outstanding', 
      value: `₹${(data?.total_outstanding || 0).toLocaleString()}`, 
      icon: IndianRupee, 
      color: 'bg-red-100 text-red-600' 
    },
  ];

  return (
    <div className="p-5 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Hello, {profile.name?.split(' ')[0] || 'Sales'}!</h2>
        <p className="text-sm text-white/80 mt-1">Welcome back to your sales dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(data?.due_invoices_count || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <FileWarning className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {data?.due_invoices_count} invoice{(data?.due_invoices_count || 0) > 1 ? 's' : ''} pending payment
            </p>
            <Link to="/invoices" className="text-xs text-amber-700 underline mt-1 inline-block">
              View invoices →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/customers/add"
            data-testid="add-customer-btn"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Add Customer</span>
          </Link>
          <Link
            to="/products"
            data-testid="create-order-btn"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Create Order</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Orders This Week</h3>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">{data?.new_orders_week || 0}</p>
            <p className="text-sm text-slate-500 mt-1">new orders placed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
