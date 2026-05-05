import React, { useEffect, useState } from "react";
import { apiProxy } from "../apiProxy";

export default function SalesReport() {
  const [report, setReport] = useState({ totalOrders: 0, totalValue: 0, unpaidInvoices: 0 });

  useEffect(() => {
    (async () => {
      const ordersRes: any = await (apiProxy.getOrders?.({ scope: "mine" as any }) ?? apiProxy.getOrders?.());
      const invoicesRes: any = await apiProxy.getInvoices?.();
      const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data ?? []);
      const invoices = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes?.data ?? []);
      const totalValue = orders.reduce((sum: number, o: any) => sum + Number(o.amount ?? 0), 0);
      const unpaidInvoices = invoices.filter((i: any) => ["due", "overdue"].includes(String(i.status).toLowerCase())).length;
      setReport({ totalOrders: orders.length, totalValue, unpaidInvoices });
    })().catch(console.error);
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-4">
      <h1 className="text-2xl font-black">Sales Report</h1>
      <div className="bg-white border rounded-2xl p-4"><p>Total Orders</p><p className="text-2xl font-black">{report.totalOrders}</p></div>
      <div className="bg-white border rounded-2xl p-4"><p>Total Order Value</p><p className="text-2xl font-black">₹{report.totalValue.toLocaleString()}</p></div>
      <div className="bg-white border rounded-2xl p-4"><p>Unpaid Invoices</p><p className="text-2xl font-black">{report.unpaidInvoices}</p></div>
    </div>
  );
}
