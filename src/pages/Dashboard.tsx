import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Order, User as UserType } from "../types";
import { Package, ClipboardList, FileText, ChevronRight, TrendingUp, Clock, CheckCircle2, User } from "lucide-react";
import { motion } from "motion/react";

export default function Dashboard() {
  const [user, setUser] = useState<UserType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, ordersResponse] = await Promise.all([
          apiProxy.getMe(),
          apiProxy.getOrders({ page: 1, per_page: 3 })
        ]);
        setUser(userData);
        setOrders(ordersResponse.data.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest leading-tight">Hello, {user?.name.split(' ')[0]}</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Welcome back to your portal</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-slate-900 dark:text-white font-black text-2xl">{orders.length}</p>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Recent Orders</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-slate-900 dark:text-white font-black text-2xl">₹{(orders.reduce((acc, o) => acc + parseFloat(o.amount), 0)).toLocaleString()}</p>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Spend</p>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link to="/products" className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] shadow-sm flex items-center justify-center group hover:border-primary/20 transition-all">
              <Package className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-200 uppercase tracking-widest">Products</span>
          </Link>
          <Link to="/orders" className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] shadow-sm flex items-center justify-center group hover:border-primary/20 transition-all">
              <ClipboardList className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-200 uppercase tracking-widest">Orders</span>
          </Link>
          <Link to="/invoices" className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] shadow-sm flex items-center justify-center group hover:border-primary/20 transition-all">
              <FileText className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-200 uppercase tracking-widest">Invoices</span>
          </Link>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Orders</h2>
          <Link to="/orders" className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/order/${order.id}`}
              className="block bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm hover:border-primary/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{order.id}</p>
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mt-1">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                  order.status === 'Created' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-slate-900 dark:text-white font-black text-lg">₹{order.amount.toLocaleString()}</p>
                <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[32px] border border-dashed border-slate-200">
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No orders yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
