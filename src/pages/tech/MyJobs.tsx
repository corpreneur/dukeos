import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Camera, Play, CheckCircle2, Navigation } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const TechMyJobs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [proofJobId, setProofJobId] = useState<string | null>(null);
  const [proofType, setProofType] = useState<"before" | "after">("before");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel("tech-jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tech-jobs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["tech-jobs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, service_addresses(street, city, state, zip, lat, lng)")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: proofs } = useQuery({
    queryKey: ["tech-proofs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_proofs").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "in_progress") updates.started_at = new Date().toISOString();
      if (status === "completed") updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from("jobs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-jobs"] });
      toast.success("Job updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proofJobId || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${proofJobId}/${proofType}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("job-proofs").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("job-proofs").getPublicUrl(path);
      const { error: insertError } = await supabase.from("job_proofs").insert({
        job_id: proofJobId, proof_type: proofType, image_url: urlData.publicUrl, uploaded_by: user.id,
      });
      if (insertError) throw insertError;
      queryClient.invalidateQueries({ queryKey: ["tech-proofs"] });
      toast.success(`${proofType} photo uploaded`);
      setProofJobId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const openProofDialog = (jobId: string, type: "before" | "after") => {
    setProofJobId(jobId);
    setProofType(type);
    setTimeout(() => fileRef.current?.click(), 100);
  };

  const todayJobs = jobs?.filter((j: any) => j.status !== "cancelled") || [];
  const scheduledJobs = todayJobs.filter((j: any) => j.status === "scheduled");
  const inProgressJobs = todayJobs.filter((j: any) => j.status === "in_progress");
  const completedJobs = todayJobs.filter((j: any) => j.status === "completed");

  const openNavigation = (addr: any) => {
    const q = encodeURIComponent(`${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`);
    window.open(`https://maps.google.com/maps?q=${q}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-display font-bold text-foreground">{scheduledJobs.length}</div><div className="text-xs text-muted-foreground">Scheduled</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-display font-bold text-warning">{inProgressJobs.length}</div><div className="text-xs text-muted-foreground">In Progress</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-display font-bold text-success">{completedJobs.length}</div><div className="text-xs text-muted-foreground">Done</div></CardContent></Card>
      </div>

      <h2 className="text-xl font-display font-bold text-foreground">My Jobs</h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !todayJobs.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No jobs assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todayJobs.map((job: any) => {
            const jobProofs = proofs?.filter((p: any) => p.job_id === job.id) || [];
            const hasBefore = jobProofs.some((p: any) => p.proof_type === "before");
            const hasAfter = jobProofs.some((p: any) => p.proof_type === "after");
            return (
              <Card key={job.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display font-semibold text-foreground">
                        {format(new Date(job.scheduled_date), "EEEE, MMM d")}
                      </div>
                      {job.service_addresses && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.service_addresses.street}, {job.service_addresses.city}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={statusColors[job.status]}>{job.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {job.service_addresses && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => openNavigation(job.service_addresses)}>
                        <Navigation className="h-3.5 w-3.5" /> Navigate
                      </Button>
                    )}
                    {job.status === "scheduled" && (
                      <Button size="sm" className="gap-1" onClick={() => updateStatus.mutate({ id: job.id, status: "in_progress" })}>
                        <Play className="h-3.5 w-3.5" /> Start Job
                      </Button>
                    )}
                    {job.status === "in_progress" && (
                      <Button size="sm" className="gap-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => updateStatus.mutate({ id: job.id, status: "completed" })}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button variant={hasBefore ? "secondary" : "outline"} size="sm" className="gap-1 flex-1" onClick={() => openProofDialog(job.id, "before")}>
                      <Camera className="h-3.5 w-3.5" /> {hasBefore ? "✓ Before" : "Before Photo"}
                    </Button>
                    <Button variant={hasAfter ? "secondary" : "outline"} size="sm" className="gap-1 flex-1" onClick={() => openProofDialog(job.id, "after")}>
                      <Camera className="h-3.5 w-3.5" /> {hasAfter ? "✓ After" : "After Photo"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUploadProof} />
    </div>
  );
};

export default TechMyJobs;
