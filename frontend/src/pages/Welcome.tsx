import React from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-slate-50 to-primary/5 p-6">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100 flex flex-col items-center">
        <img src="/plylam.png" alt="Plylam Logo" className="w-16 h-16 mb-6 object-contain" />
        <h1 className="text-3xl font-black text-primary uppercase tracking-widest mb-2 text-center">Natural Plylam</h1>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8 text-center">Business Management Portal</p>
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => navigate("/login")}
            data-testid="admin-login-btn"
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Admin Login
          </button>
          <a
            href="/portal/"
            data-testid="customer-portal-btn"
            className="w-full py-4 bg-white text-primary font-bold rounded-2xl border-2 border-primary shadow-xl shadow-primary/10 transition-all hover:bg-primary/5 active:scale-[0.98] text-center"
          >
            Customer Portal
          </a>
        </div>
      </div>
    </div>
  );
}
