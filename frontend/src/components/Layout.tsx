import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  FileText, 
  User, 
  LogOut,
  Menu,
  X,
  Package,
  ChevronDown,
  UserCog
} from "lucide-react";
import { apiProxy } from "../apiProxy";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  superAdminOnly?: boolean;
}

const getNavItems = (isSuperAdmin: boolean): NavItem[] => {
  const items: NavItem[] = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/customers", icon: Users, label: "Customers" },
    { to: "/orders", icon: ClipboardList, label: "Orders" },
    { to: "/invoices", icon: FileText, label: "Invoices" },
    { to: "/products", icon: Package, label: "Products" },
  ];
  
  if (isSuperAdmin) {
    items.push({ to: "/users", icon: UserCog, label: "Staff", superAdminOnly: true });
  }
  
  return items;
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const profile = (() => {
    try {
      const raw = localStorage.getItem("profile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const isSuperAdmin = profile?.role?.toLowerCase() === 'super admin';
  const navItems = getNavItems(isSuperAdmin);

  const handleLogout = async () => {
    await apiProxy.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" data-testid="admin-layout">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="/plylam.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-slate-900 text-sm">Natural Plylam</h1>
                <p className="text-[10px] text-slate-400 font-medium">Admin Panel</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="toggle-sidebar"
          >
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100'
                } ${!sidebarOpen && 'justify-center px-0'}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-200">
          <NavLink
            to="/profile"
            data-testid="nav-profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              } ${!sidebarOpen && 'justify-center px-0'}`
            }
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium text-sm">Profile</span>}
          </NavLink>
          
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 w-full mt-1 ${
              !sidebarOpen && 'justify-center px-0'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="mobile-sidebar"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <img src="/plylam.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">Natural Plylam</h1>
              <p className="text-[10px] text-slate-400 font-medium">Admin Panel</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg"
            data-testid="close-mobile-menu"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <NavLink
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">Profile</span>
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 w-full mt-1"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6" data-testid="top-header">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
              data-testid="mobile-menu-button"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <img src="/plylam.png" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Plylam Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-xl transition-colors"
                data-testid="user-menu-button"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-900">{profile?.name || 'Admin'}</p>
                  <p className="text-xs text-slate-400">{profile?.role || 'Super Admin'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50" data-testid="user-dropdown">
                    <NavLink
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      <User className="w-4 h-4" />
                      Profile Settings
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto" data-testid="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
