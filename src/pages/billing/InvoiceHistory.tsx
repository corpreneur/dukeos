import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Filter } from "lucide-react";
import { format, subMonths, subDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  amount: number;
  status: "paid" | "pending" | "overdue";
  description: string;
}

const now = new Date();
const mockInvoices: Invoice[] = [
  { id: "inv_1", number: "INV-2026-0012", date: subDays(now, 2), dueDate: subDays(now, -28), amount: 7900, status: "pending", description: "Weekly Scooping — February" },
  { id: "inv_2", number: "INV-2026-0011", date: subMonths(now, 1), dueDate: subDays(subMonths(now, 1), -30), amount: 7900, status: "paid", description: "Weekly Scooping — January" },
  { id: "inv_3", number: "INV-2025-0010", date: subMonths(now, 2), dueDate: subDays(subMonths(now, 2), -30), amount: 7900, status: "paid", description: "Weekly Scooping — December" },
  { id: "inv_4", number: "INV-2025-0009", date: subMonths(now, 3), dueDate: subDays(subMonths(now, 3), -30), amount: 9900, status: "paid", description: "Weekly Scooping + Deodorizer — November" },
  { id: "inv_5", number: "INV-2025-0008", date: subMonths(now, 4), dueDate: subDays(subMonths(now, 4), -30), amount: 7900, status: "paid", description: "Weekly Scooping — October" },
];

const statusStyles: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const InvoiceHistory = () => {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? mockInvoices : mockInvoices.filter((i) => i.status === filter);
  const totalPaid = mockInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Invoice History</h2>
          <p className="text-sm text-muted-foreground">
            {mockInvoices.length} invoices · ${(totalPaid / 100).toFixed(2)} paid
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px] gap-2">
            <Filter className="h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No invoices match this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => (
            <Card key={inv.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{inv.number}</div>
                    <div className="text-xs text-muted-foreground">{inv.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(inv.date, "MMM d, yyyy")} · Due {format(inv.dueDate, "MMM d")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-display font-bold text-foreground">
                      ${(inv.amount / 100).toFixed(2)}
                    </div>
                    <Badge variant="outline" className={`text-xs ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toast.info("PDF download requires Stripe integration")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
