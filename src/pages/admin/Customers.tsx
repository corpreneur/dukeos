import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, CreditCard, Briefcase, AlertTriangle, Dog, Calendar, ChevronRight, Plus } from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

const MOCK_FIRST = ["James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","David","Elizabeth","William","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Lisa","Daniel","Nancy","Matthew","Betty","Anthony","Margaret","Mark","Sandra","Donald","Ashley","Steven","Dorothy","Paul","Kimberly","Andrew","Emily","Joshua","Donna","Kenneth","Michelle","Kevin","Carol","Brian","Amanda","George","Melissa","Timothy","Deborah","Ronald","Stephanie","Edward","Rebecca","Jason","Sharon","Jeffrey","Laura","Ryan","Cynthia","Jacob","Kathleen","Gary","Amy","Nicholas","Angela","Eric","Shirley","Jonathan","Anna","Stephen","Brenda","Larry","Pamela","Justin","Emma","Scott","Nicole","Brandon","Helen","Benjamin","Samantha","Samuel","Katherine","Raymond","Christine","Gregory","Debra","Frank","Rachel","Alexander","Carolyn","Patrick","Janet","Jack","Catherine","Dennis","Maria","Jerry","Heather","Tyler","Diane","Aaron","Ruth","Jose","Julie","Adam","Olivia","Nathan","Joyce","Henry","Virginia","Peter","Victoria","Zachary","Kelly","Douglas","Lauren","Harold","Christina","Carl","Joan","Arthur","Evelyn","Dylan","Judith","Jordan","Megan","Wayne","Andrea","Alan","Cheryl","Ralph","Hannah","Roy","Jacqueline","Eugene","Martha","Russell","Gloria","Bobby","Teresa"];
const MOCK_LAST = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Gomez","Phillips","Evans","Turner","Diaz","Parker","Cruz","Edwards","Collins","Reyes","Stewart","Morris","Morales","Murphy","Cook","Rogers","Gutierrez","Ortiz","Morgan","Cooper","Peterson","Bailey","Reed","Kelly","Howard","Ramos","Kim","Cox","Ward","Richardson","Watson","Brooks","Chavez","Wood","James","Bennett","Gray","Mendoza","Ruiz","Hughes","Price","Alvarez","Castillo","Sanders","Patel","Myers","Long","Ross","Foster","Jimenez","Powell","Jenkins","Perry","Russell","Sullivan","Bell","Coleman","Butler","Henderson","Barnes","Gonzales","Fisher","Vasquez","Simmons","Graham","Murray","Ford","Castro","Marshall","Owens","Harrison","Fernandez","McDonald","Woods","Washington","Kennedy","Wells","Vargas","Henry","Chen","Freeman","Webb","Tucker","Guzman"];
const MOCK_AREAS = ["469","972","214","817","682","940","903"];
const MOCK_STATUSES = ["active","active","active","active","active","active","active","active","inactive","pending"] as const;
const MOCK_STREETS = ["Oak St","Maple Ave","Pine Dr","Cedar Ln","Elm Blvd","Birch Ct","Willow Way","Poplar Rd","Spruce Pl","Hickory Trl","Dogwood Dr","Magnolia Ln","Peachtree St","Azalea Way","Cypress Ct"];
const MOCK_CITIES = ["McKinney","Frisco","Celina","Allen","Plano","Dallas","Prosper","Anna","Princeton","Melissa"];
const MOCK_PLANS = ["basic","standard","premium"];
const MOCK_FREQS = ["weekly","biweekly","monthly"];
const MOCK_ISSUES = ["long_grass","broken_fence","standing_water","pet_waste_buildup","pest_infestation"];

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface MockCustomer {
  id: string;
  user_id?: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  status: string;
  dogs: number;
  isMock: boolean;
  addresses: { street: string; city: string; state: string; zip: string; label: string }[];
  subscriptions: { plan: string; frequency: string; price_cents: number; active: boolean; started_at: string }[];
  jobs: { scheduled_date: string; status: string }[];
  yardIssues: { issue_type: string; resolved: boolean; created_at: string; notes: string | null }[];
}

