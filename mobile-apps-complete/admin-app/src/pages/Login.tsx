import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import { apiService } from "../apiService";
import { apiProxy } from "../apiProxy";
import { LogIn } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiProxy.login({ email, password });
      const profile = await apiProxy.getMe();
      const role = String(profile?.role || "").toLowerCase();
      const allowed = ["manager", "super admin", "admin"].includes(role);
      if (!allowed) {
        await apiProxy.logout();
        setError("Only Manager, Admin, or Super Admin accounts can access this admin app.");
        return;
      }
      localStorage.setItem("profile", JSON.stringify(profile));
      navigate("/dashboard");
    } catch (err) {
      setError("Login failed. Please check your admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mb-6 shadow-sm">
            <img src="/plylam.png" alt="Plylam" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Natural Plylam</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Admin Portal Login</p>
        </div>




        {location.state?.message && (
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest text-center mb-4">{location.state.message}</p>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-sm"
              required
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary hover:scale-[1.02] active:scale-[0.98] text-white font-black rounded-2xl shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {loading ? "Logging in..." : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
