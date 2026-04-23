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
            .select("id, name, organization_id, config")
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
              sourceInstanceId: integration.id,
              sourceInstanceName: integration.name || String((integration.config as Record<string, unknown>)?.phone_number_id || "WhatsApp Business"),
            });
          }
        }
      }
    }

    // Handle Evolution API message status updates (delivered/read)
    if (body.event === "messages.update" || body.event === "MESSAGES_UPDATE") {
      const updates = Array.isArray(body.data) ? body.data : [body.data];
      for (const update of updates) {
        const msgId = update?.key?.id || update?.id;
        const status = update?.status;
        if (!msgId || !status) continue;

        // Map Evolution API status to our delivery_status
        let deliveryStatus: string | null = null;
        if (status === "DELIVERY_ACK" || status === "delivered" || status === 3) {
          deliveryStatus = "delivered";
        } else if (status === "READ" || status === "read" || status === 4) {
          deliveryStatus = "read";
        } else if (status === "PLAYED" || status === 5) {
          deliveryStatus = "read";
        } else if (status === "ERROR" || status === "failed") {
          deliveryStatus = "failed";
        }

        if (deliveryStatus) {
          await supabase
            .from("messages")
            .update({ delivery_status: deliveryStatus })
            .eq("external_id", msgId);
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
                      <a href="https://site.agsell.com.br/integrations" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 12px;">
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
                      message: `⚠️ *WhatsApp Desconectado*\n\nA instância "${displayName}" foi desconectada do AG Sell.\n\nReconecte o quanto antes para não perder mensagens de clientes.\n\n👉 Acesse: https://site.agsell.com.br/integrations`,
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

    // Handle Evolution API group participant events (join/leave)
    if (body.event === "group-participants.update" || body.event === "GROUP_PARTICIPANTS_UPDATE") {
      const data = body.data || body;
      const instanceName = (body.instance || data.instance || "").trim();
      const action = data.action || data.event || ""; // "add" or "remove"
      const groupJid = data.id || data.groupJid || data.jid || "";
      const participants = data.participants || [];

      console.log(`Group event: ${action} in ${groupJid}, participants: ${JSON.stringify(participants)}`);

      const normalizeInstanceName = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, "");
      const normalizedIncoming = normalizeInstanceName(instanceName);

      const { data: activeIntegrations } = await supabase
        .from("organization_integrations")
        .select("organization_id, config")
        .eq("integration_type", "evolution_api")
        .eq("is_active", true);

      const integration = (activeIntegrations || []).find((item) => {
        const config = (item.config || {}) as Record<string, unknown>;
        const configuredInstance = typeof config.instance_name === "string" ? config.instance_name : "";
        return normalizeInstanceName(configuredInstance) === normalizedIncoming;
      });

      if (integration) {
        const orgId = integration.organization_id;
        const triggerEvent = (action === "add" || action === "join") ? "on_join" : "on_leave";

        // Find active group messages matching this trigger
        const { data: messages } = await supabase
          .from("whatsapp_group_messages")
          .select("*")
          .eq("organization_id", orgId)
          .eq("trigger_event", triggerEvent)
          .eq("is_active", true);

        if (messages && messages.length > 0) {
          // Get Evolution API config
          let evoUrl = "";
          let evoApiKey = "";
          const integrationConfig = (integration.config || {}) as Record<string, string>;
          const evoInstance = integrationConfig.instance_name || instanceName;

          evoUrl = integrationConfig.server_url || integrationConfig.api_url || "";
          evoApiKey = integrationConfig.api_key || integrationConfig.global_api_key || "";

          if (!evoUrl || !evoApiKey) {
            const { data: globalEvoSetting } = await supabase
              .from("platform_settings")
              .select("value")
              .eq("key", "evolution_api")
              .maybeSingle();
            const globalEvoValue = (globalEvoSetting?.value || {}) as Record<string, unknown>;
            if (!evoUrl && typeof globalEvoValue.api_url === "string") evoUrl = globalEvoValue.api_url;
            if (!evoApiKey && typeof globalEvoValue.api_key === "string") evoApiKey = globalEvoValue.api_key;
          }

          if (evoUrl && evoApiKey) {
            for (const msg of messages) {
              // Check if this message targets this group (or all groups if empty)
              const targetGroups = (msg.target_groups || []) as string[];
              if (targetGroups.length > 0 && !targetGroups.includes(groupJid)) continue;

              // Replace variables in content
              for (const participant of participants) {
                const phone = String(participant).replace("@s.whatsapp.net", "").replace("@c.us", "");
                let content = msg.content as string;
                content = content.replace(/\{\{nome\}\}/g, phone);
                content = content.replace(/\{\{grupo\}\}/g, groupJid.split("@")[0]);
                content = content.replace(/\{\{data\}\}/g, new Date().toLocaleDateString("pt-BR"));

                try {
                  const baseUrl = evoUrl.replace(/\/+$/, "");
                  const sendUrl = `${baseUrl}/message/sendText/${encodeURIComponent(evoInstance)}`;
                  const resp = await fetch(sendUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "apikey": evoApiKey },
                    body: JSON.stringify({ number: groupJid, text: content }),
                  });
                  const respData = await resp.json();
                  console.log(`Group message sent: ${msg.name} -> ${groupJid}`, resp.status, JSON.stringify(respData).slice(0, 200));
                } catch (sendErr) {
                  console.error(`Failed to send group message ${msg.name}:`, sendErr);
                }
              }
            }
          }
        }

        // Also record group events in whatsapp_group_events
        for (const participant of participants) {
          const phone = String(participant).replace("@s.whatsapp.net", "").replace("@c.us", "");
          // Find group by external_group_id
          const { data: group } = await supabase
            .from("whatsapp_groups")
            .select("id")
            .eq("organization_id", orgId)
            .eq("external_group_id", groupJid)
            .maybeSingle();

          if (group) {
            await supabase.from("whatsapp_group_events").insert({
              group_id: group.id,
              phone_number: phone,
              event_type: triggerEvent === "on_join" ? "join" : "leave",
              event_data: { instance: instanceName, action } as any,
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
        .select("id, name, organization_id, config, user_id")
        .eq("integration_type", "evolution_api")
        .eq("is_active", true);

      const incomingInstanceId = typeof data.instanceId === "string"
        ? data.instanceId.trim()
        : (typeof body.instanceId === "string" ? body.instanceId.trim() : "");

      const normalizeIdentifier = (value: string) => value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s_-]+/g, "");

      const integration = (activeIntegrations || []).find((item) => {
        const config = (item.config || {}) as Record<string, unknown>;
        const candidates = [
          typeof config.instance_name === "string" ? config.instance_name : "",
          typeof item.name === "string" ? item.name : "",
          typeof config.instance_id === "string" ? config.instance_id : "",
          typeof config.evolution_instance_id === "string" ? config.evolution_instance_id : "",
        ].filter(Boolean);

        return candidates.some((candidate) => {
          const normalizedCandidate = normalizeIdentifier(String(candidate));
          // Exact match
          if (normalizedCandidate === normalizedIncomingInstance) return true;
          // instanceId match
          if (!!incomingInstanceId && String(candidate) === incomingInstanceId) return true;
          // Substring/suffix match: "suporte" matches "atendimentoesuporte"
          if (normalizedIncomingInstance.length >= 4 && normalizedCandidate.includes(normalizedIncomingInstance)) return true;
          if (normalizedCandidate.length >= 4 && normalizedIncomingInstance.includes(normalizedCandidate)) return true;
          return false;
        });
      });

      // If matched by instanceId but name differs, sync the real name to DB
      if (integration && instanceName) {
        const config = (integration.config || {}) as Record<string, unknown>;
        const storedName = typeof config.instance_name === "string" ? config.instance_name : "";
        if (storedName && normalizeIdentifier(storedName) !== normalizedIncomingInstance) {
          // Update the stored instance_name to match the real Evolution API name
          const updatedConfig = { ...config, instance_name: instanceName };
          await supabase
            .from("organization_integrations")
            .update({ name: instanceName, config: updatedConfig })
            .eq("id", integration.id);
          console.log(`Auto-synced instance name: "${storedName}" → "${instanceName}"`);
        }
      }

      const integrationConfig = integration ? (integration.config || {}) as Record<string, string> : {};

      if (integration) {
        // Use the user_id stored on the integration (who connected it), fallback to org owner
        let userId = (integration as any).user_id as string | null;
        
        if (!userId) {
          const { data: orgOwner } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", integration.organization_id)
            .eq("role", "owner")
            .maybeSingle();
          userId = orgOwner?.user_id || null;
        }

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

          // Extract quoted message info from contextInfo
          const contextInfo = messageData?.extendedTextMessage?.contextInfo
            || messageData?.imageMessage?.contextInfo
            || messageData?.audioMessage?.contextInfo
            || messageData?.videoMessage?.contextInfo
            || messageData?.documentMessage?.contextInfo
            || null;
          const quotedExternalId = contextInfo?.stanzaId || null;
          const quotedMessage = contextInfo?.quotedMessage || null;
          const quotedContent = quotedMessage?.conversation
            || quotedMessage?.extendedTextMessage?.text
            || (quotedMessage?.imageMessage?.caption)
            || (quotedMessage?.videoMessage?.caption)
            || (quotedMessage ? "[Mídia]" : null);
          const quotedFromMe = contextInfo?.participant
            ? !contextInfo.participant.includes(senderPhone)
            : null;

          if (messageData?.imageMessage) {
            mediaMimeType = messageData.imageMessage.mimetype || "image/jpeg";
            messageType = "image";
            mediaCaption = messageData.imageMessage.caption || null;
          } else if (messageData?.audioMessage) {
            mediaMimeType = messageData.audioMessage.mimetype || "audio/ogg";
            messageType = "audio";
          } else if (messageData?.videoMessage) {
            mediaMimeType = messageData.videoMessage.mimetype || "video/mp4";
            messageType = "video";
            mediaCaption = messageData.videoMessage.caption || null;
          } else if (messageData?.documentMessage) {
            mediaMimeType = messageData.documentMessage.mimetype || "application/octet-stream";
            messageType = "document";
            fileName = messageData.documentMessage.fileName || messageData.documentMessage.title || null;
            mediaCaption = messageData.documentMessage.caption || null;
          } else if (messageData?.stickerMessage) {
            mediaMimeType = messageData.stickerMessage.mimetype || "image/webp";
            messageType = "image";
          }

          const hasMedia = messageType !== "text";

          // Download media via Evolution API getBase64 and upload to Storage
          if (hasMedia && keyData.id) {
            try {
              // Prefer instance config, fallback to global platform settings
              let evoUrl = integrationConfig.server_url || integrationConfig.api_url || "";
              let evoApiKey = integrationConfig.api_key || integrationConfig.global_api_key || "";
              const evoInstance = integrationConfig.instance_name || instanceName;

              if (!evoUrl || !evoApiKey) {
                const { data: globalEvoSetting } = await supabase
                  .from("platform_settings")
                  .select("value")
                  .eq("key", "evolution_api")
                  .maybeSingle();

                const globalEvoValue = (globalEvoSetting?.value || {}) as Record<string, unknown>;
                if (!evoUrl && typeof globalEvoValue.api_url === "string") evoUrl = globalEvoValue.api_url;
                if (!evoApiKey && typeof globalEvoValue.api_key === "string") evoApiKey = globalEvoValue.api_key;
              }

              if (evoUrl && evoApiKey) {
                // Use Evolution API v2 getBase64 endpoint
                const base64Url = `${evoUrl.replace(/\/$/, "")}/chat/getBase64FromMediaMessage/${encodeURIComponent(evoInstance)}`;
                const base64Resp = await fetch(base64Url, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "apikey": evoApiKey,
                  },
                  body: JSON.stringify({
                    message: { key: keyData },
                    convertToMp4: messageType === "audio",
                  }),
                });

                if (base64Resp.ok) {
                  const base64Data = await base64Resp.json();
                  const base64String = base64Data.base64 || base64Data.data || "";

                  if (base64String) {
                    // Convert base64 to binary
                    const cleanBase64 = base64String.includes(",") ? base64String.split(",")[1] : base64String;
                    const binaryString = atob(cleanBase64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Determine file extension
                    const extMap: Record<string, string> = {
                      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
                      "audio/ogg": "ogg", "audio/ogg; codecs=opus": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a",
                      "video/mp4": "mp4", "application/pdf": "pdf",
                    };
                    const ext = extMap[mediaMimeType || ""] || mediaMimeType?.split("/")[1]?.split(";")[0] || "bin";
                    const storagePath = `${integration.organization_id}/${crypto.randomUUID()}.${ext}`;
                    const cleanMime = (mediaMimeType || "application/octet-stream").split(";")[0].trim();

                    const { error: uploadError } = await supabase.storage
                      .from("inbox-attachments")
                      .upload(storagePath, bytes.buffer, {
                        contentType: cleanMime,
                        upsert: false,
                      });

                    if (!uploadError) {
                      const { data: publicUrlData } = supabase.storage
                        .from("inbox-attachments")
                        .getPublicUrl(storagePath);
                      mediaUrl = publicUrlData.publicUrl;
                      console.log(`Media uploaded to storage: ${storagePath}`);
                    } else {
                      console.error("Storage upload error:", uploadError);
                    }
                  }
                } else {
                  console.error("Evolution getBase64 failed:", base64Resp.status, await base64Resp.text().catch(() => ""));
                }
              } else {
                console.error("Evolution API credentials/URL not found (instance or global config)");
              }
            } catch (mediaErr) {
              console.error("Error downloading media:", mediaErr);
            }
          }

          // Also check if Evolution API v2 sent base64 directly in the payload
          if (!mediaUrl && data.message?.base64 && hasMedia) {
            try {
              const b64 = data.message.base64;
              const cleanB64 = b64.includes(",") ? b64.split(",")[1] : b64;
              const bin = atob(cleanB64);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              const ext = mediaMimeType?.split("/")[1]?.split(";")[0] || "bin";
              const storagePath = `${integration.organization_id}/${crypto.randomUUID()}.${ext}`;
              const cleanMime = (mediaMimeType || "application/octet-stream").split(";")[0].trim();
              const { error: upErr } = await supabase.storage
                .from("inbox-attachments")
                .upload(storagePath, bytes.buffer, { contentType: cleanMime, upsert: false });
              if (!upErr) {
                const { data: pubUrl } = supabase.storage.from("inbox-attachments").getPublicUrl(storagePath);
                mediaUrl = pubUrl.publicUrl;
              }
            } catch (e) {
              console.error("Error uploading inline base64:", e);
            }
          }

          // Ignore delivery/read status updates that are not real inbound messages
          const isStatusOnly = !messageText && !hasMedia;

          // Skip group messages (they are handled elsewhere)
          const isGroupMessage = String(remoteJid).includes("@g.us") || String(remoteJid).includes("@broadcast");

          if (senderPhone && !isStatusOnly && !isGroupMessage) {
            const displayText = mediaCaption || messageText || (hasMedia ? "" : "");
            const resolvedText = displayText || (hasMedia ? `[${messageType === "audio" ? "🎵 Áudio" : messageType === "image" ? "📷 Imagem" : messageType === "video" ? "🎥 Vídeo" : "📎 Arquivo"}]` : "[Mensagem]");

            // Log routed message
            await supabase.from("whatsapp_webhook_logs").insert({
              event_type: body.event || "messages.upsert",
              instance_name: instanceName,
              phone: senderPhone,
              organization_id: integration.organization_id,
              routing_status: "routed",
              details: { message_type: hasMedia ? messageType : "text", from_me: isFromMe, text_preview: resolvedText.slice(0, 100) },
            }).then(() => {}).catch(() => {});

            // For fromMe messages, the senderPhone is the contact we're messaging
            // We route them as "user" sender_type so they appear in the conversation
            await routeToInbox(supabase, {
              organizationId: integration.organization_id,
              userId,
              channel: "whatsapp",
              senderIdentifier: senderPhone,
              identifierField: "whatsapp_phone",
              messageText: resolvedText,
              externalMessageId: keyData.id,
              mediaUrl,
              mediaMimeType,
              messageType: hasMedia ? messageType : "text",
              fileName,
              sourceInstanceId: integration.id,
              sourceInstanceName: integration.name || instanceName,
              isFromMe: isFromMe,
              quotedContent: quotedContent?.slice(0, 200) || null,
              quotedExternalId,
              quotedSenderType: quotedFromMe === null ? null : (quotedFromMe ? "contact" : "user"),
            });
          } else if (isGroupMessage) {
            // Log discarded group message
            await supabase.from("whatsapp_webhook_logs").insert({
              event_type: body.event || "messages.upsert",
              instance_name: instanceName,
              phone: senderPhone,
              organization_id: integration.organization_id,
              routing_status: "discarded",
              details: { reason: "group_message", jid: String(remoteJid).slice(0, 60) },
            }).then(() => {}).catch(() => {});
          }
        }
      } else if (instanceName) {
        // Unknown instance — log it and register for admin review
        console.log(`Unknown instance received message: "${instanceName}"`);

        const keyData = data.key || data.message?.key || {};
        const remoteJid = keyData.remoteJid || data.remoteJid || "";
        const senderPhone = String(remoteJid).replace("@s.whatsapp.net", "").replace("@c.us", "");

        // Log as unknown
        await supabase.from("whatsapp_webhook_logs").insert({
          event_type: body.event || "messages.upsert",
          instance_name: instanceName,
          phone: senderPhone || null,
          organization_id: null,
          routing_status: "unknown_instance",
          details: { instance_name: instanceName },
        }).then(() => {}).catch(() => {});

        // Upsert into unknown_whatsapp_instances
        const { data: existing } = await supabase
          .from("unknown_whatsapp_instances")
          .select("id, message_count")
          .eq("instance_name", instanceName)
          .maybeSingle();

        if (existing) {
          await supabase.from("unknown_whatsapp_instances")
            .update({
              last_seen_at: new Date().toISOString(),
              message_count: (existing.message_count || 0) + 1,
              sample_phone: senderPhone || null,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("unknown_whatsapp_instances")
            .insert({
              instance_name: instanceName,
              sample_phone: senderPhone || null,
            });

          // Create admin notification
          const { data: admins } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");

          for (const admin of admins || []) {
            await supabase.from("notifications").insert({
              user_id: admin.user_id,
              type: "unknown_instance",
              title: "⚠️ Instância WhatsApp Desconhecida",
              message: `A instância "${instanceName}" está enviando mensagens mas não está cadastrada. Considere cadastrá-la.`,
              link: "/whatsapp",
              is_read: false,
              metadata: { instance_name: instanceName },
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
  sourceInstanceId?: string;
  sourceInstanceName?: string;
  isFromMe?: boolean;
  quotedContent?: string | null;
  quotedExternalId?: string | null;
  quotedSenderType?: string | null;
}

async function routeToInbox(
  supabase: ReturnType<typeof createClient>,
  params: RouteToInboxParams
) {
  try {
    const { organizationId, userId, channel, senderIdentifier, messageText, sourceInstanceId, sourceInstanceName } = params;

    // Try to find existing contact by normalized phone/whatsapp number
    let contactId: string | null = null;
    const cleanPhone = senderIdentifier.replace(/\D/g, "");

    // Normalize phone: extract the core local number (strip country code 55 if present)
    const normalizePhone = (value: string | null | undefined) => (value || "").replace(/\D/g, "");
    const extractLocal = (phone: string) => {
      const digits = phone.replace(/\D/g, "");
      if (digits.startsWith("55") && digits.length > 11) return digits.slice(2);
      return digits;
    };
    // Brazilian normalization: DDD + last 8 subscriber digits (handles 8→9 digit migration)
    const normalizeBR = (phone: string) => {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10) return digits;
      let local = digits;
      if (local.startsWith("55") && local.length > 11) local = local.slice(2);
      const ddd = local.slice(0, 2);
      const subscriber = local.slice(-8);
      return ddd + subscriber;
    };

    const localClean = extractLocal(cleanPhone);
    const brKey = normalizeBR(cleanPhone);
    const comparablePhones = Array.from(
      new Set([cleanPhone, `55${localClean}`, localClean].filter(Boolean))
    );

    const { data: orgContacts } = await supabase
      .from("contacts")
      .select("id, first_name, phone, whatsapp, source")
      .eq("organization_id", organizationId)
      .limit(2000);

    const allContacts = orgContacts || [];
    const isAutoCreatedName = (name: string) => /^\+?\d[\d\s\-\.]+$/.test(name.trim());

    const matchingContacts = allContacts.filter((contact) => {
      const phone = normalizePhone(contact.phone);
      const whatsapp = normalizePhone(contact.whatsapp);

      // Exact or local match
      if (comparablePhones.includes(phone) || comparablePhones.includes(whatsapp)) return true;
      if (localClean && (extractLocal(phone) === localClean || extractLocal(whatsapp) === localClean)) return true;
      // Brazilian DDD+8 match (handles 8→9 digit migration)
      if (brKey.length >= 10) {
        if ((phone && normalizeBR(phone) === brKey) || (whatsapp && normalizeBR(whatsapp) === brKey)) return true;
      }
      return false;
    });

    // Prefer "real" contacts (manually created, with actual names) over auto-created ones
    const realContact = matchingContacts.find((c) => c.source !== "whatsapp_inbound" && !isAutoCreatedName(c.first_name));
    const anyContact = matchingContacts[0];
    const matchedContact = realContact || anyContact || null;

    if (matchedContact) {
      contactId = matchedContact.id;

      // If there's also an auto-created duplicate, merge it into the real contact
      if (realContact && matchingContacts.length > 1) {
        const autoCreated = matchingContacts.find((c) => c.id !== realContact.id && (c.source === "whatsapp_inbound" || isAutoCreatedName(c.first_name)));
        if (autoCreated) {
          // Reassign conversations from auto-created contact to real contact
          await supabase
            .from("conversations")
            .update({ contact_id: realContact.id })
            .eq("contact_id", autoCreated.id);
          // Delete the auto-created duplicate
          await supabase
            .from("contacts")
            .delete()
            .eq("id", autoCreated.id);
          console.log(`Merged auto-created contact ${autoCreated.id} into real contact ${realContact.id}`);
        }
      }

      // Ensure whatsapp field is populated on the matched contact
      const existingWhatsapp = normalizePhone(matchedContact.whatsapp);
      if (!existingWhatsapp) {
        await supabase
          .from("contacts")
          .update({ whatsapp: cleanPhone })
          .eq("id", matchedContact.id);
      }
    } else {
      // Auto-create contact from incoming message
      // Format phone for display name
      const displayPhone = cleanPhone.length > 11
        ? `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 4)} ${cleanPhone.slice(4)}`
        : cleanPhone;

      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          first_name: displayPhone,
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
    const localSender = extractLocal(normalizedSender);
    const senderCandidates = Array.from(
      new Set(
        [
          senderIdentifier,
          normalizedSender,
          `55${localSender}`,
          localSender,
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
        const localMetadata = extractLocal(normalizedMetadata);
        return senderCandidates.includes(String(metadataValue || ""))
          || senderCandidates.includes(normalizedMetadata)
          || (localSender && localMetadata === localSender);
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
      const sourceInstanceMetadata = {
        ...(sourceInstanceId ? { whatsapp_instance_id: sourceInstanceId } : {}),
        ...(sourceInstanceName ? { whatsapp_instance_name: sourceInstanceName } : {}),
      };

      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          status: "open",
          contact_id: contactId || existingConv.contact_id,
          metadata: {
            ...existingMetadata,
            ...sourceInstanceMetadata,
            [metadataKey]: normalizedSender || senderIdentifier,
          },
        })
        .eq("id", conversationId);
    } else {
      const sourceInstanceMetadata = {
        ...(sourceInstanceId ? { whatsapp_instance_id: sourceInstanceId } : {}),
        ...(sourceInstanceName ? { whatsapp_instance_name: sourceInstanceName } : {}),
      };

      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          organization_id: organizationId,
          channel,
          status: "open",
          contact_id: contactId,
          last_message_at: new Date().toISOString(),
          metadata: { ...sourceInstanceMetadata, [metadataKey]: normalizedSender || senderIdentifier },
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
    const senderType = params.isFromMe ? "user" : "contact";
    const messageInsert: Record<string, unknown> = {
      conversation_id: conversationId,
      content: messageText,
      sender_type: senderType,
      is_read: params.isFromMe ? true : false,
      ...(params.isFromMe && userId ? { sender_id: userId } : {}),
    };
    if (params.externalMessageId) messageInsert.external_id = params.externalMessageId;
    if (params.isFromMe) messageInsert.delivery_status = "sent";
    if (params.mediaUrl) messageInsert.media_url = params.mediaUrl;
    if (params.mediaMimeType) messageInsert.media_mime_type = params.mediaMimeType;
    if (params.messageType && params.messageType !== "text") messageInsert.message_type = params.messageType;
    if (params.fileName) messageInsert.file_name = params.fileName;
    if (params.quotedContent) messageInsert.quoted_content = params.quotedContent;
    if (params.quotedExternalId) {
      // Try to find the quoted message by external_id to set quoted_message_id
      const { data: quotedMsg } = await supabase
        .from("messages")
        .select("id, sender_type")
        .eq("external_id", params.quotedExternalId)
        .eq("conversation_id", conversationId)
        .maybeSingle();
      if (quotedMsg) {
        messageInsert.quoted_message_id = quotedMsg.id;
        messageInsert.quoted_sender_type = quotedMsg.sender_type;
      } else {
        messageInsert.quoted_sender_type = params.quotedSenderType || "contact";
      }
    }

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
