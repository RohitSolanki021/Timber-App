import type { Invoice, Order } from "../types/api";

export interface SalesReportSnapshot {
  totalOrders: number;
  totalPendingOrders: number;
  totalRevenue: number;
  unpaidInvoices: number;
}

export function buildSalesReport(orders: Order[], invoices: Invoice[]): SalesReportSnapshot {
  const totalOrders = orders.length;
  const totalPendingOrders = orders.filter((x) => x.status.toLowerCase() === "pending").length;
  const totalRevenue = orders.reduce((acc, x) => acc + Number(x.grand_total ?? 0), 0);
  const unpaidInvoices = invoices.filter((x) => x.status.toLowerCase() === "unpaid").length;

  return {
    totalOrders,
    totalPendingOrders,
    totalRevenue,
    unpaidInvoices,
  };
}
