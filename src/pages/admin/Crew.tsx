import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Award, Calendar, BarChart3, Plus, Trash2 } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminCrew = () => {
  const queryClient = useQueryClient();
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [skillForm, setSkillForm] = useState({ technician_id: "", skill: "", certified: false, expires_at: "" });

  // Fetch all technicians (profiles with technician role)
  const { data: techRoles } = useQuery({
    queryKey: ["admin-technicians"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
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

  const techProfiles = profiles?.filter((p: any) =>
    techRoles?.some((t: any) => t.user_id === p.user_id)
  ) || [];

  // Time entries
  const { data: timeEntries } = useQuery({
    queryKey: ["admin-time-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*, jobs(scheduled_date, service_addresses(street, city))")
        .order("clock_in", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Skills
  const { data: skills } = useQuery({
    queryKey: ["admin-skills"],
    queryFn: async () => {
      const { data, error } = await supabase.from("technician_skills").select("*").order("skill");
      if (error) throw error;
      return data;
    },
  });

  // Availability
  const { data: availability } = useQuery({
    queryKey: ["admin-availability"],
    queryFn: async () => {
      const { data, error } = await supabase.from("technician_availability").select("*").order("day_of_week");
      if (error) throw error;
      return data;
    },
  });

  // Jobs for performance
  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const addSkill = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("technician_skills").insert({
        technician_id: skillForm.technician_id,
        skill: skillForm.skill,
        certified: skillForm.certified,
        expires_at: skillForm.expires_at || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success("Skill added");
      setAddSkillOpen(false);
      setSkillForm({ technician_id: "", skill: "", certified: false, expires_at: "" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technician_skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success("Skill removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const upsertAvailability = useMutation({
    mutationFn: async (entry: { technician_id: string; day_of_week: number; is_available: boolean; start_time: string; end_time: string }) => {
      const { error } = await supabase.from("technician_availability").upsert(
        { ...entry },
        { onConflict: "technician_id,day_of_week" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-availability"] });
      toast.success("Availability updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getTechName = (techId: string) => {
    const p = profiles?.find((p: any) => p.user_id === techId);
    return p?.full_name || techId.slice(0, 8);
  };

  // Performance calculations
  const getPerformanceStats = () => {
    return techProfiles.map((tech: any) => {
      const techJobs = jobs?.filter((j: any) => j.technician_id === tech.user_id) || [];
      const completed = techJobs.filter((j: any) => j.status === "completed");
      const techTime = timeEntries?.filter((t: any) => t.technician_id === tech.user_id && t.clock_out) || [];
      const totalMinutes = techTime.reduce((sum: number, t: any) => sum + differenceInMinutes(new Date(t.clock_out), new Date(t.clock_in)), 0);
      const avgMinutes = completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0;

      return {
        id: tech.user_id,
        name: tech.full_name || tech.user_id.slice(0, 8),
        totalJobs: techJobs.length,
        completed: completed.length,
        inProgress: techJobs.filter((j: any) => j.status === "in_progress").length,
        totalHours: (totalMinutes / 60).toFixed(1),
        avgMinutesPerJob: avgMinutes,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Crew Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Track time, skills, availability, and performance</p>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance" className="gap-2"><BarChart3 className="h-4 w-4" />Performance</TabsTrigger>
          <TabsTrigger value="time" className="gap-2"><Clock className="h-4 w-4" />Time Tracking</TabsTrigger>
          <TabsTrigger value="skills" className="gap-2"><Award className="h-4 w-4" />Skills</TabsTrigger>
          <TabsTrigger value="availability" className="gap-2"><Calendar className="h-4 w-4" />Availability</TabsTrigger>
        </TabsList>

        {/* Performance Dashboard */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Total Technicians</div>
                <div className="text-3xl font-display font-bold text-foreground mt-1">{techProfiles.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Total Time Entries</div>
                <div className="text-3xl font-display font-bold text-foreground mt-1">{timeEntries?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Skills Tracked</div>
                <div className="text-3xl font-display font-bold text-foreground mt-1">{skills?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Active Today</div>
                <div className="text-3xl font-display font-bold text-foreground mt-1">
                  {timeEntries?.filter((t: any) => !t.clock_out && new Date(t.clock_in).toDateString() === new Date().toDateString()).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="font-display">Technician Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technician</TableHead>
                      <TableHead>Total Jobs</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Hours Logged</TableHead>
                      <TableHead>Avg Min/Job</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPerformanceStats().map((stat: any) => (
                      <TableRow key={stat.id}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell>{stat.totalJobs}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">{stat.completed}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{stat.inProgress}</Badge>
                        </TableCell>
                        <TableCell>{stat.totalHours}h</TableCell>
                        <TableCell>{stat.avgMinutesPerJob > 0 ? `${stat.avgMinutesPerJob} min` : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {techProfiles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No technicians found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tracking */}
        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="font-display">Recent Time Entries</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technician</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries?.map((entry: any) => {
                      const duration = entry.clock_out
                        ? differenceInMinutes(new Date(entry.clock_out), new Date(entry.clock_in))
                        : null;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{getTechName(entry.technician_id)}</TableCell>
                          <TableCell>{format(new Date(entry.clock_in), "MMM d, h:mm a")}</TableCell>
                          <TableCell>
                            {entry.clock_out ? format(new Date(entry.clock_out), "h:mm a") : (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {duration !== null ? `${Math.floor(duration / 60)}h ${duration % 60}m` : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{entry.notes || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {(!timeEntries || timeEntries.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No time entries yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Add Skill</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">Add Skill / Certification</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Technician</Label>
                    <Select value={skillForm.technician_id} onValueChange={(v) => setSkillForm(p => ({ ...p, technician_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                      <SelectContent>
                        {techProfiles.map((t: any) => (
                          <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.user_id.slice(0, 8)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Skill Name</Label>
                    <Input value={skillForm.skill} onChange={(e) => setSkillForm(p => ({ ...p, skill: e.target.value }))} placeholder="e.g. Lawn Mowing, Pesticide Application" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={skillForm.certified} onCheckedChange={(v) => setSkillForm(p => ({ ...p, certified: v }))} />
                    <Label>Certified</Label>
                  </div>
                  {skillForm.certified && (
                    <div className="space-y-2">
                      <Label>Certification Expires</Label>
                      <Input type="date" value={skillForm.expires_at} onChange={(e) => setSkillForm(p => ({ ...p, expires_at: e.target.value }))} />
                    </div>
                  )}
                  <Button className="w-full" onClick={() => addSkill.mutate()} disabled={!skillForm.technician_id || !skillForm.skill || addSkill.isPending}>
                    {addSkill.isPending ? "Adding..." : "Add Skill"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technician</TableHead>
                      <TableHead>Skill</TableHead>
                      <TableHead>Certified</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skills?.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{getTechName(s.technician_id)}</TableCell>
                        <TableCell>{s.skill}</TableCell>
                        <TableCell>
                          {s.certified ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">Certified</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>{s.expires_at ? format(new Date(s.expires_at), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteSkill.mutate(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!skills || skills.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No skills tracked yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability */}
        <TabsContent value="availability" className="space-y-4">
          {techProfiles.map((tech: any) => {
            const techAvail = availability?.filter((a: any) => a.technician_id === tech.user_id) || [];
            return (
              <Card key={tech.user_id}>
                <CardHeader>
                  <CardTitle className="font-display text-base">{tech.full_name || tech.user_id.slice(0, 8)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {DAYS.map((day, idx) => {
                      const entry = techAvail.find((a: any) => a.day_of_week === idx);
                      const isAvailable = entry?.is_available ?? (idx >= 1 && idx <= 5);
                      const startTime = entry?.start_time ?? "08:00";
                      const endTime = entry?.end_time ?? "17:00";

                      return (
                        <div key={idx} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                          <div className="w-24 text-sm font-medium text-foreground">{day}</div>
                          <Switch
                            checked={isAvailable}
                            onCheckedChange={(v) =>
                              upsertAvailability.mutate({
                                technician_id: tech.user_id,
                                day_of_week: idx,
                                is_available: v,
                                start_time: startTime,
                                end_time: endTime,
                              })
                            }
                          />
                          {isAvailable && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                className="w-32 h-8"
                                defaultValue={startTime}
                                onBlur={(e) =>
                                  upsertAvailability.mutate({
                                    technician_id: tech.user_id,
                                    day_of_week: idx,
                                    is_available: true,
                                    start_time: e.target.value,
                                    end_time: endTime,
                                  })
                                }
                              />
                              <span className="text-muted-foreground text-sm">to</span>
                              <Input
                                type="time"
                                className="w-32 h-8"
                                defaultValue={endTime}
                                onBlur={(e) =>
                                  upsertAvailability.mutate({
                                    technician_id: tech.user_id,
                                    day_of_week: idx,
                                    is_available: true,
                                    start_time: startTime,
                                    end_time: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}
                          {!isAvailable && <span className="text-sm text-muted-foreground">Off</span>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {techProfiles.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No technicians found</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCrew;