function generateMockCustomers(realProfiles: any[]): MockCustomer[] {
  const TARGET = 127;
  const mockCount = Math.max(0, TARGET - realProfiles.length);
  const mocks: MockCustomer[] = [];
  for (let i = 0; i < mockCount; i++) {
    const r = seededRandom(i + 42);
    const r2 = seededRandom(i + 99);
    const r3 = seededRandom(i + 200);
    const first = MOCK_FIRST[Math.floor(r * MOCK_FIRST.length)];
    const last = MOCK_LAST[Math.floor(r2 * MOCK_LAST.length)];
    const area = MOCK_AREAS[Math.floor(r3 * MOCK_AREAS.length)];
    const hasPhone = r3 > 0.25;
    const phone = hasPhone ? `(${area}) ${String(Math.floor(seededRandom(i + 300) * 900 + 100))}-${String(Math.floor(seededRandom(i + 400) * 9000 + 1000))}` : null;
    const daysAgo = Math.floor(seededRandom(i + 500) * 365);
    const status = MOCK_STATUSES[Math.floor(seededRandom(i + 600) * MOCK_STATUSES.length)];
    const dogs = Math.floor(seededRandom(i + 700) * 4) + 1;

    // Mock addresses (1-2)
    const addrCount = seededRandom(i + 800) > 0.7 ? 2 : 1;
    const addresses = Array.from({ length: addrCount }, (_, ai) => ({
      street: `${Math.floor(seededRandom(i * 10 + ai + 810) * 9000 + 100)} ${MOCK_STREETS[Math.floor(seededRandom(i * 10 + ai + 820) * MOCK_STREETS.length)]}`,
      city: MOCK_CITIES[Math.floor(seededRandom(i * 10 + ai + 830) * MOCK_CITIES.length)],
      state: "TX",
      zip: `7${String(Math.floor(seededRandom(i * 10 + ai + 840) * 5000 + 5000))}`,
      label: ai === 0 ? "Home" : "Vacation",
    }));

    // Mock subscriptions (1, sometimes 2)
    const subCount = seededRandom(i + 850) > 0.85 ? 2 : 1;
    const subscriptions = Array.from({ length: subCount }, (_, si) => {
      const plan = MOCK_PLANS[Math.floor(seededRandom(i * 10 + si + 860) * MOCK_PLANS.length)];
      const freq = MOCK_FREQS[Math.floor(seededRandom(i * 10 + si + 870) * MOCK_FREQS.length)];
      const price = plan === "basic" ? 1800 : plan === "standard" ? 2500 : 3500;
      return {
        plan,
        frequency: freq,
        price_cents: price * dogs,
        active: status === "active",
        started_at: subDays(new Date(), daysAgo - Math.floor(seededRandom(i * 10 + si + 880) * 30)).toISOString(),
      };
    });

    // Mock jobs (2-8)
    const jobCount = 2 + Math.floor(seededRandom(i + 900) * 7);
    const jobs = Array.from({ length: jobCount }, (_, ji) => {
      const jr = seededRandom(i * 20 + ji + 910);
      return {
        scheduled_date: subDays(new Date(), Math.floor(seededRandom(i * 20 + ji + 920) * 90)).toISOString(),
        status: jr < 0.5 ? "completed" : jr < 0.75 ? "scheduled" : jr < 0.9 ? "in_progress" : "cancelled",
      };
    });

    // Mock yard issues (0-2)
    const issueCount = seededRandom(i + 950) > 0.6 ? Math.floor(seededRandom(i + 960) * 3) : 0;
    const yardIssues = Array.from({ length: issueCount }, (_, ii) => ({
      issue_type: MOCK_ISSUES[Math.floor(seededRandom(i * 10 + ii + 970) * MOCK_ISSUES.length)],
      resolved: seededRandom(i * 10 + ii + 980) > 0.4,
      created_at: subDays(new Date(), Math.floor(seededRandom(i * 10 + ii + 990) * 60)).toISOString(),
      notes: seededRandom(i * 10 + ii + 995) > 0.5 ? "Reported during routine visit" : null,
    }));

    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
    mocks.push({ id: `mock-${i}`, full_name: `${first} ${last}`, email, phone, created_at: subDays(new Date(), daysAgo).toISOString(), status, dogs, isMock: true, addresses, subscriptions, jobs, yardIssues });
  }
  return mocks;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminCustomers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MockCustomer | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ email: "", password: "", full_name: "", phone: "" });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch technician role user IDs to exclude them from customer list
  const { data: techRoles } = useQuery({
    queryKey: ["admin-technicians"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      if (error) throw error;
      return data;
    },
  });

  const techUserIds = useMemo(() => new Set((techRoles || []).map((t: any) => t.user_id)), [techRoles]);

  // For real customers, fetch their related data
  const { data: realAddresses } = useQuery({
    queryKey: ["admin-addresses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_addresses").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: realSubscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*, service_addresses(street, city)");
      if (error) throw error;
      return data;
    },
  });

  const { data: realJobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*, service_addresses(street, city), subscriptions(customer_id)").order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: realYardIssues } = useQuery({
    queryKey: ["admin-yard-issues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("yard_issues").select("*, jobs(subscription_id, subscriptions(customer_id))");
      if (error) throw error;
      return data;
    },
  });

  const allCustomers = useMemo(() => {
    const real: MockCustomer[] = (profiles || [])
      .filter((p: any) => !techUserIds.has(p.user_id))
      .map((p: any) => {
      const addrs = (realAddresses || []).filter((a: any) => a.customer_id === p.user_id).map((a: any) => ({
        street: a.street, city: a.city, state: a.state, zip: a.zip, label: a.label,
      }));
      const subs = (realSubscriptions || []).filter((s: any) => s.customer_id === p.user_id).map((s: any) => ({
        plan: s.plan, frequency: s.frequency, price_cents: s.price_cents, active: s.active, started_at: s.started_at,
      }));
      const customerJobs = (realJobs || []).filter((j: any) => j.subscriptions?.customer_id === p.user_id).map((j: any) => ({
        scheduled_date: j.scheduled_date, status: j.status,
      }));
      const issues = (realYardIssues || []).filter((yi: any) => yi.jobs?.subscriptions?.customer_id === p.user_id).map((yi: any) => ({
        issue_type: yi.issue_type, resolved: yi.resolved, created_at: yi.created_at, notes: yi.notes,
      }));
      return {
        ...p,
        email: null, // real users don't expose email from profiles
        status: "active",
        dogs: subs.reduce((max: number, s: any) => Math.max(max, 1), 1),
        isMock: false,
        addresses: addrs,
        subscriptions: subs,
        jobs: customerJobs,
        yardIssues: issues,
      };
    });
    const mocks = generateMockCustomers(real);
    return [...real, ...mocks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [profiles, realAddresses, realSubscriptions, realJobs, realYardIssues, techUserIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCustomers;
    const q = search.toLowerCase();
    return allCustomers.filter(c => c.full_name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
  }, [allCustomers, search]);

  const activeCount = allCustomers.filter(c => c.status === "active").length;
  const thisMonth = allCustomers.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const addCustomer = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-technician", {
        body: { email: newCustomer.email, password: newCustomer.password, full_name: newCustomer.full_name, role: "customer" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Update phone if provided
      if (newCustomer.phone && data?.user_id) {
        await supabase.from("profiles").update({ phone: newCustomer.phone }).eq("user_id", data.user_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Customer created");
      setAddOpen(false);
      setNewCustomer({ email: "", password: "", full_name: "", phone: "" });
    },
    onError: (err: any) => toast.error(err.message),
  });
  const handlePauseSubscription = async (customer: MockCustomer, subIndex: number) => {
    if (customer.isMock) return toast.error("Cannot modify mock data");
    // Find real subscription ID
    const realSubs = (realSubscriptions || []).filter((s: any) => s.customer_id === customer.user_id);
    const sub = realSubs[subIndex];
    if (!sub) return toast.error("Subscription not found");
    
    const { error } = await supabase
      .from("subscriptions")
      .update({ active: false, cancellation_reason: "Paused by admin" })
      .eq("id", sub.id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    toast.success("Subscription paused");
    setSelected(null);
  };

  const handleCancelSubscription = async (customer: MockCustomer, subIndex: number) => {
    if (customer.isMock) return toast.error("Cannot modify mock data");
    const realSubs = (realSubscriptions || []).filter((s: any) => s.customer_id === customer.user_id);
    const sub = realSubs[subIndex];
    if (!sub) return toast.error("Subscription not found");
    
    const { error } = await supabase
      .from("subscriptions")
      .update({ active: false, cancelled_at: new Date().toISOString(), cancellation_reason: "Cancelled by admin" })
      .eq("id", sub.id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    toast.success("Subscription cancelled");
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allCustomers.length} total · {activeCount} active · {thisMonth} new this month
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Add Customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add Customer</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={newCustomer.full_name} onChange={(e) => setNewCustomer(p => ({ ...p, full_name: e.target.value }))} placeholder="Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={newCustomer.password} onChange={(e) => setNewCustomer(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Phone (optional)</Label>
                  <Input value={newCustomer.phone} onChange={(e) => setNewCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="(469) 555-1234" />
                </div>
                <Button className="w-full" onClick={() => addCustomer.mutate()} disabled={!newCustomer.email || !newCustomer.password || !newCustomer.full_name || addCustomer.isPending}>
                  {addCustomer.isPending ? "Creating..." : "Create Customer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden md:table-cell">Address</TableHead>
              <TableHead className="hidden md:table-cell">Plan</TableHead>
              <TableHead className="hidden sm:table-cell">Dogs</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(p)}>
                <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{p.email || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{p.phone || "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {p.addresses.length > 0 ? `${p.addresses[0].street}, ${p.addresses[0].city}` : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {p.subscriptions.length > 0 ? (
                    <Badge variant="outline" className="capitalize text-xs">{p.subscriptions[0].plan}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{p.dogs}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={p.status === "active" ? "default" : p.status === "pending" ? "secondary" : "outline"} className="capitalize text-xs">{p.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{selected.full_name}</SheetTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={selected.status === "active" ? "default" : "secondary"} className="capitalize text-xs">{selected.status}</Badge>
                  <span>·</span>
                  <span>Joined {format(new Date(selected.created_at), "MMM d, yyyy")}</span>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Contact */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</div>
                  <div className="text-sm">{selected.phone || "No phone on file"}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Dog className="h-4 w-4" />
                    {selected.dogs} dog{selected.dogs !== 1 ? "s" : ""}
                  </div>
                </div>

                <Separator />

                {/* Addresses */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5" /> Addresses ({selected.addresses.length})
                  </div>
                  {selected.addresses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No addresses on file</p>
                  ) : (
                    selected.addresses.map((addr, i) => (
                      <Card key={i}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium">{addr.street}</div>
                              <div className="text-xs text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{addr.label}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <Separator />

                {/* Subscriptions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <CreditCard className="h-3.5 w-3.5" /> Subscriptions ({selected.subscriptions.length})
                  </div>
                  {selected.subscriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subscriptions</p>
                  ) : (
                    selected.subscriptions.map((sub, i) => (
                      <Card key={i}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium capitalize">{sub.plan} Plan</div>
                              <div className="text-xs text-muted-foreground capitalize">{sub.frequency} · Started {format(new Date(sub.started_at), "MMM d, yyyy")}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">${(sub.price_cents / 100).toFixed(2)}</div>
                              <Badge variant={sub.active ? "default" : "secondary"} className="text-xs">{sub.active ? "Active" : "Cancelled"}</Badge>
                            </div>
                          </div>
                          {sub.active && !selected.isMock && (
                            <div className="flex gap-2 mt-3 pt-2 border-t border-border">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => handlePauseSubscription(selected, i)}
                              >
                                Pause
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1 text-xs"
                                onClick={() => handleCancelSubscription(selected, i)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <Separator />

                {/* Jobs */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Briefcase className="h-3.5 w-3.5" /> Jobs ({selected.jobs.length})
                  </div>
                  {selected.jobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No jobs</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.jobs.slice(0, 10).map((job, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(new Date(job.scheduled_date), "MMM d, yyyy")}
                          </div>
                          <Badge variant="outline" className={`text-xs capitalize ${statusColors[job.status] || ""}`}>
                            {job.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                      {selected.jobs.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">+ {selected.jobs.length - 10} more jobs</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Yard Issues */}
                {selected.yardIssues.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <AlertTriangle className="h-3.5 w-3.5" /> Yard Issues ({selected.yardIssues.length})
                      </div>
                      {selected.yardIssues.map((issue, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border">
                          <div>
                            <div className="text-sm font-medium capitalize">{issue.issue_type.replace(/_/g, " ")}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(issue.created_at), "MMM d, yyyy")}</div>
                          </div>
                          <Badge variant={issue.resolved ? "default" : "destructive"} className="text-xs">
                            {issue.resolved ? "Resolved" : "Open"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminCustomers;
