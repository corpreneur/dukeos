import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Dog, CalendarDays, DollarSign, CheckCircle2, ArrowLeft, ArrowRight, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Address", "Service", "Dogs & Frequency", "Pricing", "Confirm"];

const SERVICE_TYPES = [
  { id: "pet_waste_removal", label: "Pet Waste Removal", description: "Weekly scooping and sanitizing of your yard" },
];

const FREQUENCIES = [
  { id: "weekly", label: "Once a Week", multiplier: 4 },
  { id: "biweekly", label: "Twice a Week", multiplier: 8 },
  { id: "monthly", label: "Once a Month", multiplier: 1 },
];

const DOG_OPTIONS = [1, 2, 3, 4];

const BookingWizard = ({ onComplete }: { onComplete?: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState("");
  const [serviceType, setServiceType] = useState("pet_waste_removal");
  const [numDogs, setNumDogs] = useState(1);
  const [frequency, setFrequency] = useState("weekly");
  const [densityData, setDensityData] = useState<any>(null);
  const [loadingDensity, setLoadingDensity] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ["my-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_addresses")
        .select("*")
        .eq("customer_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const selectedAddress = addresses?.find((a: any) => a.id === addressId);

  // Fetch density score when address is selected
  const fetchDensityScore = async (addr: any) => {
    if (!addr?.lat || !addr?.lng) {
      setDensityData({
        density_score: 50,
        zone: "yellow",
        price_per_visit_cents: 2500,
        message: "Standard pricing for your area.",
        nearby_customers: 0,
      });
      return;
    }

    setLoadingDensity(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/density-score`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ lat: addr.lat, lng: addr.lng }),
        }
      );
      if (!response.ok) throw new Error("Failed to get density score");
      const data = await response.json();
      setDensityData(data);
    } catch (err) {
      console.error("Density score error:", err);
      setDensityData({
        density_score: 50,
        zone: "yellow",
        price_per_visit_cents: 2500,
        message: "Standard pricing applied.",
      });
    } finally {
      setLoadingDensity(false);
    }
  };

  const pricePerVisit = densityData?.price_per_visit_cents || 2500;
  const dogSurcharge = (numDogs - 1) * 500; // $5 per extra dog
  const perVisitTotal = pricePerVisit + dogSurcharge;
  const frequencyConfig = FREQUENCIES.find((f) => f.id === frequency)!;
  const monthlyTotal = perVisitTotal * frequencyConfig.multiplier;

  const zoneColors: Record<string, string> = {
    green: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    yellow: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    red: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const createSubscription = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("subscriptions").insert({
        customer_id: user!.id,
        address_id: addressId,
        plan: serviceType,
        frequency,
        price_cents: monthlyTotal,
        num_dogs: numDogs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription created! Your first service will be scheduled soon.");
      onComplete?.();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const canProceed = () => {
    if (step === 0) return !!addressId;
    if (step === 1) return !!serviceType;
    if (step === 2) return !!numDogs && !!frequency;
    return true;
  };

  const handleNext = () => {
    if (step === 0 && selectedAddress) {
      fetchDensityScore(selectedAddress);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-2 w-full rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
            <span className={cn("text-[10px]", i <= step ? "text-foreground" : "text-muted-foreground")}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Step 0: Address */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Select Service Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!addresses?.length ? (
              <p className="text-sm text-muted-foreground">
                No addresses yet. Add one in the Addresses tab first.
              </p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr: any) => (
                  <button
                    key={addr.id}
                    onClick={() => setAddressId(addr.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all",
                      addressId === addr.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium text-foreground">{addr.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {addr.street}, {addr.city}, {addr.state} {addr.zip}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Service */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Choose Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            {SERVICE_TYPES.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setServiceType(svc.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  serviceType === svc.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium text-foreground">{svc.label}</div>
                <div className="text-sm text-muted-foreground">{svc.description}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Dogs & Frequency */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Dog className="h-5 w-5 text-primary" />
              Dogs & Frequency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Number of Dogs</Label>
              <div className="flex gap-2">
                {DOG_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumDogs(n)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border text-center font-medium transition-all",
                      numDogs === n
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-border text-foreground hover:border-primary/50"
                    )}
                  >
                    {n}{n === 4 ? "+" : ""}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Frequency</Label>
              <div className="space-y-2">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFrequency(f.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      frequency === f.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium text-foreground">{f.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Your Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDensity ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Calculating best price...</span>
              </div>
            ) : (
              <>
                {/* Density Zone Badge */}
                {densityData && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", zoneColors[densityData.zone] || "")}>
                        {densityData.zone?.toUpperCase()} ZONE
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Density Score: {densityData.density_score}/100
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{densityData.message}</p>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base price per visit</span>
                    <span className="text-foreground">${(pricePerVisit / 100).toFixed(2)}</span>
                  </div>
                  {numDogs > 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Extra dogs ({numDogs - 1} × $5)</span>
                      <span className="text-foreground">${(dogSurcharge / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Per visit total</span>
                    <span className="font-medium text-foreground">${(perVisitTotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Frequency ({frequencyConfig.label})
                    </span>
                    <span className="text-muted-foreground">× {frequencyConfig.multiplier}/mo</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-display font-bold text-foreground">Monthly Total</span>
                    <span className="font-display text-2xl font-bold text-primary">
                      ${(monthlyTotal / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Confirm Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-foreground text-right">
                  {selectedAddress?.street}, {selectedAddress?.city}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">Pet Waste Removal</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Dogs</span>
                <span className="font-medium text-foreground">{numDogs}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium text-foreground">{frequencyConfig.label}</span>
              </div>
              {densityData && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Zone</span>
                  <Badge variant="outline" className={cn("text-xs", zoneColors[densityData.zone] || "")}>
                    {densityData.zone?.toUpperCase()}
                  </Badge>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="font-display font-bold text-foreground text-base">Monthly Total</span>
                <span className="font-display text-2xl font-bold text-primary">
                  ${(monthlyTotal / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => createSubscription.mutate()}
              disabled={createSubscription.isPending}
            >
              {createSubscription.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Confirm & Subscribe"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Payment integration coming soon. Your subscription will be activated immediately.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 && (
          <Button
            className="ml-auto gap-1"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;
