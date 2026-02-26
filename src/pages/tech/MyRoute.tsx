import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Clock, Loader2, Truck } from "lucide-react";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createNumberedIcon = (num: number, color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${num}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

interface RouteResult {
  orderedJobs: any[];
  totalDistance: number;
  totalDuration: number;
  legs: { distance: number; duration: number }[];
  geometry: [number, number][];
}

const TechMyRoute = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const { data: jobs } = useQuery({
    queryKey: ["tech-jobs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, service_addresses(street, city, state, zip, lat, lng), subscriptions(plan)")
        .eq("technician_id", user!.id)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const todayJobs = useMemo(
    () =>
      jobs?.filter(
        (j: any) =>
          j.scheduled_date === selectedDate &&
          (j.status === "scheduled" || j.status === "in_progress")
      ) || [],
    [jobs, selectedDate]
  );

  const geoJobs = useMemo(
    () => todayJobs.filter((j: any) => j.service_addresses?.lat && j.service_addresses?.lng),
    [todayJobs]
  );

  const positions = useMemo(
    () => geoJobs.map((j: any) => [j.service_addresses.lat, j.service_addresses.lng] as [number, number]),
    [geoJobs]
  );

  // Auto-optimize when date/jobs change
  useEffect(() => {
    setRoute(null);
  }, [selectedDate]);

  const optimizeRoute = async () => {
    if (geoJobs.length < 2) {
      setRoute({ orderedJobs: geoJobs, totalDistance: 0, totalDuration: 0, legs: [], geometry: [] });
      return;
    }
    setIsOptimizing(true);
    try {
      const coords = geoJobs.map((j: any) => `${j.service_addresses.lng},${j.service_addresses.lat}`).join(";");
      const res = await fetch(
        `https://router.project-osrm.org/trip/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&roundtrip=false&source=first`
      );
      const data = await res.json();
      if (data.code !== "Ok") throw new Error("Routing failed");

      const trip = data.trips[0];
      const orderedJobs = data.waypoints
        .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
        .map((wp: any) => geoJobs[wp.original_index]);

      setRoute({
        orderedJobs,
        totalDistance: trip.distance,
        totalDuration: trip.duration,
        legs: trip.legs.map((l: any) => ({ distance: l.distance, duration: l.duration })),
        geometry: trip.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      });
    } catch {
      setRoute({ orderedJobs: geoJobs, totalDistance: 0, totalDuration: 0, legs: [], geometry: [] });
    } finally {
      setIsOptimizing(false);
    }
  };

  const displayJobs = route?.orderedJobs || geoJobs;

  const defaultCenter: [number, number] = positions.length > 0
    ? [positions.reduce((s, p) => s + p[0], 0) / positions.length, positions.reduce((s, p) => s + p[1], 0) / positions.length]
    : [35.78, -78.64];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">My Route</h2>
        <p className="text-sm text-muted-foreground mt-1">Your optimized daily stops</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input type="date" className="w-44" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <Button onClick={optimizeRoute} disabled={geoJobs.length < 1 || isOptimizing} className="gap-2">
          {isOptimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {isOptimizing ? "Optimizing..." : "Optimize"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">Stops</div>
            <div className="text-2xl font-display font-bold text-foreground">{todayJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">Distance</div>
            <div className="text-2xl font-display font-bold text-foreground">
              {route ? `${(route.totalDistance / 1609.34).toFixed(1)} mi` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">Drive</div>
            <div className="text-2xl font-display font-bold text-foreground">
              {route ? `${Math.floor(route.totalDuration / 60)} min` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <div style={{ height: 350 }}>
          <MapContainer center={defaultCenter} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions.length > 0 && <FitBounds positions={positions} />}
            {displayJobs.map((job: any, idx: number) => (
              <Marker
                key={job.id}
                position={[job.service_addresses.lat, job.service_addresses.lng]}
                icon={createNumberedIcon(idx + 1, "hsl(142, 71%, 45%)")}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold">Stop {idx + 1}</div>
                    <div>{job.service_addresses.street}</div>
                    <div>{job.service_addresses.city}, {job.service_addresses.state}</div>
                    {route?.legs[idx] && (
                      <div className="text-xs mt-1">
                        → {(route.legs[idx].distance / 1609.34).toFixed(1)} mi, {Math.round(route.legs[idx].duration / 60)} min to next
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
            {route?.geometry && route.geometry.length > 0 && (
              <Polyline positions={route.geometry} pathOptions={{ color: "hsl(142, 71%, 45%)", weight: 4, opacity: 0.8 }} />
            )}
          </MapContainer>
        </div>
      </Card>

      {/* Stop List */}
      <div className="space-y-2">
        {displayJobs.map((job: any, idx: number) => (
          <Card key={job.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: "hsl(142, 71%, 45%)" }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{job.service_addresses.street}</div>
                <div className="text-xs text-muted-foreground">
                  {job.service_addresses.city}, {job.service_addresses.state} • {job.subscriptions?.plan}
                </div>
                {route?.legs[idx] && (
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    <Navigation className="h-3 w-3" />
                    {(route.legs[idx].distance / 1609.34).toFixed(1)} mi
                    <Clock className="h-3 w-3" />
                    {Math.round(route.legs[idx].duration / 60)} min
                  </div>
                )}
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {job.status.replace("_", " ")}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {todayJobs.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No jobs scheduled for this date</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TechMyRoute;
