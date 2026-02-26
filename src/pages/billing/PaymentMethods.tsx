import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2, Star } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const mockMethods: PaymentMethod[] = [
  { id: "pm_1", brand: "Visa", last4: "4242", expMonth: 12, expYear: 2027, isDefault: true },
  { id: "pm_2", brand: "Mastercard", last4: "8888", expMonth: 3, expYear: 2026, isDefault: false },
];

const brandIcons: Record<string, string> = {
  Visa: "💳",
  Mastercard: "💳",
  Amex: "💳",
};

const PaymentMethods = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>(mockMethods);

  const setDefault = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id }))
    );
    toast.success("Default payment method updated");
  };

  const removeMethod = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    toast.success("Payment method removed");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Payment Methods</h2>
          <p className="text-sm text-muted-foreground">Manage your saved cards</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info("Stripe integration required to add cards")}>
          <Plus className="h-4 w-4" /> Add Card
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No payment methods on file.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => toast.info("Stripe integration required")}>
              <Plus className="h-4 w-4" /> Add your first card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <Card key={method.id} className={method.isDefault ? "ring-2 ring-primary/30" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-16 rounded-lg bg-muted flex items-center justify-center text-2xl">
                    {brandIcons[method.brand] || "💳"}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {method.brand} •••• {method.last4}
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Star className="h-3 w-3" /> Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => setDefault(method.id)}>
                      Set Default
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {method.brand} ending in {method.last4}. You can add it back later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeMethod(method.id)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-accent/30 border-accent">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">🔒 Secure payments</strong> — Card data is encrypted and processed securely. Connect Stripe to enable live payment processing.
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethods;
