import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { CustomerDetail } from "../apiService";
import { useToast } from "../components/ui/Toast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { 
  ArrowLeft, Building2, User, Mail, Phone, MapPin, 
  FileText, ClipboardList, Edit2, Power, Archive, Trash2,
  CheckCircle2, XCircle, Calendar, CreditCard, Hash
} from "lucide-react";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await apiProxy.getCustomer(Number(id));
        setCustomer(data);
      } catch (error: any) {
        toast.error('Failed to load customer', error.message);
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id, navigate, toast]);

  const handleAction = async () => {
    if (!customer) return;
    
    setConfirmLoading(true);
    try {
      switch (confirmAction) {
        case 'approve':
          await apiProxy.approveCustomer(customer.id);
          toast.success('Customer approved');
          break;
        case 'reject':
          await apiProxy.rejectCustomer(customer.id);
          toast.success('Customer rejected');
          break;
        case 'activate':
          await apiProxy.toggleCustomerStatus(customer.id, true);
          toast.success('Customer activated');
          break;
        case 'deactivate':
          await apiProxy.toggleCustomerStatus(customer.id, false);
          toast.success('Customer deactivated');
          break;
        case 'archive':
          await apiProxy.deleteCustomer(customer.id, false);
          toast.success('Customer archived');
          navigate('/customers');
          return;
        case 'delete':
          await apiProxy.deleteCustomer(customer.id, true);
          toast.success('Customer deleted');
          navigate('/customers');
          return;
      }
      
      // Reload customer data
      const data = await apiProxy.getCustomer(Number(id));
      setCustomer(data);
      setConfirmOpen(false);
    } catch (error: any) {
      toast.error('Operation failed', error.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const getConfirmProps = () => {
    switch (confirmAction) {
      case 'approve': return { title: 'Approve Customer', message: 'Approve this customer to allow them to place orders?', confirmText: 'Approve', variant: 'info' as const };
      case 'reject': return { title: 'Reject Customer', message: 'Reject this customer application?', confirmText: 'Reject', variant: 'danger' as const };
      case 'activate': return { title: 'Activate Customer', message: 'Activate this customer account?', confirmText: 'Activate', variant: 'info' as const };
      case 'deactivate': return { title: 'Deactivate Customer', message: 'Deactivate this customer? They won\'t be able to place orders.', confirmText: 'Deactivate', variant: 'warning' as const };
      case 'archive': return { title: 'Archive Customer', message: 'Archive this customer? This is a soft delete.', confirmText: 'Archive', variant: 'warning' as const };
      case 'delete': return { title: 'Delete Customer', message: 'Permanently delete this customer? This cannot be undone.', confirmText: 'Delete', variant: 'danger' as const };
      default: return { title: '', message: '', confirmText: '', variant: 'info' as const };
    }
  };

  const getStatusBadge = () => {
    if (!customer) return null;
    if (customer.approval_status === 'Archived') return <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-200 text-slate-600">Archived</span>;
    if (customer.approval_status === 'Rejected') return <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700">Rejected</span>;
    if (customer.approval_status === 'Pending') return <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700">Pending Approval</span>;
    if (customer.is_active === false) return <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-500">Inactive</span>;
    return <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">Active</span>;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]" data-testid="customer-loading">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center" data-testid="customer-not-found">
        <p className="text-slate-500">Customer not found</p>
        <Link to="/customers" className="text-primary hover:underline mt-2 inline-block">Back to Customers</Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8" data-testid="customer-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{customer.name}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-slate-500 mt-1">Customer ID: #{customer.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/customers?edit=${customer.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            data-testid="edit-btn"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="company-info">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Company Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Company Name</p>
                <p className="text-slate-900 font-medium">{customer.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">GST Number</p>
                <p className="text-slate-900 font-medium">{customer.gst_number || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Contact Person</p>
                <p className="text-slate-900 font-medium">{customer.contactPerson || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Sales Person</p>
                <p className="text-slate-900 font-medium">{customer.sales_person_name || '-'}</p>
              </div>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="contact-info">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Contact Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-slate-900 font-medium">{customer.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</p>
                  <p className="text-slate-900 font-medium">{customer.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</p>
                  <p className="text-slate-900 font-medium">
                    {customer.address || '-'}
                    {customer.city && <>, {customer.city}</>}
                    {customer.state && <>, {customer.state}</>}
                    {customer.pincode && <> - {customer.pincode}</>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="recent-orders">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Recent Orders</h2>
              </div>
              <span className="text-sm text-slate-500">{customer.total_orders || 0} orders</span>
            </div>
            {customer.orders && customer.orders.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {customer.orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    to={`/order/${order.id}`}
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{order.id}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(order.order_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">₹{Number(order.amount || order.grand_total || 0).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'Dispatched' ? 'bg-cyan-100 text-cyan-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4" data-testid="quick-stats">
            <h2 className="font-semibold text-slate-900">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm text-slate-600">Outstanding</span>
                </div>
                <span className="font-semibold text-slate-900">₹{Number(customer.outstanding_balance || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600">Credit Limit</span>
                </div>
                <span className="font-semibold text-slate-900">₹{Number(customer.credit_limit || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Hash className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-slate-600">Pricing Tier</span>
                </div>
                <span className="font-semibold text-primary">Tier {customer.pricing_type || 1}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-600">Total Orders</span>
                </div>
                <span className="font-semibold text-slate-900">{customer.total_orders || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-slate-600">Total Invoices</span>
                </div>
                <span className="font-semibold text-slate-900">{customer.total_invoices || 0}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="notes">
              <h2 className="font-semibold text-slate-900 mb-3">Notes</h2>
              <p className="text-sm text-slate-600">{customer.notes}</p>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3" data-testid="dates">
            <h2 className="font-semibold text-slate-900 mb-3">Timeline</h2>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Created:</span>
              <span className="text-slate-900">
                {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Updated:</span>
              <span className="text-slate-900">
                {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3" data-testid="actions">
            <h2 className="font-semibold text-slate-900 mb-3">Actions</h2>
            
            {customer.approval_status === 'Pending' && (
              <>
                <button
                  onClick={() => { setConfirmAction('approve'); setConfirmOpen(true); }}
                  className="w-full py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                  data-testid="approve-btn"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Customer
                </button>
                <button
                  onClick={() => { setConfirmAction('reject'); setConfirmOpen(true); }}
                  className="w-full py-2.5 text-sm font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  data-testid="reject-btn"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            
            {customer.approval_status === 'Approved' && (
              <button
                onClick={() => { setConfirmAction(customer.is_active ? 'deactivate' : 'activate'); setConfirmOpen(true); }}
                className={`w-full py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  customer.is_active 
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
                data-testid="toggle-btn"
              >
                <Power className="w-4 h-4" /> {customer.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
            
            {customer.approval_status !== 'Archived' && (
              <button
                onClick={() => { setConfirmAction('archive'); setConfirmOpen(true); }}
                className="w-full py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                data-testid="archive-btn"
              >
                <Archive className="w-4 h-4" /> Archive
              </button>
            )}
            
            <button
              onClick={() => { setConfirmAction('delete'); setConfirmOpen(true); }}
              className="w-full py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              data-testid="delete-btn"
            >
              <Trash2 className="w-4 h-4" /> Delete Permanently
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleAction}
        loading={confirmLoading}
        {...getConfirmProps()}
      />
    </div>
  );
}
