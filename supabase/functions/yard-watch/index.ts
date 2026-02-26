import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Upsell mapping: issue type → service offer
const UPSELL_MAP: Record<string, { service: string; price_cents: number; message_template: string }> = {
  long_grass: {
    service: "lawn_mow",
    price_cents: 4500,
    message_template: "Hi {name}! Our tech noticed the grass is getting long during today's scoop. Want us to add a mow to your next visit for just $45?",
  },
  broken_fence: {
    service: "fence_repair_referral",
    price_cents: 0,
    message_template: "Hi {name}! Our tech noticed a section of fencing that looks damaged. Would you like us to connect you with our trusted repair partner?",
  },
  pest_infestation: {
    service: "pest_treatment_referral",
    price_cents: 0,
    message_template: "Hi {name}! Our tech observed signs of pest activity in your yard. We can refer you to our pest control partner — want us to set that up?",
  },
  broken_sprinkler: {
    service: "sprinkler_referral",
    price_cents: 0,
    message_template: "Hi {name}! Our tech spotted a broken sprinkler head during today's visit. Want us to connect you with an irrigation specialist?",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { job_id, issue_type, notes, technician_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Save the yard issue
    const { data: issue, error: issueError } = await supabase
      .from("yard_issues")
      .insert({ job_id, issue_type, notes, technician_id })
      .select()
      .single();

    if (issueError) throw issueError;

    // Get the job → subscription → customer info
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("subscription_id, subscriptions(customer_id)")
      .eq("id", job_id)
      .single();

    if (jobError) throw jobError;

    const customerId = (job as any).subscriptions?.customer_id;
    if (!customerId) throw new Error("Could not find customer for this job");

    // Get customer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", customerId)
      .single();

    const customerName = profile?.full_name || "there";

    // Generate upsell message via AI
    const upsellConfig = UPSELL_MAP[issue_type];
    let upsellMessage: string;

    if (upsellConfig) {
      // Use AI to personalize the message
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: "You are a friendly SMS copywriter for Scoop Duke, a pet waste removal service. Write a short, warm SMS (under 160 chars) offering an upsell service. Be conversational, not salesy. Include the price if provided. Do not include any links or phone numbers.",
                },
                {
                  role: "user",
                  content: `Customer name: ${customerName}. Issue observed: ${issue_type}. Tech notes: ${notes || 'none'}. Service to offer: ${upsellConfig.service}. Price: ${upsellConfig.price_cents ? '$' + (upsellConfig.price_cents / 100) : 'free referral'}.`,
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            upsellMessage = aiData.choices?.[0]?.message?.content || upsellConfig.message_template.replace("{name}", customerName);
          } else {
            upsellMessage = upsellConfig.message_template.replace("{name}", customerName);
          }
        } catch {
          upsellMessage = upsellConfig.message_template.replace("{name}", customerName);
        }
      } else {
        upsellMessage = upsellConfig.message_template.replace("{name}", customerName);
      }
    } else {
      upsellMessage = `Hi ${customerName}! Our tech noticed a yard issue during today's visit. We'll follow up with options to help.`;
    }

    // Log notification (SMS would be sent via Twilio in production)
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: customerId,
      type: "sms_upsell",
      channel: "sms",
      title: `Yard Watch: ${issue_type.replace(/_/g, " ")}`,
      body: upsellMessage,
      metadata: {
        job_id,
        issue_id: issue.id,
        issue_type,
        service_offered: upsellConfig?.service,
        price_cents: upsellConfig?.price_cents,
      },
    });

    if (notifError) console.error("Notification insert error:", notifError);

    return new Response(JSON.stringify({
      success: true,
      issue_id: issue.id,
      upsell_message: upsellMessage,
      notification_sent: !notifError,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("yard-watch error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
