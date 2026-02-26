import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Dispatch pending notifications via their configured channel (sms, email, push).
 * 
 * Currently logs dispatch actions and marks notifications as sent.
 * To enable actual SMS delivery, add a Twilio integration.
 * To enable actual email delivery, add a transactional email service.
 * 
 * This function can be called on a cron schedule or invoked manually.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get unsent notifications (sent_at = created_at means not yet dispatched externally)
    // We track dispatch by checking a dispatched flag in metadata
    const { data: pending, error: fetchErr } = await supabase
      .from("notifications")
      .select("*, profiles!inner(full_name, phone)")
      .eq("read", false)
      .is("metadata->dispatched", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchErr) throw fetchErr;

    if (!pending?.length) {
      return new Response(JSON.stringify({ message: "No pending notifications", dispatched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const notif of pending) {
      const channel = notif.channel || "sms";
      const phone = notif.profiles?.phone;
      const name = notif.profiles?.full_name || "Customer";

      let dispatchResult = "queued";

      if (channel === "sms") {
        if (phone) {
          // TODO: Integrate Twilio or similar SMS provider
          // For now, log the SMS that would be sent
          console.log(`[SMS] To: ${phone} | ${notif.title}: ${notif.body}`);
          dispatchResult = "logged_sms";
        } else {
          dispatchResult = "no_phone";
        }
      } else if (channel === "email") {
        // TODO: Integrate transactional email service
        console.log(`[EMAIL] To: ${name} | ${notif.title}: ${notif.body}`);
        dispatchResult = "logged_email";
      } else if (channel === "push") {
        console.log(`[PUSH] To: ${name} | ${notif.title}: ${notif.body}`);
        dispatchResult = "logged_push";
      }

      // Mark as dispatched in metadata
      const existingMetadata = (notif.metadata as Record<string, any>) || {};
      const { error: updateErr } = await supabase
        .from("notifications")
        .update({
          metadata: { ...existingMetadata, dispatched: true, dispatch_channel: channel, dispatch_result: dispatchResult, dispatched_at: new Date().toISOString() },
        })
        .eq("id", notif.id);

      if (updateErr) console.error(`Failed to mark notification ${notif.id}:`, updateErr);

      results.push({ id: notif.id, type: notif.type, channel, result: dispatchResult, recipient: name });
    }

    return new Response(
      JSON.stringify({
        message: `Dispatched ${results.length} notifications`,
        dispatched: results.length,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("dispatch-notifications error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
