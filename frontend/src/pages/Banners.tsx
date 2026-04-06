import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Image, Link, Eye, EyeOff, 
  GripVertical, Loader2, X, Save, ArrowUp, ArrowDown,
  AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface BannerForm {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
}

const initialForm: BannerForm = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  is_active: true,
  display_order: 0
};

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('token');

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/banners`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAddModal = () => {
    setEditingBanner(null);
    setForm({
      ...initialForm,
      display_order: banners.length + 1
    });
    setShowModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      description: banner.description,
      image_url: banner.image_url,
      link_url: banner.link_url,
      is_active: banner.is_active,
      display_order: banner.display_order
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setForm(initialForm);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.title || !form.image_url) {
      setError('Title and Image URL are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingBanner 
        ? `${API_BASE}/admin/banners/${editingBanner.id}`
        : `${API_BASE}/admin/banners`;
      
      const res = await fetch(url, {
        method: editingBanner ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        throw new Error('Failed to save banner');
      }

      await fetchBanners();
      closeModal();
    } catch (err) {
      setError('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await fetch(`${API_BASE}/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      await fetchBanners();
    } catch (err) {
      setError('Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await fetch(`${API_BASE}/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !banner.is_active })
      });
      await fetchBanners();
    } catch (err) {
      setError('Failed to update banner');
    }
  };

  const handleMoveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const targetBanner = banners[targetIndex];
    
    try {
      // Swap display orders
      await Promise.all([
        fetch(`${API_BASE}/admin/banners/${banner.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ display_order: targetBanner.display_order })
        }),
        fetch(`${API_BASE}/admin/banners/${targetBanner.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ display_order: banner.display_order })
        })
      ]);
      await fetchBanners();
    } catch (err) {
      setError('Failed to reorder banners');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Banner Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage promotional banners displayed on customer dashboard
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Banner
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Banners List */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No banners yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Add promotional banners to display on the customer dashboard
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-white rounded-2xl border ${banner.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'} overflow-hidden`}
            >
              <div className="flex items-stretch">
                {/* Order Controls */}
                <div className="flex flex-col items-center justify-center px-3 bg-slate-50 border-r border-slate-200">
                  <button
                    onClick={() => handleMoveOrder(banner, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-500 my-1">{index + 1}</span>
                  <button
                    onClick={() => handleMoveOrder(banner, 'down')}
                    disabled={index === banners.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Banner Image */}
                <div className="w-48 h-32 flex-shrink-0 bg-slate-100">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Banner';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Banner Info */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{banner.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {banner.description || 'No description'}
                      </p>
                      {banner.link_url && (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                        >
                          <Link className="w-3 h-3" />
                          {banner.link_url.substring(0, 40)}...
                        </a>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      banner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 border-l border-slate-100">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`p-2 rounded-lg transition-colors ${
                      banner.is_active 
                        ? 'text-amber-600 hover:bg-amber-50' 
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={banner.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {banner.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => openEditModal(banner)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button
                onClick={closeModal}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Preview */}
              {form.image_url && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Invalid+URL';
                    }}
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Summer Sale 2026"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Get up to 20% off on all plywood products"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://example.com/banner.jpg"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Recommended size: 1200x400 pixels
                </p>
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Link URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://example.com/promo"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-900">Active</p>
                  <p className="text-sm text-slate-500">Show this banner to customers</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    form.is_active ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    form.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingBanner ? 'Save Changes' : 'Create Banner'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
