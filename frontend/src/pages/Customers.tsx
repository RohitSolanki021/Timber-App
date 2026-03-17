import React, { useEffect, useState } from "react";
import { apiProxy } from "../apiProxy";
import { Customer, Pagination } from "../types";
import { CheckCircle2, Search, Users, ChevronLeft, ChevronRight, Mail, Phone, User } from "lucide-react";

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
    const timer = setTimeout(loadCustomers, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

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

  return (
    <div className="p-6 lg:p-8" data-testid="customers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="customers-title">
            Customers
          </h1>
          <p className="text-slate-500 mt-1">Manage and approve customer accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
            {pagination?.total || customers.length} total customers
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6" data-testid="customers-filters">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or status..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            data-testid="search-input"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20" data-testid="loading-state">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading customers...</p>
          </div>
        </div>
      )}

      {/* Customers Table - Desktop */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="customers-table">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pricing Tier</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleCustomers.map((customer) => {
                  const status = customer.status || customer.approval_status || "Pending";
                  const approved = ["approved", "active"].includes(String(status).toLowerCase());

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors" data-testid={`customer-row-${customer.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{customer.name}</p>
                            <p className="text-sm text-slate-500">{customer.contactPerson || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {customer.email || "-"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {customer.phone || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          ₹{Number(customer.outstandingBalance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                          Tier {customer.pricing_type || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!approved && (
                          <button
                            onClick={() => approveCustomer(customer.id)}
                            disabled={processingId === customer.id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                            data-testid={`approve-btn-${customer.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {processingId === customer.id ? "Approving..." : "Approve"}
                          </button>
                        )}
                        {approved && (
                          <span className="text-emerald-600 text-sm font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {visibleCustomers.map((customer) => {
              const status = customer.status || customer.approval_status || "Pending";
              const approved = ["approved", "active"].includes(String(status).toLowerCase());

              return (
                <div key={customer.id} className="p-4 space-y-4" data-testid={`customer-card-${customer.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.email || "No email"}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Contact</p>
                      <p className="font-medium text-slate-900">{customer.contactPerson || "-"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">{customer.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Outstanding</p>
                      <p className="font-semibold text-slate-900">₹{Number(customer.outstandingBalance || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Pricing Tier</p>
                      <p className="font-medium text-slate-900">Tier {customer.pricing_type || 1}</p>
                    </div>
                  </div>

                  {!approved && (
                    <button
                      onClick={() => approveCustomer(customer.id)}
                      disabled={processingId === customer.id}
                      className="w-full py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                      data-testid={`approve-btn-mobile-${customer.id}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {processingId === customer.id ? "Approving..." : "Approve Customer"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {visibleCustomers.length === 0 && !loading && (
            <div className="py-20 text-center" data-testid="empty-state">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-900 font-medium">No customers found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && visibleCustomers.length > 0 && (
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
