import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, Package, ShoppingCart, ClipboardList, User, LayoutGrid } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useCart } from "../context/CartContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { cartCount } = useCart();

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Home", color: "text-blue-500" },
    { to: "/products", icon: LayoutGrid, label: "Products", color: "text-orange-500" },
    { to: "/cart", icon: ShoppingCart, label: "Cart", color: "text-emerald-500" },
    { to: "/orders", icon: ClipboardList, label: "Orders", color: "text-purple-500" },
    { to: "/profile", icon: User, label: "Profile", color: "text-pink-500" },
  ];

  return (
    <div className="min-h-screen bg-background-light pb-20 font-sans">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm relative">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all duration-300",
                  isActive ? cn(item.color, "scale-110") : "text-slate-400 hover:text-slate-600"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {isActive && (
                      <item.icon className="w-6 h-6 fill-current opacity-20 absolute" />
                    )}
                    <item.icon className="w-6 h-6 relative z-10" />
                    {item.label === "Cart" && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white z-20">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
