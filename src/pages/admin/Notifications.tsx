import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const AdminNotifications = () => {
  const { data: notifications, isLoading: loadingNotifs, error: errorNotifs } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: gateVerifications, isLoading: loadingGates, error: errorGates } = useQuery({
    queryKey: ["admin-gate-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gate_verifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: yardIssues, isLoading: loadingYard, error: errorYard } = useQuery({
    queryKey: ["admin-yard-issues-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yard_issues")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = loadingNotifs || loadingGates || loadingYard;
  const hasError = errorNotifs || errorGates || errorYard;

  const gateAlerts = gateVerifications?.filter((g: any) => !g.latch_secure) || [];
  const openYardIssues = yardIssues?.filter((y: any) => !y.resolved) || [];
  const upsellNotifs = notifications?.filter((n: any) => n.type === "yard_watch_upsell") || [];
  const enRouteNotifs = notifications?.filter((n: any) => n.type === "en_route") || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading notifications...</CardContent>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Failed to load notifications. Please refresh and try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Notifications & Alerts</h2>
        <p className="text-sm text-muted-foreground mt-1">Gate alerts, yard watch reports, and upsell tracking</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-destructive/10 p-2.5">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Gate Alerts</div>
              <div className="text-3xl font-display font-bold text-foreground mt-0.5">{gateAlerts.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-warning/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Open Yard Issues</div>
              <div className="text-3xl font-display font-bold text-foreground mt-0.5">{openYardIssues.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Upsells Sent</div>
              <div className="text-3xl font-display font-bold text-foreground mt-0.5">{upsellNotifs.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-success/10 p-2.5">
              <Bell className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">En Route Alerts</div>
              <div className="text-3xl font-display font-bold text-foreground mt-0.5">{enRouteNotifs.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gate" className="gap-2"><ShieldAlert className="h-4 w-4" />Gate Alerts</TabsTrigger>
          <TabsTrigger value="yard" className="gap-2"><AlertTriangle className="h-4 w-4" />Yard Issues</TabsTrigger>
          <TabsTrigger value="all" className="gap-2"><Bell className="h-4 w-4" />All Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="gate">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Gate Detected</TableHead>
                      <TableHead>Latch Secure</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gateVerifications?.map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell>{format(new Date(g.created_at), "MMM d, h:mm a")}</TableCell>
                        <TableCell>
                          <Badge variant={g.gate_detected ? "default" : "destructive"}>
                            {g.gate_detected ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={g.latch_secure ? "default" : "destructive"}>
                            {g.latch_secure ? "Secure" : "Unsecure"}
                          </Badge>
                        </TableCell>
                        <TableCell>{g.confidence_score ? `${(g.confidence_score * 100).toFixed(0)}%` : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={g.admin_alerted ? "secondary" : "outline"}>
                            {g.admin_alerted ? "Alerted" : "OK"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!gateVerifications?.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No gate verifications yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yard">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yardIssues?.map((y: any) => (
                      <TableRow key={y.id}>
                        <TableCell>{format(new Date(y.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="capitalize font-medium">{y.issue_type.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{y.notes || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={y.resolved ? "default" : "destructive"}>
                            {y.resolved ? "Resolved" : "Open"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!yardIssues?.length && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No yard issues reported</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Body</TableHead>
                      <TableHead>Channel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications?.map((n: any) => (
                      <TableRow key={n.id}>
                        <TableCell>{format(new Date(n.created_at), "MMM d, h:mm a")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">{n.type.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{n.title || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{n.body}</TableCell>
                        <TableCell className="uppercase text-xs text-muted-foreground">{n.channel}</TableCell>
                      </TableRow>
                    ))}
                    {!notifications?.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No notifications yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
