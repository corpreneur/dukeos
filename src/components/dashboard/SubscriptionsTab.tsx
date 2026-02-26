import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, MapPin, XCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/pdf-generators";
import { useProfile } from "@/hooks/useProfile";
import NewSubscriptionDialog from "@/components/dashboard/NewSubscriptionDialog";
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

const SubscriptionsTab = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

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

  const cancelSub = useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ active: false, cancelled_at: new Date().toISOString() })
        .eq("id", subId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      toast.success("Subscription cancelled");
    },
    onError: (err: any) => toast.error(err.message),
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
              <div className="pt-2 border-t border-border flex items-center gap-2">
                {sub.active && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Cancel Subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel your {sub.plan} plan ({sub.frequency} service). You won't be charged again, and any remaining scheduled jobs will be kept.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cancelSub.mutate(sub.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    generateInvoicePDF({
                      customerName: profile?.full_name || "",
                      customerEmail: user?.email || "",
                      address: sub.service_addresses
                        ? `${sub.service_addresses.street}, ${sub.service_addresses.city}, ${sub.service_addresses.state} ${sub.service_addresses.zip}`
                        : "N/A",
                      plan: sub.plan,
                      frequency: sub.frequency,
                      numDogs: sub.num_dogs,
                      priceCents: sub.price_cents,
                      startedAt: sub.started_at,
                      subscriptionId: sub.id,
                    })
                  }
                >
                  <Download className="h-3.5 w-3.5" /> Invoice PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionsTab;
