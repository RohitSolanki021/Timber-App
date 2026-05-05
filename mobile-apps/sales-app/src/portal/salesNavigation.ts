export interface NavItem {
  key: string;
  label: string;
  path: string;
}

export const salesPortalNavigation: NavItem[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard" },
  { key: "orders", label: "My Orders", path: "/orders" },
  { key: "cart", label: "Cart", path: "/cart" },
  { key: "customers", label: "My Customers", path: "/customers" },
  { key: "invoices", label: "Invoices", path: "/invoices" },
  { key: "profile", label: "Profile", path: "/profile" },
];
