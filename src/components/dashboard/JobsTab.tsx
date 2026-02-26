import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const JobsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription for job updates
  useEffect(() => {
    const channel = supabase
      .channel("customer-jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["customer-jobs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["customer-jobs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          service_addresses (street, city, state, zip),
          subscriptions (plan, frequency)
        `)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!jobs?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground">No jobs yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Jobs will appear here once you have an active subscription.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Upcoming Jobs</h2>
        <p className="text-muted-foreground text-sm mt-1">Track your scheduled lawn care visits</p>
      </div>
      <div className="grid gap-4">
        {jobs.map((job: any) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="font-display font-semibold text-foreground">
                    {format(new Date(job.scheduled_date), "EEEE, MMM d, yyyy")}
                  </span>
                </div>
                {job.service_addresses && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.service_addresses.street}, {job.service_addresses.city}, {job.service_addresses.state} {job.service_addresses.zip}
                  </div>
                )}
                {job.subscriptions && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {job.subscriptions.plan} plan · {job.subscriptions.frequency}
                  </div>
                )}
              </div>
              <Badge variant="outline" className={statusColors[job.status] || ""}>
                {job.status.replace("_", " ")}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobsTab;
