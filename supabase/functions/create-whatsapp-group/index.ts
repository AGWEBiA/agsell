import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  organization_id: string;
  instance_name: string;
  group_name: string;
  description?: string;
  participants: string[]; // phone numbers
  tags?: string[];
}

function formatBrazilianNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as RequestBody;
    const { organization_id, instance_name, group_name, description, participants, tags } = body;

    if (!organization_id || !instance_name || !group_name || !participants?.length) {
      return new Response(
        JSON.stringify({ error: "organization_id, instance_name, group_name e participants são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user belongs to org
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Sem acesso à organização" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Evolution API config
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

    const evolutionConfig = settings?.value as { api_url?: string; api_key?: string } | null;
    if (!evolutionConfig?.api_url || !evolutionConfig?.api_key) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = evolutionConfig.api_url.replace(/\/+$/, "");
    const apiKey = evolutionConfig.api_key;

    // Format participant numbers
    const formattedParticipants = participants
      .map((p) => formatBrazilianNumber(p))
      .filter((p) => p.length >= 10)
      .map((p) => `${p}@s.whatsapp.net`);

    if (formattedParticipants.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum número válido informado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create group via Evolution API
    console.log(`[CREATE-GROUP] Creating group "${group_name}" on instance "${instance_name}" with ${formattedParticipants.length} participants`);

    const createResponse = await fetch(`${apiUrl}/group/create/${instance_name}`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: group_name,
        description: description || "",
        participants: formattedParticipants,
      }),
    });

    const createResult = await createResponse.text();
    console.log("[CREATE-GROUP] Evolution API response:", createResponse.status, createResult);

    if (!createResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Erro da Evolution API: ${createResult}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(createResult);
    } catch {
      parsedResult = {};
    }

    const groupJid = parsedResult?.id || parsedResult?.groupJid || parsedResult?.jid || null;

    // Save group in database
    const { data: newGroup, error: insertError } = await supabase
      .from("whatsapp_groups")
      .insert({
        organization_id,
        name: group_name,
        description: description || null,
        external_group_id: groupJid,
        group_type: "group",
        member_count: formattedParticipants.length + 1, // +1 for the bot/admin
        is_admin: true,
        is_active: true,
        settings: { instance_name },
        tags: tags || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error("[CREATE-GROUP] DB insert error:", insertError);
      // Group was created on WhatsApp but failed to save locally
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Grupo criado no WhatsApp mas erro ao salvar no banco",
          group_jid: groupJid,
          evolution_response: parsedResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        group: newGroup,
        group_jid: groupJid,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("[CREATE-GROUP] Error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
