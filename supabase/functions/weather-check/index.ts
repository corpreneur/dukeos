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
      .select("id, scheduled_date, subscription_id, address_id, service_addresses!inner(lat, lng, zip, street, city)")
      .eq("status", "scheduled")
      .gte("scheduled_date", new Date().toISOString().split("T")[0]);

    if (!upcomingJobs?.length) {
      return new Response(JSON.stringify({ message: "No upcoming jobs", alerts: 0, rescheduled: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique coords (deduplicate by zip)
    const zipCoords: Record<string, { lat: number; lng: number }> = {};
    upcomingJobs.forEach((j: any) => {
      const addr = Array.isArray(j.service_addresses) ? j.service_addresses[0] : j.service_addresses;
      if (addr?.lat && addr?.zip) {
        zipCoords[addr.zip] = { lat: addr.lat, lng: addr.lng };
      }
    });

    const alerts: any[] = [];
    const severeAlertDates: Record<string, Set<string>> = {}; // date -> set of zips

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

            const isHeavyRain = precip > 10 || precipProb > 70;
            const isHighWind = wind > 48;
            const isSevere = precip > 20 || wind > 64;

            if (isHeavyRain || isHighWind) {
              const parts: string[] = [];
              if (isHeavyRain) parts.push(`Heavy rain expected (${precip.toFixed(1)}mm, ${precipProb}% chance)`);
              if (isHighWind) parts.push(`High winds (${(wind * 0.621).toFixed(0)} mph)`);

              const severity = isSevere ? "severe" : "warning";

              alerts.push({
                alert_date: date,
                severity,
                description: parts.join(". "),
                affected_zip: zip,
                auto_reschedule: isSevere, // auto-reschedule severe weather
              });

              if (isSevere) {
                if (!severeAlertDates[date]) severeAlertDates[date] = new Set();
                severeAlertDates[date].add(zip);
              }
            }
          }
        }
      } catch (e) {
        console.error(`Weather fetch failed for zip ${zip}:`, e);
      }
    }

    // Upsert alerts
    if (alerts.length > 0) {
      const dates = [...new Set(alerts.map(a => a.alert_date))];
      await supabase
        .from("weather_alerts")
        .delete()
        .in("alert_date", dates)
        .eq("dismissed", false);

      const { error } = await supabase.from("weather_alerts").insert(alerts);
      if (error) console.error("Insert alerts error:", error);
    }

    // AUTO-RESCHEDULE: Move jobs on severe weather dates to next available day
    let rescheduled = 0;
    const rescheduledDetails: any[] = [];

    for (const [alertDate, affectedZips] of Object.entries(severeAlertDates)) {
      const affectedJobs = upcomingJobs.filter((j: any) => {
        const addr = Array.isArray(j.service_addresses) ? j.service_addresses[0] : j.service_addresses;
        return j.scheduled_date === alertDate && addr?.zip && affectedZips.has(addr.zip);
      });

      for (const job of affectedJobs) {
        const addr = Array.isArray(job.service_addresses) ? job.service_addresses[0] : job.service_addresses;
        // Find next clear day (try +1, +2, +3 days)
        const originalDate = new Date(alertDate + "T12:00:00");
        let newDate: string | null = null;

        for (let offset = 1; offset <= 3; offset++) {
          const candidate = new Date(originalDate);
          candidate.setDate(candidate.getDate() + offset);
          const candidateStr = candidate.toISOString().split("T")[0];
          
          if (!severeAlertDates[candidateStr]?.has(addr?.zip)) {
            newDate = candidateStr;
            break;
          }
        }

        if (newDate) {
          const { error } = await supabase
            .from("jobs")
            .update({
              scheduled_date: newDate,
              notes: `Auto-rescheduled from ${alertDate} due to severe weather`,
            })
            .eq("id", job.id);

          if (!error) {
            rescheduled++;
            rescheduledDetails.push({
              job_id: job.id,
              from: alertDate,
              to: newDate,
              zip: addr?.zip,
            });

            const { data: sub } = await supabase
              .from("subscriptions")
              .select("customer_id")
              .eq("id", job.subscription_id)
              .single();

            if (sub) {
              await supabase.from("notifications").insert({
                user_id: sub.customer_id,
                type: "weather_reschedule",
                title: "Visit Rescheduled — Weather",
                body: `Your visit at ${addr?.street || 'your property'} on ${alertDate} has been moved to ${newDate} due to severe weather.`,
                channel: "sms",
                metadata: { job_id: job.id, original_date: alertDate, new_date: newDate },
              });
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Weather check complete. ${alerts.length} alerts, ${rescheduled} jobs auto-rescheduled.`,
        alerts: alerts.length,
        rescheduled,
        rescheduledDetails,
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
