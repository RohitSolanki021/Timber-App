import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";
import { isApproved, isProfileComplete, notifyApproval } from "../utils/accessControl";

export default function AwaitingApproval() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Your registration is under review. You will be notified once an admin approves your account.");
  const navigate = useNavigate();

  const checkApproval = async () => {
    setLoading(true);
    try {
      const profile = await apiProxy.getMe();
      localStorage.setItem("profile", JSON.stringify(profile));

      if (isApproved(profile)) {
        await notifyApproval(profile);
        if (!isProfileComplete(profile)) {
          navigate("/profile?complete=1");
          return;
        }
        navigate("/dashboard");
        return;
      }

      setMessage("Still awaiting admin approval. Please check again in a while.");
    } catch (error) {
      setMessage("Unable to fetch account status right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 text-center space-y-4">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Approval Pending</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        <button
          onClick={checkApproval}
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-60"
        >
          {loading ? "Checking..." : "Check approval status"}
        </button>
      </div>
    </div>
  );
}
