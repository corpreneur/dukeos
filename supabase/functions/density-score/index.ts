import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Haversine distance in miles
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lat, lng } = await req.json();
    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: "lat and lng required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all existing service addresses with coordinates
    const { data: addresses, error } = await supabase
      .from("service_addresses")
      .select("lat, lng")
      .not("lat", "is", null)
      .not("lng", "is", null);

    if (error) throw error;

    if (!addresses?.length) {
      // No existing addresses = low density
      return new Response(JSON.stringify({
        density_score: 10,
        zone: "red",
        price_per_visit_cents: 3500,
        nearby_customers: 0,
        message: "Premium pricing — you'd be our first customer in this area!",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Count customers within various radii
    let within_quarter_mile = 0;
    let within_half_mile = 0;
    let within_mile = 0;
    let within_two_miles = 0;

    for (const addr of addresses) {
      const dist = haversine(lat, lng, addr.lat, addr.lng);
      if (dist <= 0.25) within_quarter_mile++;
      if (dist <= 0.5) within_half_mile++;
      if (dist <= 1) within_mile++;
      if (dist <= 2) within_two_miles++;
    }

    // Density score: 0-100
    // Heavy weight on quarter-mile (route efficiency)
    const score = Math.min(100, Math.round(
      within_quarter_mile * 20 +
      within_half_mile * 10 +
      within_mile * 5 +
      within_two_miles * 2
    ));

    // Dynamic pricing based on density
    let zone: string;
    let price_per_visit_cents: number;
    let message: string;

    if (score >= 80) {
      zone = "green";
      price_per_visit_cents = 1800; // $18
      message = "Great news! You're in a high-density zone — best pricing available.";
    } else if (score >= 50) {
      zone = "yellow";
      price_per_visit_cents = 2500; // $25
      message = "Good location! Competitive pricing for your area.";
    } else if (score >= 25) {
      zone = "orange";
      price_per_visit_cents = 3000; // $30
      message = "We service your area with standard pricing.";
    } else {
      zone = "red";
      price_per_visit_cents = 3500; // $35
      message = "Premium pricing — help us grow in your neighborhood for future discounts!";
    }

    return new Response(JSON.stringify({
      density_score: score,
      zone,
      price_per_visit_cents,
      nearby_customers: within_mile,
      within_quarter_mile,
      within_half_mile,
      within_mile,
      within_two_miles,
      message,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("density-score error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
