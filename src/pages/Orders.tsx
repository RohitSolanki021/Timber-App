import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Order, Pagination } from "../types";
import { ClipboardList, ChevronRight, Search } from "lucide-react";

const ORDERS_PER_PAGE = 8;

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await apiProxy.getOrders({ page, per_page: ORDERS_PER_PAGE });
        setOrders(response.data);
        setFilteredOrders(response.data);
        setPagination(response.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

  useEffect(() => {
    let result = orders;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(o => o.id.toLowerCase().includes(s));
    }
    if (statusFilter !== "All") {
      result = result.filter(o => o.status === statusFilter);
    }
    setFilteredOrders(result);
  }, [search, statusFilter, orders]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Orders...</div>;

  const statuses = ["All", "Created", "Approved", "Paid", "Dispatched", "Completed"];
  const currentPage = pagination?.page ?? page;
  const totalPages = Math.max(1, pagination?.total_pages ?? page);
  const hasPrevious = currentPage > 1;
  const hasNext = pagination ? currentPage < totalPages : orders.length === ORDERS_PER_PAGE;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <header className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">My Orders</h1>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-white text-slate-400 border border-slate-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Link
            key={order.id}
            to={`/order/${order.id}`}
            className="block bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-primary/20 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">Order #{order.id}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {new Date(order.order_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                order.status === 'Created' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {order.status}
              </span>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-xl font-black text-slate-900">₹{Number(order.amount || order.grand_total || 0).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-widest">
                View Details
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <ClipboardList className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No orders found</p>
            <Link to="/products" className="text-primary font-black text-xs uppercase tracking-widest inline-block">Browse Products</Link>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={!hasPrevious || loading}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Page {currentPage} of {totalPages}
        </p>
        <button
          onClick={() =>
            setPage((prev) =>
              pagination ? Math.min(totalPages, prev + 1) : prev + 1
            )
          }
          disabled={!hasNext || loading}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
