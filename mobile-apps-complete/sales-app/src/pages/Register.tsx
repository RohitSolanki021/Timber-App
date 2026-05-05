import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";

export default function Register() {
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiProxy.registerCustomer({
        business_name: businessName,
        address,
        contact_person: contactPerson,
        phone,
        gstin,
        type: "customer" // not shown to user, only sent to backend
      });
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100">
        <h1 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-widest">Register Customer</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required className="w-full mt-1 p-3 bg-slate-100 rounded-xl border-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
              rows={3}
              className="w-full mt-1 p-3 bg-slate-100 rounded-xl border-none text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
            <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required className="w-full mt-1 p-3 bg-slate-100 rounded-xl border-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full mt-1 p-3 bg-slate-100 rounded-xl border-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN</label>
            <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} required className="w-full mt-1 p-3 bg-slate-100 rounded-xl border-none text-sm" />
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
