import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Get plan details (including Stripe price IDs)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: plan, error: planError } = await serviceClient
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
      // No Stripe key = test mode: update subscription directly
      const { data: existingSub } = await serviceClient
        .from("subscriptions")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      const subData = {
        plan_id: planId,
        billing_cycle: billingCycle,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (existingSub) {
        await serviceClient.from("subscriptions").update(subData).eq("id", existingSub.id);
      } else {
        await serviceClient.from("subscriptions").insert({ organization_id: organizationId, ...subData });
      }

      await serviceClient.from("organizations").update({ plan_id: planId }).eq("id", organizationId);

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
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Use the pre-configured Stripe price ID from the plan record
    const stripePriceId = billingCycle === "yearly"
      ? plan.stripe_price_id_yearly
      : plan.stripe_price_id_monthly;

    let priceId: string;

    if (stripePriceId) {
      priceId = stripePriceId;
      console.log(`Using pre-configured Stripe price: ${priceId}`);
    } else {
      // Fallback: create a price dynamically (legacy)
      console.log("No Stripe price ID configured, creating dynamically");
      const amount = billingCycle === "yearly"
        ? Math.round(plan.price_yearly * 100)
        : Math.round(plan.price_monthly * 100);

      const price = await stripe.prices.create({
        currency: "brl",
        unit_amount: amount,
        recurring: { interval: billingCycle === "yearly" ? "year" : "month" },
        product_data: {
          name: `AG Sell - ${plan.name}`,
          metadata: { plan_id: plan.id },
        },
      });
      priceId = price.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
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
    return new Response(
      JSON.stringify({ error: "An error occurred processing your checkout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
