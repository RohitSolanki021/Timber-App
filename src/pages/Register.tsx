import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiProxy } from "../apiProxy";

export default function Register() {
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiProxy.registerCustomer({ name, contactPerson, phone, email, password });
      navigate("/login", { state: { message: "Registration submitted. Please wait for admin approval before you can access the portal." } });
    } catch {
      setError("Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100">
        <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest">Register Customer</h1>
        <p className="text-xs text-slate-500 mb-6">After registration, your account will be activated by admin.</p>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Business Name" required className="w-full p-3 bg-slate-100 rounded-xl" />
          <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Contact Person" required className="w-full p-3 bg-slate-100 rounded-xl" />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" required className="w-full p-3 bg-slate-100 rounded-xl" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full p-3 bg-slate-100 rounded-xl" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full p-3 bg-slate-100 rounded-xl" />
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white font-bold rounded-2xl">{loading ? "Registering..." : "Register"}</button>
        </form>
      </div>
    </div>
  );
}
