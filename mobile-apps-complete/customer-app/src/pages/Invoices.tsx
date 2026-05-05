import React, { useEffect, useState } from 'react';
import { apiService } from '../apiService';
import { Loader2, FileText, ChevronRight } from 'lucide-react';

interface Invoice {
  id: string;
  order_id: string;
  customerName: string;
  issue_date: string;
  due_date: string;
  grand_total: number;
  status: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await apiService.getInvoices({ status: filter });
        setInvoices(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filters = ['', 'Pending', 'Paid', 'Overdue'];

  return (
    <div className="p-5 space-y-5 pb-24">
      <h1 className="text-xl font-bold text-slate-900">Invoices</h1>

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
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">{invoice.id}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{invoice.customerName}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Due: {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-lg font-bold text-slate-900">₹{invoice.grand_total.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
