import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Camera, Sparkles } from "lucide-react";

const ISSUE_TYPES = [
  { id: "long_grass", label: "Long Grass", emoji: "🌿" },
  { id: "broken_fence", label: "Broken Fence", emoji: "🚧" },
  { id: "pest_infestation", label: "Pest Infestation", emoji: "🐛" },
  { id: "broken_sprinkler", label: "Broken Sprinkler", emoji: "💧" },
  { id: "standing_water", label: "Standing Water", emoji: "🌊" },
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState(false);
  const [aiResult, setAiResult] = useState<{ issue_type: string; description: string; confidence: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    // When photo is selected, switch to AI detection mode
    setAiMode(true);
    setIssueType(""); // Clear manual selection — AI will detect
    setAiResult(null);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!aiMode && !issueType) return;

    setSubmitting(true);
    try {
      let photoUrl: string | undefined;

      // Upload photo if provided
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `yard-watch/${jobId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("job-proofs").upload(path, photoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("job-proofs").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const body: any = {
        job_id: jobId,
        technician_id: user.id,
        notes: notes || null,
      };

      if (aiMode && photoUrl) {
        // Let AI detect the issue from the photo
        body.photo_url = photoUrl;
        // Don't send issue_type — let AI figure it out
      } else {
        body.issue_type = issueType;
        if (photoUrl) body.photo_url = photoUrl;
      }

      const response = await supabase.functions.invoke("yard-watch", { body });

      if (response.error) throw response.error;

      const data = response.data;
      if (data?.success) {
        const detectedType = data.detected_issue_type?.replace(/_/g, " ");
        const aiDetection = data.ai_detection;

        if (aiDetection) {
          setAiResult(aiDetection);
          toast.success(`AI detected: ${detectedType}`, {
            description: `${aiDetection.description} (${Math.round(aiDetection.confidence * 100)}% confidence). ${data.notification_sent ? "Customer notified!" : "Logged for review."}`,
            duration: 6000,
          });
        } else {
          toast.success("Issue reported! Customer will be notified.", {
            description: data.notification_sent
              ? "Upsell SMS queued for customer."
              : "Issue logged for admin review.",
          });
        }
      } else {
        throw new Error(data?.error || "Unknown error");
      }

      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to report issue");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIssueType("");
    setNotes("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setAiMode(false);
    setAiResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
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
          {/* AI Photo Detection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Snap a Photo (AI Auto-Detect)
            </Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Yard issue" className="w-full max-h-48 object-cover rounded-md" />
              ) : (
                <div className="py-4">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Tap to take a photo — AI will identify the issue</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
          </div>

          {aiMode && photoPreview && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              AI will analyze the photo to detect the issue type automatically
            </div>
          )}

          {/* Manual Selection (fallback or override) */}
          <div className="space-y-2">
            <Label>{aiMode ? "Or select manually (override AI)" : "Issue Type"}</Label>
            <div className="grid grid-cols-2 gap-2">
              {ISSUE_TYPES.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => { setIssueType(issue.id); setAiMode(false); }}
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
            disabled={(!aiMode && !issueType) || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {aiMode ? "Analyzing..." : "Reporting..."}
              </>
            ) : aiMode ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze & Report
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
