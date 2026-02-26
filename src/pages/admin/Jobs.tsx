import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Filter, X } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminJobs = () => {
  const queryClient = useQueryClient();
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState({ subscription_id: "", scheduled_date: "", technician_id: "" });

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTech, setFilterTech] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const hasFilters = filterStatus !== "all" || filterTech !== "all" || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterTech("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  useEffect(() => {
    const channel = supabase
      .channel("admin-jobs-rt")
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
        .select("*, service_addresses(street, city)")
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

  const { data: technicians } = useQuery({
    queryKey: ["admin-technicians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "technician");
      if (error) throw error;
      return data;
    },
  });

  const techProfiles = profiles?.filter((p: any) =>
    technicians?.some((t: any) => t.user_id === p.user_id)
  );

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job: any) => {
      if (filterStatus !== "all" && job.status !== filterStatus) return false;
      if (filterTech !== "all" && job.technician_id !== filterTech) return false;
      if (filterDateFrom && job.scheduled_date < filterDateFrom) return false;
      if (filterDateTo && job.scheduled_date > filterDateTo) return false;
      return true;
    });
  }, [jobs, filterStatus, filterTech, filterDateFrom, filterDateTo]);

  const createJob = useMutation({
    mutationFn: async () => {
      const sub = subscriptions?.find((s: any) => s.id === newJobForm.subscription_id);
      const { error } = await supabase.from("jobs").insert({
        subscription_id: newJobForm.subscription_id,
        address_id: sub?.address_id,
        scheduled_date: newJobForm.scheduled_date,
        technician_id: newJobForm.technician_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Job created");
      setNewJobOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateJobStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("jobs").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Job updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const assignTechnician = useMutation({
    mutationFn: async ({ jobId, techId }: { jobId: string; techId: string }) => {
      const { error } = await supabase.from("jobs").update({ technician_id: techId }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Technician assigned");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">All Jobs</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}{hasFilters ? " (filtered)" : ""}
          </p>
        </div>
        <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Job</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Schedule Job</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subscription</Label>
                <Select value={newJobForm.subscription_id} onValueChange={(v) => setNewJobForm(p => ({ ...p, subscription_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subscription" /></SelectTrigger>
                  <SelectContent>
                    {subscriptions?.filter((s: any) => s.active).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.plan} — {s.service_addresses?.street}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newJobForm.scheduled_date} onChange={(e) => setNewJobForm(p => ({ ...p, scheduled_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Technician (optional)</Label>
                <Select value={newJobForm.technician_id} onValueChange={(v) => setNewJobForm(p => ({ ...p, technician_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {techProfiles?.map((t: any) => (
                      <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.user_id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => createJob.mutate()} disabled={!newJobForm.subscription_id || !newJobForm.scheduled_date || createJob.isPending}>
                {createJob.isPending ? "Creating..." : "Schedule Job"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Technician</Label>
          <Select value={filterTech} onValueChange={setFilterTech}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {techProfiles?.map((t: any) => (
                <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.user_id.slice(0, 8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" className="h-8 w-36" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" className="h-8 w-36" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job: any) => {
              const techProfile = profiles?.find((p: any) => p.user_id === job.technician_id);
              return (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{format(new Date(job.scheduled_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{job.service_addresses?.street}, {job.service_addresses?.city}</TableCell>
                  <TableCell className="capitalize">{job.subscriptions?.plan}</TableCell>
                  <TableCell>
                    <Select value={job.technician_id || ""} onValueChange={(v) => assignTechnician.mutate({ jobId: job.id, techId: v })}>
                      <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Assign" /></SelectTrigger>
                      <SelectContent>
                        {techProfiles?.map((t: any) => (
                          <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.user_id.slice(0, 8)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[job.status] || ""}>{job.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={job.status} onValueChange={(v) => updateJobStatus.mutate({ id: job.id, status: v })}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredJobs.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No jobs match filters</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminJobs;
