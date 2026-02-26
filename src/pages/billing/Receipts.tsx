import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MailCheck, MailX, Send } from "lucide-react";
import { format, subMonths, subDays } from "date-fns";
import { toast } from "sonner";

interface Receipt {
  id: string;
  invoiceNumber: string;
  sentTo: string;
  sentAt: Date;
  amount: number;
  status: "delivered" | "failed" | "pending";
}

const now = new Date();
const mockReceipts: Receipt[] = [
  { id: "r1", invoiceNumber: "INV-2026-0012", sentTo: "john@example.com", sentAt: subDays(now, 2), amount: 7900, status: "pending" },
  { id: "r2", invoiceNumber: "INV-2026-0011", sentTo: "john@example.com", sentAt: subMonths(now, 1), amount: 7900, status: "delivered" },
  { id: "r3", invoiceNumber: "INV-2025-0010", sentTo: "john@example.com", sentAt: subMonths(now, 2), amount: 7900, status: "delivered" },
  { id: "r4", invoiceNumber: "INV-2025-0009", sentTo: "john@example.com", sentAt: subMonths(now, 3), amount: 9900, status: "delivered" },
  { id: "r5", invoiceNumber: "INV-2025-0008", sentTo: "john@oldmail.com", sentAt: subMonths(now, 4), amount: 7900, status: "failed" },
];

const statusIcon: Record<string, React.ReactNode> = {
  delivered: <MailCheck className="h-4 w-4 text-success" />,
  failed: <MailX className="h-4 w-4 text-destructive" />,
  pending: <Mail className="h-4 w-4 text-warning" />,
};

const statusStyles: Record<string, string> = {
  delivered: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

const Receipts = () => {
  const deliveredCount = mockReceipts.filter((r) => r.status === "delivered").length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Email Receipts</h2>
          <p className="text-sm text-muted-foreground">
            {deliveredCount} of {mockReceipts.length} receipts delivered
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-display font-bold text-success">{deliveredCount}</div>
            <div className="text-xs text-muted-foreground">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-display font-bold text-warning">
              {mockReceipts.filter((r) => r.status === "pending").length}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-display font-bold text-destructive">
              {mockReceipts.filter((r) => r.status === "failed").length}
            </div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {mockReceipts.map((receipt) => (
          <Card key={receipt.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  {statusIcon[receipt.status]}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{receipt.invoiceNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    Sent to {receipt.sentTo}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {format(receipt.sentAt, "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-display font-bold text-foreground">
                    ${(receipt.amount / 100).toFixed(2)}
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusStyles[receipt.status]}`}>
                    {receipt.status}
                  </Badge>
                </div>
                {receipt.status === "failed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toast.info("Resend requires email service integration")}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-accent/30 border-accent">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">📧 Auto-receipts</strong> — Once Stripe is connected, receipts are sent automatically after each payment.
        </CardContent>
      </Card>
    </div>
  );
};

export default Receipts;
