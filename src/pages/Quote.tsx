import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, MapPin, Dog, Calendar, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FREQUENCIES = [
  { label: "Three Times A Week", value: "3x_week", visits: 12, pricePerVisit: 1500 },
  { label: "Two Times A Week", value: "2x_week", visits: 8, pricePerVisit: 1700 },
  { label: "Once A Week", value: "weekly", visits: 4, pricePerVisit: 2150 },
  { label: "Bi-Weekly", value: "biweekly", visits: 2, pricePerVisit: 2500 },
  { label: "Twice Per Month", value: "2x_month", visits: 2, pricePerVisit: 2800 },
  { label: "Once A Month", value: "monthly", visits: 1, pricePerVisit: 3500 },
  { label: "One-Time", value: "one_time", visits: 1, pricePerVisit: 7500 },
];

const CLEANUP_OPTIONS = [
  { label: "Less than 1 week", value: "lt_1w", surcharge: 0 },
  { label: "1-2 weeks", value: "1_2w", surcharge: 1500 },
  { label: "2-4 weeks", value: "2_4w", surcharge: 2500 },
  { label: "More than a month", value: "gt_1m", surcharge: 4500 },
  { label: "Never / Not Sure", value: "never", surcharge: 7500 },
];

const Quote = () => {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [zip, setZip] = useState("");
  const [zipValid, setZipValid] = useState<boolean | null>(null);
  const [zipChecking, setZipChecking] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  // Step 2
  const [numDogs, setNumDogs] = useState(1);
  const [frequencyIdx, setFrequencyIdx] = useState(2); // default weekly
  const [cleanupOption, setCleanupOption] = useState("lt_1w");
  const [coupon, setCoupon] = useState("");

  // Step 3
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("TX");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const { data: serviceAreas } = useQuery({
    queryKey: ["service-areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_areas").select("zip_code");
      if (error) throw error;
      return data.map((r: any) => r.zip_code);
    },
  });

  const checkZip = () => {
    if (!zip || zip.length < 5) return toast.error("Enter a valid 5-digit zip code");
    setZipChecking(true);
    const valid = (serviceAreas || []).includes(zip);
    setZipValid(valid);
    setZipChecking(false);
    if (valid) setStep(2);
  };

  const freq = FREQUENCIES[frequencyIdx];
  const cleanup = CLEANUP_OPTIONS.find(c => c.value === cleanupOption) || CLEANUP_OPTIONS[0];
  const dogSurcharge = numDogs > 1 ? (numDogs - 1) * 500 : 0;
  const perVisit = freq.pricePerVisit + dogSurcharge;
  const monthlyTotal = freq.value === "one_time" ? perVisit + cleanup.surcharge : perVisit * freq.visits;
  const initialCleanup = cleanup.surcharge;

  const handleSubmit = async () => {
    if (!fullName || !email || !password || !street || !city) return toast.error("Please fill all required fields");
    setSubmitting(true);
    try {
      // Create account
      const { error: authError } = await signUp(email, password, fullName);
      if (authError) throw authError;

      // Sign in immediately
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;

      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (!newUser) throw new Error("Failed to get user");

      // Update phone
      if (phone) {
        await supabase.from("profiles").update({ phone }).eq("user_id", newUser.id);
      }

      // Create service address
      const { data: addr, error: addrError } = await supabase.from("service_addresses").insert({
        customer_id: newUser.id,
        street,
        city,
        state,
        zip,
        label: "Home",
      }).select().single();
      if (addrError) throw addrError;

      // Create subscription
      const { error: subError } = await supabase.from("subscriptions").insert({
        customer_id: newUser.id,
        address_id: addr.id,
        plan: freq.value === "one_time" ? "one_time" : "recurring",
        frequency: freq.value === "one_time" ? "one_time" : freq.value.replace("_", "-"),
        num_dogs: numDogs,
        price_cents: monthlyTotal,
      }).select().single();
      if (subError) throw subError;

      setComplete(true);
      toast.success("Welcome to Scoop Duke! Your service is confirmed.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (complete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">You're All Set!</h2>
            <p className="text-muted-foreground mb-6">Your service has been confirmed. We'll assign a technician and get your yard cleaned up!</p>
            <Button onClick={() => navigate("/dashboard")} className="gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-display text-foreground">Scoop Duke</span>
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">
            You're 30 Seconds Away From A Cleaner Yard!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Professional pet waste removal at your door</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Zip Validation */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Check Service Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input
                  value={zip}
                  onChange={e => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setZipValid(null); }}
                  placeholder="75069"
                  maxLength={5}
                />
              </div>
              {zipValid === false && (
                <div className="bg-warning/10 border border-warning/20 rounded-md p-3 text-sm">
                  <div className="flex items-center gap-2 text-warning font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" /> We don't service your area yet
                  </div>
                  <p className="text-muted-foreground mb-2">We're growing fast! Enter your email to be notified when we arrive.</p>
                  <div className="flex gap-2">
                    <Input value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="you@email.com" className="flex-1" />
                    <Button size="sm" onClick={() => { toast.success("You're on the waitlist!"); setWaitlistEmail(""); }}>Notify Me</Button>
                  </div>
                </div>
              )}
              <Button className="w-full gap-2" onClick={checkZip} disabled={zipChecking || zip.length < 5}>
                Free Quote <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Quote Configuration */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Dog className="h-5 w-5 text-primary" /> Configure Your Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input value={zip} readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Number of Dogs: <span className="font-bold text-primary">{numDogs}{numDogs >= 5 ? "+" : ""}</span></Label>
                <Slider value={[numDogs]} onValueChange={v => setNumDogs(v[0])} min={1} max={5} step={1} />
              </div>

              <div className="space-y-2">
                <Label>Cleanup Frequency: <span className="font-bold text-primary">{freq.label}</span></Label>
                <Slider value={[frequencyIdx]} onValueChange={v => setFrequencyIdx(v[0])} min={0} max={FREQUENCIES.length - 1} step={1} />
              </div>

              <div className="space-y-2">
                <Label>Last Time Yard Was Thoroughly Cleaned</Label>
                <Select value={cleanupOption} onValueChange={setCleanupOption}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLEANUP_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Coupon Code (optional)</Label>
                <Input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="DUKE20" />
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base price per visit</span>
                  <span className="text-foreground font-medium">${(freq.pricePerVisit / 100).toFixed(2)}</span>
                </div>
                {dogSurcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional dogs ({numDogs - 1})</span>
                    <span className="text-foreground font-medium">+${(dogSurcharge / 100).toFixed(2)}/visit</span>
                  </div>
                )}
                {freq.value !== "one_time" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visits per month</span>
                    <span className="text-foreground font-medium">×{freq.visits}</span>
                  </div>
                )}
                {initialCleanup > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Initial cleanup fee</span>
                    <span className="text-foreground font-medium">+${(initialCleanup / 100).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span className="text-foreground">{freq.value === "one_time" ? "Total" : "Monthly Total"}</span>
                  <span className="text-primary">${((monthlyTotal + (freq.value !== "one_time" ? 0 : 0)) / 100).toFixed(2)}</span>
                </div>
                {initialCleanup > 0 && freq.value !== "one_time" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">+ One-time initial cleanup</span>
                    <span className="text-muted-foreground">${(initialCleanup / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
                  Get Free Quote <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Sign Up */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Create Your Account & Confirm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between font-bold">
                  <span>{freq.label} · {numDogs} dog{numDogs > 1 ? "s" : ""}</span>
                  <span className="text-primary">${(monthlyTotal / 100).toFixed(2)}{freq.value !== "one_time" ? "/mo" : ""}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Full Name *</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(469) 555-1234" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Password *</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="font-display font-bold">Service Address</Label>
                <div className="space-y-2">
                  <Input value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Oak Street" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="McKinney" />
                  <Input value={state} onChange={e => setState(e.target.value)} placeholder="TX" />
                  <Input value={zip} readOnly className="bg-muted" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Creating Account..." : "Confirm & Start Service"}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                By signing up you agree to our Terms of Service. Your account will be verified via email.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Quote;
