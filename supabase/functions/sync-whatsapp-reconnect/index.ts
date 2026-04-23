// Sync WhatsApp messages from last 24h when an instance reconnects
// Called by Evolution API webhook on connection.update event
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Sync reconnect received:", JSON.stringify(body).slice(0, 500));

    // Accept both direct calls and Evolution API webhook format
    const instanceName = body.instance?.instanceName || body.instance_name;
    const state = body.data?.state || body.state;

    // Only process when instance becomes connected/open
    if (state !== "open" && state !== "connected") {
      return new Response(JSON.stringify({ skipped: true, reason: `State is ${state}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!instanceName) {
      return new Response(JSON.stringify({ error: "No instance name provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Instance ${instanceName} reconnected, syncing last 24h messages...`);

    // Find the integration by instance name
    const { data: integration } = await supabase
      .from("organization_integrations")
      .select("id, organization_id, config")
      .eq("is_active", true)
      .or(`config->>instance_name.eq.${instanceName},name.eq.${instanceName}`)
      .in("integration_type", ["evolution_api", "whatsapp_business"])
      .maybeSingle();

    if (!integration) {
      console.log("No integration found for instance:", instanceName);
      return new Response(JSON.stringify({ error: "Instance not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Evolution API global config
    const { data: globalConfig } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .maybeSingle();

    const config = integration.config as Record<string, string>;
    const evolutionUrl = config.evolution_url || (globalConfig?.value as any)?.url;
    const evolutionApiKey = config.evolution_api_key || (globalConfig?.value as any)?.api_key;

    if (!evolutionUrl || !evolutionApiKey) {
      console.log("No Evolution API credentials available");
      return new Response(JSON.stringify({ error: "No API credentials" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get org owner for user_id
    const { data: orgOwner } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", integration.organization_id)
      .eq("role", "owner")
      .maybeSingle();

    const userId = orgOwner?.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "No org owner found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch chats from Evolution API
    const baseUrl = evolutionUrl.replace(/\/$/, "");
    const resolvedName = config.instance_name || instanceName;

    let chats: any[] = [];
    try {
      const chatsRes = await fetch(`${baseUrl}/chat/findChats/${resolvedName}`, {
        method: "POST",
        headers: {
          "apikey": evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (chatsRes.ok) {
        chats = await chatsRes.json();
      } else {
        console.log("Failed to fetch chats:", chatsRes.status, await chatsRes.text());
      }
    } catch (e) {
      console.error("Error fetching chats:", e);
    }

    const syncHours = Math.min(Math.max(Number(body.hours) || 48, 1), 168);
    const now = Date.now();
    const twentyFourHoursAgo = now - syncHours * 60 * 60 * 1000;
    let syncedMessages = 0;
    let syncedChats = 0;

    // Filter chats with recent activity
    const recentChats = chats.filter((chat: any) => {
      const lastMsgTimestamp = chat.lastMsgTimestamp || chat.conversationTimestamp;
      if (!lastMsgTimestamp) return false;
      const ts = typeof lastMsgTimestamp === "number"
        ? (lastMsgTimestamp > 1e12 ? lastMsgTimestamp : lastMsgTimestamp * 1000)
        : new Date(lastMsgTimestamp).getTime();
      return ts > twentyFourHoursAgo;
    });

    console.log(`Found ${recentChats.length} chats with recent activity out of ${chats.length} total`);

    for (const chat of recentChats.slice(0, 50)) { // Limit to 50 chats
      const remoteJid = chat.id || chat.remoteJid;
      if (!remoteJid || remoteJid.includes("@g.us") || remoteJid.includes("@broadcast")) continue;

      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
      if (!phone || phone.length < 8) continue;

      // Fetch messages for this chat
      try {
        const msgsRes = await fetch(`${baseUrl}/chat/findMessages/${resolvedName}`, {
          method: "POST",
          headers: {
            "apikey": evolutionApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            where: {
              key: { remoteJid },
            },
            limit: 50,
          }),
        });

        if (!msgsRes.ok) continue;
        const messages = await msgsRes.json();

        // Filter to last 24h only
        const recentMessages = (Array.isArray(messages) ? messages : messages.messages || []).filter((msg: any) => {
          const ts = msg.messageTimestamp
            ? (typeof msg.messageTimestamp === "number"
              ? (msg.messageTimestamp > 1e12 ? msg.messageTimestamp : msg.messageTimestamp * 1000)
              : new Date(msg.messageTimestamp).getTime())
            : 0;
          return ts > twentyFourHoursAgo;
        });

        if (recentMessages.length === 0) continue;

        // Find or create contact
        const digits = phone.replace(/\D/g, "");
        const normalizedSuffix = digits.slice(-10);

        let { data: contact } = await supabase
          .from("contacts")
          .select("id")
          .eq("organization_id", integration.organization_id)
          .or(`whatsapp.ilike.%${normalizedSuffix},phone.ilike.%${normalizedSuffix}`)
          .maybeSingle();

        if (!contact) {
          const { data: newContact } = await supabase
            .from("contacts")
            .insert({
              first_name: phone,
              whatsapp: phone,
              phone: phone,
              user_id: userId,
              organization_id: integration.organization_id,
              source: "whatsapp_sync",
            })
            .select("id")
            .single();
          contact = newContact;
        }

        if (!contact) continue;

        // Find or create conversation
        let { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("organization_id", integration.organization_id)
          .eq("contact_id", contact.id)
          .eq("channel", "whatsapp")
          .maybeSingle();

        if (!conversation) {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({
              user_id: userId,
              organization_id: integration.organization_id,
              contact_id: contact.id,
              channel: "whatsapp",
              status: "open",
              metadata: { instance_name: resolvedName, synced: true },
            })
            .select("id")
            .single();
          conversation = newConv;
        }

        if (!conversation) continue;

        // Insert messages (skip duplicates via external_id)
        for (const msg of recentMessages) {
          const msgId = msg.key?.id || msg.id;
          const fromMe = msg.key?.fromMe === true;
          const msgTimestamp = msg.messageTimestamp
            ? new Date(
                typeof msg.messageTimestamp === "number"
                  ? (msg.messageTimestamp > 1e12 ? msg.messageTimestamp : msg.messageTimestamp * 1000)
                  : msg.messageTimestamp
              ).toISOString()
            : new Date().toISOString();

          const content =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            "[Mídia]";

          // Check if message already exists
          const { data: existing } = await supabase
            .from("messages")
            .select("id")
            .eq("conversation_id", conversation.id)
            .eq("external_id", msgId)
            .maybeSingle();

          if (existing) continue;

          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            content,
            sender_type: fromMe ? "user" : "contact",
            sender_id: fromMe ? userId : contact.id,
            external_id: msgId,
            channel: "whatsapp",
            created_at: msgTimestamp,
            metadata: { synced: true, instance: resolvedName },
          });

          syncedMessages++;
        }

        // Update conversation last_message_at
        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversation.id);

        syncedChats++;
      } catch (e) {
        console.error(`Error syncing chat ${phone}:`, e);
      }
    }

    // Update integration last_sync_at
    await supabase
      .from("organization_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", integration.id);

    // Audit log for sync
    await supabase.from("audit_logs").insert({
      organization_id: integration.organization_id,
      user_id: userId,
      action: "sync",
      resource_type: "whatsapp_instance",
      details: { instance: instanceName, synced_chats: syncedChats, synced_messages: syncedMessages },
    });

    const result = {
      success: true,
      instance: instanceName,
      synced_chats: syncedChats,
      synced_messages: syncedMessages,
    };

    console.log("Sync completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
