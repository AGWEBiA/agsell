// Instagram Webhook Handler - Processes incoming Instagram events and triggers automations
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle verification challenge from Meta
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("INSTAGRAM_WEBHOOK_VERIFY_TOKEN") || "agsell_instagram_verify";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Instagram webhook verified");
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
    console.log("Instagram webhook received:", JSON.stringify(body).slice(0, 500));

    const entries = body.entry || [];

    for (const entry of entries) {
      const igUserId = entry.id;

      // Find the Instagram account in our system
      const { data: igAccount } = await supabase
        .from("instagram_accounts")
        .select("id, organization_id, connected_by")
        .eq("instagram_user_id", igUserId)
        .eq("is_active", true)
        .maybeSingle();

      if (!igAccount) {
        console.log("No active Instagram account found for user:", igUserId);
        continue;
      }

      // Process messaging events (DMs)
      const messagingEvents = entry.messaging || [];
      for (const event of messagingEvents) {
        if (event.message) {
          const eventData = {
            sender_id: event.sender?.id,
            message_text: event.message?.text,
            message_id: event.message?.mid,
            timestamp: event.timestamp,
          };

          // Route DM to SAC Inbox
          await routeDmToInbox(supabase, igAccount, eventData);

          // Process automations
          await processEvent(supabase, igAccount, "dm_received", eventData);
        }
      }

      // Process changes (comments, mentions)
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === "comments") {
          await processEvent(supabase, igAccount, "comment_received", {
            comment_id: change.value?.id,
            comment_text: change.value?.text,
            media_id: change.value?.media?.id,
            from_id: change.value?.from?.id,
            from_username: change.value?.from?.username,
          });
        }
        if (change.field === "mentions") {
          await processEvent(supabase, igAccount, "mention_received", {
            media_id: change.value?.media_id,
            comment_id: change.value?.comment_id,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Instagram webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Route incoming Instagram DM to SAC Inbox (conversations + messages tables)
async function routeDmToInbox(
  supabase: ReturnType<typeof createClient>,
  igAccount: { id: string; organization_id: string; connected_by: string },
  eventData: Record<string, unknown>
) {
  try {
    const senderId = eventData.sender_id as string;
    const messageText = (eventData.message_text as string) || "";
    if (!senderId || !messageText) return;

    // Try to find an existing contact linked to this Instagram sender
    // We search by checking if any contact has this IG user id stored or matching phone/name
    let contactId: string | null = null;

    // Look for existing conversation with this sender via metadata
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id, contact_id")
      .eq("organization_id", igAccount.organization_id)
      .eq("channel", "instagram")
      .filter("metadata->>instagram_sender_id", "eq", senderId)
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
      contactId = existingConv.contact_id;

      // Update last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString(), status: "open" })
        .eq("id", conversationId);
    } else {
      // Create a new conversation for this Instagram DM
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: igAccount.connected_by,
          organization_id: igAccount.organization_id,
          channel: "instagram",
          status: "open",
          last_message_at: new Date().toISOString(),
          metadata: { instagram_sender_id: senderId },
        })
        .select("id")
        .single();

      if (convError) {
        console.error("Error creating conversation for IG DM:", convError);
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
      console.error("Error inserting IG DM message:", msgError);
    } else {
      console.log("Instagram DM routed to inbox, conversation:", conversationId);
    }
  } catch (err) {
    console.error("Error routing DM to inbox:", err);
  }
}

// Process automation events
async function processEvent(
  supabase: ReturnType<typeof createClient>,
  igAccount: { id: string; organization_id: string; connected_by: string },
  eventType: string,
  eventData: Record<string, unknown>
) {
  // Find matching automations
  const { data: automations } = await supabase
    .from("instagram_automations")
    .select("id, actions, trigger_config")
    .eq("instagram_account_id", igAccount.id)
    .eq("organization_id", igAccount.organization_id)
    .eq("is_active", true);

  if (!automations?.length) return;

  for (const automation of automations) {
    const triggerConfig = automation.trigger_config as Record<string, unknown> | null;
    const automationType = triggerConfig?.event_type;

    if (automationType && automationType !== eventType) continue;

    const keywords = (triggerConfig?.keywords as string[]) || [];
    const messageText = (eventData.message_text || eventData.comment_text || "") as string;
    if (keywords.length > 0) {
      const matches = keywords.some((kw) =>
        messageText.toLowerCase().includes(kw.toLowerCase())
      );
      if (!matches) continue;
    }

    await supabase.from("instagram_automation_logs").insert({
      automation_id: automation.id,
      instagram_account_id: igAccount.id,
      event_type: eventType,
      event_data: eventData,
      action_taken: "triggered",
      status: "success",
    });

    await supabase
      .from("instagram_automations")
      .update({
        executions_count: (automation as any).executions_count ? (automation as any).executions_count + 1 : 1,
        last_triggered_at: new Date().toISOString(),
      })
      .eq("id", automation.id);

    const actions = (automation.actions || []) as Array<{ type: string; config: Record<string, string> }>;
    for (const action of actions) {
      if (action.type === "auto_reply_dm" && eventType === "dm_received" && eventData.sender_id) {
        try {
          const { data: account } = await supabase
            .from("instagram_accounts")
            .select("page_access_token, page_id")
            .eq("id", igAccount.id)
            .single();

          if (account?.page_access_token) {
            const resp = await fetch(
              `https://graph.facebook.com/v18.0/${account.page_id}/messages`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${account.page_access_token}`,
                },
                body: JSON.stringify({
                  recipient: { id: eventData.sender_id },
                  message: { text: action.config.message || "Obrigado pela sua mensagem!" },
                }),
              }
            );
            if (!resp.ok) {
              console.error("Failed to send Instagram DM:", await resp.text());
            }
          }
        } catch (err) {
          console.error("Error sending auto-reply:", err);
        }
      }

      if (action.type === "auto_reply_comment" && eventType === "comment_received" && eventData.comment_id) {
        try {
          const { data: account } = await supabase
            .from("instagram_accounts")
            .select("access_token")
            .eq("id", igAccount.id)
            .single();

          if (account?.access_token) {
            const resp = await fetch(
              `https://graph.facebook.com/v18.0/${eventData.comment_id}/replies`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${account.access_token}`,
                },
                body: JSON.stringify({
                  message: action.config.message || "Obrigado pelo comentário!",
                }),
              }
            );
            if (!resp.ok) {
              console.error("Failed to reply to comment:", await resp.text());
            }
          }
        } catch (err) {
          console.error("Error replying to comment:", err);
        }
      }
    }
  }
}
