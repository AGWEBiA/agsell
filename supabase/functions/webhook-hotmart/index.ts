// Webhook Handler for Hotmart Events
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.203.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.203.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
};

interface HotmartPayload {
  hottok: string;
  prod: number;
  prod_name: string;
  off: string;
  price: {
    value: number;
    currency_value: string;
  };
  buyer_email: string;
  buyer_name: string;
  first_name: string;
  last_name: string;
  phone_checkout_local_code: string;
  phone_checkout_number: string;
  status: string;
  transaction: string;
  aff?: string;
  aff_name?: string;
  // Additional fields
  [key: string]: unknown;
}

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
    const payload = JSON.parse(rawBody) as HotmartPayload;
    const hottok = payload.hottok || req.headers.get("x-hotmart-hottok");

    console.log("Hotmart webhook received:", payload.status, payload.buyer_email);

    // Find organization by integration
    const { data: integration } = await supabase
      .from("organization_integrations")
      .select("organization_id, config")
      .eq("integration_type", "hotmart")
      .eq("is_active", true)
      .single();

    const organizationId = integration?.organization_id;

    // Verify hottok matches the configured webhook secret
    if (integration?.config?.webhook_secret) {
      const configuredSecret = integration.config.webhook_secret as string;

      // Try HMAC verification first (preferred)
      const signature = req.headers.get("x-hotmart-hottok");
      if (signature) {
        const isValid = await verifyHmacSignature(rawBody, configuredSecret, signature);
        if (!isValid) {
          console.error("Invalid Hotmart HMAC signature");
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (hottok) {
        // Fallback: verify hottok matches configured secret
        if (hottok !== configuredSecret) {
          console.error("Invalid Hotmart hottok");
          return new Response(
            JSON.stringify({ error: "Invalid hottok" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        console.error("No authentication token provided");
        return new Response(
          JSON.stringify({ error: "Missing authentication" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Map Hotmart status to event type
    const eventTypeMap: Record<string, string> = {
      approved: "purchase.approved",
      canceled: "purchase.canceled",
      refunded: "purchase.refunded",
      chargeback: "purchase.chargeback",
      complete: "purchase.complete",
      expired: "subscription.expired",
      delayed: "purchase.delayed",
      dispute: "purchase.dispute",
    };

    const eventType = eventTypeMap[payload.status] || `unknown.${payload.status}`;

    // Store webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        organization_id: organizationId,
        source: "hotmart",
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

    // Process based on event type
    if (payload.status === "approved" && organizationId) {
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

      // Create or update contact
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", payload.buyer_email)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!existingContact) {
        await supabase.from("contacts").insert({
          organization_id: organizationId,
          user_id: owner.user_id,
          first_name: payload.first_name || payload.buyer_name.split(" ")[0],
          last_name: payload.last_name || payload.buyer_name.split(" ").slice(1).join(" "),
          email: payload.buyer_email,
          phone: payload.phone_checkout_number
            ? `${payload.phone_checkout_local_code}${payload.phone_checkout_number}`
            : null,
          source: "hotmart",
          status: "customer",
          notes: `Produto: ${payload.prod_name} - Transação: ${payload.transaction}`,
        });
      }

      // Mark as processed
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
    console.error("Error processing Hotmart webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
