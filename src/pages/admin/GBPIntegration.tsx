import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, MessageSquare, TrendingUp, Settings2, Plus, ExternalLink, RefreshCw, Eye, BarChart3, Send } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

// Mock GBP metrics for demo
const MOCK_METRICS = [
  { label: "Search Views", value: "4,230", change: "+12%", up: true },
  { label: "Map Views", value: "1,847", change: "+8%", up: true },
  { label: "Website Clicks", value: "312", change: "+23%", up: true },
  { label: "Phone Calls", value: "89", change: "-3%", up: false },
];

const MOCK_REVIEWS = Array.from({ length: 12 }, (_, i) => {
  const names = ["Sarah M.", "James R.", "Linda K.", "Robert P.", "Emily W.", "David L.", "Maria G.", "Chris T.", "Amanda B.", "Kevin S.", "Jennifer H.", "Michael F."];
  const comments = [
    "Excellent service! Yard has never looked so clean.",
    "Very professional team. Always on time.",
    "Great value for the price. Highly recommend!",
    "Duke's crew is amazing. My dogs love them!",
    "Consistent quality every single week.",
    "Wish I'd found them sooner. 5 stars!",
    "Responsive customer service and great work.",
    "They go above and beyond every visit.",
    "Best pet waste removal in the DFW area.",
    "Trustworthy and thorough. Can't ask for more.",
    "Fair pricing and excellent communication.",
    "Professional from start to finish.",
  ];
  const ratings = [5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5, 5];
  return {
    id: `review-${i}`,
    reviewer_name: names[i],
    star_rating: ratings[i],
    comment: comments[i],
    reply: i < 4 ? "Thank you for your kind words! We love serving your family." : null,
    review_date: subDays(new Date(), i * 3 + Math.floor(Math.random() * 5)).toISOString(),
  };
});

const GBPIntegration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [accountName, setAccountName] = useState("");

  const { data: integration } = useQuery({
    queryKey: ["gbp-integration"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gbp_integrations")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["gbp-reviews"],
    queryFn: async () => {
      if (!integration) return MOCK_REVIEWS;
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("gbp_integration_id", integration.id)
        .order("review_date", { ascending: false });
      if (error) throw error;
      return data.length > 0 ? data : MOCK_REVIEWS;
    },
    enabled: true,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!locationId || !accountName) throw new Error("All fields required");
      const { error } = await supabase.from("gbp_integrations").insert({
        admin_user_id: user!.id,
        gbp_location_id: locationId,
        gbp_account_name: accountName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gbp-integration"] });
      toast.success("Google Business Profile connected!");
      setConnectOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!integration) return;
      const { error } = await supabase
        .from("gbp_integrations")
        .update(updates)
        .eq("id", integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gbp-integration"] });
      toast.success("Settings updated");
    },
  });

  const avgRating = (reviews || MOCK_REVIEWS).reduce((sum, r: any) => sum + r.star_rating, 0) / (reviews || MOCK_REVIEWS).length;
  const totalReviews = (reviews || MOCK_REVIEWS).length;
  const repliedCount = (reviews || MOCK_REVIEWS).filter((r: any) => r.reply).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Google Business Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage reviews, track performance, and automate reputation</p>
        </div>
        {!integration && (
          <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Connect GBP</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Connect Google Business Profile</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter your GBP details to connect your business listing.</p>
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Scoop Duke — McKinney" />
                </div>
                <div className="space-y-2">
                  <Label>GBP Location ID</Label>
                  <Input value={locationId} onChange={e => setLocationId(e.target.value)} placeholder="accounts/123/locations/456" />
                  <p className="text-xs text-muted-foreground">Find this in your Google Business Profile settings</p>
                </div>
                <Button className="w-full" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending}>
                  {connectMutation.isPending ? "Connecting..." : "Connect Profile"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MOCK_METRICS.map(m => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-display text-foreground">{m.value}</span>
                <span className={`text-xs font-medium ${m.up ? "text-success" : "text-destructive"}`}>{m.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(avgRating) ? "text-warning fill-warning" : "text-muted"}`} />
              ))}
            </div>
            <p className="text-3xl font-bold font-display text-foreground">{avgRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">{totalReviews} total reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <MessageSquare className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-3xl font-bold font-display text-foreground">{repliedCount}/{totalReviews}</p>
            <p className="text-xs text-muted-foreground">Reviews replied to</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <Send className="h-6 w-6 text-success mx-auto mb-1" />
            <p className="text-3xl font-bold font-display text-foreground">{integration?.auto_review_request !== false ? "Active" : "Paused"}</p>
            <p className="text-xs text-muted-foreground">Auto review requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-3 mt-4">
          {(reviews || MOCK_REVIEWS).map((r: any) => (
            <Card key={r.id || r.review_id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">{r.reviewer_name}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < r.star_rating ? "text-warning fill-warning" : "text-muted"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                    {r.reply && (
                      <div className="mt-2 pl-3 border-l-2 border-primary/30">
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Owner reply:</span> {r.reply}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(r.review_date), "MMM d")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Review Request Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Auto-Send Review Requests</Label>
                  <p className="text-xs text-muted-foreground">Send review requests after completed jobs</p>
                </div>
                <Switch
                  checked={integration?.auto_review_request !== false}
                  onCheckedChange={v => updateSettings.mutate({ auto_review_request: v })}
                />
              </div>
              <div className="space-y-2">
                <Label>Delay After Job Completion (hours)</Label>
                <Input
                  type="number"
                  defaultValue={integration?.review_request_delay_hours || 24}
                  onBlur={e => updateSettings.mutate({ review_request_delay_hours: parseInt(e.target.value) || 24 })}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>Review Request Template</Label>
                <Textarea
                  defaultValue={integration?.review_request_template || "Hi {{customer_name}}! Thanks for choosing Scoop Duke. We'd love your feedback — please leave us a review: {{review_link}}"}
                  onBlur={e => updateSettings.mutate({ review_request_template: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Available variables: {"{{customer_name}}"}, {"{{review_link}}"}</p>
              </div>
              {integration && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Connected Account</span><span className="text-foreground">{integration.gbp_account_name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Location ID</span><span className="font-mono text-foreground text-xs">{integration.gbp_location_id}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={integration.is_active ? "default" : "secondary"}>{integration.is_active ? "Active" : "Inactive"}</Badge></div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GBPIntegration;
