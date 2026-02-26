import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Sparkles, DollarSign, ShoppingCart } from "lucide-react";
import { format } from "date-fns";

const AdminAddons = () => {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price_cents: "", icon: "sparkles" });

  const { data: addons } = useQuery({
    queryKey: ["admin-addons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_addons").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-addon-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addon_orders")
        .select("*, service_addons(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createAddon = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_addons").insert({
        name: form.name,
        description: form.description,
        price_cents: Math.round(parseFloat(form.price_cents) * 100),
        icon: form.icon,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addons"] });
      toast.success("Add-on created");
      setAddOpen(false);
      setForm({ name: "", description: "", price_cents: "", icon: "sparkles" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("service_addons").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addons"] });
      toast.success("Updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("addon_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addon-orders"] });
      toast.success("Order updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.status !== "cancelled" ? o.price_cents : 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Service Add-ons</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage premium one-time services</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Add-on</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Create Add-on Service</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Yard Deodorizing" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Professional treatment..." />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" value={form.price_cents} onChange={(e) => setForm(p => ({ ...p, price_cents: e.target.value }))} placeholder="25.00" />
              </div>
              <Button className="w-full" onClick={() => createAddon.mutate()} disabled={!form.name || !form.price_cents || createAddon.isPending}>
                {createAddon.isPending ? "Creating..." : "Create Add-on"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5"><Sparkles className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Active Add-ons</div>
              <div className="text-2xl font-display font-bold text-foreground">{addons?.filter((a: any) => a.active).length || 0}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-success/10 p-2.5"><ShoppingCart className="h-5 w-5 text-success" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
              <div className="text-2xl font-display font-bold text-foreground">{orders?.length || 0}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="text-sm text-muted-foreground">Add-on Revenue</div>
              <div className="text-2xl font-display font-bold text-foreground">${(totalRevenue / 100).toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add-ons Catalog */}
      <Card>
        <CardHeader><CardTitle className="font-display text-base">Add-on Catalog</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons?.map((addon: any) => (
                  <TableRow key={addon.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{addon.name}</div>
                        <div className="text-xs text-muted-foreground">{addon.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">${(addon.price_cents / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={addon.active}
                        onCheckedChange={(v) => toggleActive.mutate({ id: addon.id, active: v })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      {orders && orders.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Recent Orders</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => {
                    const profile = profiles?.find((p: any) => p.user_id === order.customer_id);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm">{format(new Date(order.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-medium">{order.service_addons?.name}</TableCell>
                        <TableCell>{profile?.full_name || order.customer_id.slice(0, 8)}</TableCell>
                        <TableCell className="font-semibold">${(order.price_cents / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              order.status === "completed" ? "bg-success/10 text-success border-success/20 cursor-pointer" :
                              order.status === "pending" ? "bg-primary/10 text-primary border-primary/20 cursor-pointer" :
                              "cursor-pointer"
                            }
                            onClick={() => updateOrderStatus.mutate({
                              id: order.id,
                              status: order.status === "pending" ? "completed" : "pending",
                            })}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAddons;
