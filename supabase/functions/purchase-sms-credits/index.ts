import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageId } = await req.json();
    if (!packageId) {
      return new Response(JSON.stringify({ error: "packageId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) throw new Error("Authentication failed");

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership?.organization_id) throw new Error("No organization found");

    // Get SMS credit package
    const { data: pkg, error: pkgError } = await supabase
      .from("sms_credit_packages")
      .select("*")
      .eq("id", packageId)
      .eq("is_active", true)
      .single();

    if (pkgError || !pkg) {
      return new Response(JSON.stringify({ error: "Package not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get platform gateway settings
    const { data: gatewaySettings } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "payment_gateway")
      .maybeSingle();

    const settings = (gatewaySettings?.value as Record<string, unknown>) ?? {
      stripe_enabled: true,
      kiwify_enabled: false,
      default_gateway: "stripe",
    };

    const defaultGateway = settings.default_gateway as string;
    const origin = req.headers.get("origin") || "https://agsell.lovable.app";

    if (defaultGateway === "kiwify" && settings.kiwify_enabled) {
      const checkoutUrlStr = pkg.kiwify_checkout_url;
      if (!checkoutUrlStr) {
        return new Response(
          JSON.stringify({ error: "Kiwify checkout URL not configured for this SMS package. Contact admin." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const checkoutUrl = new URL(checkoutUrlStr);
      if (user.email) checkoutUrl.searchParams.set("email", user.email);
      const fullName = user.user_metadata?.full_name;
      if (fullName) checkoutUrl.searchParams.set("name", fullName);

      await supabase.from("sms_transactions").insert({
        organization_id: membership.organization_id,
        user_id: user.id,
        type: "purchase_pending",
        amount: pkg.credits,
        package_id: pkg.id,
        payment_method: "kiwify",
        description: `Compra pendente: ${pkg.name} (${pkg.credits} créditos SMS)`,
      });

      console.log(`[SMS-PURCHASE] Kiwify checkout for ${user.email}, package ${pkg.name}`);

      return new Response(
        JSON.stringify({ url: checkoutUrl.toString(), gateway: "kiwify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (defaultGateway === "stripe" || settings.stripe_enabled) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("Stripe not configured");

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      let customerId: string | undefined;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pkg.stripe_price_id
        ? [{ price: pkg.stripe_price_id, quantity: 1 }]
        : [{
            price_data: {
              currency: "brl",
              product_data: {
                name: `SMS - ${pkg.name}`,
                description: `${pkg.credits} créditos de SMS`,
              },
              unit_amount: pkg.price_cents,
            },
            quantity: 1,
          }];

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email!,
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/sms?purchase=success&package=${pkg.id}`,
        cancel_url: `${origin}/sms?purchase=cancelled`,
        metadata: {
          type: "sms_credits",
          package_id: pkg.id,
          organization_id: membership.organization_id,
          user_id: user.id,
          credits: String(pkg.credits),
        },
      });

      console.log(`[SMS-PURCHASE] Stripe checkout session ${session.id} for ${user.email}`);

      return new Response(
        JSON.stringify({ url: session.url, gateway: "stripe" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "No payment gateway is enabled. Contact admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("[SMS-PURCHASE] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
