import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, MapPin } from "lucide-react";
import NewSubscriptionDialog from "@/components/dashboard/NewSubscriptionDialog";

const SubscriptionsTab = () => {
  const { user } = useAuth();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["customer-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`*, service_addresses (street, city, state, zip)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!subscriptions?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground">No subscriptions</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your active service plans will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Subscriptions</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your lawn care plans</p>
        </div>
        <NewSubscriptionDialog />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {subscriptions.map((sub: any) => (
          <Card key={sub.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground capitalize">
                  {sub.plan} Plan
                </h3>
                <Badge variant={sub.active ? "default" : "secondary"}>
                  {sub.active ? "Active" : "Cancelled"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="capitalize">{sub.frequency} service</p>
                <p className="font-semibold text-foreground">
                  ${(sub.price_cents / 100).toFixed(2)}/visit
                </p>
              </div>
              {sub.service_addresses && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                  <MapPin className="h-3.5 w-3.5" />
                  {sub.service_addresses.street}, {sub.service_addresses.city}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionsTab;
