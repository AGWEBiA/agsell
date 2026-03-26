// Webhook Handler for Eduzz Events
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.203.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.203.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-eduzz-signature",
};

interface EduzzPayload {
  trans_cod: string;
  trans_status: number;
  trans_value: number;
  trans_currency: string;
  cus_email: string;
  cus_name: string;
  cus_tel: string;
  cus_cel: string;
  pro_cod: number;
  pro_name: string;
  aff_cod?: number;
  aff_name?: string;
  aff_email?: string;
  aff_document_number?: string;
  recurrency_cod?: string;
  recurrency_status?: string;
  trans_createdate: string;
  [key: string]: unknown;
}

// Eduzz status codes
const EDUZZ_STATUS: Record<number, string> = {
  1: "open",
  3: "paid",
  4: "canceled",
  6: "waiting_refund",
  7: "refunded",
  9: "duplicate",
  10: "expired",
  11: "recovering",
  15: "waiting_payment",
};

async function verifyHmacSignature(rawBody: string, secret: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(rawBody);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const expectedSignature = encodeHex(new Uint8Array(signatureBuffer));

  return signature === expectedSignature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    const payload = JSON.parse(rawBody) as EduzzPayload;

    console.log("Eduzz webhook received:", EDUZZ_STATUS[payload.trans_status], payload.cus_email);

    // Find organization by integration — support multi-tenant
    const url = new URL(req.url);
    const orgIdParam = url.searchParams.get("org_id");
    
    let integration: { organization_id: string; config: Record<string, unknown> } | null = null;
    
    if (orgIdParam) {
      const { data } = await supabase
        .from("organization_integrations")
        .select("organization_id, config")
        .eq("integration_type", "eduzz")
        .eq("organization_id", orgIdParam)
        .eq("is_active", true)
        .maybeSingle();
      integration = data;
    } else {
      const { data } = await supabase
        .from("organization_integrations")
        .select("organization_id, config")
        .eq("integration_type", "eduzz")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      integration = data;
    }

    const organizationId = integration?.organization_id;

    // Verify signature if secret is configured
    if (integration?.config?.webhook_secret) {
      const secret = integration.config.webhook_secret as string;
      const signature = req.headers.get("x-eduzz-signature");

      if (!signature) {
        console.error("Missing Eduzz signature");
        return new Response(
          JSON.stringify({ error: "Missing signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await verifyHmacSignature(rawBody, secret, signature);
      if (!isValid) {
        console.error("Invalid Eduzz signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Map Eduzz status to event type
    const eventTypeMap: Record<number, string> = {
      1: "purchase.pending",
      3: "purchase.approved",
      4: "purchase.canceled",
      6: "purchase.refund_requested",
      7: "purchase.refunded",
      9: "purchase.duplicate",
      10: "purchase.expired",
      11: "purchase.recovering",
      15: "purchase.waiting_payment",
    };

    const eventType = eventTypeMap[payload.trans_status] || `unknown.${payload.trans_status}`;

    // Store webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        organization_id: organizationId,
        source: "eduzz",
        event_type: eventType,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error("Error storing webhook:", webhookError);
      throw webhookError;
    }

    // Process approved purchases (status 3)
    if (payload.trans_status === 3 && organizationId) {
      const nameParts = payload.cus_name.split(" ");

      // Get the organization owner's user_id for proper FK reference
      const { data: owner } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("role", "owner")
        .limit(1)
        .single();

      if (!owner) {
        console.error("No organization owner found for org:", organizationId);
        throw new Error("No organization owner found");
      }

      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", payload.cus_email)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!existingContact) {
        await supabase.from("contacts").insert({
          organization_id: organizationId,
          user_id: owner.user_id,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || null,
          email: payload.cus_email,
          phone: payload.cus_cel || payload.cus_tel,
          source: "eduzz",
          status: "customer",
          notes: `Produto: ${payload.pro_name} - Transação: ${payload.trans_cod}`,
        });
      }

      await supabase
        .from("webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", webhookEvent.id);
    }

    return new Response(
      JSON.stringify({ success: true, event_id: webhookEvent.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing Eduzz webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
