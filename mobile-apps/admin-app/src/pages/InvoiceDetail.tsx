import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Invoice, Order } from "../types";
import { useToast } from "../components/ui/Toast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { 
  ArrowLeft, Share2, CheckCircle2, Clock, AlertCircle, 
  XCircle, Edit2, Calendar, Building2, FileText
} from "lucide-react";

const invoiceStatuses = [
  { value: 'Pending', label: 'Pending', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Clock },
  { value: 'Paid', label: 'Paid', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: CheckCircle2 },
  { value: 'Overdue', label: 'Overdue', color: 'bg-red-50 border-red-200 text-red-700', icon: AlertCircle },
  { value: 'Partially Paid', label: 'Partially Paid', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Clock },
  { value: 'Cancelled', label: 'Cancelled', color: 'bg-slate-50 border-slate-200 text-slate-500', icon: XCircle },
];

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const inv = await apiProxy.getInvoice(id!);
        setInvoice(inv);
        setSelectedStatus(inv.status);
        // V2 invoices have items embedded, order is optional for reference
        if (inv.order_id) {
          try {
            const ord = await apiProxy.getOrder(inv.order_id);
            setOrder(ord);
          } catch {
            // Order may not exist, continue with invoice-only data
            console.log('Order not found, using invoice items');
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, toast]);

  const handleStatusUpdate = async () => {
    if (!invoice || selectedStatus === invoice.status) {
      setStatusModalOpen(false);
      return;
    }
    
    setUpdating(true);
    try {
      await apiProxy.updateInvoice(invoice.id, { status: selectedStatus });
      const refreshed = await apiProxy.getInvoice(invoice.id);
      setInvoice(refreshed);
      toast.success('Invoice updated', `Status changed to ${selectedStatus}`);
      setStatusModalOpen(false);
    } catch (error: any) {
      toast.error('Update failed', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice || !order) return;
    const jsPDF = (await import('jspdf')).jsPDF;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Invoice Receipt`, 10, 15);
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${invoice.id}`, 10, 30);
    doc.text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 10, 40);
    doc.text(`Status: ${invoice.status}`, 10, 50);
    doc.text(`Bill To: ${invoice.customerName || order.customerName || "Customer"}`, 10, 60);
    doc.text(`Items:`, 10, 75);
    let y = 85;
    (order.items || []).forEach((item, idx) => {
      doc.text(
        `${(item.productName || item.name || "Product")} x${item.quantity} @₹${(item.unitPrice ?? item.price ?? 0)} (${item.unit})`,
        15,
        y + idx * 10
      );
    });
    doc.text(`Total: ₹${invoice.grand_total.toLocaleString()}`, 10, y + (order.items || []).length * 10 + 15);
    doc.save(`Invoice_${invoice.id}.pdf`);
    toast.success('PDF Downloaded');
  };

  const getStatusConfig = (status: string) => {
    return invoiceStatuses.find(s => s.value === status) || invoiceStatuses[0];
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]" data-testid="invoice-loading">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading Invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Invoice not found</p>
        <Link to="/invoices" className="text-primary hover:underline mt-2 inline-block">Back to Invoices</Link>
      </div>
    );
  }

  // Use invoice items directly (V2 invoices have embedded items)
  const displayItems = invoice.items || order?.items || [];

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-6 lg:p-8" data-testid="invoice-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoice Details</h1>
            <p className="text-slate-500">{invoice.id}</p>
          </div>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          data-testid="download-pdf-btn"
        >
          <Share2 className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          <div className={`p-6 rounded-2xl border flex items-center justify-between ${statusConfig.color}`} data-testid="status-banner">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Status</p>
              <p className="text-2xl font-bold">{invoice.status}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusIcon className="w-10 h-10" />
              <button
                onClick={() => setStatusModalOpen(true)}
                className="p-2 bg-white/50 hover:bg-white rounded-lg transition-colors"
                data-testid="edit-status-btn"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="invoice-card">
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Invoice Number</p>
                  <p className="text-lg font-bold text-slate-900">{invoice.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Issue Date</p>
                  <p className="font-medium text-slate-900">
                    {new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Customer Info */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bill To</p>
                  <p className="font-bold text-slate-900">{invoice.customerName || order.customerName || "Customer"}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Order Reference */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Order Reference</p>
                <Link 
                  to={`/order/${invoice.order_id}`}
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  {invoice.order_id}
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Items</p>
                <div className="space-y-3">
                  {displayItems.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-900">{item.product_name || item.productName || item.name || "Product"}</p>
                        <p className="text-xs text-slate-500">
                          {item.thickness && `${item.thickness}mm `}
                          {item.size && `× ${item.size} `}
                          · {item.quantity} {item.unit || 'pcs'} × ₹{(item.unit_price ?? item.unitPrice ?? item.price ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-bold text-slate-900">
                        ₹{(item.total_price ?? ((item.unit_price ?? item.unitPrice ?? item.price ?? 0) * item.quantity)).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">₹{Number(invoice.sub_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">CGST</span>
                  <span className="font-medium text-slate-900">₹{Number(invoice.cgst).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">SGST</span>
                  <span className="font-medium text-slate-900">₹{Number(invoice.sgst).toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold text-slate-900">Total Amount</span>
                  <span className="text-2xl font-bold text-slate-900">₹{Number(invoice.grand_total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4" data-testid="quick-info">
            <h2 className="font-semibold text-slate-900">Quick Info</h2>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Due Date</p>
                <p className="font-medium text-slate-900">
                  {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <FileText className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Pricing Tier</p>
                <p className="font-medium text-slate-900">Tier {invoice.pricing_type || 1}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3" data-testid="actions">
            <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
            
            {invoice.status !== 'Paid' && (
              <button
                onClick={() => {
                  setSelectedStatus('Paid');
                  setStatusModalOpen(true);
                }}
                className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                data-testid="mark-paid-btn"
              >
                <CheckCircle2 className="w-5 h-5" /> Mark as Paid
              </button>
            )}

            {invoice.status === 'Pending' && (
              <button
                onClick={() => {
                  setSelectedStatus('Overdue');
                  setStatusModalOpen(true);
                }}
                className="w-full py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                data-testid="mark-overdue-btn"
              >
                <AlertCircle className="w-5 h-5" /> Mark as Overdue
              </button>
            )}

            <button
              onClick={() => setStatusModalOpen(true)}
              className="w-full py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              data-testid="change-status-btn"
            >
              <Edit2 className="w-5 h-5" /> Change Status
            </button>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <ConfirmDialog
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedStatus(invoice.status);
        }}
        onConfirm={handleStatusUpdate}
        loading={updating}
        title="Update Invoice Status"
        message={
          <div className="space-y-4">
            <p className="text-slate-600 mb-4">Select the new status for this invoice:</p>
            <div className="grid grid-cols-1 gap-2">
              {invoiceStatuses.map((status) => {
                const Icon = status.icon;
                return (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedStatus === status.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selectedStatus === status.value ? 'text-primary' : 'text-slate-400'}`} />
                    <span className={`font-medium ${selectedStatus === status.value ? 'text-primary' : 'text-slate-700'}`}>
                      {status.label}
                    </span>
                    {selectedStatus === status.value && (
                      <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        }
        confirmText="Update Status"
        variant="info"
      />
    </div>
  );
}
