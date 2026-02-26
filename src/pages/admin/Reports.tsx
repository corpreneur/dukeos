import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Download, FileText, TrendingUp, DollarSign, Users, Briefcase } from "lucide-react";
import { toast } from "sonner";

const RANGES = [
  { id: "7d", label: "Last 7 Days", days: 7 },
  { id: "30d", label: "Last 30 Days", days: 30 },
  { id: "90d", label: "Last 90 Days", days: 90 },
];

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const AdminReports = () => {
  const [range, setRange] = useState("30d");
  const days = RANGES.find((r) => r.id === range)!.days;
  const startDate = subDays(new Date(), days);

  const { data: jobs } = useQuery({
    queryKey: ["report-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, service_addresses(street, city, zip), subscriptions(plan, price_cents, customer_id, frequency)")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["report-subs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*, service_addresses(street, city, zip)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["report-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((j: any) => new Date(j.scheduled_date) >= startDate);
  }, [jobs, startDate]);

  // Revenue over time
  const revenueByDay = useMemo(() => {
    if (!filteredJobs.length) return [];
    const dayMap: Record<string, { revenue: number; jobs: number }> = {};
    filteredJobs.forEach((j: any) => {
      const day = j.scheduled_date;
      if (!dayMap[day]) dayMap[day] = { revenue: 0, jobs: 0 };
      dayMap[day].jobs += 1;
      if (j.status === "completed" && j.subscriptions?.price_cents) {
        const perVisit = j.subscriptions.frequency === "weekly"
          ? j.subscriptions.price_cents / 4
          : j.subscriptions.frequency === "biweekly"
          ? j.subscriptions.price_cents / 2
          : j.subscriptions.price_cents;
        dayMap[day].revenue += perVisit;
      }
    });
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date: format(new Date(date), "MMM d"),
        revenue: d.revenue / 100,
        jobs: d.jobs,
      }));
  }, [filteredJobs]);

  // KPI cards
  const totalJobs = filteredJobs.length;
  const completedJobs = filteredJobs.filter((j: any) => j.status === "completed").length;
  const totalRevenue = revenueByDay.reduce((s, d) => s + d.revenue, 0);
  const activeSubs = subscriptions?.filter((s: any) => s.active).length || 0;

  // CSV exports
  const exportJobs = () => {
    if (!filteredJobs.length) return toast.error("No jobs to export");
    const headers = ["Date", "Status", "Address", "City", "ZIP", "Plan", "Technician ID"];
    const rows = filteredJobs.map((j: any) => [
      j.scheduled_date,
      j.status,
      j.service_addresses?.street || "",
      j.service_addresses?.city || "",
      j.service_addresses?.zip || "",
      j.subscriptions?.plan || "",
      j.technician_id || "unassigned",
    ]);
    downloadCsv(`jobs-${range}.csv`, toCsv(headers, rows));
    toast.success(`Exported ${rows.length} jobs`);
  };

  const exportCustomers = () => {
    if (!profiles?.length) return toast.error("No customers to export");
    const headers = ["Name", "Phone", "Joined"];
    const rows = profiles.map((p: any) => [
      p.full_name || "",
      p.phone || "",
      format(new Date(p.created_at), "yyyy-MM-dd"),
    ]);
    downloadCsv("customers.csv", toCsv(headers, rows));
    toast.success(`Exported ${rows.length} customers`);
  };

  const exportSubscriptions = () => {
    if (!subscriptions?.length) return toast.error("No subscriptions to export");
    const headers = ["Plan", "Frequency", "Dogs", "Price/mo", "Active", "Address", "City", "Started"];
    const rows = subscriptions.map((s: any) => [
      s.plan,
      s.frequency,
      String(s.num_dogs),
      (s.price_cents / 100).toFixed(2),
      s.active ? "Yes" : "No",
      s.service_addresses?.street || "",
      s.service_addresses?.city || "",
      format(new Date(s.started_at), "yyyy-MM-dd"),
    ]);
    downloadCsv("subscriptions.csv", toCsv(headers, rows));
    toast.success(`Exported ${rows.length} subscriptions`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">Revenue analytics and data exports</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Revenue ({RANGES.find(r => r.id === range)?.label})</div>
              <div className="text-3xl font-display font-bold text-foreground">${totalRevenue.toFixed(0)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
              <div className="text-3xl font-display font-bold text-foreground">{totalJobs}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
              <div className="text-3xl font-display font-bold text-foreground">
                {totalJobs ? Math.round((completedJobs / totalJobs) * 100) : 0}%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Subscriptions</div>
              <div className="text-3xl font-display font-bold text-foreground">{activeSubs}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Revenue & Jobs Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis yAxisId="revenue" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="jobs" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue ($)" dot={false} />
                  <Line yAxisId="jobs" type="monotone" dataKey="jobs" stroke="hsl(152, 69%, 40%)" strokeWidth={2} name="Jobs" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data for this period</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            Data Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" className="gap-2 justify-start" onClick={exportJobs}>
              <FileText className="h-4 w-4" />
              Export Jobs CSV
            </Button>
            <Button variant="outline" className="gap-2 justify-start" onClick={exportCustomers}>
              <Users className="h-4 w-4" />
              Export Customers CSV
            </Button>
            <Button variant="outline" className="gap-2 justify-start" onClick={exportSubscriptions}>
              <DollarSign className="h-4 w-4" />
              Export Subscriptions CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
