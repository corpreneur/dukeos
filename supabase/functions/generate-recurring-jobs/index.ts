import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all active subscriptions
    const { data: subs, error: subErr } = await supabase
      .from("subscriptions")
      .select("id, customer_id, address_id, frequency")
      .eq("active", true);

    if (subErr) throw subErr;

    const now = new Date();
    let created = 0;

    for (const sub of subs || []) {
      // Check latest job for this subscription
      const { data: latestJobs } = await supabase
        .from("jobs")
        .select("scheduled_date")
        .eq("subscription_id", sub.id)
        .order("scheduled_date", { ascending: false })
        .limit(1);

      const lastDate = latestJobs?.[0]?.scheduled_date
        ? new Date(latestJobs[0].scheduled_date)
        : null;

      // Calculate next date based on frequency
      let daysInterval = 7;
      if (sub.frequency === "biweekly") daysInterval = 14;
      if (sub.frequency === "monthly") daysInterval = 30;

      let nextDate: Date;
      if (!lastDate || lastDate < now) {
        // No future jobs — schedule from today + interval
        nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + 1); // tomorrow at earliest
      } else {
        nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + daysInterval);
      }

      // Only create if within next 30 days
      const thirtyDaysOut = new Date(now);
      thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

      if (nextDate <= thirtyDaysOut) {
        const { error: insertErr } = await supabase.from("jobs").insert({
          subscription_id: sub.id,
          address_id: sub.address_id,
          scheduled_date: nextDate.toISOString().split("T")[0],
        });

        if (!insertErr) created++;
      }
    }

    return new Response(JSON.stringify({ success: true, jobs_created: created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
