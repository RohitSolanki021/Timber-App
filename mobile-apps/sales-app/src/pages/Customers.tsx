import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../apiService';
import { Search, UserPlus, ChevronRight, Loader2, Users, CheckCircle, Clock, Ban } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface Customer {
  id: number;
  name: string;
  business_name?: string;
  email: string;
  phone: string;
  approval_status: string;
  pricing_type: number;
  outstanding_balance?: number;
  address?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setSelectedCustomer, selectedCustomer } = useCart();

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await apiService.getCustomers({ search, status: filter });
        setCustomers(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [search, filter]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    navigate('/products');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Approved' };
      case 'Pending':
        return { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' };
      case 'Rejected':
        return { icon: Ban, color: 'bg-red-100 text-red-700', label: 'Rejected' };
      default:
        return { icon: Clock, color: 'bg-slate-100 text-slate-700', label: status };
    }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
  ];

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">My Customers</h1>
        <Link
          to="/customers/add"
          data-testid="add-customer-link"
          className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
        >
          <UserPlus className="w-5 h-5" />
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="customer-search"
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-300 hover:border-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No customers found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
          <Link
            to="/customers/add"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => {
            const status = getStatusBadge(customer.approval_status);
            const isSelected = selectedCustomer?.id === customer.id;
            
            return (
              <div
                key={customer.id}
                className={`bg-white p-4 rounded-2xl border shadow-sm transition-all ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-slate-600">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 truncate">{customer.name}</h3>
                        <p className="text-sm text-slate-600">{customer.phone}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${status.color}`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          Tier {customer.pricing_type}
                        </span>
                        {(customer.outstanding_balance || 0) > 0 && (
                          <span className="text-xs font-semibold text-red-600">
                            Due: ₹{customer.outstanding_balance?.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      {customer.approval_status === 'Approved' && (
                        <button
                          onClick={() => handleSelectCustomer(customer)}
                          data-testid={`select-customer-${customer.id}`}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
