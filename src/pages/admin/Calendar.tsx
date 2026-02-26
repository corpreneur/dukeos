import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";

const statusBadge: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

type ViewMode = "week" | "month";

const AdminCalendar = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragJob, setDragJob] = useState<any>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<{ job: any; newDate: string } | null>(null);

  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, service_addresses(street, city), subscriptions(plan)")
        .order("scheduled_date", { ascending: true });
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

  const { data: techRoles } = useQuery({
    queryKey: ["admin-technicians"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      if (error) throw error;
      return data;
    },
  });

  const [filterTech, setFilterTech] = useState<string>("all");

  const techProfiles = useMemo(
    () => profiles?.filter((p: any) => techRoles?.some((t: any) => t.user_id === p.user_id)) || [],
    [profiles, techRoles]
  );

  const rescheduleJob = useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const { error } = await supabase.from("jobs").update({ scheduled_date: date }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Job rescheduled");
      setRescheduleDialog(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const days = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    // Extend to full weeks
    const calStart = startOfWeek(start, { weekStartsOn: 1 });
    const calEnd = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMode, currentDate]);

  const navigate = (dir: number) => {
    setCurrentDate((d) =>
      viewMode === "week" ? (dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1)) : dir > 0 ? addMonths(d, 1) : subMonths(d, 1)
    );
  };

  const getJobsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    let filtered = jobs?.filter((j: any) => j.scheduled_date === dateStr) || [];
    if (filterTech !== "all") {
      filtered = filtered.filter((j: any) => j.technician_id === filterTech);
    }
    return filtered;
  };

  const getTechName = (techId: string | null) => {
    if (!techId) return "Unassigned";
    const p = profiles?.find((pr: any) => pr.user_id === techId);
    return p?.full_name || techId.slice(0, 8);
  };

  const handleDragStart = (e: React.DragEvent, job: any) => {
    setDragJob(job);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!dragJob) return;
    const newDate = format(date, "yyyy-MM-dd");
    if (dragJob.scheduled_date === newDate) return;
    setRescheduleDialog({ job: dragJob, newDate });
    setDragJob(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const headerLabel =
    viewMode === "week"
      ? `${format(days[0], "MMM d")} – ${format(days[days.length - 1], "MMM d, yyyy")}`
      : format(currentDate, "MMMM yyyy");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Schedule Calendar</h2>
        <p className="text-sm text-muted-foreground mt-1">Drag jobs between days to reschedule</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="text-sm px-3">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-lg font-display font-semibold text-foreground">{headerLabel}</span>
        <div className="ml-auto flex gap-2">
          <Select value={filterTech} onValueChange={setFilterTech}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {techProfiles.map((t: any) => (
                <SelectItem key={t.user_id} value={t.user_id}>
                  {t.full_name || t.user_id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-md">
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="rounded-r-none"
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="rounded-l-none"
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-7"} gap-px bg-border rounded-lg overflow-hidden border border-border`}>
        {/* Day headers */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dayJobs = getJobsForDay(day);
          const today = isToday(day);
          const currentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={`bg-card min-h-[100px] ${viewMode === "month" ? "min-h-[90px]" : "min-h-[140px]"} p-1.5 transition-colors ${
                !currentMonth && viewMode === "month" ? "opacity-40" : ""
              } ${today ? "ring-2 ring-inset ring-primary/30" : ""}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className={`text-xs font-medium mb-1 ${today ? "text-primary" : "text-muted-foreground"}`}>
                {format(day, viewMode === "month" ? "d" : "d MMM")}
              </div>
              <div className="space-y-1">
                {dayJobs.slice(0, viewMode === "month" ? 3 : 10).map((job: any) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job)}
                    className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] cursor-grab active:cursor-grabbing border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                    <div className="flex-1 min-w-0 truncate">
                      <span className="font-medium">{job.service_addresses?.street}</span>
                    </div>
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${statusBadge[job.status] || ""}`}>
                      {job.status === "in_progress" ? "IP" : job.status.slice(0, 3)}
                    </Badge>
                  </div>
                ))}
                {dayJobs.length > (viewMode === "month" ? 3 : 10) && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayJobs.length - (viewMode === "month" ? 3 : 10)} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reschedule Confirmation Dialog */}
      <Dialog open={!!rescheduleDialog} onOpenChange={(v) => !v && setRescheduleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Reschedule Job?</DialogTitle>
          </DialogHeader>
          {rescheduleDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Move <strong>{rescheduleDialog.job.service_addresses?.street}</strong> from{" "}
                <strong>{format(new Date(rescheduleDialog.job.scheduled_date), "MMM d, yyyy")}</strong> to{" "}
                <strong>{format(new Date(rescheduleDialog.newDate), "MMM d, yyyy")}</strong>?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setRescheduleDialog(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    rescheduleJob.mutate({ id: rescheduleDialog.job.id, date: rescheduleDialog.newDate })
                  }
                  disabled={rescheduleJob.isPending}
                >
                  {rescheduleJob.isPending ? "Moving..." : "Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;
