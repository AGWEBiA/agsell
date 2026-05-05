import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  action: "add_member" | "remove_member" | "sync_user";
  group_id?: string;
  user_id?: string;
  phone_number?: string;
  should_be_active?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as RequestBody;
    const { action } = body;

    if (action === "add_member") {
      const { group_id, user_id, phone_number } = body;
      if (!group_id || !phone_number) {
        return new Response(
          JSON.stringify({ error: "group_id e phone_number são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get group info to find organization_id
      const { data: group } = await supabase
        .from("plan_whatsapp_groups")
        .select("organization_id")
        .eq("id", group_id)
        .single();

      if (!group) {
        return new Response(
          JSON.stringify({ error: "Grupo não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Push to queue instead of calling Evolution API directly (Etapa 3: Sincronização Inteligente)
      const { error: queueError } = await supabase.from("wa_sync_queue").insert({
        organization_id: group.organization_id,
        action_type: "add_member",
        group_id,
        user_id,
        phone_number,
        status: "pending",
        scheduled_for: new Date().toISOString()
      });

      if (queueError) {
        console.error("[WA-GROUPS] Queue error:", queueError);
        return new Response(JSON.stringify({ error: "Erro ao enfileirar ação" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Ação de adição enfileirada para processamento assíncrono" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "remove_member") {
      const { group_id, user_id, phone_number } = body;
      if (!group_id || !phone_number) {
        return new Response(
          JSON.stringify({ error: "group_id e phone_number são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: group } = await supabase
        .from("plan_whatsapp_groups")
        .select("organization_id")
        .eq("id", group_id)
        .single();

      if (!group) {
        return new Response(
          JSON.stringify({ error: "Grupo não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Push to queue for removal
      const { error: queueError } = await supabase.from("wa_sync_queue").insert({
        organization_id: group.organization_id,
        action_type: "remove_member",
        group_id,
        user_id,
        phone_number,
        status: "pending",
        scheduled_for: new Date().toISOString()
      });

      if (queueError) throw queueError;

      return new Response(
        JSON.stringify({ success: true, message: "Ação de remoção enfileirada para processamento assíncrono" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "sync_user") {
      const { user_id, should_be_active } = body;
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For sync_user, we can either process immediately or queue a "sync_user" task
      // Queueing is safer for bulk operations
      const { data: profile } = await supabase
        .from("profiles")
        .select("whatsapp_number, organization_id")
        .eq("user_id", user_id)
        .single();

      if (!profile?.whatsapp_number) {
        return new Response(
          JSON.stringify({ success: true, message: "Usuário sem número de WhatsApp" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: queueError } = await supabase.from("wa_sync_queue").insert({
        organization_id: profile.organization_id,
        action_type: "sync_user",
        user_id,
        phone_number: profile.whatsapp_number,
        status: "pending",
        scheduled_for: new Date().toISOString()
      });

      if (queueError) throw queueError;

      return new Response(
        JSON.stringify({ success: true, message: "Sincronização de usuário enfileirada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("[WA-GROUPS] Error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
