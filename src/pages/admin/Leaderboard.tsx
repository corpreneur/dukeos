import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Star, Flame, Target, Zap, Award } from "lucide-react";
import { differenceInMinutes } from "date-fns";

const BADGES_CONFIG = [
  { id: "speed_demon", name: "Speed Demon", icon: Zap, color: "text-amber-500", desc: "Avg < 20 min/job", check: (s: any) => s.avgMinutes > 0 && s.avgMinutes < 20 },
  { id: "completionist", name: "Completionist", icon: Target, color: "text-success", desc: "95%+ completion rate", check: (s: any) => s.totalJobs > 5 && s.completionRate >= 95 },
  { id: "workhorse", name: "Workhorse", icon: Flame, color: "text-destructive", desc: "25+ jobs completed", check: (s: any) => s.completed >= 25 },
  { id: "perfectionist", name: "Perfectionist", icon: Star, color: "text-primary", desc: "Zero cancellations", check: (s: any) => s.totalJobs > 5 && s.cancelled === 0 },
  { id: "reliable", name: "Reliable", icon: Award, color: "text-violet-500", desc: "100+ hours logged", check: (s: any) => s.totalHours >= 100 },
];

const RANK_ICONS = [
  { icon: Trophy, color: "text-amber-500" },
  { icon: Medal, color: "text-slate-400" },
  { icon: Medal, color: "text-amber-700" },
];

const AdminLeaderboard = () => {
  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*");
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

  const { data: timeEntries } = useQuery({
    queryKey: ["admin-time-entries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("time_entries").select("*");
      if (error) throw error;
      return data;
    },
  });

  const techProfiles = useMemo(
    () => profiles?.filter((p: any) => techRoles?.some((t: any) => t.user_id === p.user_id)) || [],
    [profiles, techRoles]
  );

  const leaderboard = useMemo(() => {
    return techProfiles
      .map((tech: any) => {
        const techJobs = jobs?.filter((j: any) => j.technician_id === tech.user_id) || [];
        const completed = techJobs.filter((j: any) => j.status === "completed").length;
        const cancelled = techJobs.filter((j: any) => j.status === "cancelled").length;
        const totalJobs = techJobs.length;
        const completionRate = totalJobs > 0 ? Math.round((completed / totalJobs) * 100) : 0;

        const techTime = timeEntries?.filter((t: any) => t.technician_id === tech.user_id && t.clock_out) || [];
        const totalMinutes = techTime.reduce(
          (sum: number, t: any) => sum + differenceInMinutes(new Date(t.clock_out), new Date(t.clock_in)),
          0
        );
        const totalHours = totalMinutes / 60;
        const avgMinutes = completed > 0 ? Math.round(totalMinutes / completed) : 0;

        // Score: weighted combination
        const score = completed * 10 + completionRate * 2 + (avgMinutes > 0 ? Math.max(0, 50 - avgMinutes) : 0);

        const stats = { totalJobs, completed, cancelled, completionRate, totalHours, avgMinutes, score };
        const badges = BADGES_CONFIG.filter((b) => b.check(stats));

        return {
          id: tech.user_id,
          name: tech.full_name || tech.user_id.slice(0, 8),
          ...stats,
          badges,
        };
      })
      .sort((a: any, b: any) => b.score - a.score);
  }, [techProfiles, jobs, timeEntries]);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Crew Leaderboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Performance rankings, badges, and gamification</p>
      </div>

      {/* Podium */}
      {topThree.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {topThree.map((tech: any, idx: number) => {
            const RankIcon = RANK_ICONS[idx]?.icon || Medal;
            const rankColor = RANK_ICONS[idx]?.color || "text-muted-foreground";
            return (
              <Card key={tech.id} className={idx === 0 ? "border-amber-500/30 bg-amber-500/5 sm:order-2 sm:-mt-4" : idx === 1 ? "sm:order-1" : "sm:order-3"}>
                <CardContent className="p-6 text-center space-y-3">
                  <RankIcon className={`h-10 w-10 mx-auto ${rankColor}`} />
                  <div>
                    <div className="font-display font-bold text-lg text-foreground">{tech.name}</div>
                    <div className="text-sm text-muted-foreground">#{idx + 1} Overall</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xl font-bold text-foreground">{tech.completed}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Jobs</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-foreground">{tech.completionRate}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Rate</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-foreground">{tech.avgMinutes || "—"}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Min/Job</div>
                    </div>
                  </div>
                  {tech.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center pt-2 border-t border-border">
                      {tech.badges.map((b: any) => (
                        <Badge key={b.id} variant="outline" className="gap-1 text-xs">
                          <b.icon className={`h-3 w-3 ${b.color}`} /> {b.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Badge Legend */}
      <Card>
        <CardHeader><CardTitle className="font-display text-base">Achievement Badges</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {BADGES_CONFIG.map((b) => (
              <div key={b.id} className="flex items-center gap-2 text-sm">
                <b.icon className={`h-4 w-4 ${b.color}`} />
                <span className="font-medium text-foreground">{b.name}</span>
                <span className="text-muted-foreground">— {b.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Rankings Table */}
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Full Rankings</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Jobs Done</TableHead>
                    <TableHead>Completion %</TableHead>
                    <TableHead>Avg Min/Job</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Badges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((tech: any, idx: number) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-bold">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{tech.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{tech.score}</Badge>
                      </TableCell>
                      <TableCell>{tech.completed}</TableCell>
                      <TableCell>{tech.completionRate}%</TableCell>
                      <TableCell>{tech.avgMinutes > 0 ? `${tech.avgMinutes}m` : "—"}</TableCell>
                      <TableCell>{tech.totalHours.toFixed(1)}h</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {tech.badges.map((b: any) => (
                            <b.icon key={b.id} className={`h-4 w-4 ${b.color}`} title={b.name} />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLeaderboard;
