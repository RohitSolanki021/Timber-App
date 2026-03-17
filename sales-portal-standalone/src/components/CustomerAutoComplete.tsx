import React, { useEffect, useRef, useState } from "react";
import { apiProxy } from "../apiProxy";
import { Customer } from "../types";

interface CustomerAutoCompleteProps {
  selectedId: number | null;
  selectedName?: string | null;
  onSelect: (id: number | null, name?: string | null, pricingType?: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  onlyApproved?: boolean;
}

export default function CustomerAutoComplete({
  selectedId,
  selectedName,
  onSelect,
  placeholder = "Start typing a customer",
  disabled = false,
  label,
  onlyApproved = false,
}: CustomerAutoCompleteProps) {
  const [query, setQuery] = useState(selectedName ?? "");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  setQuery(selectedName ?? "");
}, [selectedName]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      (async () => {
        if (!active) return;
        setLoading(true);
        setError(null);
        try {
          const params = {
            search: query.trim() || undefined,
            page: 1,
            per_page: 10,
          };
          const res: any = await apiProxy.getCustomers(params);
          const data: Customer[] = Array.isArray(res) ? res : res?.data ?? [];
          if (!active) return;
          const filtered = onlyApproved
            ? data.filter((customer) => {
                const status = (customer.status ?? "").toLowerCase();
                return status === "approved" || status.includes("approved");
              })
            : data;
          setSuggestions(filtered);
          setOpen(true);
        } catch (err) {
          console.error(err);
          if (active) setError("Unable to load customers");
        } finally {
          if (active) setLoading(false);
        }
      })();
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, onlyApproved]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (customer: Customer) => {
    setQuery(customer.name);
    onSelect(customer.id, customer.name, customer.pricing_type ?? null);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
      )}
      <input
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          if (!value) {
            onSelect(null, null, null);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-3 text-xs text-slate-400">Searching customers...</div>
          )}
          {!loading && error && (
            <div className="p-3 text-xs text-rose-500">{error}</div>
          )}
          {!loading && !error && suggestions.length === 0 && (
            <div className="p-3 text-xs text-slate-500">No customers found</div>
          )}
          {!loading && !error && suggestions.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(customer)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-100 transition"
            >
              <div className="font-bold text-slate-900">{customer.name}</div>
              {customer.contactPerson && (
                <p className="text-[10px] text-slate-400 mt-1">{customer.contactPerson}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
