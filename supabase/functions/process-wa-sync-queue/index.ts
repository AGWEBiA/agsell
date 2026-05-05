import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatBrazilianNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return digits;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get pending items from queue
    const { data: queueItems, error: fetchError } = await supabase
      .from("wa_sync_queue")
      .select("*, plan_whatsapp_groups(*)")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(5); // Process in small batches

    if (fetchError) throw fetchError;
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: "No pending items in queue" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Evolution API config
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

    const evolutionConfig = settings?.value as { api_url?: string; api_key?: string } | null;
    if (!evolutionConfig?.api_url || !evolutionConfig?.api_key) {
      throw new Error("Evolution API not configured");
    }

    const apiUrl = evolutionConfig.api_url.replace(/\/+$/, "");
    const apiKey = evolutionConfig.api_key;

    const results = [];

    for (const item of queueItems) {
      // Mark as processing
      await supabase.from("wa_sync_queue").update({ status: "processing" }).eq("id", item.id);

      try {
        // Random delay (1-5 seconds) to avoid rate limiting as per Etapa 3
        const randomDelay = Math.floor(Math.random() * 4000) + 1000;
        await delay(randomDelay);

        const group = item.plan_whatsapp_groups;
        if (!group) throw new Error("Group information not found");

        const formattedNumber = formatBrazilianNumber(item.phone_number);
        const jid = `${formattedNumber}@s.whatsapp.net`;
        const instanceName = group.instance_name;
        const groupJid = group.group_jid;

        let success = false;
        let apiResponse = null;

        if (item.action_type === "add_member") {
          const resp = await fetch(`${apiUrl}/group/updateParticipant/${instanceName}`, {
            method: "PUT",
            headers: { apikey: apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              groupJid: groupJid,
              action: "add",
              participants: [jid],
            }),
          });
          apiResponse = await resp.json();
          success = resp.ok;

          // Verification Step (as per Etapa 3)
          if (success) {
            // Wait 2 seconds and check if member is actually there
            await delay(2000);
            const checkResp = await fetch(`${apiUrl}/group/getParticipants/${instanceName}?groupJid=${groupJid}`, {
              headers: { apikey: apiKey },
            });
            if (checkResp.ok) {
              const participants = await checkResp.json();
              const isPresent = Array.isArray(participants) && participants.some((p: any) => 
                (p.id === jid) || (p.jid === jid) || (p.id?.includes(formattedNumber))
              );
              if (!isPresent) {
                console.warn(`[WA-SYNC] Verification failed for ${jid} in ${groupJid}`);
                // Optional: handle verification failure (retry or mark as error)
              }
            }
          }

          if (success && item.user_id) {
            await supabase.from("plan_whatsapp_members").upsert({
              user_id: item.user_id,
              group_id: item.group_id,
              status: "active",
              added_at: new Date().toISOString(),
            }, { onConflict: "user_id, group_id" });
          }
        } else if (item.action_type === "remove_member") {
          const resp = await fetch(`${apiUrl}/group/updateParticipant/${instanceName}`, {
            method: "PUT",
            headers: { apikey: apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              groupJid: groupJid,
              action: "remove",
              participants: [jid],
            }),
          });
          apiResponse = await resp.json();
          success = resp.ok;

          if (success && item.user_id) {
            await supabase
              .from("plan_whatsapp_members")
              .update({ status: "removed", removed_at: new Date().toISOString() })
              .eq("user_id", item.user_id)
              .eq("group_id", item.group_id);
          }
        }

        if (success) {
          await supabase.from("wa_sync_queue").update({ status: "completed" }).eq("id", item.id);
          await supabase.from("wa_sync_logs").insert({
            queue_id: item.id,
            organization_id: item.organization_id,
            action_type: item.action_type,
            status: "success",
            details: apiResponse
          });
        } else {
          throw new Error(JSON.stringify(apiResponse));
        }

        results.push({ id: item.id, status: "completed" });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const nextRetry = item.retry_count + 1;
        const status = nextRetry >= 3 ? "failed" : "pending";
        const scheduledFor = new Date(Date.now() + nextRetry * 60000 * 5).toISOString(); // Backoff

        await supabase.from("wa_sync_queue").update({
          status,
          retry_count: nextRetry,
          last_error: errorMsg,
          scheduled_for: status === "pending" ? scheduledFor : item.scheduled_for
        }).eq("id", item.id);

        await supabase.from("wa_sync_logs").insert({
          queue_id: item.id,
          organization_id: item.organization_id,
          action_type: item.action_type,
          status: "error",
          details: { error: errorMsg, retry_count: nextRetry }
        });

        results.push({ id: item.id, status, error: errorMsg });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
