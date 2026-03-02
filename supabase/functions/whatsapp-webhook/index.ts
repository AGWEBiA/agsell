// WhatsApp Inbound Webhook - Routes incoming WhatsApp messages to SAC Inbox
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Meta webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "agsell_whatsapp_verify";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp webhook verified");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("WhatsApp webhook received:", JSON.stringify(body).slice(0, 500));

    // Handle WhatsApp Business API (Cloud API) format
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== "messages") continue;
          const value = change.value;
          const phoneNumberId = value.metadata?.phone_number_id;

          // Find the organization that owns this phone number
          const { data: integration } = await supabase
            .from("organization_integrations")
            .select("organization_id, config")
            .eq("integration_type", "whatsapp_business")
            .eq("is_active", true)
            .filter("config->>phone_number_id", "eq", phoneNumberId)
            .maybeSingle();

          if (!integration) {
            console.log("No org found for phone_number_id:", phoneNumberId);
            continue;
          }

          // Get org owner for user_id reference
          const { data: orgOwner } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", integration.organization_id)
            .eq("role", "owner")
            .maybeSingle();

          const userId = orgOwner?.user_id;
          if (!userId) continue;

          for (const message of value.messages || []) {
            const senderPhone = message.from; // e.g. "5511999990000"
            const messageText = message.text?.body || message.caption || "[Mídia recebida]";
            const messageId = message.id;

            await routeToInbox(supabase, {
              organizationId: integration.organization_id,
              userId,
              channel: "whatsapp",
              senderIdentifier: senderPhone,
              identifierField: "whatsapp_phone",
              messageText,
              externalMessageId: messageId,
            });
          }
        }
      }
    }

    // Handle Evolution API format (webhook events)
    if (body.event === "messages.upsert" || body.event === "message" || body.event === "MESSAGES_UPSERT") {
      const data = body.data || body;
      const instanceName = (body.instance || data.instance || "").trim();

      // Find the org by Evolution API instance name (normalized match to avoid space/case issues)
      const normalizeInstanceName = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, "");
      const normalizedIncomingInstance = normalizeInstanceName(instanceName);

      const { data: activeIntegrations } = await supabase
        .from("organization_integrations")
        .select("organization_id, config")
        .eq("integration_type", "evolution_api")
        .eq("is_active", true);

      const integration = (activeIntegrations || []).find((item) => {
        const config = (item.config || {}) as Record<string, unknown>;
        const configuredInstance = typeof config.instance_name === "string" ? config.instance_name : "";
        return normalizeInstanceName(configuredInstance) === normalizedIncomingInstance;
      });

      if (integration) {
        const { data: orgOwner } = await supabase
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", integration.organization_id)
          .eq("role", "owner")
          .maybeSingle();

        const userId = orgOwner?.user_id;
        if (userId) {
          const keyData = data.key || data.message?.key || {};
          const messageData = data.message || data;

          const remoteJid =
            keyData.remoteJid ||
            data.remoteJid ||
            messageData.remoteJid ||
            "";

          const senderPhone = String(remoteJid)
            .replace("@s.whatsapp.net", "")
            .replace("@c.us", "");

          const isFromMe = keyData.fromMe || data.fromMe || false;

          const messageText =
            messageData?.conversation ||
            messageData?.extendedTextMessage?.text ||
            data.body ||
            null;

          const hasMedia = Boolean(
            messageData?.imageMessage ||
            messageData?.videoMessage ||
            messageData?.audioMessage ||
            messageData?.documentMessage
          );

          // Ignore delivery/read status updates that are not real inbound messages
          const isStatusOnly = !messageText && !hasMedia;

          if (!isFromMe && senderPhone && !isStatusOnly) {
            await routeToInbox(supabase, {
              organizationId: integration.organization_id,
              userId,
              channel: "whatsapp",
              senderIdentifier: senderPhone,
              identifierField: "whatsapp_phone",
              messageText: messageText || "[Mídia recebida]",
              externalMessageId: keyData.id,
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface RouteToInboxParams {
  organizationId: string;
  userId: string;
  channel: string;
  senderIdentifier: string;
  identifierField: string;
  messageText: string;
  externalMessageId?: string;
}

async function routeToInbox(
  supabase: ReturnType<typeof createClient>,
  params: RouteToInboxParams
) {
  try {
    const { organizationId, userId, channel, senderIdentifier, messageText } = params;

    // Try to find existing contact by phone/whatsapp number
    let contactId: string | null = null;
    const cleanPhone = senderIdentifier.replace(/\D/g, "");

    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .or(`whatsapp.eq.${cleanPhone},phone.eq.${cleanPhone}`)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      // Auto-create contact from incoming message
      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          first_name: cleanPhone,
          whatsapp: cleanPhone,
          phone: cleanPhone,
          source: "whatsapp_inbound",
          status: "active",
        })
        .select("id")
        .single();

      if (newContact) contactId = newContact.id;
    }

    // Find or create conversation
    const metadataKey = `${channel}_sender_id`;
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id, contact_id")
      .eq("organization_id", organizationId)
      .eq("channel", channel)
      .filter(`metadata->>${metadataKey}`, "eq", senderIdentifier)
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          status: "open",
          contact_id: contactId || existingConv.contact_id,
        })
        .eq("id", conversationId);
    } else {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          organization_id: organizationId,
          channel,
          status: "open",
          contact_id: contactId,
          last_message_at: new Date().toISOString(),
          metadata: { [metadataKey]: senderIdentifier },
        })
        .select("id")
        .single();

      if (convError) {
        console.error(`Error creating ${channel} conversation:`, convError);
        return;
      }
      conversationId = newConv.id;
    }

    // Insert the message
    const { error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content: messageText,
        sender_type: "contact",
        is_read: false,
      });

    if (msgError) {
      console.error(`Error inserting ${channel} message:`, msgError);
    } else {
      console.log(`${channel} message routed to inbox, conversation: ${conversationId}`);
    }
  } catch (err) {
    console.error("Error routing message to inbox:", err);
  }
}
