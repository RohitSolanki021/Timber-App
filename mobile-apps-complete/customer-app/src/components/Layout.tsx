import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { apiService } from '../apiService';

export default function Layout() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const profile = JSON.parse(localStorage.getItem('customer_profile') || '{}');

  const handleLogout = async () => {
    await apiService.logout();
    localStorage.removeItem('customer_profile');
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'HOME' },
    { to: '/products', icon: Package, label: 'PRODUCTS' },
    { to: '/cart', icon: ShoppingCart, label: 'ORDER', badge: cartCount },
    { to: '/orders', icon: ClipboardList, label: 'HISTORY' },
    { to: '/profile', icon: User, label: 'PROFILE' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Natural Plylam</h1>
            <p className="text-xs text-emerald-100">Customer Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-3 py-1.5 rounded-lg">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                {profile.name || profile.business_name || 'Customer'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50 safe-area-inset-bottom">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors relative ${
                  isActive 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
