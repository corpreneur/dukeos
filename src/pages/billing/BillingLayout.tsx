import { Outlet, NavLink, useLocation } from "react-router-dom";
import { CreditCard, FileText, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const billingLinks = [
  { to: "/dashboard/billing", label: "Payment Methods", icon: CreditCard, end: true },
  { to: "/dashboard/billing/invoices", label: "Invoices", icon: FileText },
  { to: "/dashboard/billing/receipts", label: "Receipts", icon: Mail },
];

const BillingLayout = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Billing & Payments</h1>
        <p className="text-sm text-muted-foreground">Manage payment methods, view invoices, and track receipts</p>
      </div>

      <nav className="flex gap-1 border-b border-border pb-px overflow-x-auto">
        {billingLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                isActive
                  ? "bg-card text-foreground border border-border border-b-card -mb-px shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
};

export default BillingLayout;
