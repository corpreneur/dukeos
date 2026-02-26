import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const { job_id } = await req.json();
    if (!job_id) throw new Error("job_id is required");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get job details with customer info
    const { data: job, error: jobError } = await adminClient
      .from("jobs")
      .select("*, subscriptions(customer_id, plan), service_addresses(street, city)")
      .eq("id", job_id)
      .single();

    if (jobError || !job) throw new Error("Job not found");

    // Get technician name
    const { data: techProfile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", caller.id)
      .single();

    // Get customer profile
    const { data: customerProfile } = await adminClient
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", job.subscriptions?.customer_id)
      .single();

    const techName = techProfile?.full_name || "Your technician";
    const address = job.service_addresses ? `${job.service_addresses.street}` : "your property";

    // Create notification record
    const { error: notifError } = await adminClient.from("notifications").insert({
      user_id: job.subscriptions?.customer_id,
      type: "en_route",
      title: "Technician En Route",
      body: `${techName} is on the way to ${address}. Estimated arrival: 10-15 minutes.`,
      channel: "sms",
      metadata: { job_id, technician_id: caller.id, customer_phone: customerProfile?.phone },
    });

    if (notifError) throw notifError;

    return new Response(JSON.stringify({
      success: true,
      message: `Notification sent to ${customerProfile?.full_name || "customer"}`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("notify-en-route error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
