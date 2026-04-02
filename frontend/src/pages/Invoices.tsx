import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Invoice, Pagination } from "../types";
import { FileText, ChevronRight, ChevronLeft, Search, Calendar, CheckCircle2, Clock, Package, TreePine } from "lucide-react";
import { apiProxy } from "../apiProxy";

const INVOICES_PER_PAGE = 10;

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { 
          page: String(page), 
          per_page: String(INVOICES_PER_PAGE) 
        };
        if (typeFilter !== 'all') params.order_type = typeFilter;
        if (statusFilter !== 'All') params.status = statusFilter;
        
        const response = await apiProxy.getInvoices(params);
        setInvoices(response.data);
        setPagination(response.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [page, typeFilter, statusFilter]);

  const currentPage = pagination?.page ?? page;
  const totalPages = Math.max(1, pagination?.total_pages ?? page);
  const hasPrevious = currentPage > 1;
  const hasNext = pagination ? currentPage < totalPages : invoices.length === INVOICES_PER_PAGE;
  
  const normalizedSearch = searchTerm.trim().toLowerCase();
  let visibleInvoices = normalizedSearch
    ? invoices.filter((invoice) =>
        invoice.id.toLowerCase().includes(normalizedSearch) ||
        invoice.order_id.toLowerCase().includes(normalizedSearch) ||
        invoice.customerName?.toLowerCase().includes(normalizedSearch)
      )
    : invoices;

  const statuses = ["All", "Paid", "Pending"];
  const orderTypes = [
    { value: 'all', label: 'All Types', icon: FileText },
    { value: 'Plywood', label: 'Plywood', icon: Package },
    { value: 'Timber', label: 'Timber', icon: TreePine }
  ];

  const getTypeBadge = (type: string | undefined) => {
    if (type === 'Plywood') return 'bg-orange-100 text-orange-700';
    if (type === 'Timber') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8" data-testid="invoices-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="invoices-title">
            Invoices
          </h1>
          <p className="text-slate-500 mt-1">Manage and track all invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
            {pagination?.total || invoices.length} total invoices
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-4" data-testid="invoices-filters">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice ID, Order ID, or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              data-testid="search-input"
            />
          </div>
          
          {/* Type Filter */}
          <div className="flex gap-2">
            {orderTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => { setTypeFilter(type.value); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  typeFilter === type.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                data-testid={`filter-type-${type.value}`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2" data-testid="status-filters">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid={`filter-${status.toLowerCase()}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20" data-testid="loading-state">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading invoices...</p>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="invoices-table">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer" 
                    data-testid={`invoice-row-${invoice.id}`}
                    onClick={() => window.location.href = `/invoice/${invoice.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          invoice.order_type === 'Plywood' ? 'bg-orange-50' : invoice.order_type === 'Timber' ? 'bg-emerald-50' : 'bg-slate-50'
                        }`}>
                          {invoice.order_type === 'Plywood' ? (
                            <Package className="w-5 h-5 text-orange-600" />
                          ) : invoice.order_type === 'Timber' ? (
                            <TreePine className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <span className="font-medium text-slate-900">{invoice.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{invoice.customerName || "Customer"}</p>
                      <p className="text-xs text-slate-500">{invoice.order_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(invoice.order_type)}`}>
                        {invoice.order_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(invoice.issue_date).toLocaleDateString('en-IN', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        ₹{Number(invoice.grand_total).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'Paid' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {invoice.status === 'Paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/invoice/${invoice.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        data-testid={`view-invoice-${invoice.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {visibleInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoice/${invoice.id}`}
                className="block p-4 hover:bg-slate-50 transition-colors"
                data-testid={`invoice-card-${invoice.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      invoice.status === 'Paid' ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        invoice.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{invoice.id}</p>
                      <p className="text-sm text-slate-500">{invoice.customerName || "Customer"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'Paid' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {invoice.status === 'Paid' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-slate-500">
                    Order: {invoice.order_id}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      ₹{Number(invoice.grand_total).toLocaleString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {visibleInvoices.length === 0 && !loading && (
            <div className="py-20 text-center" data-testid="empty-state">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-900 font-medium">No invoices found</p>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm || statusFilter !== "All" 
                  ? "Try adjusting your search or filter criteria"
                  : "Invoices will appear here when orders are invoiced"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && visibleInvoices.length > 0 && (
        <div className="flex items-center justify-between mt-6" data-testid="pagination">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!hasPrevious || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <p className="text-sm text-slate-600">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </p>
          <button
            onClick={() => setPage((prev) => (pagination ? Math.min(totalPages, prev + 1) : prev + 1))}
            disabled={!hasNext || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="next-page"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
