import React, { useEffect, useState, useCallback } from "react";
import { apiService } from "../apiService";
import { useToast } from "../components/ui/Toast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { SlideOver } from "../components/ui/SlideOver";
import { DataTable, Column } from "../components/ui/DataTable";
import { 
  Search, Plus, MoreVertical, Edit2, Trash2,
  UserCog, Shield, ShieldCheck, Users as UsersIcon,
  Mail, Phone, Eye, EyeOff
} from "lucide-react";

interface User {
  id?: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  is_active?: boolean;
  created_at?: string;
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

type RoleFilter = 'all' | 'Super Admin' | 'Admin' | 'Manager' | 'Sales Person';

const roleFilters: { value: RoleFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All Staff', color: 'bg-slate-100 text-slate-700' },
  { value: 'Super Admin', label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
  { value: 'Admin', label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  { value: 'Manager', label: 'Manager', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'Sales Person', label: 'Sales Person', color: 'bg-amber-100 text-amber-700' },
];

const roleOptions = [
  { value: 'Super Admin', label: 'Super Admin', description: 'Full access including user management' },
  { value: 'Admin', label: 'Admin (Worker)', description: 'Orders, invoices, products + view-only customers' },
  { value: 'Sales Person', label: 'Sales Person', description: 'Manage assigned customers and orders' },
];

const initialFormData = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'Admin',
};

export default function Users() {
  const toast = useToast();
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [page, setPage] = useState(1);
  
  // UI state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  // Dropdown state
  const [openDropdownEmail, setOpenDropdownEmail] = useState<string | null>(null);

  const currentUserEmail = (() => {
    try {
      const profile = localStorage.getItem("profile");
      return profile ? JSON.parse(profile).email : null;
    } catch {
      return null;
    }
  })();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, per_page: 10 };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      
      const response = await apiService.getUsers(params);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error('Failed to load users', error.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownEmail(null);
    if (openDropdownEmail !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownEmail]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (slideOverMode === 'add' && !formData.password) errors.password = 'Password is required';
    if (formData.password && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!formData.role) errors.role = 'Role is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedUser(null);
    setSlideOverMode('add');
    setSlideOverOpen(true);
    setShowPassword(false);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || 'Admin',
    });
    setFormErrors({});
    setSlideOverMode('edit');
    setSlideOverOpen(true);
    setOpenDropdownEmail(null);
    setShowPassword(false);
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      if (slideOverMode === 'add') {
        await apiService.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          role: formData.role,
        });
        toast.success('User created', 'New staff member has been added');
      } else {
        const updateData: any = {
          name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
        };
        if (formData.email !== selectedUser?.email) {
          updateData.email = formData.email;
        }
        await apiService.updateUser(selectedUser!.email, updateData);
        toast.success('User updated', 'Staff member details have been updated');
      }
      setSlideOverOpen(false);
      loadUsers();
    } catch (error: any) {
      toast.error('Operation failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setConfirmUser(user);
    setConfirmOpen(true);
    setOpenDropdownEmail(null);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmUser) return;
    
    setConfirmLoading(true);
    try {
      await apiService.deleteUser(confirmUser.email);
      toast.success('User deleted', `${confirmUser.name} has been removed`);
      setConfirmOpen(false);
      loadUsers();
    } catch (error: any) {
      toast.error('Delete failed', error.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      'super admin': 'bg-purple-100 text-purple-700',
      'admin': 'bg-blue-100 text-blue-700',
      'manager': 'bg-emerald-100 text-emerald-700',
      'sales person': 'bg-amber-100 text-amber-700',
    };
    return styles[role.toLowerCase()] || 'bg-slate-100 text-slate-700';
  };

  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'super admin') return ShieldCheck;
    if (roleLower === 'admin') return Shield;
    if (roleLower === 'sales person') return UsersIcon;
    return UserCog;
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (user) => {
        const RoleIcon = getRoleIcon(user.role);
        const isCurrentUser = user.email === currentUserEmail;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getRoleBadge(user.role)}`}>
              <RoleIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900 truncate">{user.name}</p>
                {isCurrentUser && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">You</span>
                )}
              </div>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (user) => (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {user.phone || '-'}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
          {user.role}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Added',
      render: (user) => (
        <span className="text-sm text-slate-500">
          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-12',
      render: (user) => {
        const isCurrentUser = user.email === currentUserEmail;
        return (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownEmail(openDropdownEmail === user.email ? null : user.email);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              data-testid={`user-menu-${user.email}`}
            >
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button>
            
            {openDropdownEmail === user.email && (
              <div 
                className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50"
                data-testid={`user-dropdown-${user.email}`}
              >
                <button
                  onClick={() => handleEditUser(user)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  data-testid={`edit-user-${user.email}`}
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                {!isCurrentUser && (
                  <>
                    <div className="h-px bg-slate-200 my-1" />
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      data-testid={`delete-user-${user.email}`}
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 lg:p-8" data-testid="users-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="users-title">
            Staff Management
          </h1>
          <p className="text-slate-500 mt-1">Manage admins, managers and sales persons</p>
        </div>
        <button
          onClick={handleAddUser}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
          data-testid="add-user-btn"
        >
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 space-y-4" data-testid="users-filters">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              data-testid="search-input"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2" data-testid="role-filters">
          {roleFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => { setRoleFilter(filter.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                roleFilter === filter.value
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : `${filter.color} hover:opacity-80`
              }`}
              data-testid={`filter-${filter.value.toLowerCase().replace(' ', '-')}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        emptyIcon={<UserCog className="w-8 h-8 text-slate-400" />}
        emptyTitle="No staff found"
        emptyMessage={search || roleFilter !== 'all' ? "Try adjusting your filters" : "Add your first staff member"}
        rowKey={(user) => user.email}
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
        title={slideOverMode === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}
        subtitle={slideOverMode === 'add' ? 'Create a new staff account' : `Editing ${selectedUser?.name}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSlideOverOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              data-testid="cancel-user-btn"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-50 transition-all"
              data-testid="save-user-btn"
            >
              {saving ? 'Saving...' : (slideOverMode === 'add' ? 'Create Staff' : 'Save Changes')}
            </button>
          </div>
        }
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.name ? 'border-red-300' : 'border-slate-200'}`}
                placeholder="Enter full name"
                data-testid="input-name"
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.email ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Enter email address"
                  data-testid="input-email"
                />
              </div>
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>
            
            {slideOverMode === 'add' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-2.5 pr-12 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${formErrors.password ? 'border-red-300' : 'border-slate-200'}`}
                    placeholder="Enter password (min 6 characters)"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Enter phone number"
                  data-testid="input-phone"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Role *</label>
            <div className="space-y-2">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.role === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid={`role-option-${option.value.toLowerCase().replace(' ', '-')}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={formData.role === option.value}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium text-slate-900">{option.label}</p>
                    <p className="text-sm text-slate-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
          </div>
        </form>
      </SlideOver>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={confirmLoading}
        title="Delete Staff Member"
        message={`Are you sure you want to delete "${confirmUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
