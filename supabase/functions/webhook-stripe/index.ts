// Webhook Handler for Stripe Events — Signature Verification Required
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    // Find organization with active Stripe integration
    const { data: integration } = await supabase
      .from("organization_integrations")
      .select("organization_id, config")
      .eq("integration_type", "stripe")
      .eq("is_active", true)
      .single();

    const organizationId = integration?.organization_id;
    const stripeWebhookSecret = integration?.config?.webhook_secret as string | undefined;
    const stripeSecretKey = integration?.config?.secret_key as string | undefined;

    // SECURITY: Require signature verification
    if (!stripeWebhookSecret || !signature) {
      console.error("Webhook rejected: missing webhook secret or signature");
      return new Response(
        JSON.stringify({ error: "Webhook signature verification required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!stripeSecretKey) {
      console.error("Webhook rejected: Stripe secret key not configured");
      return new Response(
        JSON.stringify({ error: "Stripe not properly configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
    } catch (err) {
      console.error("Stripe signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Stripe webhook received:", event.type);

    // Store webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        organization_id: organizationId,
        source: "stripe",
        event_type: event.type,
        payload: event,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error("Error storing webhook:", webhookError);
      return new Response(
        JSON.stringify({ error: "Failed to process webhook" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process specific events
    if (organizationId) {
      // Get org owner user_id for contact creation
      const { data: ownerMember } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();

      const ownerUserId = ownerMember?.user_id;

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.customer_details?.email && ownerUserId) {
            const { data: existingContact } = await supabase
              .from("contacts")
              .select("id")
              .eq("email", session.customer_details.email)
              .eq("organization_id", organizationId)
              .maybeSingle();

            if (!existingContact) {
              const nameParts = (session.customer_details.name || "").split(" ");
              await supabase.from("contacts").insert({
                organization_id: organizationId,
                user_id: ownerUserId,
                first_name: nameParts[0] || "Cliente",
                last_name: nameParts.slice(1).join(" ") || null,
                email: session.customer_details.email,
                phone: session.customer_details.phone,
                source: "stripe",
                status: "customer",
              });
            }
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log("Subscription event:", subscription.id, subscription.status);
          break;
        }

        case "invoice.paid":
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log("Invoice event:", invoice.id, invoice.status);
          break;
        }
      }

      await supabase
        .from("webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", webhookEvent.id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing Stripe webhook:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
