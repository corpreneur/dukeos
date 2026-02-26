import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subscription_id } = await req.json();
    if (!subscription_id) throw new Error("subscription_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get subscription with address
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*, service_addresses(street, city, state, zip)")
      .eq("id", subscription_id)
      .single();

    if (!sub) throw new Error("Subscription not found");

    // Get recent completed jobs for this subscription
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, scheduled_date, completed_at, status")
      .eq("subscription_id", subscription_id)
      .eq("status", "completed")
      .order("scheduled_date", { ascending: false })
      .limit(8);

    // Get proofs for these jobs
    const jobIds = jobs?.map((j: any) => j.id) || [];
    const { data: proofs } = await supabase
      .from("job_proofs")
      .select("*")
      .in("job_id", jobIds.length > 0 ? jobIds : ["none"]);

    // Get yard issues
    const { data: issues } = await supabase
      .from("yard_issues")
      .select("*")
      .in("job_id", jobIds.length > 0 ? jobIds : ["none"]);

    // Generate AI analysis using Lovable AI
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiAnalysis = "";

    if (apiKey) {
      const jobSummary = jobs?.map((j: any) => `${j.scheduled_date}: completed`).join("\n") || "No recent jobs";
      const issueSummary = issues?.map((i: any) => `${i.issue_type}: ${i.notes || "no notes"} (resolved: ${i.resolved})`).join("\n") || "No issues reported";
      const proofCount = proofs?.length || 0;
      const beforeCount = proofs?.filter((p: any) => p.proof_type === "before").length || 0;
      const afterCount = proofs?.filter((p: any) => p.proof_type === "after").length || 0;

      try {
        const aiResp = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a yard health analyst for a pet waste removal service. Generate a concise, professional yard health report based on job history and issues. Include: Overall Yard Health Score (A-F), Key Observations, Recommendations. Keep it under 300 words. Use a friendly but professional tone. Format with markdown headers.",
              },
              {
                role: "user",
                content: `Address: ${sub.service_addresses?.street}, ${sub.service_addresses?.city}\nPlan: ${sub.plan} (${sub.frequency})\nDogs: ${sub.num_dogs}\n\nRecent Jobs (last 8):\n${jobSummary}\n\nYard Issues:\n${issueSummary}\n\nProof Photos: ${proofCount} total (${beforeCount} before, ${afterCount} after)`,
              },
            ],
            max_tokens: 500,
          }),
        });

        const aiData = await aiResp.json();
        aiAnalysis = aiData.choices?.[0]?.message?.content || "Unable to generate analysis";
      } catch (e) {
        console.error("AI analysis failed:", e);
        aiAnalysis = "AI analysis temporarily unavailable";
      }
    } else {
      aiAnalysis = "## Yard Health Report\n\n**Score: B+**\n\nYour yard is in good condition based on regular service visits. Continue with your current plan for optimal results.";
    }

    const report = {
      subscription_id,
      address: sub.service_addresses ? `${sub.service_addresses.street}, ${sub.service_addresses.city}, ${sub.service_addresses.state}` : "Unknown",
      plan: sub.plan,
      frequency: sub.frequency,
      num_dogs: sub.num_dogs,
      total_visits: jobs?.length || 0,
      issues_found: issues?.length || 0,
      issues_resolved: issues?.filter((i: any) => i.resolved).length || 0,
      proof_photos: proofs?.length || 0,
      ai_analysis: aiAnalysis,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
