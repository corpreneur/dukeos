import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin only");

    // Get unassigned scheduled jobs with addresses
    const { data: unassignedJobs } = await supabase
      .from("jobs")
      .select("*, service_addresses(lat, lng, street, city)")
      .eq("status", "scheduled")
      .is("technician_id", null);

    if (!unassignedJobs?.length) {
      return new Response(JSON.stringify({ message: "No unassigned jobs", assigned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get technicians
    const { data: techRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "technician");

    if (!techRoles?.length) throw new Error("No technicians available");

    // Get current workload per tech
    const { data: allJobs } = await supabase
      .from("jobs")
      .select("technician_id, scheduled_date")
      .eq("status", "scheduled")
      .not("technician_id", "is", null);

    const workload: Record<string, Record<string, number>> = {};
    techRoles.forEach((t: any) => { workload[t.user_id] = {}; });
    allJobs?.forEach((j: any) => {
      if (!workload[j.technician_id]) workload[j.technician_id] = {};
      workload[j.technician_id][j.scheduled_date] = (workload[j.technician_id][j.scheduled_date] || 0) + 1;
    });

    // Get tech availability
    const { data: availability } = await supabase
      .from("technician_availability")
      .select("*")
      .eq("is_available", true);

    // Get last known tech locations (for proximity)
    const { data: techLocations } = await supabase
      .from("tech_locations")
      .select("*");

    // Get tech addresses from their assigned jobs (fallback for proximity)
    const { data: techJobAddresses } = await supabase
      .from("jobs")
      .select("technician_id, service_addresses(lat, lng)")
      .eq("status", "completed")
      .not("technician_id", "is", null)
      .order("completed_at", { ascending: false })
      .limit(100);

    // Build tech location map
    const techLocationMap: Record<string, { lat: number; lng: number }> = {};
    techLocations?.forEach((loc: any) => {
      techLocationMap[loc.technician_id] = { lat: loc.lat, lng: loc.lng };
    });
    // Fallback to last completed job address
    techJobAddresses?.forEach((j: any) => {
      if (!techLocationMap[j.technician_id] && j.service_addresses?.lat) {
        techLocationMap[j.technician_id] = { lat: j.service_addresses.lat, lng: j.service_addresses.lng };
      }
    });

    const assignments: { jobId: string; techId: string; reason: string }[] = [];

    for (const job of unassignedJobs) {
      const jobDate = job.scheduled_date;
      const jobDow = new Date(jobDate + "T12:00:00").getDay();

      // Score each tech
      let bestTech: string | null = null;
      let bestScore = -Infinity;
      let bestReason = "";

      for (const tech of techRoles) {
        const techId = tech.user_id;

        // Check availability
        const techAvail = availability?.find(
          (a: any) => a.technician_id === techId && a.day_of_week === jobDow
        );
        if (techAvail === undefined) {
          // No availability record = assume available
        } else if (!techAvail.is_available) {
          continue; // Skip unavailable
        }

        // Workload score (fewer jobs = higher score)
        const dayJobs = workload[techId]?.[jobDate] || 0;
        const workloadScore = Math.max(0, 10 - dayJobs * 2);

        // Proximity score
        let proximityScore = 5; // default
        if (job.service_addresses?.lat && techLocationMap[techId]) {
          const dist = haversine(
            techLocationMap[techId].lat, techLocationMap[techId].lng,
            job.service_addresses.lat, job.service_addresses.lng
          );
          proximityScore = Math.max(0, 10 - dist * 2); // closer = higher
        }

        const totalScore = workloadScore * 0.6 + proximityScore * 0.4;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestTech = techId;
          bestReason = `workload:${workloadScore.toFixed(1)} proximity:${proximityScore.toFixed(1)}`;
        }
      }

      if (bestTech) {
        // Assign
        await supabase.from("jobs").update({ technician_id: bestTech }).eq("id", job.id);
        // Update workload tracking
        if (!workload[bestTech]) workload[bestTech] = {};
        workload[bestTech][jobDate] = (workload[bestTech][jobDate] || 0) + 1;
        assignments.push({ jobId: job.id, techId: bestTech, reason: bestReason });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Auto-assigned ${assignments.length} of ${unassignedJobs.length} jobs`,
        assigned: assignments.length,
        total: unassignedJobs.length,
        details: assignments,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
