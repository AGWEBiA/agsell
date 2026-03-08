import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { contact_id, organization_id, calculate_all } = await req.json();
    if (!organization_id) throw new Error("organization_id required");

    // Get contacts to score
    let contactsQuery = supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, lead_score, source, status, created_at")
      .eq("organization_id", organization_id);

    if (!calculate_all && contact_id) {
      contactsQuery = contactsQuery.eq("id", contact_id);
    }

    const { data: contacts, error: contactsError } = await contactsQuery.limit(50);
    if (contactsError) throw contactsError;
    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const contact of contacts) {
      // Gather behavioral data
      const [activitiesRes, conversationsRes, dealsRes, tagsRes] = await Promise.all([
        supabase.from("activities").select("activity_type, created_at").eq("contact_id", contact.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("conversations").select("channel, status, created_at").eq("contact_id", contact.id).limit(10),
        supabase.from("deals").select("status, value, created_at").eq("contact_id", contact.id).limit(5),
        supabase.from("contact_tags").select("tag_id, tags(name)").eq("contact_id", contact.id).limit(10),
      ]);

      const activities = activitiesRes.data ?? [];
      const conversations = conversationsRes.data ?? [];
      const deals = dealsRes.data ?? [];
      const tags = tagsRes.data ?? [];

      const prompt = `Analyze this contact's behavior and predict their conversion probability (0-100).

Contact: ${contact.first_name} ${contact.last_name || ''}, source: ${contact.source || 'unknown'}, status: ${contact.status || 'lead'}, current_score: ${contact.lead_score ?? 0}, created: ${contact.created_at}

Activities (${activities.length}): ${activities.map(a => a.activity_type).join(', ') || 'none'}
Conversations (${conversations.length}): ${conversations.map(c => `${c.channel}:${c.status}`).join(', ') || 'none'}
Deals (${deals.length}): ${deals.map(d => `${d.status}:$${d.value || 0}`).join(', ') || 'none'}
Tags: ${tags.map((t: any) => t.tags?.name).filter(Boolean).join(', ') || 'none'}

Return a JSON with predicted_score (0-100), confidence (0-1), and factors array [{name, impact (-10 to +10), description}]. Max 5 factors.`;

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You are a lead scoring AI. Return ONLY valid JSON, no markdown." },
              { role: "user", content: prompt },
            ],
            tools: [{
              type: "function",
              function: {
                name: "predict_score",
                description: "Return predicted lead score",
                parameters: {
                  type: "object",
                  properties: {
                    predicted_score: { type: "number" },
                    confidence: { type: "number" },
                    factors: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          impact: { type: "number" },
                          description: { type: "string" },
                        },
                        required: ["name", "impact", "description"],
                      },
                    },
                  },
                  required: ["predicted_score", "confidence", "factors"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "predict_score" } },
          }),
        });

        if (!aiResp.ok) {
          if (aiResp.status === 429) {
            console.log("Rate limited, waiting...");
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          console.error("AI error:", aiResp.status);
          continue;
        }

        const aiData = await aiResp.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) continue;

        const result = JSON.parse(toolCall.function.arguments);
        const score = Math.min(100, Math.max(0, Math.round(result.predicted_score)));
        const confidence = Math.min(1, Math.max(0, result.confidence));

        await supabase.from("predictive_lead_scores").upsert({
          contact_id: contact.id,
          organization_id,
          predicted_score: score,
          confidence,
          factors: result.factors || [],
          model_version: "v1",
          calculated_at: new Date().toISOString(),
        }, { onConflict: "contact_id" });

        // Also update the contact's lead_score if predictive is higher
        if (score > (contact.lead_score ?? 0)) {
          await supabase.from("contacts").update({ lead_score: score }).eq("id", contact.id);
        }

        processed++;
      } catch (e) {
        console.error(`Error scoring contact ${contact.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Predictive scoring error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
