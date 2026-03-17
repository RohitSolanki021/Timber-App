import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { Customer, Pagination } from "../types";
import { CustomerFormData } from "../apiService";
import { useToast } from "../components/ui/Toast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { SlideOver } from "../components/ui/SlideOver";
import { DataTable, Column } from "../components/ui/DataTable";
import { 
  Search, Users, Plus, Filter, MoreVertical, 
  Eye, Edit2, Trash2, CheckCircle2, XCircle, 
  Power, Archive, Mail, Phone, User, Building2, MapPin
} from "lucide-react";

const CUSTOMERS_PER_PAGE = 10;

type StatusFilter = 'all' | 'active' | 'inactive' | 'pending' | 'archived' | 'rejected';

const statusFilters: { value: StatusFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-slate-100 text-slate-700' },
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  { value: 'inactive', label: 'Inactive', color: 'bg-slate-100 text-slate-500' },
  { value: 'archived', label: 'Archived', color: 'bg-red-100 text-red-700' },
];

const initialFormData: CustomerFormData = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  gst_number: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  pricing_type: 1,
  credit_limit: 0,
  notes: '',
  approval_status: 'Approved',
  is_active: true,
};

export default function Customers() {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Check if user is Super Admin
  const isSuperAdmin = (() => {
    try {
      const profile = localStorage.getItem("profile");
      return profile ? JSON.parse(profile).role?.toLowerCase() === 'super admin' : false;
    } catch {
      return false;
    }
  })();
  
  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; customer: Customer | null }>({ type: '', customer: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { 
        page, 
        per_page: CUSTOMERS_PER_PAGE,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await apiProxy.getCustomers(params);
      setCustomers(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error('Failed to load customers', error.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortOrder, toast]);

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 300);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Company name is required';
    if (!formData.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) errors.phone = 'Phone must be 10 digits';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCustomer = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedCustomer(null);
    setSlideOverMode('add');
    setSlideOverOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    navigate(`/customer/${customer.id}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      gst_number: customer.gst_number || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      pricing_type: customer.pricing_type || 1,
      credit_limit: customer.credit_limit || 0,
      notes: customer.notes || '',
      approval_status: customer.approval_status || 'Approved',
      is_active: customer.is_active !== false,
    });
    setFormErrors({});
    setSlideOverMode('edit');
    setSlideOverOpen(true);
    setOpenDropdownId(null);
  };

  const handleSaveCustomer = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      if (slideOverMode === 'add') {
        await apiProxy.createCustomer(formData);
        toast.success('Customer created', 'New customer has been added successfully');
      } else {
        await apiProxy.updateCustomer(selectedCustomer!.id, formData);
        toast.success('Customer updated', 'Customer details have been updated');
      }
      setSlideOverOpen(false);
      loadCustomers();
    } catch (error: any) {
      toast.error('Operation failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (customer: Customer) => {
    try {
      await apiProxy.approveCustomer(customer.id);
      toast.success('Customer approved', `${customer.name} has been approved`);
      loadCustomers();
    } catch (error: any) {
      toast.error('Failed to approve', error.message);
    }
    setOpenDropdownId(null);
  };

  const handleReject = (customer: Customer) => {
    setConfirmAction({ type: 'reject', customer });
    setConfirmOpen(true);
    setOpenDropdownId(null);
  };

  const handleToggleStatus = (customer: Customer) => {
    const action = customer.is_active ? 'deactivate' : 'activate';
    setConfirmAction({ type: action, customer });
    setConfirmOpen(true);
    setOpenDropdownId(null);
  };

  const handleArchive = (customer: Customer) => {
    setConfirmAction({ type: 'archive', customer });
    setConfirmOpen(true);
    setOpenDropdownId(null);
  };

  const handleDelete = (customer: Customer) => {
    setConfirmAction({ type: 'delete', customer });
    setConfirmOpen(true);
    setOpenDropdownId(null);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction.customer) return;
    
    setConfirmLoading(true);
    try {
      const { type, customer } = confirmAction;
      
      switch (type) {
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
          break;
        case 'delete':
          await apiProxy.deleteCustomer(customer.id, true);
          toast.success('Customer deleted');
          break;
      }
      
      setConfirmOpen(false);
      loadCustomers();
    } catch (error: any) {
      toast.error('Operation failed', error.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getStatusBadge = (customer: Customer) => {
    if (customer.approval_status === 'Archived') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-600">Archived</span>;
    }
    if (customer.approval_status === 'Rejected') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
    }
    if (customer.approval_status === 'Pending') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
    }
    if (customer.is_active === false) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Inactive</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>;
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{customer.name}</p>
            <p className="text-sm text-slate-500 truncate">{customer.contactPerson || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      sortable: true,
      render: (customer) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{customer.email || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {customer.phone || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'outstanding_balance',
      header: 'Outstanding',
      sortable: true,
      render: (customer) => (
        <span className="font-semibold text-slate-900">
          ₹{Number(customer.outstanding_balance || customer.outstandingBalance || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'pricing_type',
      header: 'Tier',
      sortable: true,
      render: (customer) => (
        <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
          Tier {customer.pricing_type || 1}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (customer) => getStatusBadge(customer),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-12',
      render: (customer) => (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === customer.id ? null : customer.id);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid={`customer-menu-${customer.id}`}
          >
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>
          
          {openDropdownId === customer.id && (
            <div 
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50"
              data-testid={`customer-dropdown-${customer.id}`}
            >
              <button
                onClick={() => handleViewCustomer(customer)}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                data-testid={`view-customer-${customer.id}`}
              >
                <Eye className="w-4 h-4" /> View Details
              </button>
              
              {/* Super Admin only actions */}
              {isSuperAdmin && (
                <>
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    data-testid={`edit-customer-${customer.id}`}
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  
                  <div className="h-px bg-slate-200 my-1" />
                  
                  {customer.approval_status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(customer)}
                        className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                        data-testid={`approve-customer-${customer.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(customer)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        data-testid={`reject-customer-${customer.id}`}
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  
                  {customer.approval_status === 'Approved' && (
                    <button
                      onClick={() => handleToggleStatus(customer)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        customer.is_active 
                          ? 'text-amber-600 hover:bg-amber-50' 
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      data-testid={`toggle-customer-${customer.id}`}
                    >
                      <Power className="w-4 h-4" /> 
                      {customer.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  
                  <div className="h-px bg-slate-200 my-1" />
                  
                  {customer.approval_status !== 'Archived' && (
                    <button
                      onClick={() => handleArchive(customer)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      data-testid={`archive-customer-${customer.id}`}
                    >
                      <Archive className="w-4 h-4" /> Archive
                    </button>
                  )}
              
                  <button
                    onClick={() => handleDelete(customer)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    data-testid={`delete-customer-${customer.id}`}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const getConfirmDialogProps = () => {
    const { type, customer } = confirmAction;
    switch (type) {
      case 'reject':
        return {
          title: 'Reject Customer',
          message: `Are you sure you want to reject ${customer?.name}? They will not be able to place orders.`,
          confirmText: 'Reject',
          variant: 'danger' as const,
        };
      case 'activate':
        return {
          title: 'Activate Customer',
          message: `Are you sure you want to activate ${customer?.name}? They will be able to place orders again.`,
          confirmText: 'Activate',
          variant: 'info' as const,
        };
      case 'deactivate':
        return {
          title: 'Deactivate Customer',
          message: `Are you sure you want to deactivate ${customer?.name}? They will not be able to place new orders.`,
          confirmText: 'Deactivate',
          variant: 'warning' as const,
        };
      case 'archive':
        return {
          title: 'Archive Customer',
          message: `Are you sure you want to archive ${customer?.name}? This is a soft delete and can be reversed.`,
          confirmText: 'Archive',
          variant: 'warning' as const,
        };
      case 'delete':
        return {
          title: 'Delete Customer',
          message: `Are you sure you want to permanently delete ${customer?.name}? This action cannot be undone. Customers with orders cannot be deleted.`,
          confirmText: 'Delete',
          variant: 'danger' as const,
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'Are you sure?',
          confirmText: 'Confirm',
          variant: 'info' as const,
        };
    }
  };

  return (
    <div className="p-6 lg:p-8" data-testid="customers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="customers-title">
            Customers
          </h1>
          <p className="text-slate-500 mt-1">
            {isSuperAdmin ? 'Manage customer accounts and approvals' : 'View customer accounts'}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={handleAddCustomer}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            data-testid="add-customer-btn"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-4" data-testid="customers-filters">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, phone, GST..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              data-testid="search-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 mr-2">Status:</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2" data-testid="status-filters">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => { setStatusFilter(filter.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === filter.value
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : `${filter.color} hover:opacity-80`
              }`}
              data-testid={`filter-${filter.value}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={customers}
        columns={columns}
        loading={loading}
        emptyIcon={<Users className="w-8 h-8 text-slate-400" />}
        emptyTitle="No customers found"
        emptyMessage={search || statusFilter !== 'all' ? "Try adjusting your filters" : "Add your first customer to get started"}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={handleViewCustomer}
        rowKey={(customer) => customer.id}
        pagination={pagination ? {
          page: pagination.page,
          perPage: pagination.per_page,
          total: pagination.total,
          totalPages: pagination.total_pages,
          onPageChange: setPage,
        } : undefined}
      />

      {/* Add/Edit SlideOver */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title={slideOverMode === 'add' ? 'Add Customer' : 'Edit Customer'}
        subtitle={slideOverMode === 'add' ? 'Create a new customer account' : `Editing ${selectedCustomer?.name}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSlideOverOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              data-testid="cancel-customer-btn"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustomer}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-50 transition-all"
              data-testid="save-customer-btn"
            >
              {saving ? 'Saving...' : (slideOverMode === 'add' ? 'Create Customer' : 'Save Changes')}
            </button>
          </div>
        }
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveCustomer(); }}>
          {/* Company Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Company Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.name ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Enter company name"
                  data-testid="input-name"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                <input
                  type="text"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g. 27AABCU9603R1ZM"
                  data-testid="input-gst"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.contactPerson ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Enter contact person name"
                  data-testid="input-contact"
                />
                {formErrors.contactPerson && <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.phone ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Enter phone number"
                  data-testid="input-phone"
                />
                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.email ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Enter email address"
                  data-testid="input-email"
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Address
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Enter street address"
                  data-testid="input-address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="City"
                    data-testid="input-city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="State"
                    data-testid="input-state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Pincode"
                    data-testid="input-pincode"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Business Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pricing Tier</label>
                <select
                  value={formData.pricing_type}
                  onChange={(e) => setFormData({ ...formData, pricing_type: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  data-testid="input-pricing"
                >
                  <option value={1}>Tier 1 (Standard)</option>
                  <option value={2}>Tier 2 (Wholesale)</option>
                  <option value={3}>Tier 3 (Premium)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Enter credit limit"
                  min="0"
                  data-testid="input-credit"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              placeholder="Add any notes about this customer..."
              data-testid="input-notes"
            />
          </div>

          {/* Status (for edit mode) */}
          {slideOverMode === 'edit' && (
            <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                  data-testid="input-active"
                />
                <span className="text-sm font-medium text-slate-700">Active Customer</span>
              </label>
            </div>
          )}
        </form>
      </SlideOver>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeConfirmAction}
        loading={confirmLoading}
        {...getConfirmDialogProps()}
      />
    </div>
  );
}
