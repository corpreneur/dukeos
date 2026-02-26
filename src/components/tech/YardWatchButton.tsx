import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

const ISSUE_TYPES = [
  { id: "long_grass", label: "Long Grass", emoji: "🌿" },
  { id: "broken_fence", label: "Broken Fence", emoji: "🚧" },
  { id: "pest_infestation", label: "Pest Infestation", emoji: "🐛" },
  { id: "broken_sprinkler", label: "Broken Sprinkler", emoji: "💧" },
  { id: "other", label: "Other Issue", emoji: "⚠️" },
];

interface YardWatchButtonProps {
  jobId: string;
}

const YardWatchButton = ({ jobId }: YardWatchButtonProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!issueType || !user) return;
    setSubmitting(true);
    try {
      const response = await supabase.functions.invoke("yard-watch", {
        body: {
          job_id: jobId,
          issue_type: issueType,
          notes: notes || null,
          technician_id: user.id,
        },
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (data?.success) {
        toast.success("Issue reported! Customer will be notified.", {
          description: data.notification_sent
            ? "Upsell SMS queued for customer."
            : "Issue logged for admin review.",
        });
      } else {
        throw new Error(data?.error || "Unknown error");
      }

      setOpen(false);
      setIssueType("");
      setNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to report issue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
          <AlertTriangle className="h-3.5 w-3.5" /> Yard Watch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Report Yard Issue
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Issue Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {ISSUE_TYPES.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setIssueType(issue.id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${
                    issueType === issue.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg">{issue.emoji}</span>
                  <div className="font-medium text-foreground mt-1">{issue.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Describe what you see..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!issueType || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reporting...
              </>
            ) : (
              "Report & Notify Customer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YardWatchButton;
