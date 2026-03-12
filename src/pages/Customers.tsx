import React, { useEffect, useState } from "react";
import { apiProxy } from "../apiProxy";
import { Customer, Pagination } from "../types";
import { CheckCircle2, Search, Users } from "lucide-react";

const CUSTOMERS_PER_PAGE = 10;

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiProxy.getCustomers({ page, per_page: CUSTOMERS_PER_PAGE, search });
      setCustomers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error(error);
      alert("Unable to load customers right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page]);

  const approveCustomer = async (customerId: number) => {
    setProcessingId(customerId);
    try {
      await apiProxy.approveCustomer(customerId);
      await loadCustomers();
    } catch (error) {
      console.error(error);
      alert("Unable to approve customer.");
    } finally {
      setProcessingId(null);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const visibleCustomers = normalizedSearch
    ? customers.filter((customer) => {
        const status = String(customer.status || customer.approval_status || "").toLowerCase();
        return (
          String(customer.name || "").toLowerCase().includes(normalizedSearch) ||
          String(customer.email || "").toLowerCase().includes(normalizedSearch) ||
          String(customer.id).includes(normalizedSearch) ||
          status.includes(normalizedSearch)
        );
      })
    : customers;

  const currentPage = pagination?.page ?? page;
  const totalPages = Math.max(1, pagination?.total_pages ?? page);
  const hasPrevious = currentPage > 1;
  const hasNext = pagination ? currentPage < totalPages : customers.length === CUSTOMERS_PER_PAGE;

  if (loading) return <div className="p-8 text-center text-slate-500">Loading customers...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <header className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Customers</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer"
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </header>

      <div className="space-y-4">
        {visibleCustomers.map((customer) => {
          const status = customer.status || customer.approval_status || "Pending";
          const approved = ["approved", "active"].includes(String(status).toLowerCase());

          return (
            <div key={customer.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{customer.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{customer.email || "No email"}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                <p>Contact: <span className="font-semibold text-slate-700">{customer.contactPerson || "-"}</span></p>
                <p>Phone: <span className="font-semibold text-slate-700">{customer.phone || "-"}</span></p>
              </div>
              {!approved && (
                <button
                  onClick={() => approveCustomer(customer.id)}
                  disabled={processingId === customer.id}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {processingId === customer.id ? "Approving..." : "Approve Customer"}
                </button>
              )}
            </div>
          );
        })}

        {visibleCustomers.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No customers found</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={!hasPrevious || loading}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 disabled:opacity-40"
        >
          Previous
        </button>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Page {currentPage} of {totalPages}
        </p>
        <button
          onClick={() => setPage((prev) => (pagination ? Math.min(totalPages, prev + 1) : prev + 1))}
          disabled={!hasNext || loading}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
