import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pause, Play, XCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";

const PLANS = [
  { id: "basic", label: "Basic", price: 1800 },
  { id: "standard", label: "Standard", price: 2500 },
  { id: "premium", label: "Premium", price: 3500 },
];

const FREQUENCIES = ["weekly", "biweekly", "monthly"];

const AdminSubscriptions = () => {
  const queryClient = useQueryClient();
  const [changePlanSub, setChangePlanSub] = useState<any>(null);
  const [newPlan, setNewPlan] = useState("");
  const [newFreq, setNewFreq] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, service_addresses(street, city)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const getCustomerName = (sub: any) => {
    const profile = profiles?.find((p: any) => p.user_id === sub.customer_id);
    return profile?.full_name || "—";
  };

  const updateSubscription = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("subscriptions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Subscription updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handlePause = (id: string) => updateSubscription.mutate({ id, updates: { active: false } });
  const handleResume = (id: string) => updateSubscription.mutate({ id, updates: { active: true, cancelled_at: null } });
  const handleCancel = (id: string) => {
    updateSubscription.mutate({ id, updates: { active: false, cancelled_at: new Date().toISOString() } });
    setCancelConfirm(null);
  };

  const openChangePlan = (sub: any) => {
    setChangePlanSub(sub);
    setNewPlan(sub.plan);
    setNewFreq(sub.frequency);
  };

  const applyPlanChange = () => {
    if (!changePlanSub) return;
    const planConfig = PLANS.find(p => p.id === newPlan);
    const numDogs = changePlanSub.num_dogs || 1;
    updateSubscription.mutate({
      id: changePlanSub.id,
      updates: {
        plan: newPlan,
        frequency: newFreq,
        price_cents: (planConfig?.price || 1800) * numDogs,
      },
    });
    setChangePlanSub(null);
  };

  const activeCount = subscriptions?.filter((s: any) => s.active).length || 0;
  const pausedCount = subscriptions?.filter((s: any) => !s.active && !s.cancelled_at).length || 0;
  const cancelledCount = subscriptions?.filter((s: any) => s.cancelled_at).length || 0;
  const mrr = subscriptions?.filter((s: any) => s.active).reduce((sum: number, s: any) => sum + s.price_cents, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">All Subscriptions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {activeCount} active · {pausedCount} paused · {cancelledCount} cancelled · MRR ${(mrr / 100).toLocaleString()}
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden md:table-cell">Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions?.map((sub: any) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{getCustomerName(sub)}</TableCell>
                <TableCell className="capitalize">{sub.plan}</TableCell>
                <TableCell className="capitalize">{sub.frequency}</TableCell>
                <TableCell>${(sub.price_cents / 100).toFixed(2)}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {sub.service_addresses?.street}, {sub.service_addresses?.city}
                </TableCell>
                <TableCell>
                  <Badge variant={sub.active ? "default" : sub.cancelled_at ? "destructive" : "secondary"}>
                    {sub.cancelled_at ? "Cancelled" : sub.active ? "Active" : "Paused"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {sub.active ? (
                      <>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => openChangePlan(sub)}>
                          <ArrowUpCircle className="h-3 w-3" /> Change Plan
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => handlePause(sub.id)}>
                          <Pause className="h-3 w-3" /> Pause
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs text-destructive hover:text-destructive" onClick={() => setCancelConfirm(sub.id)}>
                          <XCircle className="h-3 w-3" /> Cancel
                        </Button>
                      </>
                    ) : !sub.cancelled_at ? (
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => handleResume(sub.id)}>
                        <Play className="h-3 w-3" /> Resume
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(sub.cancelled_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!subscriptions?.length && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No subscriptions yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={!!changePlanSub} onOpenChange={(o) => !o && setChangePlanSub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Change Subscription</DialogTitle>
            <DialogDescription>
              Update plan or frequency for {changePlanSub ? getCustomerName(changePlanSub) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <div className="grid grid-cols-3 gap-2">
                {PLANS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setNewPlan(p.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      newPlan === p.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-sm font-medium capitalize">{p.label}</div>
                    <div className="text-xs text-muted-foreground">${(p.price / 100).toFixed(0)}/dog</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={newFreq} onValueChange={setNewFreq}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => (
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanSub(null)}>Cancel</Button>
            <Button onClick={applyPlanChange}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={!!cancelConfirm} onOpenChange={(o) => !o && setCancelConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Cancel Subscription</DialogTitle>
            <DialogDescription>
              This will deactivate the subscription and stop all future jobs. This action can't be undone easily.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirm(null)}>Keep Active</Button>
            <Button variant="destructive" onClick={() => cancelConfirm && handleCancel(cancelConfirm)}>
              Yes, Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
