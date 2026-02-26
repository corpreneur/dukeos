import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminOverview = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("admin-overview-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, service_addresses(street, city), subscriptions(plan, customer_id)")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
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

  const activeJobs = jobs?.filter((j: any) => j.status === "scheduled" || j.status === "in_progress") || [];
  const completedJobs = jobs?.filter((j: any) => j.status === "completed") || [];
  const activeSubs = subscriptions?.filter((s: any) => s.active) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Active Jobs</div><div className="text-3xl font-display font-bold text-foreground mt-1">{activeJobs.length}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Completed</div><div className="text-3xl font-display font-bold text-foreground mt-1">{completedJobs.length}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Active Subscriptions</div><div className="text-3xl font-display font-bold text-foreground mt-1">{activeSubs.length}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Customers</div><div className="text-3xl font-display font-bold text-foreground mt-1">{profiles?.length || 0}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="font-display">Recent Jobs</CardTitle></CardHeader>
        <CardContent>
          {!jobs?.length ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-display font-semibold text-sm text-foreground">
                      {format(new Date(job.scheduled_date), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {job.service_addresses?.street}, {job.service_addresses?.city}
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColors[job.status] || ""}>
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
