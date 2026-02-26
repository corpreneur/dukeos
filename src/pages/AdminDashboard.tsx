import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Leaf, LogOut, Users, CalendarDays, CreditCard, MapPin, Plus, Briefcase } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const tabs = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "jobs", label: "Jobs", icon: CalendarDays },
  { id: "customers", label: "Customers", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
] as const;

type TabId = (typeof tabs)[number]["id"];

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState({ subscription_id: "", address_id: "", scheduled_date: "", technician_id: "" });

  // Queries
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

  // Mutations
  const createJob = useMutation({
    mutationFn: async () => {
      const sub = subscriptions?.find((s: any) => s.id === newJobForm.subscription_id);
      const { error } = await supabase.from("jobs").insert({
        subscription_id: newJobForm.subscription_id,
        address_id: sub?.address_id || newJobForm.address_id,
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

  const activeJobs = jobs?.filter((j: any) => j.status === "scheduled" || j.status === "in_progress") || [];
  const completedJobs = jobs?.filter((j: any) => j.status === "completed") || [];
  const activeSubs = subscriptions?.filter((s: any) => s.active) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">DukeOS</span>
            <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab.id)} className="gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="container px-4 py-8">
        {activeTab === "overview" && (
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
        )}

        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">All Jobs</h2>
                <p className="text-muted-foreground text-sm mt-1">Schedule and manage jobs</p>
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
                            <SelectItem key={s.id} value={s.id}>
                              {s.plan} — {s.service_addresses?.street}
                            </SelectItem>
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
                            <SelectItem key={t.user_id} value={t.user_id}>
                              {t.full_name || t.user_id.slice(0, 8)}
                            </SelectItem>
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
                  {jobs?.map((job: any) => {
                    const techProfile = profiles?.find((p: any) => p.user_id === job.technician_id);
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{format(new Date(job.scheduled_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{job.service_addresses?.street}, {job.service_addresses?.city}</TableCell>
                        <TableCell className="capitalize">{job.subscriptions?.plan}</TableCell>
                        <TableCell>
                          <Select
                            value={job.technician_id || ""}
                            onValueChange={(v) => assignTechnician.mutate({ jobId: job.id, techId: v })}
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              {techProfiles?.map((t: any) => (
                                <SelectItem key={t.user_id} value={t.user_id}>
                                  {t.full_name || t.user_id.slice(0, 8)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[job.status] || ""}>{job.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={job.status}
                            onValueChange={(v) => updateJobStatus.mutate({ id: job.id, status: v })}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
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
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-foreground">Customers</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell>{p.phone || "—"}</TableCell>
                      <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-foreground">All Subscriptions</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions?.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium capitalize">{sub.plan}</TableCell>
                      <TableCell className="capitalize">{sub.frequency}</TableCell>
                      <TableCell>${(sub.price_cents / 100).toFixed(2)}</TableCell>
                      <TableCell>{sub.service_addresses?.street}, {sub.service_addresses?.city}</TableCell>
                      <TableCell>
                        <Badge variant={sub.active ? "default" : "secondary"}>
                          {sub.active ? "Active" : "Cancelled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
