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
  standing_water: {
    service: "drainage_referral",
    price_cents: 0,
    message_template: "Hi {name}! Our tech noticed standing water in your yard — this could attract mosquitoes. Want us to refer a drainage specialist?",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { job_id, issue_type, notes, technician_id, photo_url } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // If photo_url is provided and no issue_type, use AI vision to auto-detect
    let detectedIssueType = issue_type;
    let aiDetectionResult: any = null;

    if (photo_url && !issue_type && LOVABLE_API_KEY) {
      try {
        const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: `You are a yard inspection AI for Scoop Duke, a pet waste removal company. Analyze yard photos to identify actionable issues. You MUST respond using the provided tool function.`,
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Analyze this yard photo. Identify any issues like overgrown grass, fence damage, pest signs, sprinkler issues, standing water, or other property problems." },
                  { type: "image_url", image_url: { url: photo_url } },
                ],
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "yard_issue_detection",
                  description: "Report detected yard issues from photo analysis",
                  parameters: {
                    type: "object",
                    properties: {
                      issue_detected: {
                        type: "boolean",
                        description: "Whether any actionable yard issue was detected",
                      },
                      issue_type: {
                        type: "string",
                        enum: ["long_grass", "broken_fence", "pest_infestation", "broken_sprinkler", "standing_water", "other"],
                        description: "The primary issue type detected",
                      },
                      confidence: {
                        type: "number",
                        description: "Confidence score from 0 to 1",
                      },
                      description: {
                        type: "string",
                        description: "Brief description of what was observed in the photo",
                      },
                    },
                    required: ["issue_detected", "issue_type", "confidence", "description"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "yard_issue_detection" } },
          }),
        });

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const toolCall = visionData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            aiDetectionResult = JSON.parse(toolCall.function.arguments);
            if (aiDetectionResult.issue_detected && aiDetectionResult.confidence > 0.5) {
              detectedIssueType = aiDetectionResult.issue_type;
            }
          }
        } else {
          const errText = await visionResponse.text();
          console.error("Vision API error:", visionResponse.status, errText);
        }
      } catch (visionErr) {
        console.error("Vision detection failed:", visionErr);
      }
    }

    // Fallback if still no issue type
    if (!detectedIssueType) {
      detectedIssueType = "other";
    }

    // Save the yard issue
    const { data: issue, error: issueError } = await supabase
      .from("yard_issues")
      .insert({
        job_id,
        issue_type: detectedIssueType,
        notes: aiDetectionResult?.description || notes || null,
        technician_id,
        photo_url: photo_url || null,
      })
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
    const upsellConfig = UPSELL_MAP[detectedIssueType];
    let upsellMessage: string;

    if (upsellConfig && LOVABLE_API_KEY) {
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
                content: `Customer name: ${customerName}. Issue observed: ${detectedIssueType}. AI observation: ${aiDetectionResult?.description || 'none'}. Tech notes: ${notes || 'none'}. Service to offer: ${upsellConfig.service}. Price: ${upsellConfig.price_cents ? '$' + (upsellConfig.price_cents / 100) : 'free referral'}.`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          upsellMessage = aiData.choices?.[0]?.message?.content || upsellConfig.message_template.replace("{name}", customerName);
        } else {
          await aiResponse.text();
          upsellMessage = upsellConfig.message_template.replace("{name}", customerName);
        }
      } catch {
        upsellMessage = upsellConfig.message_template.replace("{name}", customerName);
      }
    } else if (upsellConfig) {
      upsellMessage = upsellConfig.message_template.replace("{name}", customerName);
    } else {
      upsellMessage = `Hi ${customerName}! Our tech noticed a yard issue during today's visit. We'll follow up with options to help.`;
    }

    // Log notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: customerId,
      type: "sms_upsell",
      channel: "sms",
      title: `Yard Watch: ${detectedIssueType.replace(/_/g, " ")}`,
      body: upsellMessage,
      metadata: {
        job_id,
        issue_id: issue.id,
        issue_type: detectedIssueType,
        ai_detection: aiDetectionResult,
        service_offered: upsellConfig?.service,
        price_cents: upsellConfig?.price_cents,
        photo_url,
      },
    });

    if (notifError) console.error("Notification insert error:", notifError);

    return new Response(JSON.stringify({
      success: true,
      issue_id: issue.id,
      detected_issue_type: detectedIssueType,
      ai_detection: aiDetectionResult,
      upsell_message: upsellMessage,
      notification_sent: !notifError,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("yard-watch error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
