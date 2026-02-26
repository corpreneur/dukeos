import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Clock, Camera, Image, CalendarClock, SkipForward } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
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

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const JobsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [rescheduleJob, setRescheduleJob] = useState<any>(null);
  const [newDate, setNewDate] = useState("");

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
        .select(`*, service_addresses (street, city, state, zip), subscriptions (plan, frequency)`)
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: proofs } = useQuery({
    queryKey: ["customer-proofs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_proofs").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const skipVisit = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("jobs").update({ status: "cancelled" as any, notes: "Skipped by customer" }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-jobs"] });
      toast.success("Visit skipped successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rescheduleVisit = useMutation({
    mutationFn: async ({ jobId, date }: { jobId: string; date: string }) => {
      const { error } = await supabase.from("jobs").update({ scheduled_date: date, notes: "Rescheduled by customer" }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-jobs"] });
      toast.success("Visit rescheduled!");
      setRescheduleJob(null);
      setNewDate("");
    },
    onError: (err: any) => toast.error(err.message),
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

  const upcomingJobs = jobs.filter((j: any) => j.status === "scheduled" || j.status === "in_progress");
  const pastJobs = jobs.filter((j: any) => j.status === "completed" || j.status === "cancelled");
  const getJobProofs = (jobId: string) => proofs?.filter((p: any) => p.job_id === jobId) || [];
  const minDate = format(addDays(new Date(), 1), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      {upcomingJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold text-foreground">Upcoming Jobs</h2>
          <p className="text-muted-foreground text-sm">Track your scheduled visits — skip or reschedule anytime</p>
          <div className="grid gap-4">
            {upcomingJobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" onClick={() => setSelectedJob(job)} role="button">
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
                          {job.service_addresses.street}, {job.service_addresses.city}
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
                  </div>

                  {/* Self-service actions for scheduled jobs */}
                  {job.status === "scheduled" && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => { setRescheduleJob(job); setNewDate(""); }}
                      >
                        <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1 text-muted-foreground">
                            <SkipForward className="h-3.5 w-3.5" /> Skip Visit
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-display">Skip This Visit?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel the visit on {format(new Date(job.scheduled_date), "MMM d, yyyy")}.
                              Your regular schedule will continue on the next visit.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Visit</AlertDialogCancel>
                            <AlertDialogAction onClick={() => skipVisit.mutate(job.id)}>
                              Skip Visit
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-foreground">Job History</h2>
          <div className="grid gap-3">
            {pastJobs.map((job: any) => {
              const jobProofs = getJobProofs(job.id);
              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedJob(job)}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-display font-semibold text-sm text-foreground">
                          {format(new Date(job.scheduled_date), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {job.service_addresses?.street}, {job.service_addresses?.city}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {jobProofs.length > 0 && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Camera className="h-3 w-3" /> {jobProofs.length}
                        </Badge>
                      )}
                      <Badge variant="outline" className={statusColors[job.status] || ""}>
                        {job.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleJob} onOpenChange={(v) => !v && setRescheduleJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Reschedule Visit</DialogTitle>
          </DialogHeader>
          {rescheduleJob && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Move your visit from <strong>{format(new Date(rescheduleJob.scheduled_date), "MMM d, yyyy")}</strong> to a new date.
              </p>
              <div className="space-y-2">
                <Label>New Date</Label>
                <Input type="date" min={minDate} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setRescheduleJob(null)}>Cancel</Button>
                <Button
                  className="flex-1"
                  disabled={!newDate || rescheduleVisit.isPending}
                  onClick={() => rescheduleVisit.mutate({ jobId: rescheduleJob.id, date: newDate })}
                >
                  {rescheduleVisit.isPending ? "Moving..." : "Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-lg">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Job — {format(new Date(selectedJob.scheduled_date), "EEEE, MMM d, yyyy")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`${statusColors[selectedJob.status] || ""} capitalize`}>
                    {selectedJob.status.replace("_", " ")}
                  </Badge>
                  {selectedJob.subscriptions && (
                    <span className="text-sm text-muted-foreground capitalize">
                      {selectedJob.subscriptions.plan} · {selectedJob.subscriptions.frequency}
                    </span>
                  )}
                </div>
                {selectedJob.service_addresses && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {selectedJob.service_addresses.street}, {selectedJob.service_addresses.city}, {selectedJob.service_addresses.state} {selectedJob.service_addresses.zip}
                  </div>
                )}
                {selectedJob.notes && (
                  <p className="text-sm text-muted-foreground italic">{selectedJob.notes}</p>
                )}
                {selectedJob.started_at && (
                  <div className="text-sm text-muted-foreground">
                    Started: {format(new Date(selectedJob.started_at), "h:mm a")}
                    {selectedJob.completed_at && ` — Completed: ${format(new Date(selectedJob.completed_at), "h:mm a")}`}
                  </div>
                )}
                {(() => {
                  const jobProofs = getJobProofs(selectedJob.id);
                  const beforePhotos = jobProofs.filter((p: any) => p.proof_type === "before");
                  const afterPhotos = jobProofs.filter((p: any) => p.proof_type === "after");
                  if (jobProofs.length === 0) {
                    return (
                      <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                        <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        No proof photos for this job
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Camera className="h-4 w-4" /> Proof Photos
                      </h4>
                      {beforePhotos.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Before</p>
                          <div className="grid grid-cols-2 gap-2">
                            {beforePhotos.map((p: any) => (
                              <img key={p.id} src={p.image_url} alt="Before" className="rounded-lg border border-border object-cover w-full h-32" />
                            ))}
                          </div>
                        </div>
                      )}
                      {afterPhotos.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">After</p>
                          <div className="grid grid-cols-2 gap-2">
                            {afterPhotos.map((p: any) => (
                              <img key={p.id} src={p.image_url} alt="After" className="rounded-lg border border-border object-cover w-full h-32" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsTab;
