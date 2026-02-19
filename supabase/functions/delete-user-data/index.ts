// LGPD - Data Deletion Edge Function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Delete user data in order (respecting foreign keys)
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
        // Continue with other deletions
      }
    }

    // Finally delete the auth user
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Erro ao excluir conta. Entre em contato com o suporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Conta e dados excluídos com sucesso." }),
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
