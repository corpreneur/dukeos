import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, subDays, isAfter, startOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Briefcase,
  CheckCircle2,
  CreditCard,
  Users,
  TrendingUp,
  DollarSign,
  CalendarDays,
  Clock,
} from "lucide-react";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(38, 92%, 50%)",
  "hsl(152, 69%, 40%)",
  "hsl(var(--destructive))",
];

const AdminOverview = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("admin-overview-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, service_addresses(street, city), subscriptions(plan, customer_id, price_cents)")
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

  // Monthly recurring revenue
  const mrr = useMemo(() => {
    if (!activeSubs.length) return 0;
    return activeSubs.reduce((sum: number, s: any) => {
      const monthly =
        s.frequency === "weekly" ? s.price_cents * 4 :
        s.frequency === "biweekly" ? s.price_cents * 2 :
        s.price_cents;
      return sum + monthly;
    }, 0);
  }, [activeSubs]);

  // Job status breakdown for pie chart
  const statusBreakdown = useMemo(() => {
    if (!jobs?.length) return [];
    const counts: Record<string, number> = { scheduled: 0, in_progress: 0, completed: 0, cancelled: 0 };
    jobs.forEach((j: any) => { counts[j.status] = (counts[j.status] || 0) + 1; });
    return [
      { name: "Scheduled", value: counts.scheduled },
      { name: "In Progress", value: counts.in_progress },
      { name: "Completed", value: counts.completed },
      { name: "Cancelled", value: counts.cancelled },
    ].filter(d => d.value > 0);
  }, [jobs]);

  // Jobs per day (last 14 days) for area chart
  const jobsPerDay = useMemo(() => {
    if (!jobs?.length) return [];
    const days: { date: string; jobs: number; completed: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, "yyyy-MM-dd");
      const label = format(day, "MMM d");
      const dayJobs = jobs.filter((j: any) => j.scheduled_date === dayStr);
      days.push({
        date: label,
        jobs: dayJobs.length,
        completed: dayJobs.filter((j: any) => j.status === "completed").length,
      });
    }
    return days;
  }, [jobs]);

  // Revenue by plan for bar chart
  const revenueByPlan = useMemo(() => {
    if (!activeSubs.length) return [];
    const planTotals: Record<string, number> = {};
    activeSubs.forEach((s: any) => {
      const monthly =
        s.frequency === "weekly" ? s.price_cents * 4 :
        s.frequency === "biweekly" ? s.price_cents * 2 :
        s.price_cents;
      planTotals[s.plan] = (planTotals[s.plan] || 0) + monthly;
    });
    return Object.entries(planTotals).map(([plan, cents]) => ({
      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
      revenue: cents / 100,
    }));
  }, [activeSubs]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time business metrics and job activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Jobs</div>
              <div className="text-3xl font-display font-bold text-foreground mt-0.5">{activeJobs.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-3xl font-display font-bold text-foreground mt-0.5">{completedJobs.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Monthly Revenue</div>
              <div className="text-3xl font-display font-bold text-foreground mt-0.5">{formatCurrency(mrr)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Customers</div>
              <div className="text-3xl font-display font-bold text-foreground mt-0.5">{profiles?.length || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Job Activity - Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Job Activity (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={jobsPerDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="jobs" stroke="hsl(var(--primary))" fill="url(#jobsGradient)" strokeWidth={2} name="Scheduled" />
                  <Area type="monotone" dataKey="completed" stroke="hsl(152, 69%, 40%)" fill="url(#completedGradient)" strokeWidth={2} name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Job Status Breakdown - Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Job Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value: string) => (
                        <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No job data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Plan - Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Monthly Revenue by Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            {revenueByPlan.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByPlan} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="plan" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No subscription data</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Recent Jobs</CardTitle>
        </CardHeader>
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
