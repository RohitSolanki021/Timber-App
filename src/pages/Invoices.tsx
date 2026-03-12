import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Invoice, Pagination } from "../types";
import { FileText, ChevronRight, Search } from "lucide-react";
import { apiProxy } from "../apiProxy";

const INVOICES_PER_PAGE = 8;
export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const response = await apiProxy.getInvoices({ page, per_page: INVOICES_PER_PAGE });
        setInvoices(response.data);
        setPagination(response.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [page]);

  const currentPage = pagination?.page ?? page;
  const totalPages = Math.max(1, pagination?.total_pages ?? page);
  const hasPrevious = currentPage > 1;
  const hasNext = pagination ? currentPage < totalPages : invoices.length === INVOICES_PER_PAGE;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleInvoices = normalizedSearch
    ? invoices.filter((invoice) =>
        invoice.id.toLowerCase().includes(normalizedSearch) ||
        invoice.order_id.toLowerCase().includes(normalizedSearch) ||
        invoice.customerName?.toLowerCase().includes(normalizedSearch)
      )
    : invoices;

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Invoices...</div>;

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Invoice Management</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-xs focus:ring-2 focus:ring-primary/20"
            />
          </div>
      </header>

      <div className="space-y-4">
        {visibleInvoices.map((invoice) => (
          <Link
            key={invoice.id}
            to={`/invoice/${invoice.id}`}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{invoice.id}</h3>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                  invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {new Date(invoice.issue_date).toLocaleDateString()} • Order #{invoice.order_id}
              </p>
              <div className="flex justify-between items-center mt-3">
                <p className="text-lg font-black text-slate-900">₹{invoice.grand_total.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-widest">
                  Details
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </Link>
        ))}

        {visibleInvoices.length === 0 && invoices.length > 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No invoices match your search query.</p>
          </div>
        )}

        {invoices.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No invoices yet</p>
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
