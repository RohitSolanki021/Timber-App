import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { User as UserType } from "../types";
import { User, LogOut, Phone, Mail, X, Check, Shield, Building } from "lucide-react";
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

  const handleLogout = async () => {
    await apiProxy.logout();
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

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]" data-testid="profile-loading">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8" data-testid="profile-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" data-testid="profile-title">
          Profile Settings
        </h1>
        <p className="text-slate-500 mt-1">Manage your account settings</p>
      </div>

      {mustComplete && !isProfileComplete(user) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex items-start gap-3" data-testid="complete-profile-alert">
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Profile Incomplete</p>
            <p className="text-sm mt-1">Your account is approved. Please complete your profile details to continue.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="profile-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-slate-500 mt-1">{user.email}</p>
              <span className="mt-3 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="profile-details">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Account Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Phone Number</p>
                  <p className="text-slate-900 font-medium mt-1">{user.phone || "Not set"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Email Address</p>
                  <p className="text-slate-900 font-medium mt-1">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Role</p>
                  <p className="text-slate-900 font-medium mt-1">{user.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Account Status</p>
                  <p className="text-slate-900 font-medium mt-1">{user.approval_status || "Active"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4" data-testid="profile-actions">
            <h3 className="font-semibold text-slate-900 mb-4">Account Actions</h3>
            
            <button
              onClick={() => setPasswordModalOpen(true)}
              className="w-full py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              data-testid="change-password-btn"
            >
              <Shield className="w-5 h-5" />
              Change Password
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            data-testid="password-modal"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
                <button 
                  onClick={() => setPasswordModalOpen(false)} 
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                  data-testid="close-modal"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    data-testid="current-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.next}
                    onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    data-testid="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    data-testid="confirm-password"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500 font-medium" data-testid="password-error">{passwordError}</p>
                )}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full py-3 bg-primary text-white font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="submit-password"
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
