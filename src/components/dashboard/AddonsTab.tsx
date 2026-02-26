import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, SprayCan, ShieldCheck, Leaf, RefreshCw, Check } from "lucide-react";
import { format } from "date-fns";

const iconMap: Record<string, any> = {
  "spray-can": SprayCan,
  "shield-check": ShieldCheck,
  leaf: Leaf,
  "refresh-cw": RefreshCw,
  sparkles: Sparkles,
};

const AddonsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: addons, isLoading: addonsLoading } = useQuery({
    queryKey: ["service-addons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_addons").select("*").eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["customer-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, service_addresses(street, city)")
        .eq("active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders } = useQuery({
    queryKey: ["addon-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addon_orders")
        .select("*, service_addons(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const orderAddon = useMutation({
    mutationFn: async ({ addonId, subscriptionId, priceCents }: { addonId: string; subscriptionId: string; priceCents: number }) => {
      const { error } = await supabase.from("addon_orders").insert({
        addon_id: addonId,
        customer_id: user!.id,
        subscription_id: subscriptionId,
        price_cents: priceCents,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addon-orders"] });
      toast.success("Add-on service ordered! We'll include it on your next visit.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (addonsLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const activeSub = subscriptions?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Service Add-ons</h2>
        <p className="text-muted-foreground text-sm mt-1">Boost your yard care with one-time premium treatments</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {addons?.map((addon: any) => {
          const Icon = iconMap[addon.icon] || Sparkles;
          return (
            <Card key={addon.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-foreground">{addon.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xl font-display font-bold text-foreground">
                    ${(addon.price_cents / 100).toFixed(2)}
                  </span>
                  {activeSub ? (
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() =>
                        orderAddon.mutate({
                          addonId: addon.id,
                          subscriptionId: activeSub.id,
                          priceCents: addon.price_cents,
                        })
                      }
                      disabled={orderAddon.isPending}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Add to Next Visit
                    </Button>
                  ) : (
                    <Badge variant="secondary">Subscription required</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {orders && orders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-display font-semibold text-foreground">Order History</h3>
          <div className="space-y-2">
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-medium text-foreground">{order.service_addons?.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">${(order.price_cents / 100).toFixed(2)}</span>
                    <Badge variant="outline" className={
                      order.status === "completed" ? "bg-success/10 text-success border-success/20" :
                      order.status === "pending" ? "bg-primary/10 text-primary border-primary/20" :
                      ""
                    }>
                      {order.status === "completed" && <Check className="h-3 w-3 mr-1" />}
                      {order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonsTab;
