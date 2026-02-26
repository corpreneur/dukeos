import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get unique addresses with coordinates for upcoming jobs
    const { data: upcomingJobs } = await supabase
      .from("jobs")
      .select("scheduled_date, service_addresses(lat, lng, zip)")
      .eq("status", "scheduled")
      .gte("scheduled_date", new Date().toISOString().split("T")[0]);

    if (!upcomingJobs?.length) {
      return new Response(JSON.stringify({ message: "No upcoming jobs", alerts: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique coords (deduplicate by zip)
    const zipCoords: Record<string, { lat: number; lng: number }> = {};
    upcomingJobs.forEach((j: any) => {
      if (j.service_addresses?.lat && j.service_addresses?.zip) {
        zipCoords[j.service_addresses.zip] = { lat: j.service_addresses.lat, lng: j.service_addresses.lng };
      }
    });

    const alerts: any[] = [];

    // Check weather for each unique location using Open-Meteo (free, no API key)
    for (const [zip, coords] of Object.entries(zipCoords)) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=America%2FNew_York&forecast_days=7`;
        const resp = await fetch(url);
        const weather = await resp.json();

        if (weather.daily) {
          for (let i = 0; i < weather.daily.time.length; i++) {
            const date = weather.daily.time[i];
            const precip = weather.daily.precipitation_sum[i];
            const precipProb = weather.daily.precipitation_probability_max[i];
            const wind = weather.daily.wind_speed_10m_max[i];

            // Flag heavy rain (>10mm or >70% probability) or high wind (>30 mph / ~48 km/h)
            const isHeavyRain = precip > 10 || precipProb > 70;
            const isHighWind = wind > 48;

            if (isHeavyRain || isHighWind) {
              const parts: string[] = [];
              if (isHeavyRain) parts.push(`Heavy rain expected (${precip.toFixed(1)}mm, ${precipProb}% chance)`);
              if (isHighWind) parts.push(`High winds (${(wind * 0.621).toFixed(0)} mph)`);

              alerts.push({
                alert_date: date,
                severity: precip > 20 || wind > 64 ? "severe" : "warning",
                description: parts.join(". "),
                affected_zip: zip,
              });
            }
          }
        }
      } catch (e) {
        console.error(`Weather fetch failed for zip ${zip}:`, e);
      }
    }

    // Upsert alerts (avoid duplicates)
    if (alerts.length > 0) {
      // Delete existing alerts for these dates/zips to avoid duplicates
      const dates = [...new Set(alerts.map(a => a.alert_date))];
      await supabase
        .from("weather_alerts")
        .delete()
        .in("alert_date", dates)
        .eq("dismissed", false);

      const { error } = await supabase.from("weather_alerts").insert(alerts);
      if (error) console.error("Insert alerts error:", error);
    }

    return new Response(
      JSON.stringify({
        message: `Weather check complete. ${alerts.length} alerts created.`,
        alerts: alerts.length,
        details: alerts,
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
