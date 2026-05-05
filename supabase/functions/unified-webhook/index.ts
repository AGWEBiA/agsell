import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  source: string;
  payload: any;
  headers?: any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const url = new URL(req.url);
    const source = url.searchParams.get("source") || "unknown";

    // 1. Store the raw event for audit/replay
    const { data: event, error: eventError } = await supabase
      .from("webhook_events")
      .insert({
        source,
        event_type: "received",
        payload,
        processed: false,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    console.log(`[Unified Webhook] Received event from ${source}, event_id: ${event.id}`);

    // 2. Delegate processing based on source
    let processorUrl = "";
    if (source === "kiwify") {
      processorUrl = `${supabaseUrl}/functions/v1/webhook-kiwify`;
    } else if (source === "paid-groups") {
      processorUrl = `${supabaseUrl}/functions/v1/paid-groups-webhook`;
    }

    if (processorUrl) {
      // Background call to the actual processor to keep response time low
      // We pass the webhook_event_id so the processor can update it
      fetch(processorUrl, {
        method: "POST",
        headers: {
          ...Object.fromEntries(req.headers.entries()),
          "X-Webhook-Event-Id": event.id,
        },
        body: rawBody,
      }).catch(err => console.error(`[Unified Webhook] Error calling processor ${source}:`, err));
    }

    return new Response(JSON.stringify({ success: true, event_id: event.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[Unified Webhook] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
