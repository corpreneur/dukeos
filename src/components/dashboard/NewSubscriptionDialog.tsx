import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const plans = [
  { id: "basic", name: "Basic", price: 2999, desc: "Weekly mowing" },
  { id: "pro", name: "Pro", price: 4999, desc: "Mowing + edging + blowing" },
  { id: "premium", name: "Premium", price: 7999, desc: "Full yard care + fertilization" },
];

const frequencies = [
  { id: "weekly", name: "Weekly" },
  { id: "biweekly", name: "Every 2 Weeks" },
  { id: "monthly", name: "Monthly" },
];

const NewSubscriptionDialog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState("basic");
  const [frequency, setFrequency] = useState("weekly");
  const [addressId, setAddressId] = useState("");

  const { data: addresses } = useQuery({
    queryKey: ["customer-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_addresses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createSub = useMutation({
    mutationFn: async () => {
      const selectedPlan = plans.find((p) => p.id === plan)!;
      const { error } = await supabase.from("subscriptions").insert({
        customer_id: user!.id,
        address_id: addressId,
        plan,
        frequency,
        price_cents: selectedPlan.price,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      toast.success("Subscription created!");
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const selectedPlan = plans.find((p) => p.id === plan)!;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Subscription
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Create Subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Plan selection */}
          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="grid grid-cols-3 gap-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    plan === p.id
                      ? "border-primary bg-accent ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="font-display font-semibold text-sm text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
                  <div className="text-sm font-semibold text-primary mt-2">
                    ${(p.price / 100).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Service Address</Label>
            {!addresses?.length ? (
              <p className="text-sm text-muted-foreground">
                Add a service address first in the Addresses tab.
              </p>
            ) : (
              <Select value={addressId} onValueChange={setAddressId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select address" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label} — {a.street}, {a.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <span className="font-semibold text-foreground">{selectedPlan.name}</span> · {frequencies.find(f => f.id === frequency)?.name} · <span className="text-primary font-semibold">${(selectedPlan.price / 100).toFixed(2)}/visit</span>
          </div>

          <Button
            className="w-full"
            onClick={() => createSub.mutate()}
            disabled={!addressId || createSub.isPending}
          >
            {createSub.isPending ? "Creating..." : "Start Subscription"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSubscriptionDialog;
