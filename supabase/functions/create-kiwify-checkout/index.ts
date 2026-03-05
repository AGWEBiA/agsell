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

    // Create/update contact in CRM if we have an authenticated user with org
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        // Get user's organization
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (membership?.organization_id) {
          const contactEmail = (email || user.email || "").toLowerCase();
          // Check if contact already exists by email in this org
          const { data: existingContact } = await supabase
            .from("contacts")
            .select("id")
            .eq("organization_id", membership.organization_id)
            .ilike("email", contactEmail)
            .maybeSingle();

          if (!existingContact && contactEmail) {
            await supabase.from("contacts").insert({
              first_name: name || "Lead Checkout",
              email: contactEmail,
              user_id: user.id,
              organization_id: membership.organization_id,
              source: "checkout_kiwify",
              status: "active",
            });
            console.log(`[KIWIFY-CHECKOUT] Contact created for ${contactEmail}`);
          }
        }
      }
    }

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
