import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Order, User as UserType } from "../types";
import { ClipboardList, FileText, ChevronRight, User, Users } from "lucide-react";

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
    return { pendingApproval, invoiced, dispatched };
  }, [orders]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest leading-tight">Admin, {user?.name.split(" ")[0]}</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Manage approvals, orders and invoices</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Awaiting" value={kpis?.pending_orders_count ?? summary.pendingApproval} />
        <StatCard label="New Orders" value={kpis?.new_orders_week ?? 0} />
        <StatCard label="Due Invoices" value={kpis?.due_invoices_count ?? 0} />
      </div>

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          <QuickLink to="/customers" icon={Users} label="Customers" />
          <QuickLink to="/orders" icon={ClipboardList} label="Orders" />
          <QuickLink to="/invoices" icon={FileText} label="Invoices" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Latest Orders</h2>
          <Link to="/orders" className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {orders.slice(0, 3).map((order) => (
            <Link key={order.id} to={`/order/${order.id}`} className="block bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <p className="font-black text-slate-900">{order.id}</p>
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mt-1">{order.customerName || "Customer"}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">{order.status}</span>
              </div>
            </Link>
          ))}
          {orders.length === 0 && <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No orders available</p>}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 bg-white border border-slate-100 rounded-[24px] shadow-sm flex items-center justify-center group hover:border-primary/20 transition-all">
        <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
      </div>
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
    </Link>
  );
}
