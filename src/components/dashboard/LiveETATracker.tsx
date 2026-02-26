import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Truck } from "lucide-react";

const LiveETATracker = () => {
  const { user } = useAuth();
  const [techLocation, setTechLocation] = useState<any>(null);

  // Get in-progress jobs for customer
  const { data: activeJobs } = useQuery({
    queryKey: ["customer-active-jobs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, service_addresses(street, city, lat, lng), subscriptions(plan)")
        .eq("status", "in_progress");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Subscribe to tech location updates
  useEffect(() => {
    if (!activeJobs?.length) return;

    const techIds = [...new Set(activeJobs.map((j: any) => j.technician_id).filter(Boolean))];
    if (!techIds.length) return;

    // Fetch initial locations
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("tech_locations")
        .select("*")
        .in("technician_id", techIds);
      if (data?.length) setTechLocation(data[0]);
    };
    fetchLocations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("customer-eta-tracker")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tech_locations" },
        (payload: any) => {
          if (techIds.includes(payload.new?.technician_id)) {
            setTechLocation(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJobs]);

  if (!activeJobs?.length) return null;

  const activeJob = activeJobs[0];
  const hasLocation = !!techLocation;

  // Simple distance calculation
  const getDistance = () => {
    if (!techLocation || !activeJob.service_addresses?.lat) return null;
    const R = 3959; // miles
    const dLat = ((activeJob.service_addresses.lat - techLocation.lat) * Math.PI) / 180;
    const dLng = ((activeJob.service_addresses.lng - techLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((techLocation.lat * Math.PI) / 180) *
        Math.cos((activeJob.service_addresses.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const distance = getDistance();
  const etaMinutes = distance ? Math.max(1, Math.round(parseFloat(distance) * 3)) : null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Truck className="h-5 w-5 text-primary" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-success rounded-full animate-pulse" />
          </div>
          <h3 className="font-display font-semibold text-foreground">Your Tech is En Route!</h3>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {activeJob.service_addresses?.street}, {activeJob.service_addresses?.city}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasLocation && distance && (
            <Badge variant="outline" className="gap-1 bg-card">
              <Navigation className="h-3 w-3" /> {distance} mi away
            </Badge>
          )}
          {etaMinutes && (
            <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
              <Clock className="h-3 w-3" /> ~{etaMinutes} min ETA
            </Badge>
          )}
          {!hasLocation && (
            <Badge variant="outline" className="gap-1 bg-card">
              <Clock className="h-3 w-3" /> Waiting for location update...
            </Badge>
          )}
        </div>

        {techLocation && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(techLocation.updated_at).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveETATracker;
