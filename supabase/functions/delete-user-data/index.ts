// LGPD - Data Deletion Edge Function (with Stripe subscription cancellation)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { confirmation } = await req.json();
    if (confirmation !== "EXCLUIR MINHA CONTA") {
      return new Response(
        JSON.stringify({ error: "Confirmação inválida. Digite 'EXCLUIR MINHA CONTA' para confirmar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // ---- Step 1: Cancel all active Stripe subscriptions ----
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    // Find all organizations the user belongs to
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userId);

    if (memberships && stripeSecretKey) {
      const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

      for (const membership of memberships) {
        // Only cancel subscriptions for orgs where user is owner
        if (membership.role !== "owner") continue;

        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("stripe_subscription_id, stripe_customer_id, status")
          .eq("organization_id", membership.organization_id);

        if (subscriptions) {
          for (const sub of subscriptions) {
            // Cancel active Stripe subscriptions immediately
            if (sub.stripe_subscription_id && ["active", "trialing", "past_due"].includes(sub.status)) {
              try {
                await stripe.subscriptions.cancel(sub.stripe_subscription_id, {
                  prorate: true,
                });
                console.log("Stripe subscription canceled:", sub.stripe_subscription_id);
              } catch (stripeErr) {
                console.error("Error canceling Stripe subscription:", stripeErr);
              }
            }

            // Update local subscription record
            await supabase
              .from("subscriptions")
              .update({ status: "canceled" })
              .eq("stripe_subscription_id", sub.stripe_subscription_id);
          }
        }
      }
    }

    // ---- Step 2: Delete user data in order (respecting foreign keys) ----
    const deletions = [
      supabase.from("notifications").delete().eq("user_id", userId),
      supabase.from("activities").delete().eq("user_id", userId),
      supabase.from("tasks").delete().eq("user_id", userId),
      supabase.from("automations").delete().eq("user_id", userId),
      supabase.from("deals").delete().eq("user_id", userId),
      supabase.from("contacts").delete().eq("user_id", userId),
      supabase.from("companies").delete().eq("user_id", userId),
      supabase.from("email_campaigns").delete().eq("user_id", userId),
      supabase.from("lead_scoring_rules").delete().eq("user_id", userId),
      supabase.from("pipeline_stages").delete().eq("user_id", userId),
      supabase.from("tags").delete().eq("user_id", userId),
      supabase.from("forms").delete().eq("user_id", userId),
      supabase.from("conversations").delete().eq("user_id", userId),
      supabase.from("user_gamification").delete().eq("user_id", userId),
      supabase.from("user_achievements").delete().eq("user_id", userId),
      supabase.from("user_roles").delete().eq("user_id", userId),
      supabase.from("organization_members").delete().eq("user_id", userId),
      supabase.from("profiles").delete().eq("user_id", userId),
    ];

    for (const deletion of deletions) {
      const { error } = await deletion;
      if (error) {
        console.error("Deletion error:", error);
      }
    }

    // ---- Step 3: Delete the auth user ----
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Erro ao excluir conta. Entre em contato com o suporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Conta e dados excluídos com sucesso. Todas as cobranças foram canceladas." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error deleting user data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
