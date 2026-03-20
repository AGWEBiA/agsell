import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type IntegrationConfig = Record<string, unknown>;

type OrgInstance = {
  id: string;
  name: string;
  instance_name: string;
  config: IntegrationConfig;
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeInstanceName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");

const extractInstanceName = (item: any) =>
  item?.instance?.instanceName || item?.instanceName || item?.name || "";

const extractConnectionState = (item: any) => {
  const rawStatus = item?.connectionStatus;
  const state =
    typeof rawStatus === "string"
      ? rawStatus
      : rawStatus?.state || item?.instance?.state || item?.state || "";

  return String(state).toLowerCase();
};

const formatPhone = (rawValue: string): string => {
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("55") && digits.length >= 12) {
    const ddd = digits.substring(2, 4);
    const rest = digits.substring(4);
    if (rest.length === 9) return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    if (rest.length === 8) return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
  }

  return `+${digits}`;
};

const extractPhoneNumber = (instance: any): string => {
  const owner =
    instance?.ownerJid ||
    instance?.instance?.owner ||
    instance?.owner ||
    instance?.instance?.ownerJid ||
    "";

  const ownerValue = typeof owner === "string" ? owner.replace(/@.*$/, "") : "";
  return formatPhone(ownerValue);
};

const parseGroups = (payload: unknown): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.groups)) return record.groups;
    if (Array.isArray(record.data)) return record.data;
  }
  return [];
};

