// Webhook Handler for Kiwify Events
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.203.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.203.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-kiwify-signature",
};

interface KiwifyPayload {
  order_id: string;
  order_status: string;
  product_id: string;
  product_name: string;
  Customer: {
    email: string;
    full_name: string;
    mobile: string;
  };
  Subscription?: {
    id: string;
    status: string;
    plan: {
      id: string;
      name: string;
    };
  };
  payment_method: string;
  payment_status: string;
  order_value: number;
  created_at: string;
  [key: string]: unknown;
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
    const payload = JSON.parse(rawBody) as KiwifyPayload;
    const signature = req.headers.get("x-kiwify-signature");

    console.log("Kiwify webhook received:", payload.order_status, payload.Customer?.email);

    // Find organization by integration
    const { data: integration } = await supabase
      .from("organization_integrations")
      .select("organization_id, config")
      .eq("integration_type", "kiwify")
      .eq("is_active", true)
      .single();

    const organizationId = integration?.organization_id;

    // Verify signature if secret is configured
    if (integration?.config?.webhook_secret && signature) {
      const secret = integration.config.webhook_secret as string;
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

      if (signature !== expectedSignature) {
        console.error("Invalid Kiwify signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Map Kiwify status to event type
    const eventTypeMap: Record<string, string> = {
      paid: "purchase.approved",
      waiting_payment: "purchase.pending",
      refused: "purchase.refused",
      refunded: "purchase.refunded",
      chargedback: "purchase.chargeback",
    };

    const eventType = eventTypeMap[payload.order_status] || `unknown.${payload.order_status}`;

    // Store webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        organization_id: organizationId,
        source: "kiwify",
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

    // Process approved purchases
    if (payload.order_status === "paid" && organizationId && payload.Customer) {
      const customer = payload.Customer;
      const nameParts = customer.full_name.split(" ");

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
        .eq("email", customer.email)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!existingContact) {
        await supabase.from("contacts").insert({
          organization_id: organizationId,
          user_id: owner.user_id,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || null,
          email: customer.email,
          phone: customer.mobile,
          source: "kiwify",
          status: "customer",
          notes: `Produto: ${payload.product_name} - Pedido: ${payload.order_id}`,
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
    console.error("Error processing Kiwify webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
