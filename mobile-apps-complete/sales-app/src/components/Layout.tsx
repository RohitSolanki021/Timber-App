import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Package, ShoppingCart, ClipboardList, FileText, User, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { apiService } from '../apiService';

export default function Layout() {
  const navigate = useNavigate();
  const { cartItems, selectedCustomer } = useCart();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const profile = JSON.parse(localStorage.getItem('sales_profile') || '{}');

  const handleLogout = async () => {
    await apiService.logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
    { to: '/orders', icon: ClipboardList, label: 'Orders' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-5 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Natural Plylam</h1>
            <p className="text-xs text-slate-500">Sales Portal</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedCustomer && (
              <div className="bg-primary/10 px-3 py-1.5 rounded-lg">
                <p className="text-xs font-semibold text-primary truncate max-w-[120px]">
                  {selectedCustomer.name}
                </p>
              </div>
            )}
            <NavLink 
              to="/profile" 
              className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <User className="w-4 h-4 text-slate-600" />
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors relative ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
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
