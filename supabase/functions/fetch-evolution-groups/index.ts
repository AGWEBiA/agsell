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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use service role to read platform settings (contains API keys)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try global platform_settings first
    const { data: globalConfig } = await adminClient
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

    let baseUrl = "";
    let apiKey = "";

    if (globalConfig?.value) {
      const val = globalConfig.value as Record<string, string>;
      baseUrl = (val.base_url || val.url || "").replace(/\/$/, "");
      apiKey = val.api_key || val.apikey || "";
    }

    // Fallback to paid_groups_config per org
    if (!baseUrl || !apiKey) {
      const { data: orgConfig } = await adminClient
        .from("paid_groups_config")
        .select("evolution_api_url, evolution_api_key")
        .eq("organization_id", organization_id)
        .single();

      if (orgConfig) {
        baseUrl = (orgConfig.evolution_api_url || "").replace(/\/$/, "");
        apiKey = orgConfig.evolution_api_key || "";
      }
    }

    if (!baseUrl || !apiKey) {
      return new Response(JSON.stringify({ error: "Evolution API não configurada. Configure no painel administrativo.", instances: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Fetch all instances
    let instances: any[] = [];
    try {
      const instancesResp = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(15000),
      });

      if (!instancesResp.ok) {
        const errText = await instancesResp.text();
        console.error("Failed to fetch instances:", errText);
        return new Response(JSON.stringify({ error: "Erro ao conectar com Evolution API", detail: errText, instances: [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      instances = await instancesResp.json();
    } catch (fetchErr) {
      console.error("Evolution API connection error:", fetchErr);
      return new Response(JSON.stringify({ error: "Não foi possível conectar à Evolution API. Verifique se a URL está acessível via HTTPS.", instances: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const connectedInstances = Array.isArray(instances)
      ? instances.filter((i: any) => {
          const state = i?.instance?.state || i?.state || i?.connectionStatus?.state;
          return state === "open" || state === "connected";
        })
      : [];

    // Step 2: For each connected instance, fetch groups
    const result: Array<{
      instance_name: string;
      groups: Array<{ id: string; subject: string; size: number; creation: number }>;
    }> = [];

    for (const inst of connectedInstances) {
      const instanceName = inst?.instance?.instanceName || inst?.instanceName || inst?.name;
      if (!instanceName) continue;

      try {
        const groupsResp = await fetch(`${baseUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(15000),
        });

        if (!groupsResp.ok) {
          console.error(`Failed to fetch groups for ${instanceName}:`, await groupsResp.text());
          continue;
        }

        const groupsData = await groupsResp.json();
        const groups = (Array.isArray(groupsData) ? groupsData : []).map((g: any) => ({
          id: g.id || g.jid || g.groupJid,
          subject: g.subject || g.name || g.groupName || "Sem nome",
          size: g.size || g.participants?.length || 0,
          creation: g.creation || 0,
        }));

        result.push({ instance_name: instanceName, groups });
      } catch (e) {
        console.error(`Error fetching groups for ${instanceName}:`, e);
      }
    }

    return new Response(JSON.stringify({ instances: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-evolution-groups error:", err);
    return new Response(JSON.stringify({ error: "Erro interno", instances: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
