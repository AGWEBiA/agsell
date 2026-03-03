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

    // Handle Evolution API connection status events
    if (body.event === "connection.update" || body.event === "CONNECTION_UPDATE") {
      const data = body.data || body;
      const instanceName = (body.instance || data.instance || "").trim();
      const state = data.state || data.status || "";

      if (state === "close" || state === "disconnected" || state === "DISCONNECTED") {
        console.log(`WhatsApp instance disconnected: ${instanceName}`);

        // Find the organization that owns this instance
        const { data: activeIntegrations } = await supabase
          .from("organization_integrations")
          .select("organization_id, config, name")
          .eq("integration_type", "evolution_api")
          .eq("is_active", true);

        const normalizeInstanceName = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, "");
        const normalizedIncoming = normalizeInstanceName(instanceName);

        const integration = (activeIntegrations || []).find((item) => {
          const config = (item.config || {}) as Record<string, unknown>;
          const configuredInstance = typeof config.instance_name === "string" ? config.instance_name : "";
          return normalizeInstanceName(configuredInstance) === normalizedIncoming;
        });

        if (integration) {
          // Get all org members to notify
          const { data: orgMembers } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", integration.organization_id);

          const displayName = integration.name || instanceName;

          // Create in-app notification for all org members
          for (const member of orgMembers || []) {
            await supabase.from("notifications").insert({
              user_id: member.user_id,
              organization_id: integration.organization_id,
              type: "whatsapp_disconnected",
              title: "⚠️ WhatsApp Desconectado",
              message: `A instância "${displayName}" foi desconectada. Reconecte o quanto antes para não perder mensagens.`,
              link: "/integrations",
              is_read: false,
              metadata: { instance_name: instanceName },
            });
          }

          // Send email notification to org members
          const { data: memberProfiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", (orgMembers || []).map((m) => m.user_id));

          // Get org owner email from auth.users via admin API
          const { data: orgOwner } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", integration.organization_id)
            .eq("role", "owner")
            .maybeSingle();

          if (orgOwner) {
            const { data: ownerAuth } = await supabase.auth.admin.getUserById(orgOwner.user_id);
            const ownerEmail = ownerAuth?.user?.email;
            const ownerName = (memberProfiles || []).find((p) => p.user_id === orgOwner.user_id)?.full_name || "";

            if (ownerEmail) {
              try {
                // Send email via internal send-email function
                const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
                      <h2 style="margin: 0;">⚠️ WhatsApp Desconectado</h2>
                    </div>
                    <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
                      <p>Olá${ownerName ? ` ${ownerName}` : ''},</p>
                      <p>A instância de WhatsApp <strong>"${displayName}"</strong> foi desconectada do sistema.</p>
                      <p style="color: #dc2626; font-weight: bold;">Enquanto estiver desconectada, você não receberá mensagens de clientes neste número.</p>
                      <p>Para reconectar:</p>
                      <ol>
                        <li>Acesse o painel de <strong>Integrações</strong></li>
                        <li>Clique em <strong>Reconectar</strong> na instância desconectada</li>
                        <li>Escaneie o novo QR Code com seu WhatsApp</li>
                      </ol>
                      <a href="https://agsell.lovable.app/integrations" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 12px;">
                        Reconectar Agora
                      </a>
                      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Este é um alerta automático do AG Sell.</p>
                    </div>
                  </div>
                `;

                // Call the send-email function internally
                const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;
                await fetch(sendEmailUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    organization_id: integration.organization_id,
                    to: ownerEmail,
                    subject: `⚠️ WhatsApp Desconectado: ${displayName}`,
                    html: emailHtml,
                  }),
                });
                console.log(`Disconnect email sent to ${ownerEmail}`);
              } catch (emailErr) {
                console.error("Failed to send disconnect email:", emailErr);
              }
            }
          }

          // Try sending WhatsApp notification via another active instance
          const otherActiveInstance = (activeIntegrations || []).find((item) => {
            const config = (item.config || {}) as Record<string, unknown>;
            const configuredInstance = typeof config.instance_name === "string" ? config.instance_name : "";
            return normalizeInstanceName(configuredInstance) !== normalizedIncoming;
          });

          if (otherActiveInstance) {
            try {
              const otherConfig = (otherActiveInstance.config || {}) as Record<string, string>;
              // Get owner phone to send WhatsApp alert
              if (orgOwner) {
                const { data: ownerContact } = await supabase
                  .from("contacts")
                  .select("whatsapp, phone")
                  .eq("organization_id", integration.organization_id)
                  .eq("user_id", orgOwner.user_id)
                  .maybeSingle();

                const ownerPhone = ownerContact?.whatsapp || ownerContact?.phone;
                if (ownerPhone) {
                  const sendWhatsAppUrl = `${supabaseUrl}/functions/v1/send-whatsapp`;
                  await fetch(sendWhatsAppUrl, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({
                      organization_id: integration.organization_id,
                      to: ownerPhone.replace(/\D/g, ""),
                      message: `⚠️ *WhatsApp Desconectado*\n\nA instância "${displayName}" foi desconectada do AG Sell.\n\nReconecte o quanto antes para não perder mensagens de clientes.\n\n👉 Acesse: https://agsell.lovable.app/integrations`,
                      instance_id: otherActiveInstance.organization_id,
                    }),
                  });
                  console.log("WhatsApp disconnect alert sent via alternative instance");
                }
              }
            } catch (whatsAppErr) {
              console.error("Failed to send WhatsApp disconnect alert:", whatsAppErr);
            }
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

          // Extract media info from Evolution API payload
          let mediaUrl: string | null = null;
          let mediaMimeType: string | null = null;
          let messageType: string = "text";
          let fileName: string | null = null;
          let mediaCaption: string | null = null;

          if (messageData?.imageMessage) {
            mediaUrl = messageData.imageMessage.url || messageData.imageMessage.directPath || null;
            mediaMimeType = messageData.imageMessage.mimetype || "image/jpeg";
            messageType = "image";
            mediaCaption = messageData.imageMessage.caption || null;
          } else if (messageData?.audioMessage) {
            mediaUrl = messageData.audioMessage.url || messageData.audioMessage.directPath || null;
            mediaMimeType = messageData.audioMessage.mimetype || "audio/ogg";
            messageType = "audio";
          } else if (messageData?.videoMessage) {
            mediaUrl = messageData.videoMessage.url || messageData.videoMessage.directPath || null;
            mediaMimeType = messageData.videoMessage.mimetype || "video/mp4";
            messageType = "video";
            mediaCaption = messageData.videoMessage.caption || null;
          } else if (messageData?.documentMessage) {
            mediaUrl = messageData.documentMessage.url || messageData.documentMessage.directPath || null;
            mediaMimeType = messageData.documentMessage.mimetype || "application/octet-stream";
            messageType = "document";
            fileName = messageData.documentMessage.fileName || messageData.documentMessage.title || null;
            mediaCaption = messageData.documentMessage.caption || null;
          } else if (messageData?.stickerMessage) {
            mediaUrl = messageData.stickerMessage.url || messageData.stickerMessage.directPath || null;
            mediaMimeType = messageData.stickerMessage.mimetype || "image/webp";
            messageType = "image";
          }

          // Also check Evolution API v2 format with base64 media
          if (!mediaUrl && data.message?.base64) {
            mediaUrl = `data:${mediaMimeType || "application/octet-stream"};base64,${data.message.base64}`;
          }
          if (!mediaUrl && data.message?.mediaUrl) {
            mediaUrl = data.message.mediaUrl;
          }

          const hasMedia = Boolean(mediaUrl || messageData?.imageMessage || messageData?.videoMessage || messageData?.audioMessage || messageData?.documentMessage);

          // Ignore delivery/read status updates that are not real inbound messages
          const isStatusOnly = !messageText && !hasMedia;

          if (!isFromMe && senderPhone && !isStatusOnly) {
            const displayText = mediaCaption || messageText || (hasMedia ? "" : "");
            await routeToInbox(supabase, {
              organizationId: integration.organization_id,
              userId,
              channel: "whatsapp",
              senderIdentifier: senderPhone,
              identifierField: "whatsapp_phone",
              messageText: displayText || (hasMedia ? `[${messageType === "audio" ? "🎵 Áudio" : messageType === "image" ? "📷 Imagem" : messageType === "video" ? "🎥 Vídeo" : "📎 Arquivo"}]` : "[Mensagem]"),
              externalMessageId: keyData.id,
              mediaUrl,
              mediaMimeType,
              messageType: hasMedia ? messageType : "text",
              fileName,
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
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  messageType?: string;
  fileName?: string | null;
}

async function routeToInbox(
  supabase: ReturnType<typeof createClient>,
  params: RouteToInboxParams
) {
  try {
    const { organizationId, userId, channel, senderIdentifier, messageText } = params;

    // Try to find existing contact by normalized phone/whatsapp number
    let contactId: string | null = null;
    const cleanPhone = senderIdentifier.replace(/\D/g, "");

    const normalizePhone = (value: string | null | undefined) => (value || "").replace(/\D/g, "");
    const comparablePhones = Array.from(
      new Set([
        cleanPhone,
        cleanPhone.startsWith("55") ? cleanPhone.slice(2) : cleanPhone,
      ].filter(Boolean))
    );

    const { data: orgContacts } = await supabase
      .from("contacts")
      .select("id, phone, whatsapp")
      .eq("organization_id", organizationId)
      .limit(1000);

    const matchedContact = (orgContacts || []).find((contact) => {
      const phone = normalizePhone(contact.phone);
      const whatsapp = normalizePhone(contact.whatsapp);
      return comparablePhones.includes(phone) || comparablePhones.includes(whatsapp);
    });

    if (matchedContact) {
      contactId = matchedContact.id;
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

    // Find or create conversation (prioritize canonical conversation for this lead)
    const metadataKey = `${channel}_sender_id`;

    const normalizedSender = senderIdentifier.replace(/\D/g, "");
    const senderCandidates = Array.from(
      new Set(
        [
          senderIdentifier,
          normalizedSender,
          normalizedSender.startsWith("55") ? normalizedSender.slice(2) : normalizedSender ? `55${normalizedSender}` : "",
        ].filter(Boolean)
      )
    );

    const { data: orgConversations } = await supabase
      .from("conversations")
      .select("id, contact_id, metadata, last_message_at")
      .eq("organization_id", organizationId)
      .eq("channel", channel)
      .order("last_message_at", { ascending: false })
      .limit(1000);

    const conversations = orgConversations || [];

    const contactConv = contactId
      ? conversations.find((conv) => conv.contact_id === contactId) || null
      : null;

    const metadataConv =
      conversations.find((conv) => {
        const metadataValue = (conv.metadata as Record<string, unknown> | null)?.[metadataKey];
        const normalizedMetadata = normalizePhone(typeof metadataValue === "string" ? metadataValue : "");
        return senderCandidates.includes(String(metadataValue || "")) || senderCandidates.includes(normalizedMetadata);
      }) || null;

    let existingConv: { id: string; contact_id: string | null; metadata?: unknown } | null = null;

    // If both exist and are different, merge into the contact conversation to avoid split threads
    if (contactConv && metadataConv && contactConv.id !== metadataConv.id) {
      const { error: reassignError } = await supabase
        .from("messages")
        .update({ conversation_id: contactConv.id })
        .eq("conversation_id", metadataConv.id);

      if (reassignError) {
        console.error("Error merging duplicate conversations:", reassignError);
      } else {
        await supabase
          .from("conversations")
          .delete()
          .eq("id", metadataConv.id);
      }

      existingConv = contactConv;
    } else {
      existingConv = contactConv || metadataConv;
    }

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;

      const existingMetadata = (existingConv.metadata as Record<string, unknown> | null) || {};

      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          status: "open",
          contact_id: contactId || existingConv.contact_id,
          metadata: { ...existingMetadata, [metadataKey]: normalizedSender || senderIdentifier },
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
          metadata: { [metadataKey]: normalizedSender || senderIdentifier },
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
    const messageInsert: Record<string, unknown> = {
      conversation_id: conversationId,
      content: messageText,
      sender_type: "contact",
      is_read: false,
    };
    if (params.mediaUrl) messageInsert.media_url = params.mediaUrl;
    if (params.mediaMimeType) messageInsert.media_mime_type = params.mediaMimeType;
    if (params.messageType && params.messageType !== "text") messageInsert.message_type = params.messageType;
    if (params.fileName) messageInsert.file_name = params.fileName;

    const { error: msgError } = await supabase
      .from("messages")
      .insert(messageInsert);

    if (msgError) {
      console.error(`Error inserting ${channel} message:`, msgError);
    } else {
      console.log(`${channel} message routed to inbox, conversation: ${conversationId}`);
    }
  } catch (err) {
    console.error("Error routing message to inbox:", err);
  }
}
