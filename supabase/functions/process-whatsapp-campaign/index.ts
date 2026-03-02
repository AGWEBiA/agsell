// WhatsApp Campaign Processor - Handles bulk messaging with rate limiting
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      // 1. Fetch contacts with valid phone numbers
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

      // 2. Insert recipients
      const recipientRows = recipients.map((r: { phone: string; name: string; contact_id: string }) => ({
        campaign_id,
        phone_number: r.phone.replace(/\D/g, ""),
        name: r.name,
        contact_id: r.contact_id,
        status: "pending",
      }));

      await supabase.from("whatsapp_campaign_recipients").insert(recipientRows);

      // 3. Update campaign status
      await supabase
        .from("whatsapp_campaigns")
        .update({
          status: "running",
          started_at: new Date().toISOString(),
          total_recipients: recipients.length,
        })
        .eq("id", campaign_id);

      // 4. Resolve WhatsApp provider for this org
      const provider = await resolveProvider(supabase, orgId);
      if (!provider) {
        await supabase
          .from("whatsapp_campaigns")
          .update({ status: "cancelled" })
          .eq("id", campaign_id);
        return new Response(
          JSON.stringify({ error: "No WhatsApp integration configured for this organization" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 5. Dispatch messages with rate limiting
      const delayMs = campaign.delay_between_messages || 3000;
      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of recipients) {
        // Check if campaign was paused/cancelled mid-run
        const { data: currentState } = await supabase
          .from("whatsapp_campaigns")
          .select("status")
          .eq("id", campaign_id)
          .single();

        if (currentState?.status !== "running") {
          console.log("Campaign stopped mid-execution:", currentState?.status);
          break;
        }

        // Personalize message
        const personalizedMessage = campaign.message_content
          .replace(/\{\{nome\}\}/g, recipient.name)
          .replace(/\{\{telefone\}\}/g, recipient.phone);

        const phoneNumber = recipient.phone.replace(/\D/g, "");

        try {
          const success = await sendMessage(provider, phoneNumber, personalizedMessage, campaign.media_url);

          if (success) {
            sentCount++;
            await supabase
              .from("whatsapp_campaign_recipients")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("campaign_id", campaign_id)
              .eq("contact_id", recipient.contact_id);
          } else {
            failedCount++;
            await supabase
              .from("whatsapp_campaign_recipients")
              .update({ status: "failed", error_message: "Send failed" })
              .eq("campaign_id", campaign_id)
              .eq("contact_id", recipient.contact_id);
          }
        } catch (err) {
          failedCount++;
          const errMsg = err instanceof Error ? err.message : "Unknown error";
          await supabase
            .from("whatsapp_campaign_recipients")
            .update({ status: "failed", error_message: errMsg })
            .eq("campaign_id", campaign_id)
            .eq("contact_id", recipient.contact_id);
        }

        // Update running totals
        await supabase
          .from("whatsapp_campaigns")
          .update({ messages_sent: sentCount, messages_failed: failedCount })
          .eq("id", campaign_id);

        // Rate limiting delay
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      // 6. Mark completed
      await supabase
        .from("whatsapp_campaigns")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          messages_sent: sentCount,
          messages_failed: failedCount,
        })
        .eq("id", campaign_id);

      return new Response(
        JSON.stringify({ success: true, total_recipients: recipients.length, sent: sentCount, failed: failedCount }),
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

// --- Provider Resolution ---

interface ProviderConfig {
  type: "evolution_api" | "whatsapp_business";
  config: Record<string, string>;
}

async function resolveProvider(supabase: ReturnType<typeof createClient>, orgId: string): Promise<ProviderConfig | null> {
  // Try Evolution API first
  const { data: evolutionInt } = await supabase
    .from("organization_integrations")
    .select("config")
    .eq("organization_id", orgId)
    .eq("integration_type", "evolution_api")
    .eq("is_active", true)
    .maybeSingle();

  if (evolutionInt) {
    // Merge with global Evolution API config (URL + key from platform_settings)
    const { data: globalConfig } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

    const globalEvo = globalConfig?.value as Record<string, string> | null;
    const orgConfig = evolutionInt.config as Record<string, string>;

    const mergedConfig: Record<string, string> = {
      api_url: globalEvo?.api_url || orgConfig.api_url || "",
      api_key: globalEvo?.api_key || orgConfig.api_key || "",
      instance_name: (orgConfig.instance_name || "").trim(),
    };

    if (mergedConfig.api_url && mergedConfig.api_key && mergedConfig.instance_name) {
      return { type: "evolution_api", config: mergedConfig };
    }
  }

  // Try WhatsApp Business API
  const { data: businessInt } = await supabase
    .from("organization_integrations")
    .select("config")
    .eq("organization_id", orgId)
    .eq("integration_type", "whatsapp_business")
    .eq("is_active", true)
    .maybeSingle();

  if (businessInt) {
    return { type: "whatsapp_business", config: businessInt.config as Record<string, string> };
  }

  return null;
}

// --- Message Dispatch ---

async function sendMessage(
  provider: ProviderConfig,
  phoneNumber: string,
  message: string,
  mediaUrl?: string | null
): Promise<boolean> {
  if (provider.type === "evolution_api") {
    return await sendViaEvolution(provider.config, phoneNumber, message, mediaUrl);
  }
  return await sendViaBusiness(provider.config, phoneNumber, message, mediaUrl);
}

async function sendViaEvolution(
  config: Record<string, string>,
  phoneNumber: string,
  message: string,
  mediaUrl?: string | null
): Promise<boolean> {
  const { api_url: baseUrl, api_key: apiKey, instance_name: rawInstanceName } = config;
  const instanceName = (rawInstanceName || "").trim();
  if (!baseUrl || !apiKey || !instanceName) return false;

  if (mediaUrl) {
    const resp = await fetch(`${baseUrl}/message/sendMedia/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ number: phoneNumber, mediatype: "image", media: mediaUrl, caption: message }),
    });
    const body = await resp.text();
    if (!resp.ok) console.error("Evolution media error:", body);
    return resp.ok;
  }

  const resp = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: phoneNumber, text: message }),
  });
  const body = await resp.text();
  if (!resp.ok) console.error("Evolution text error:", body);
  return resp.ok;
}

async function sendViaBusiness(
  config: Record<string, string>,
  phoneNumber: string,
  message: string,
  mediaUrl?: string | null
): Promise<boolean> {
  const { access_token: accessToken, phone_number_id: phoneNumberId } = config;
  if (!accessToken || !phoneNumberId) return false;

  const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  let messageBody: Record<string, unknown>;
  if (mediaUrl) {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "image",
      image: { link: mediaUrl, caption: message },
    };
  } else {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: { preview_url: true, body: message },
    };
  }

  const resp = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(messageBody),
  });
  const body = await resp.text();
  if (!resp.ok) console.error("WhatsApp Business API error:", body);
  return resp.ok;
}
