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

    const { organization_id, instance_name: filterInstance } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
      baseUrl = (val.base_url || val.url || val.api_url || "").replace(/\/$/, "");
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
      const fetchUrl = `${baseUrl}/instance/fetchInstances`;
      console.log("Fetching instances from:", fetchUrl);
      const instancesResp = await fetch(fetchUrl, {
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
      console.log("Raw instances response:", JSON.stringify(instances).substring(0, 2000));
      console.log("Total instances returned:", Array.isArray(instances) ? instances.length : "not-array");
    } catch (fetchErr) {
      console.error("Evolution API connection error:", fetchErr);
      return new Response(JSON.stringify({ error: "Não foi possível conectar à Evolution API. Verifique se a URL está acessível via HTTPS.", instances: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter connected instances (or specific instance if requested)
    const connectedInstances = Array.isArray(instances)
      ? instances.filter((i: any) => {
          // connectionStatus can be a string "open" or an object { state: "open" }
          const rawStatus = i?.connectionStatus;
          const state = typeof rawStatus === "string" ? rawStatus : (rawStatus?.state || i?.instance?.state || i?.state);
          const instanceName = i?.instance?.instanceName || i?.instanceName || i?.name;
          const isConnected = state === "open" || state === "connected";
          console.log(`Instance "${instanceName}" state="${state}" connected=${isConnected}`);
          if (filterInstance) return isConnected && instanceName === filterInstance;
          return isConnected;
        })
      : [];

    console.log("Connected instances count:", connectedInstances.length);

    // Step 2: For each connected instance, fetch groups and extract phone number
    const result: Array<{
      instance_name: string;
      phone_number: string;
      groups: Array<{ id: string; subject: string; size: number; creation: number }>;
    }> = [];

    for (const inst of connectedInstances) {
      const instanceName = inst?.instance?.instanceName || inst?.instanceName || inst?.name;
      if (!instanceName) continue;

      // Extract phone number from instance data
      const owner = inst?.ownerJid || inst?.instance?.owner || inst?.owner || "";
      const phoneRaw = typeof owner === "string" ? owner.replace(/@.*$/, "").replace(/\D/g, "") : "";
      let phoneFormatted = phoneRaw;
      if (phoneRaw.startsWith("55") && phoneRaw.length >= 12) {
        const ddd = phoneRaw.substring(2, 4);
        const rest = phoneRaw.substring(4);
        if (rest.length === 9) {
          phoneFormatted = `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
        } else if (rest.length === 8) {
          phoneFormatted = `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
        }
      } else if (phoneRaw.length > 0) {
        phoneFormatted = `+${phoneRaw}`;
      }

      try {
        // Try multiple Evolution API group endpoints
        const groupUrl = `${baseUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`;
        console.log("Fetching groups from:", groupUrl);
        const groupsResp = await fetch(groupUrl, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(15000),
        });

        if (!groupsResp.ok) {
          const errText = await groupsResp.text();
          console.error(`Failed to fetch groups for ${instanceName} (${groupsResp.status}):`, errText);
          
          // Try alternative endpoint
          console.log("Trying alternative endpoint: /group/fetchAll/");
          const altResp = await fetch(`${baseUrl}/group/fetchAll/${instanceName}?getParticipants=false`, {
            headers: { apikey: apiKey },
            signal: AbortSignal.timeout(15000),
          });
          
          if (altResp.ok) {
            const altData = await altResp.json();
            console.log("Alt endpoint returned:", JSON.stringify(altData).substring(0, 1000));
            const groups = (Array.isArray(altData) ? altData : []).map((g: any) => ({
              id: g.id || g.jid || g.groupJid,
              subject: g.subject || g.name || g.groupName || "Sem nome",
              size: g.size || g.participants?.length || 0,
              creation: g.creation || 0,
            }));
            result.push({ instance_name: instanceName, phone_number: phoneFormatted, groups });
            continue;
          }
          
          result.push({ instance_name: instanceName, phone_number: phoneFormatted, groups: [] });
          continue;
        }

        const rawText = await groupsResp.text();
        console.log(`Groups response for ${instanceName} (first 1000 chars):`, rawText.substring(0, 1000));
        
        let groupsData: any;
        try {
          groupsData = JSON.parse(rawText);
        } catch {
          console.error("Failed to parse groups JSON");
          result.push({ instance_name: instanceName, phone_number: phoneFormatted, groups: [] });
          continue;
        }

        // Handle both array and object responses
        let groupsList: any[] = [];
        if (Array.isArray(groupsData)) {
          groupsList = groupsData;
        } else if (groupsData?.groups && Array.isArray(groupsData.groups)) {
          groupsList = groupsData.groups;
        } else if (groupsData?.data && Array.isArray(groupsData.data)) {
          groupsList = groupsData.data;
        }

        console.log(`Parsed ${groupsList.length} groups for ${instanceName}`);

        const groups = groupsList.map((g: any) => ({
          id: g.id || g.jid || g.groupJid,
          subject: g.subject || g.name || g.groupName || "Sem nome",
          size: g.size || g.participants?.length || 0,
          creation: g.creation || 0,
        }));

        result.push({ instance_name: instanceName, phone_number: phoneFormatted, groups });
      } catch (e) {
        console.error(`Error fetching groups for ${instanceName}:`, e);
        result.push({ instance_name: instanceName, phone_number: phoneFormatted, groups: [] });
      }
    }

    // Also update phone numbers on organization_integrations for display
    for (const inst of result) {
      if (inst.phone_number) {
        await adminClient
          .from("organization_integrations")
          .update({ config: adminClient.rpc ? undefined : undefined }) // We'll handle this client-side
          .eq("organization_id", organization_id);
        // Actually let's just return the data and let the client update
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
