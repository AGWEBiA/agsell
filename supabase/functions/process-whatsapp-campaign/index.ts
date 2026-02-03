// WhatsApp Campaign Processor - Handles bulk messaging with rate limiting
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessCampaignRequest {
  campaign_id: string;
  action: "start" | "pause" | "resume" | "stop";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { campaign_id, action } = (await req.json()) as ProcessCampaignRequest;

    const { data: campaign, error: campaignError } = await supabase
      .from("whatsapp_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = campaign.organization_id;

    if (action === "start") {
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, phone, whatsapp")
        .eq("organization_id", orgId)
        .not("phone", "is", null);

      const recipients = (contacts || [])
        .map((c: { id: string; first_name: string; last_name: string | null; phone: string | null; whatsapp: string | null }) => ({
          phone: c.whatsapp || c.phone || "",
          name: `${c.first_name} ${c.last_name || ""}`.trim(),
          contact_id: c.id,
        }))
        .filter((r: { phone: string }) => {
          const cleaned = r.phone.replace(/\D/g, "");
          return cleaned.length >= 10 && cleaned.length <= 15;
        });

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid recipients" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const recipientRows = recipients.map((r: { phone: string; name: string; contact_id: string }) => ({
        campaign_id,
        phone_number: r.phone.replace(/\D/g, ""),
        name: r.name,
        contact_id: r.contact_id,
        status: "pending",
      }));

      await supabase.from("whatsapp_campaign_recipients").insert(recipientRows);

      await supabase
        .from("whatsapp_campaigns")
        .update({
          status: "running",
          started_at: new Date().toISOString(),
          total_recipients: recipients.length,
        })
        .eq("id", campaign_id);

      return new Response(
        JSON.stringify({ success: true, total_recipients: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "pause") {
      await supabase
        .from("whatsapp_campaigns")
        .update({ status: "paused", paused_at: new Date().toISOString() })
        .eq("id", campaign_id);
    }

    if (action === "resume") {
      await supabase
        .from("whatsapp_campaigns")
        .update({ status: "running" })
        .eq("id", campaign_id);
    }

    if (action === "stop") {
      await supabase
        .from("whatsapp_campaign_recipients")
        .update({ status: "skipped" })
        .eq("campaign_id", campaign_id)
        .eq("status", "pending");

      await supabase
        .from("whatsapp_campaigns")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", campaign_id);
    }

    return new Response(
      JSON.stringify({ success: true, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
