import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { job_proof_id, job_id, image_url } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use vision model to analyze the gate photo
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
            content: `You are a visual QA inspector for a pet services company. Analyze gate/fence photos to verify:
1. Is there a gate visible in the image?
2. Is the gate latch in a closed/secured position?

You MUST respond using the provided tool function.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this gate photo. Is the gate present and is the latch secured?",
              },
              {
                type: "image_url",
                image_url: { url: image_url },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "gate_verification_result",
              description: "Report the gate verification analysis results",
              parameters: {
                type: "object",
                properties: {
                  gate_detected: {
                    type: "boolean",
                    description: "Whether a gate or fence gate is visible in the image",
                  },
                  latch_secure: {
                    type: "boolean",
                    description: "Whether the gate latch appears to be in a closed/secured position",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 0 to 1",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of the analysis",
                  },
                },
                required: ["gate_detected", "latch_secure", "confidence", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "gate_verification_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Parse tool call result
    let result = { gate_detected: false, latch_secure: false, confidence: 0, reasoning: "Analysis failed" };
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        result = JSON.parse(toolCall.function.arguments);
      }
    } catch {
      console.error("Failed to parse AI tool call result");
    }

    // Store verification result
    const { error: insertError } = await supabase.from("gate_verifications").insert({
      job_proof_id,
      job_id,
      gate_detected: result.gate_detected,
      latch_secure: result.latch_secure,
      confidence_score: result.confidence,
      ai_response: result,
      admin_alerted: !result.latch_secure, // Alert if latch not secure
    });

    if (insertError) console.error("Insert error:", insertError);

    // If gate check failed, create admin notification
    if (!result.latch_secure || !result.gate_detected) {
      // Get technician info
      const { data: job } = await supabase
        .from("jobs")
        .select("technician_id, service_addresses(street, city)")
        .eq("id", job_id)
        .single();

      const { data: techProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", job?.technician_id)
        .single();

      // Get all admins
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const address = (job as any)?.service_addresses;
      const alertBody = `⚠️ Gate verification FAILED at ${address?.street || 'unknown'}, ${address?.city || ''}. Tech: ${techProfile?.full_name || 'Unknown'}. Reason: ${result.reasoning}`;

      // Notify all admins
      for (const admin of adminRoles || []) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          type: "gate_alert",
          channel: "push",
          title: "Gate Check Failed",
          body: alertBody,
          metadata: { job_id, job_proof_id, verification: result },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      verification: result,
      alert_triggered: !result.latch_secure || !result.gate_detected,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("verify-gate-photo error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
