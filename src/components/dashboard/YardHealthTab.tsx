import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Loader2, Leaf, Bug, Camera, CheckCircle2, Download } from "lucide-react";
import { generateYardHealthPDF } from "@/lib/pdf-generators";

const YardHealthTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState("");

  const { data: subscriptions } = useQuery({
    queryKey: ["customer-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, service_addresses(street, city)")
        .eq("active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const generateReport = async () => {
    const subId = selectedSub || subscriptions?.[0]?.id;
    if (!subId) return toast.error("No subscription selected");

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("yard-health-report", {
        body: { subscription_id: subId },
      });
      if (error) throw error;
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Yard Health Report</h2>
        <p className="text-muted-foreground text-sm mt-1">AI-powered analysis of your yard's condition</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {subscriptions && subscriptions.length > 1 && (
              <Select value={selectedSub} onValueChange={setSelectedSub}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.service_addresses?.street} — {s.plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={generateReport} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {loading ? "Analyzing..." : "Generate Report"}
            </Button>
            {report && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  generateYardHealthPDF({
                    address: report.address,
                    plan: report.plan,
                    frequency: report.frequency,
                    numDogs: report.num_dogs,
                    totalVisits: report.total_visits,
                    proofPhotos: report.proof_photos,
                    issuesFound: report.issues_found,
                    issuesResolved: report.issues_resolved,
                    aiAnalysis: report.ai_analysis,
                    generatedAt: report.generated_at,
                  })
                }
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            )}
          </div>

          {!report && !loading && (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground">Ready to Analyze</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Generate an AI-powered health report based on your service history, proof photos, and any yard issues found.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Camera className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-2xl font-display font-bold text-foreground">{report.total_visits}</div>
                <div className="text-xs text-muted-foreground">Total Visits</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Camera className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-2xl font-display font-bold text-foreground">{report.proof_photos}</div>
                <div className="text-xs text-muted-foreground">Proof Photos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Bug className="h-5 w-5 text-warning mx-auto mb-1" />
                <div className="text-2xl font-display font-bold text-foreground">{report.issues_found}</div>
                <div className="text-xs text-muted-foreground">Issues Found</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                <div className="text-2xl font-display font-bold text-foreground">{report.issues_resolved}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                AI Analysis — {report.address}
              </CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="capitalize">{report.plan} plan</Badge>
                <Badge variant="outline" className="capitalize">{report.frequency}</Badge>
                <Badge variant="outline">{report.num_dogs} dog{report.num_dogs !== 1 ? "s" : ""}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-display [&_h3]:font-semibold [&_strong]:text-foreground">
                {report.ai_analysis.split("\n").map((line: string, i: number) => {
                  if (line.startsWith("## ")) return <h2 key={i}>{line.replace("## ", "")}</h2>;
                  if (line.startsWith("### ")) return <h3 key={i}>{line.replace("### ", "")}</h3>;
                  if (line.startsWith("**") && line.endsWith("**")) return <p key={i}><strong>{line.replace(/\*\*/g, "")}</strong></p>;
                  if (line.startsWith("- ")) return <p key={i} className="ml-4">• {line.replace("- ", "")}</p>;
                  if (line.trim() === "") return <br key={i} />;
                  return <p key={i}>{line}</p>;
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                Generated {new Date(report.generated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default YardHealthTab;
