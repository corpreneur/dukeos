import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal, Pause, XCircle, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";

const AdminSubscriptions = () => {
  const queryClient = useQueryClient();

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
  const handleCancel = (id: string) => updateSubscription.mutate({ id, updates: { active: false, cancelled_at: new Date().toISOString() } });
  const handleUpgrade = (id: string, currentPlan: string) => {
    const next = currentPlan === "basic" ? "standard" : currentPlan === "standard" ? "premium" : "premium";
    const price = next === "standard" ? 2500 : 3500;
    updateSubscription.mutate({ id, updates: { plan: next, price_cents: price } });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">All Subscriptions</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions?.map((sub: any) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{getCustomerName(sub)}</TableCell>
                <TableCell className="capitalize">{sub.plan}</TableCell>
                <TableCell className="capitalize">{sub.frequency}</TableCell>
                <TableCell>${(sub.price_cents / 100).toFixed(2)}</TableCell>
                <TableCell>{sub.service_addresses?.street}, {sub.service_addresses?.city}</TableCell>
                <TableCell>
                  <Badge variant={sub.active ? "default" : sub.cancelled_at ? "destructive" : "secondary"}>
                    {sub.cancelled_at ? "Cancelled" : sub.active ? "Active" : "Paused"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {sub.active ? (
                        <>
                          <DropdownMenuItem onClick={() => handlePause(sub.id)}>
                            <Pause className="h-4 w-4 mr-2" /> Pause
                          </DropdownMenuItem>
                          {sub.plan !== "premium" && (
                            <DropdownMenuItem onClick={() => handleUpgrade(sub.id, sub.plan)}>
                              <ArrowUpCircle className="h-4 w-4 mr-2" /> Upgrade
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleCancel(sub.id)} className="text-destructive">
                            <XCircle className="h-4 w-4 mr-2" /> Cancel
                          </DropdownMenuItem>
                        </>
                      ) : !sub.cancelled_at ? (
                        <DropdownMenuItem onClick={() => handleResume(sub.id)}>
                          Resume
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!subscriptions?.length && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No subscriptions yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
