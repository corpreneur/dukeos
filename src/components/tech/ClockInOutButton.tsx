import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ClockInOutButtonProps {
  jobId: string;
}

const ClockInOutButton = ({ jobId }: ClockInOutButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [gettingLocation, setGettingLocation] = useState(false);

  const { data: activeEntry } = useQuery({
    queryKey: ["time-entry", jobId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("job_id", jobId)
        .eq("technician_id", user!.id)
        .is("clock_out", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getGPS = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });

  const clockIn = useMutation({
    mutationFn: async () => {
      setGettingLocation(true);
      try {
        const pos = await getGPS();
        const { error } = await supabase.from("time_entries").insert({
          job_id: jobId,
          technician_id: user!.id,
          clock_in: new Date().toISOString(),
          notes: `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        });
        if (error) throw error;

        // Also update tech_locations
        await supabase.from("tech_locations").upsert({
          technician_id: user!.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        }, { onConflict: "technician_id" });
      } finally {
        setGettingLocation(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entry", jobId] });
      toast.success("Clocked in ✓");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      setGettingLocation(true);
      try {
        const pos = await getGPS();
        const { error } = await supabase
          .from("time_entries")
          .update({
            clock_out: new Date().toISOString(),
            notes: `${activeEntry?.notes || ""} | Out GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
          })
          .eq("id", activeEntry!.id);
        if (error) throw error;
      } finally {
        setGettingLocation(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entry", jobId] });
      toast.success("Clocked out ✓");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isClocked = !!activeEntry;
  const loading = clockIn.isPending || clockOut.isPending || gettingLocation;

  return (
    <Button
      variant={isClocked ? "destructive" : "outline"}
      size="sm"
      className="gap-1"
      disabled={loading}
      onClick={() => (isClocked ? clockOut.mutate() : clockIn.mutate())}
    >
      <Clock className="h-3.5 w-3.5" />
      {loading ? (
        <><MapPin className="h-3 w-3 animate-pulse" /> GPS...</>
      ) : isClocked ? (
        "Clock Out"
      ) : (
        "Clock In"
      )}
    </Button>
  );
};

export default ClockInOutButton;
