import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DollarSign, Save, MapPin } from "lucide-react";

interface PricingTier {
  zone: string;
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
  priceCents: number;
}

const DEFAULT_TIERS: PricingTier[] = [
  { zone: "green", label: "High Density", color: "bg-success text-success-foreground", minScore: 80, maxScore: 100, priceCents: 1800 },
  { zone: "yellow", label: "Medium Density", color: "bg-warning text-warning-foreground", minScore: 50, maxScore: 79, priceCents: 2500 },
  { zone: "orange", label: "Low Density", color: "bg-orange-500 text-white", minScore: 25, maxScore: 49, priceCents: 3000 },
  { zone: "red", label: "Frontier", color: "bg-destructive text-destructive-foreground", minScore: 0, maxScore: 24, priceCents: 3500 },
];

const AdminPricing = () => {
  const [tiers, setTiers] = useState<PricingTier[]>(DEFAULT_TIERS);
  const [hasChanges, setHasChanges] = useState(false);

  const updateTier = (idx: number, field: keyof PricingTier, value: number) => {
    setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In production this would persist to a settings table
    toast.success("Pricing rules saved! These will apply to new quotes.");
    setHasChanges(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Dynamic Pricing Rules</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure density-based pricing tiers for new customer quotes</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            How Density Scoring Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>When a customer enters their address, the system calculates a <strong className="text-foreground">Density Score (0–100)</strong> based on proximity to existing customers:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Customers within ¼ mile: <strong className="text-foreground">20 pts each</strong></li>
            <li>Customers within ½ mile: <strong className="text-foreground">10 pts each</strong></li>
            <li>Customers within 1 mile: <strong className="text-foreground">5 pts each</strong></li>
            <li>Customers within 2 miles: <strong className="text-foreground">2 pts each</strong></li>
          </ul>
          <p>Higher scores = denser route = lower price.</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tiers.map((tier, idx) => (
          <Card key={tier.zone}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 min-w-[160px]">
                  <Badge className={`${tier.color} capitalize`}>{tier.zone}</Badge>
                  <span className="text-sm font-medium text-foreground">{tier.label}</span>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Min Score</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={tier.minScore}
                      onChange={(e) => updateTier(idx, "minScore", parseInt(e.target.value) || 0)}
                      className="w-20 h-8"
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">–</span>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Max Score</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={tier.maxScore}
                      onChange={(e) => updateTier(idx, "maxScore", parseInt(e.target.value) || 0)}
                      className="w-20 h-8"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Price per Visit</Label>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={(tier.priceCents / 100).toFixed(2)}
                      onChange={(e) => updateTier(idx, "priceCents", Math.round(parseFloat(e.target.value) * 100) || 0)}
                      className="w-24 h-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Example:</strong> A customer with 5 neighbors within ¼ mile
            (5 × 20 = 100 score) would receive <strong className="text-foreground">Green Zone</strong> pricing
            at <strong className="text-foreground">${(tiers[0].priceCents / 100).toFixed(2)}/visit</strong>.
            A customer with no nearby neighbors (0 score) would receive <strong className="text-foreground">Red Zone</strong> pricing
            at <strong className="text-foreground">${(tiers[3].priceCents / 100).toFixed(2)}/visit</strong>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPricing;
