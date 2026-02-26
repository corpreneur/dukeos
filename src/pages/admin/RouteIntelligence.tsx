import { useState, useMemo, useEffect, useRef } from "react";
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
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for leaflet in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createNumberedIcon = (num: number, color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const statusColors: Record<string, string> = {
  scheduled: "hsl(142, 71%, 45%)",
  in_progress: "hsl(38, 92%, 50%)",
  completed: "hsl(215, 20%, 65%)",
  cancelled: "hsl(0, 84%, 60%)",
};

interface RouteResult {
  orderedJobs: any[];
  totalDistance: number; // meters
  totalDuration: number; // seconds
  legs: { distance: number; duration: number }[];
  geometry: [number, number][];
}

// Fit map bounds to markers
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

const AdminRouteIntelligence = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedTech, setSelectedTech] = useState<string>("all");
  const [optimizedRoute, setOptimizedRoute] = useState<RouteResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Fetch jobs
  const { data: jobs } = useQuery({
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

  // Fetch technicians
  const { data: techRoles } = useQuery({
    queryKey: ["admin-technicians"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
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

  // Filter jobs for selected date and tech
  const filteredJobs = useMemo(() => {
    let filtered = jobs?.filter(
      (j: any) => j.scheduled_date === selectedDate && (j.status === "scheduled" || j.status === "in_progress")
    ) || [];
    if (selectedTech !== "all") {
      filtered = filtered.filter((j: any) => j.technician_id === selectedTech);
    }
    return filtered;
  }, [jobs, selectedDate, selectedTech]);

  // Jobs that have coordinates
  const geoJobs = useMemo(
    () => filteredJobs.filter((j: any) => j.service_addresses?.lat && j.service_addresses?.lng),
    [filteredJobs]
  );

  const positions = useMemo(
    () => geoJobs.map((j: any) => [j.service_addresses.lat, j.service_addresses.lng] as [number, number]),
    [geoJobs]
  );

  // Reset optimized route when filters change
  useEffect(() => {
    setOptimizedRoute(null);
  }, [selectedDate, selectedTech]);

  const getTechName = (techId: string) => {
    const p = profiles?.find((pr: any) => pr.user_id === techId);
    return p?.full_name || techId?.slice(0, 8) || "Unassigned";
  };

  // Call OSRM trip API for route optimization (TSP solver)
  const optimizeRoute = async () => {
    if (geoJobs.length < 2) {
      setOptimizedRoute({
        orderedJobs: geoJobs,
        totalDistance: 0,
        totalDuration: 0,
        legs: [],
        geometry: [],
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const coords = geoJobs
        .map((j: any) => `${j.service_addresses.lng},${j.service_addresses.lat}`)
        .join(";");

      const res = await fetch(
        `https://router.project-osrm.org/trip/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&roundtrip=false&source=first`
      );
      const data = await res.json();

      if (data.code !== "Ok") throw new Error(data.message || "Routing failed");

      const trip = data.trips[0];
      const waypoints = data.waypoints;

      // Reorder jobs based on waypoint_index
      const orderedJobs = waypoints
        .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
        .map((wp: any) => geoJobs[wp.original_index]);

      const geometry: [number, number][] = trip.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      const legs = trip.legs.map((leg: any) => ({
        distance: leg.distance,
        duration: leg.duration,
      }));

      setOptimizedRoute({
        orderedJobs,
        totalDistance: trip.distance,
        totalDuration: trip.duration,
        legs,
        geometry,
      });
    } catch (err: any) {
      console.error("Route optimization error:", err);
      // Fallback: just show jobs in order without route line
      setOptimizedRoute({
        orderedJobs: geoJobs,
        totalDistance: 0,
        totalDuration: 0,
        legs: [],
        geometry: [],
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const displayJobs = optimizedRoute ? optimizedRoute.orderedJobs : geoJobs;
  const noGeoJobs = filteredJobs.filter((j: any) => !j.service_addresses?.lat || !j.service_addresses?.lng);

  const defaultCenter: [number, number] = positions.length > 0
    ? [
        positions.reduce((s, p) => s + p[0], 0) / positions.length,
        positions.reduce((s, p) => s + p[1], 0) / positions.length,
      ]
    : [35.78, -78.64]; // Default to Raleigh, NC

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
          <Input
            type="date"
            className="w-44"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Technician</Label>
          <Select value={selectedTech} onValueChange={setSelectedTech}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {techProfiles.map((t: any) => (
                <SelectItem key={t.user_id} value={t.user_id}>
                  {t.full_name || t.user_id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={optimizeRoute}
          disabled={geoJobs.length < 1 || isOptimizing}
          className="gap-2"
        >
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
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Stops Today</div>
            <div className="text-3xl font-display font-bold text-foreground mt-1">{filteredJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">With Coordinates</div>
            <div className="text-3xl font-display font-bold text-foreground mt-1">{geoJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Total Distance</div>
            <div className="text-3xl font-display font-bold text-foreground mt-1">
              {optimizedRoute ? `${(optimizedRoute.totalDistance / 1609.34).toFixed(1)} mi` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Est. Drive Time</div>
            <div className="text-3xl font-display font-bold text-foreground mt-1">
              {optimizedRoute
                ? `${Math.floor(optimizedRoute.totalDuration / 60)} min`
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map + Stop List */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div style={{ height: 500 }}>
              <MapContainer
                center={defaultCenter}
                zoom={11}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {positions.length > 0 && <FitBounds positions={positions} />}

                {displayJobs.map((job: any, idx: number) => (
                  <Marker
                    key={job.id}
                    position={[job.service_addresses.lat, job.service_addresses.lng]}
                    icon={createNumberedIcon(idx + 1, statusColors[job.status] || "#666")}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-bold">Stop {idx + 1}</div>
                        <div>{job.service_addresses.street}</div>
                        <div>{job.service_addresses.city}, {job.service_addresses.state}</div>
                        <div className="mt-1 text-xs">Plan: {job.subscriptions?.plan}</div>
                        <div className="text-xs">Tech: {getTechName(job.technician_id)}</div>
                        {optimizedRoute?.legs[idx] && (
                          <div className="mt-1 text-xs text-gray-500">
                            → Next: {(optimizedRoute.legs[idx].distance / 1609.34).toFixed(1)} mi, {Math.round(optimizedRoute.legs[idx].duration / 60)} min
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {optimizedRoute?.geometry && optimizedRoute.geometry.length > 0 && (
                  <Polyline
                    positions={optimizedRoute.geometry}
                    pathOptions={{ color: "hsl(142, 71%, 45%)", weight: 4, opacity: 0.8 }}
                  />
                )}
              </MapContainer>
            </div>
          </Card>
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
              <p className="text-sm text-muted-foreground py-4 text-center">
                No jobs with coordinates for this date
              </p>
            )}
            {displayJobs.map((job: any, idx: number) => (
              <div
                key={job.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shrink-0"
                  style={{ background: statusColors[job.status] || "#666" }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {job.service_addresses.street}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {job.service_addresses.city}, {job.service_addresses.state} {job.service_addresses.zip}
                  </div>
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
