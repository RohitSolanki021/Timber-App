import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../apiService';
import { ArrowLeft, LogOut, User, Mail, Phone } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem('sales_profile') || '{}');

  const handleLogout = async () => {
    await apiService.logout();
    navigate('/login');
  };

  return (
    <div className="p-5 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {profile.name?.charAt(0)?.toUpperCase() || 'S'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name || 'Sales Person'}</h2>
            <p className="text-sm text-slate-500">{profile.role || 'Sales Person'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Mail className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-semibold text-slate-800">{profile.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Phone className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-semibold text-slate-800">{profile.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        data-testid="logout-btn"
        className="w-full py-4 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}
