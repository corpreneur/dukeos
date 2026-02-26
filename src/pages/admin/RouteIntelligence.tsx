import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Clock, RotateCcw, Truck, Loader2 } from "lucide-react";
import { format } from "date-fns";

const TECH_COLORS = [
  "hsl(210, 80%, 55%)",  // blue
  "hsl(340, 75%, 55%)",  // pink
  "hsl(160, 70%, 40%)",  // teal
  "hsl(30, 90%, 55%)",   // orange
  "hsl(270, 65%, 55%)",  // purple
  "hsl(50, 85%, 45%)",   // gold
  "hsl(190, 75%, 45%)",  // cyan
  "hsl(0, 70%, 55%)",    // red
];

const RouteMap = lazy(() => import("@/components/admin/RouteMap"));

const getAddress = (job: any) => {
  const address = Array.isArray(job.service_addresses) ? job.service_addresses[0] : job.service_addresses;
  return address ?? null;
};

const toCoordinate = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const hasValidCoordinates = (job: any) => {
  const address = getAddress(job);
  const lat = toCoordinate(address?.lat);
  const lng = toCoordinate(address?.lng);
  return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const normalizeJobRelations = (job: any) => ({
  ...job,
  service_addresses: getAddress(job),
  subscriptions: Array.isArray(job.subscriptions) ? job.subscriptions[0] : job.subscriptions,
});

interface RouteResult {
  orderedJobs: any[];
  totalDistance: number;
  totalDuration: number;
  legs: { distance: number; duration: number }[];
  geometry: [number, number][];
}

const AdminRouteIntelligence = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedTech, setSelectedTech] = useState<string>("all");
  const [optimizedRoute, setOptimizedRoute] = useState<RouteResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, service_addresses(street, city, state, zip, lat, lng), subscriptions(plan, customer_id)")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: techRoles, isLoading: techRolesLoading, error: techRolesError } = useQuery({
    queryKey: ["admin-technicians"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const techProfiles = useMemo(
    () => profiles?.filter((p: any) => techRoles?.some((t: any) => t.user_id === p.user_id)) || [],
    [profiles, techRoles]
  );

  const filteredJobs = useMemo(() => {
    let filtered = jobs?.filter(
      (j: any) => j.scheduled_date === selectedDate && (j.status === "scheduled" || j.status === "in_progress")
    ) || [];
    if (selectedTech !== "all") {
      filtered = filtered.filter((j: any) => j.technician_id === selectedTech);
    }
    return filtered;
  }, [jobs, selectedDate, selectedTech]);

  const geoJobs = useMemo(
    () => filteredJobs.filter(hasValidCoordinates).map(normalizeJobRelations),
    [filteredJobs]
  );

  // Build a stable tech → color map
  const techColorMap = useMemo(() => {
    const uniqueTechIds = [...new Set(geoJobs.map((j: any) => j.technician_id).filter(Boolean))];
    const map: Record<string, string> = {};
    uniqueTechIds.forEach((id, i) => { map[id] = TECH_COLORS[i % TECH_COLORS.length]; });
    return map;
  }, [geoJobs]);

  const positions = useMemo(
    () => geoJobs.map((j: any) => [Number(j.service_addresses.lat), Number(j.service_addresses.lng)] as [number, number]),
    [geoJobs]
  );

  useEffect(() => {
    setOptimizedRoute(null);
  }, [selectedDate, selectedTech]);

  const getTechName = (techId: string) => {
    const p = profiles?.find((pr: any) => pr.user_id === techId);
    return p?.full_name || techId?.slice(0, 8) || "Unassigned";
  };

  const optimizeRoute = async () => {
    if (geoJobs.length < 2) {
      setOptimizedRoute({ orderedJobs: geoJobs, totalDistance: 0, totalDuration: 0, legs: [], geometry: [] });
      return;
    }
    setIsOptimizing(true);
    try {
      const coords = geoJobs.map((j: any) => `${Number(j.service_addresses.lng)},${Number(j.service_addresses.lat)}`).join(";");
      const res = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&roundtrip=false&source=first`);
      const data = await res.json();
      if (data.code !== "Ok") throw new Error(data.message || "Routing failed");
      const trip = data.trips[0];
      const waypoints = data.waypoints;
      const orderedJobs = waypoints.sort((a: any, b: any) => a.waypoint_index - b.waypoint_index).map((wp: any) => geoJobs[wp.original_index]);
      const geometry: [number, number][] = trip.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      const legs = trip.legs.map((leg: any) => ({ distance: leg.distance, duration: leg.duration }));
      setOptimizedRoute({ orderedJobs, totalDistance: trip.distance, totalDuration: trip.duration, legs, geometry });
    } catch (err: any) {
      console.error("Route optimization error:", err);
      setOptimizedRoute({ orderedJobs: geoJobs, totalDistance: 0, totalDuration: 0, legs: [], geometry: [] });
    } finally {
      setIsOptimizing(false);
    }
  };

  const displayJobs = optimizedRoute ? optimizedRoute.orderedJobs : geoJobs;
  const noGeoJobs = filteredJobs.filter((j: any) => !hasValidCoordinates(j)).map(normalizeJobRelations);

  const defaultCenter: [number, number] = positions.length > 0
    ? [positions.reduce((s, p) => s + p[0], 0) / positions.length, positions.reduce((s, p) => s + p[1], 0) / positions.length]
    : [33.20, -96.63];

  const isLoadingData = jobsLoading || techRolesLoading || profilesLoading;
  const hasDataError = !!jobsError || !!techRolesError || !!profilesError;

  if (isLoadingData) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading route intelligence...</CardContent></Card>;
  }
  if (hasDataError) {
    return <Card><CardContent className="p-6 text-sm text-destructive">Unable to load route intelligence data. Please refresh and try again.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Route Intelligence</h2>
        <p className="text-sm text-muted-foreground mt-1">Visualize daily routes and optimize stop order</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input type="date" className="w-44" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Technician</Label>
          <Select value={selectedTech} onValueChange={setSelectedTech}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {techProfiles.map((t: any) => (
                <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.user_id.slice(0, 8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={optimizeRoute} disabled={geoJobs.length < 1 || isOptimizing} className="gap-2">
          {isOptimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {isOptimizing ? "Optimizing..." : "Optimize Route"}
        </Button>
        {optimizedRoute && (
          <Button variant="outline" onClick={() => setOptimizedRoute(null)} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Stops Today</div><div className="text-3xl font-display font-bold text-foreground mt-1">{filteredJobs.length}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">With Coordinates</div><div className="text-3xl font-display font-bold text-foreground mt-1">{geoJobs.length}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Total Distance</div><div className="text-3xl font-display font-bold text-foreground mt-1">{optimizedRoute ? `${(optimizedRoute.totalDistance / 1609.34).toFixed(1)} mi` : "—"}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Est. Drive Time</div><div className="text-3xl font-display font-bold text-foreground mt-1">{optimizedRoute ? `${Math.floor(optimizedRoute.totalDuration / 60)} min` : "—"}</div></CardContent></Card>
      </div>

      {/* Map + Stop List */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <Suspense fallback={<div className="h-[500px] flex items-center justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" />Loading map...</div>}>
              <RouteMap
                defaultCenter={defaultCenter}
                positions={positions}
                displayJobs={displayJobs}
                optimizedRoute={optimizedRoute}
                getTechName={getTechName}
                techColorMap={techColorMap}
              />
            </Suspense>
          </Card>
          {/* Tech Legend */}
          {Object.keys(techColorMap).length > 1 && (
            <div className="flex flex-wrap gap-3 mt-2 px-1">
              {Object.entries(techColorMap).map(([techId, color]) => (
                <div key={techId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                  {getTechName(techId)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stop List */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {optimizedRoute ? "Optimized Stop Order" : "Stops"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
            {displayJobs.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No jobs with coordinates for this date</p>
            )}
            {displayJobs.map((job: any, idx: number) => (
              <div key={job.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shrink-0" style={{ background: techColorMap[job.technician_id] || "#666" }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{job.service_addresses.street}</div>
                  <div className="text-xs text-muted-foreground">{job.service_addresses.city}, {job.service_addresses.state} {job.service_addresses.zip}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5">{job.subscriptions?.plan}</Badge>
                    <span className="text-[10px] text-muted-foreground">{getTechName(job.technician_id)}</span>
                  </div>
                  {optimizedRoute?.legs[idx] && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Navigation className="h-3 w-3" />
                      {(optimizedRoute.legs[idx].distance / 1609.34).toFixed(1)} mi
                      <Clock className="h-3 w-3 ml-1" />
                      {Math.round(optimizedRoute.legs[idx].duration / 60)} min to next
                    </div>
                  )}
                </div>
              </div>
            ))}
            {noGeoJobs.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {noGeoJobs.length} job(s) missing coordinates
                </p>
                {noGeoJobs.map((job: any) => (
                  <div key={job.id} className="text-xs text-muted-foreground py-1">
                    {job.service_addresses?.street || "No address"}, {job.service_addresses?.city || "—"}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRouteIntelligence;
