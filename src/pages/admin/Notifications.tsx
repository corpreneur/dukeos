import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Bell, AlertTriangle, ShieldAlert, TrendingUp, ImageIcon, X } from "lucide-react";
import { format } from "date-fns";

const AdminNotifications = () => {
  const [imageModal, setImageModal] = useState<string | null>(null);

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
        .select("*, job_proofs(image_url)")
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
  const upsellNotifs = notifications?.filter((n: any) => n.type === "yard_watch_upsell" || n.type === "sms_upsell") || [];
  const enRouteNotifs = notifications?.filter((n: any) => n.type === "en_route") || [];

  // Helper to get photo from notification metadata
  const getPhotoUrl = (n: any): string | null => {
    const meta = n.metadata as Record<string, any> | null;
    return meta?.photo_url || meta?.image_url || null;
  };

  // Thumbnail component
  const PhotoThumb = ({ url, onClick }: { url: string; onClick: () => void }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-[50px] h-[50px] rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-primary/50 transition-all shrink-0"
    >
      <img src={url} alt="Alert photo" className="w-full h-full object-cover" />
    </button>
  );

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
                      <TableHead className="w-16">Photo</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Gate Detected</TableHead>
                      <TableHead>Latch Secure</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gateVerifications?.map((g: any) => {
                      const proofUrl = Array.isArray(g.job_proofs) ? g.job_proofs[0]?.image_url : g.job_proofs?.image_url;
                      return (
                        <TableRow key={g.id}>
                          <TableCell>
                            {proofUrl ? (
                              <PhotoThumb url={proofUrl} onClick={() => setImageModal(proofUrl)} />
                            ) : (
                              <div className="w-[50px] h-[50px] rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
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
                      );
                    })}
                    {!gateVerifications?.length && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No gate verifications yet</TableCell></TableRow>
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
                      <TableHead className="w-16">Photo</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yardIssues?.map((y: any) => (
                      <TableRow key={y.id}>
                        <TableCell>
                          {y.photo_url ? (
                            <PhotoThumb url={y.photo_url} onClick={() => setImageModal(y.photo_url)} />
                          ) : (
                            <div className="w-[50px] h-[50px] rounded-md bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
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
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No yard issues reported</TableCell></TableRow>
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
                      <TableHead className="w-16">Photo</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Body</TableHead>
                      <TableHead>Channel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications?.map((n: any) => {
                      const photoUrl = getPhotoUrl(n);
                      return (
                        <TableRow key={n.id}>
                          <TableCell>
                            {photoUrl ? (
                              <PhotoThumb url={photoUrl} onClick={() => setImageModal(photoUrl)} />
                            ) : (
                              <div className="w-[50px] h-[50px] rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(n.created_at), "MMM d, h:mm a")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">{n.type.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{n.title || "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{n.body}</TableCell>
                          <TableCell className="uppercase text-xs text-muted-foreground">{n.channel}</TableCell>
                        </TableRow>
                      );
                    })}
                    {!notifications?.length && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No notifications yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full Image Modal */}
      <Dialog open={!!imageModal} onOpenChange={() => setImageModal(null)}>
        <DialogContent className="max-w-3xl p-2">
          {imageModal && (
            <img src={imageModal} alt="Full size alert photo" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
