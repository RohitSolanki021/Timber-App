import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { User as UserType } from "../types";
import { User, LogOut, Phone, Mail, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { isProfileComplete } from "../utils/accessControl";

export default function Profile() {
  const [user, setUser] = useState<UserType | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const mustComplete = searchParams.get("complete") === "1";
  const navigate = useNavigate();

  useEffect(() => {
    apiProxy.getMe().then(u => {
      setUser(u);
      localStorage.setItem("profile", JSON.stringify(u));
    }).catch(console.error);
  }, []);

  const getMe =() => {
    apiProxy.getMe().then(u => {
      setUser(u);
      localStorage.setItem("profile", JSON.stringify(u));
    }).catch(console.error);
  };

  const handleLogout = () => {
    apiProxy.logout();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!passwordForm.current || !passwordForm.next) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      await apiProxy.changePassword(passwordForm.current, passwordForm.next);
      setPasswordModalOpen(false);
      setPasswordForm({ current: "", next: "", confirm: "" });
      alert("Password changed successfully. Please login again.");
      handleLogout();
    } catch (err) {
      setPasswordError("Unable to change password. Please check your current password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading Profile...</div>;

  return (
    <div className="p-6 space-y-8 relative">
      {mustComplete && !isProfileComplete(user) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-semibold">
          Your account is approved. Please complete your profile details to continue.
        </div>
      )}
      <header className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center relative">
            <User className="w-12 h-12 text-slate-400" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">{user.role}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3">
        <InfoCard icon={Phone} title="Phone Number" value={user.phone} iconClass="text-emerald-500" bgClass="bg-emerald-50" />
        <InfoCard icon={Mail} title="Email Address" value={user.email} iconClass="text-pink-500" bgClass="bg-pink-50" />
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button>

      <button
        onClick={() => setPasswordModalOpen(true)}
        className="w-full py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
      >
        Change Password
      </button>

      <AnimatePresence>
        {passwordModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
                <button onClick={() => setPasswordModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <InputField label="Current Password" value={passwordForm.current} onChange={value => setPasswordForm({ ...passwordForm, current: value })} type="password" />
                <InputField label="New Password" value={passwordForm.next} onChange={value => setPasswordForm({ ...passwordForm, next: value })} type="password" />
                <InputField label="Confirm New Password" value={passwordForm.confirm} onChange={value => setPasswordForm({ ...passwordForm, confirm: value })} type="password" />
                {passwordError && (
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{passwordError}</p>
                )}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {changingPassword ? "Updating..." : (
                  <>
                    <Check className="w-5 h-5" />
                    Update Password
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({ icon: Icon, title, value, iconClass, bgClass }: { icon: any; title: string; value?: string; iconClass: string; bgClass: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-sm font-bold text-slate-900">{value || "Not set"}</p>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
      />
    </div>
  );
}
