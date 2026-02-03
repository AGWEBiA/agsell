import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Stripe.prototype;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { organizationId, planId, billingCycle } = await req.json();

    if (!organizationId || !planId) {
      throw new Error("Missing required parameters");
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found");
    }

    // Get organization
    const { data: org, error: orgError } = await supabaseClient
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      throw new Error("Organization not found");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      // If no Stripe key, just update the subscription directly (for testing)
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Check existing subscription
      const { data: existingSub } = await serviceClient
        .from("subscriptions")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (existingSub) {
        await serviceClient
          .from("subscriptions")
          .update({
            plan_id: planId,
            billing_cycle: billingCycle,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", existingSub.id);
      } else {
        await serviceClient
          .from("subscriptions")
          .insert({
            organization_id: organizationId,
            plan_id: planId,
            billing_cycle: billingCycle,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          });
      }

      // Update organization plan reference
      await serviceClient
        .from("organizations")
        .update({ plan_id: planId })
        .eq("id", organizationId);

      return new Response(
        JSON.stringify({ success: true, message: "Plan updated (test mode)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Real Stripe checkout
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Check for existing customer
    const { data: existingSub } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organizationId)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create or get price
    const amount = billingCycle === "yearly" 
      ? Math.round(plan.price_yearly * 100) 
      : Math.round(plan.price_monthly * 100);

    const price = await stripe.prices.create({
      currency: "brl",
      unit_amount: amount,
      recurring: {
        interval: billingCycle === "yearly" ? "year" : "month",
      },
      product_data: {
        name: `AG Sell - ${plan.name}`,
        metadata: {
          plan_id: plan.id,
        },
      },
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/plans?success=true`,
      cancel_url: `${req.headers.get("origin")}/plans?canceled=true`,
      metadata: {
        organization_id: organizationId,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