const toOrgInstance = (row: any): OrgInstance => {
  const config = (row?.config || {}) as IntegrationConfig;
  const instance_name =
    typeof config.instance_name === "string" && config.instance_name.trim()
      ? config.instance_name.trim()
      : row.name;

  return {
    id: row.id,
    name: row.name,
    instance_name,
    config,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { organization_id, instance_name: filterInstance } = await req.json();
    if (!organization_id) {
      return jsonResponse({ error: "organization_id required" }, 400);
    }

    const { data: isMember, error: memberError } = await userClient.rpc("is_org_member", {
      _org_id: organization_id,
      _user_id: user.id,
    });

    if (memberError || !isMember) {
      return jsonResponse({ error: "Sem permissão para esta organização" }, 403);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: orgIntegrationRows, error: integrationError } = await adminClient
      .from("organization_integrations")
      .select("id, name, config")
      .eq("organization_id", organization_id)
      .eq("integration_type", "evolution_api");

    if (integrationError) throw integrationError;

    const orgInstances = (orgIntegrationRows || []).map(toOrgInstance);
    if (orgInstances.length === 0) {
      return jsonResponse({
        instances: [],
        error: "Nenhuma instância Evolution configurada para esta conta.",
      });
    }

    const orgInstancesByNormalizedName = new Map(
      orgInstances.map((inst) => [normalizeInstanceName(inst.instance_name), inst])
    );

    let normalizedFilter: string | null = null;
    if (filterInstance) {
      normalizedFilter = normalizeInstanceName(String(filterInstance));
      if (!orgInstancesByNormalizedName.has(normalizedFilter)) {
        return jsonResponse({
          instances: [],
          error: "A instância solicitada não pertence à conta atual.",
        });
      }
    }

    const preferredOrgInstance = normalizedFilter
      ? orgInstancesByNormalizedName.get(normalizedFilter) || null
      : orgInstances[0];

    const preferredConfig = (preferredOrgInstance?.config || {}) as Record<string, string>;

    let baseUrl = (preferredConfig.own_api_url || preferredConfig.api_url || "").replace(/\/$/, "");
    let apiKey = preferredConfig.own_api_key || preferredConfig.api_key || "";

    if (!baseUrl || !apiKey) {
      const { data: globalConfig } = await adminClient
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

      if (globalConfig?.value) {
        const val = globalConfig.value as Record<string, string>;
        baseUrl = (val.base_url || val.url || val.api_url || "").replace(/\/$/, "");
        apiKey = val.api_key || val.apikey || "";
      }
    }

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
      return jsonResponse({
        error: "Evolution API não configurada. Configure no painel administrativo.",
        instances: [],
      });
    }

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
        return jsonResponse({
          error: "Erro ao conectar com Evolution API",
          detail: errText,
          instances: [],
        });
      }

      instances = await instancesResp.json();
      console.log("Raw instances response:", JSON.stringify(instances).substring(0, 2000));
      console.log("Total instances returned:", Array.isArray(instances) ? instances.length : "not-array");
    } catch (fetchErr) {
      console.error("Evolution API connection error:", fetchErr);
      return jsonResponse({
        error: "Não foi possível conectar à Evolution API. Verifique se a URL está acessível via HTTPS.",
        instances: [],
      });
    }

    const connectedInstances = Array.isArray(instances)
      ? instances.filter((i: any) => {
          const state = extractConnectionState(i);
          const instanceName = extractInstanceName(i);
          const normalizedName = normalizeInstanceName(instanceName);
          const isConnected = state === "open" || state === "connected";
          const belongsToOrg = orgInstancesByNormalizedName.has(normalizedName);

          console.log(`Instance "${instanceName}" state="${state}" connected=${isConnected} belongsToOrg=${belongsToOrg}`);

          if (!isConnected || !belongsToOrg) return false;
          if (normalizedFilter) return normalizedName === normalizedFilter;
          return true;
        })
      : [];

    console.log("Connected instances count:", connectedInstances.length);

    const result: Array<{
      instance_id: string | null;
      instance_name: string;
      instance_label: string;
      phone_number: string;
      groups: Array<{ id: string; subject: string; size: number; creation: number }>;
    }> = [];

    for (const inst of connectedInstances) {
      const instanceName = extractInstanceName(inst);
      if (!instanceName) continue;

      const orgInstance = orgInstancesByNormalizedName.get(normalizeInstanceName(instanceName));
      const phoneFormatted = extractPhoneNumber(inst);

      try {
        const groupUrl = `${baseUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`;
        console.log("Fetching groups from:", groupUrl);
        const groupsResp = await fetch(groupUrl, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(15000),
        });

        if (!groupsResp.ok) {
          const errText = await groupsResp.text();
          console.error(`Failed to fetch groups for ${instanceName} (${groupsResp.status}):`, errText);

          console.log("Trying alternative endpoint: /group/fetchAll/");
          const altResp = await fetch(`${baseUrl}/group/fetchAll/${instanceName}?getParticipants=false`, {
            headers: { apikey: apiKey },
            signal: AbortSignal.timeout(15000),
          });
          
          if (altResp.ok) {
            const altData = await altResp.json();
            console.log("Alt endpoint returned:", JSON.stringify(altData).substring(0, 1000));
            const groups = parseGroups(altData).map((g: any) => ({
              id: g.id || g.jid || g.groupJid,
              subject: g.subject || g.name || g.groupName || "Sem nome",
              size: g.size || g.participants?.length || 0,
              creation: g.creation || 0,
            }));

            result.push({
              instance_id: orgInstance?.id || null,
              instance_name: orgInstance?.instance_name || instanceName,
              instance_label: orgInstance?.name || instanceName,
              phone_number: phoneFormatted,
              groups,
            });
            continue;
          }

          result.push({
            instance_id: orgInstance?.id || null,
            instance_name: orgInstance?.instance_name || instanceName,
            instance_label: orgInstance?.name || instanceName,
            phone_number: phoneFormatted,
            groups: [],
          });
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

        const groupsList = parseGroups(groupsData);

        console.log(`Parsed ${groupsList.length} groups for ${instanceName}`);

        const groups = groupsList.map((g: any) => ({
          id: g.id || g.jid || g.groupJid,
          subject: g.subject || g.name || g.groupName || "Sem nome",
          size: g.size || g.participants?.length || 0,
          creation: g.creation || 0,
        }));

        result.push({
          instance_id: orgInstance?.id || null,
          instance_name: orgInstance?.instance_name || instanceName,
          instance_label: orgInstance?.name || instanceName,
          phone_number: phoneFormatted,
          groups,
        });
      } catch (e) {
        console.error(`Error fetching groups for ${instanceName}:`, e);
        result.push({
          instance_id: orgInstance?.id || null,
          instance_name: orgInstance?.instance_name || instanceName,
          instance_label: orgInstance?.name || instanceName,
          phone_number: phoneFormatted,
          groups: [],
        });
      }
    }

    return jsonResponse({ instances: result });
  } catch (err) {
    console.error("fetch-evolution-groups error:", err);
    return jsonResponse({ error: "Erro interno", instances: [] });
  }
});
