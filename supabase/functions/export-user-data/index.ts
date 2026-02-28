// LGPD - Data Export (Portability) Edge Function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const userId = user.id;

    // Gather all user data across tables
    const [
      profileRes,
      contactsRes,
      companiesRes,
      dealsRes,
      tasksRes,
      activitiesRes,
      automationsRes,
      notificationsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId),
      supabase.from("contacts").select("*").eq("user_id", userId),
      supabase.from("companies").select("*").eq("user_id", userId),
      supabase.from("deals").select("*").eq("user_id", userId),
      supabase.from("tasks").select("*").eq("user_id", userId),
      supabase.from("activities").select("*").eq("user_id", userId),
      supabase.from("automations").select("*").eq("user_id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profileRes.data || [],
      contacts: contactsRes.data || [],
      companies: companiesRes.data || [],
      deals: dealsRes.data || [],
      tasks: tasksRes.data || [],
      activities: activitiesRes.data || [],
      automations: automationsRes.data || [],
      notifications: notificationsRes.data || [],
    };

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="meus-dados-agsell-${new Date().toISOString().split('T')[0]}.json"`,
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error exporting user data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
