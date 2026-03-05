// Creates a Kiwify checkout URL with pre-filled customer data
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
    const { planId, billingCycle, name, email, organizationName } = await req.json();

    if (!planId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (planId, email)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get plan with Kiwify checkout URL
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, kiwify_checkout_url, kiwify_product_id, kiwify_checkout_url_yearly, kiwify_product_id_yearly")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select checkout URL based on billing cycle
    const checkoutUrlStr = billingCycle === "yearly" && plan.kiwify_checkout_url_yearly
      ? plan.kiwify_checkout_url_yearly
      : plan.kiwify_checkout_url;

    if (!checkoutUrlStr) {
      return new Response(
        JSON.stringify({ error: "Kiwify checkout not configured for this plan/cycle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build checkout URL with pre-filled params
    const checkoutUrl = new URL(checkoutUrlStr);
    
    // Kiwify supports pre-filling customer data via URL params
    if (name) checkoutUrl.searchParams.set("name", name);
    if (email) checkoutUrl.searchParams.set("email", email);

    // Store lead for tracking
    await supabase.from("checkout_leads").upsert(
      {
        email: email.toLowerCase(),
        name: name || "Kiwify Lead",
        organization_name: organizationName || "",
        plan_id: planId,
        billing_cycle: billingCycle || "monthly",
        status: "redirected_to_kiwify",
        source: "kiwify",
      },
      { onConflict: "email", ignoreDuplicates: false }
    );

    console.log(`[KIWIFY-CHECKOUT] Redirecting ${email} to Kiwify for plan ${plan.name}`);

    return new Response(
      JSON.stringify({ url: checkoutUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[KIWIFY-CHECKOUT] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
