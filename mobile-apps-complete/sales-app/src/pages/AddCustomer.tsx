import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../apiService';
import { ArrowLeft, Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AddCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    business_name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
    pricing_type: '1',
    credit_limit: '25000',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await apiService.createCustomer({
        ...form,
        name: form.business_name,
        pricing_type: parseInt(form.pricing_type),
        credit_limit: parseInt(form.credit_limit),
      });
      setSuccess(true);
      setTimeout(() => navigate('/customers'), 1500);
    } catch (err: any) {
      const msg = err.message || 'Failed to create customer';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.detail || msg);
      } catch {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-4 sticky top-0 z-40">
        <button 
          onClick={() => navigate('/customers')} 
          className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Add Customer</h1>
      </header>

      {/* Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Customer created successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="p-5 space-y-5 pb-32">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Business Details */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Business Details</h2>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name *</label>
              <input
                type="text"
                name="business_name"
                value={form.business_name}
                onChange={handleChange}
                required
                placeholder="ABC Furniture Works"
                data-testid="business-name-input"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                required
                placeholder="John Doe"
                data-testid="contact-person-input"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="john@abc.com"
                  data-testid="email-input"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="9876543210"
                  data-testid="phone-input"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">GST Number</label>
              <input
                type="text"
                name="gst_number"
                value={form.gst_number}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5"
                data-testid="gst-input"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Address</h2>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Street Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                placeholder="123 Industrial Area"
                data-testid="address-input"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  data-testid="city-input"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  data-testid="state-input"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="400001"
                data-testid="pincode-input"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Pricing & Credit</h2>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pricing Tier</label>
              <select
                name="pricing_type"
                value={form.pricing_type}
                onChange={handleChange}
                data-testid="pricing-tier-select"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900"
              >
                <option value="1">Tier 1 (Standard)</option>
                <option value="2">Tier 2 (Dealer)</option>
                <option value="3">Tier 3 (Wholesale)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Credit Limit (₹)</label>
              <input
                type="number"
                name="credit_limit"
                value={form.credit_limit}
                onChange={handleChange}
                placeholder="25000"
                data-testid="credit-limit-input"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-slate-200 px-5 py-4">
          <button
            type="submit"
            disabled={loading}
            data-testid="submit-customer-btn"
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
