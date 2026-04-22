import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface QRCodeRequest {
  organization_id?: string;
  instance_name: string;
  action?: "create" | "connect" | "status" | "qrcode" | "logout" | "delete";
}

interface EvolutionConfig {
  api_url: string;
  api_key: string;
  instance_name: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const body = (await req.json()) as QRCodeRequest;
    if (!body.instance_name?.trim()) {
      return jsonResponse({ success: false, error: "instance_name é obrigatório" });
    }

    if (body.organization_id) {
      const { data: isMember } = await supabase.rpc("is_org_member", {
        _org_id: body.organization_id,
        _user_id: user.id,
      });

      if (!isMember) {
        return jsonResponse({ success: false, error: "Sem permissão nesta organização" }, 403);
      }
    }

    const action = body.action || "connect";
    const evoConfig = await resolveEvolutionConfig(supabase, body.organization_id, body.instance_name);

    if (!evoConfig.api_url || !evoConfig.api_key) {
      return jsonResponse({
        success: false,
        error: "Evolution API não configurada. Contate o administrador da plataforma.",
      });
    }

    const baseUrl = evoConfig.api_url.replace(/\/+$/, "");
    const apiKey = evoConfig.api_key;
    const instanceName = evoConfig.instance_name;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      if (action === "create") {
        return await createInstanceAndFetchQRCode(
          baseUrl,
          apiKey,
          instanceName,
          supabaseUrl,
          controller.signal,
        );
      }

      if (action === "connect" || action === "qrcode") {
        return await getQRCode(
          baseUrl,
          apiKey,
          instanceName,
          supabaseUrl,
          controller.signal,
          true,
        );
      }

      if (action === "status") {
        return await getConnectionStatus(baseUrl, apiKey, instanceName, controller.signal);
      }

      if (action === "logout") {
        return await logoutInstance(baseUrl, apiKey, instanceName, controller.signal);
      }

      if (action === "delete") {
        return await deleteInstance(baseUrl, apiKey, instanceName, controller.signal);
      }

      return jsonResponse({ success: false, error: "Ação inválida" });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("evolution-qrcode error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    const isTimeout = message.includes("aborted") || message.includes("AbortError");

    return jsonResponse({
      success: false,
      error: isTimeout
        ? "A Evolution API não respondeu a tempo (30s). Verifique se a URL está acessível via HTTPS na porta 443."
        : message,
    }, isTimeout ? 504 : 500);
  }
});

async function resolveEvolutionConfig(
  supabase: any,
  organizationId: string | undefined,
  requestedInstanceName: string,
): Promise<EvolutionConfig> {
  const trimmedInstance = requestedInstanceName.trim();
  let integrationConfig: Record<string, string> | null = null;

  if (organizationId) {
    const { data: integrations } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", organizationId)
      .eq("integration_type", "evolution_api")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const rows = (integrations || []) as Array<{ config: Record<string, string> | null }>;

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s_-]+/g, "");

    const target = normalize(trimmedInstance);

    const matched = rows.find((row) => {
      const name = row.config?.instance_name?.trim();
      return !!name && normalize(name) === target;
    });

    integrationConfig = matched?.config || rows[0]?.config || null;
  }

  const { data: globalConfig } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "evolution_api")
    .maybeSingle();

  const globalValue = ((globalConfig as Record<string, unknown> | null)?.value || {}) as Record<string, string>;
  const integrationApiUrl =
    integrationConfig?.own_api_url?.trim() ||
    integrationConfig?.api_url?.trim() ||
    "";

  const integrationApiKey =
    integrationConfig?.own_api_key?.trim() ||
    integrationConfig?.api_key?.trim() ||
    "";

  return {
    api_url: integrationApiUrl || globalValue.api_url || "",
    api_key: integrationApiKey || globalValue.api_key || "",
    instance_name: integrationConfig?.instance_name?.trim() || trimmedInstance,
  };
}

async function getConnectionStatus(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  signal: AbortSignal,
) {
  const candidates = await resolveInstanceCandidates(baseUrl, apiKey, requestedInstanceName, signal);

  let lastError: { status: number; details: unknown; instance: string } | null = null;

  for (const candidate of candidates) {
    const statusRes = await fetch(
      `${baseUrl}/instance/connectionState/${encodeURIComponent(candidate)}`,
      {
        headers: { apikey: apiKey },
        signal,
      },
    );

    const statusRaw = await statusRes.text();
    const statusData = parseUnknown(statusRaw);

    if (statusRes.ok) {
      return jsonResponse({
        success: true,
        data: statusData,
        instance_name: candidate,
      });
    }

    lastError = { status: statusRes.status, details: statusData, instance: candidate };

    if (!isInstanceNotFound(statusRes.status, statusData)) {
      break;
    }
  }

  return jsonResponse({
    success: false,
    error: lastError ? `Erro ao consultar status: ${lastError.status}` : "Instância não encontrada",
    data: lastError?.details || null,
    instance_name: lastError?.instance || requestedInstanceName,
    instance_candidates: candidates,
  });
}

async function logoutInstance(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  signal: AbortSignal,
) {
  const candidates = await resolveInstanceCandidates(baseUrl, apiKey, requestedInstanceName, signal);

  for (const candidate of candidates) {
    try {
      const logoutRes = await fetch(
        `${baseUrl}/instance/logout/${encodeURIComponent(candidate)}`,
        {
          method: "DELETE",
          headers: { apikey: apiKey },
          signal,
        },
      );

      const raw = await logoutRes.text();
      const data = parseUnknown(raw);

      if (logoutRes.ok) {
        return jsonResponse({
          success: true,
          action: "logout",
          message: `Instância ${candidate} desconectada com sucesso`,
          instance_name: candidate,
          details: data,
        });
      }

      if (!isInstanceNotFound(logoutRes.status, data)) {
        return jsonResponse({
          success: false,
          error: `Erro ao desconectar: ${logoutRes.status}`,
          details: data,
          instance_name: candidate,
        });
      }
    } catch (e) {
      console.error(`Logout failed for ${candidate}:`, e);
    }
  }

  return jsonResponse({
    success: false,
    error: "Instância não encontrada para desconectar",
    instance_candidates: candidates,
  });
}

async function deleteInstance(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  signal: AbortSignal,
) {
  const candidates = await resolveInstanceCandidates(baseUrl, apiKey, requestedInstanceName, signal);

  // Try logout first, then delete
  for (const candidate of candidates) {
    try {
      // Logout first (ignore errors)
      await fetch(
        `${baseUrl}/instance/logout/${encodeURIComponent(candidate)}`,
        { method: "DELETE", headers: { apikey: apiKey }, signal },
      ).catch(() => {});

      const deleteRes = await fetch(
        `${baseUrl}/instance/delete/${encodeURIComponent(candidate)}`,
        {
          method: "DELETE",
          headers: { apikey: apiKey },
          signal,
        },
      );

      const raw = await deleteRes.text();
      const data = parseUnknown(raw);

      if (deleteRes.ok) {
        return jsonResponse({
          success: true,
          action: "deleted",
          message: `Instância ${candidate} removida com sucesso`,
          instance_name: candidate,
          details: data,
        });
      }

      if (!isInstanceNotFound(deleteRes.status, data)) {
        return jsonResponse({
          success: false,
          error: `Erro ao remover instância: ${deleteRes.status}`,
          details: data,
          instance_name: candidate,
        });
      }
    } catch (e) {
      console.error(`Delete failed for ${candidate}:`, e);
    }
  }

  return jsonResponse({
    success: false,
    error: "Instância não encontrada para remover",
    instance_candidates: candidates,
  });
}

async function registerInboundWebhook(
  baseUrl: string,
  apiKey: string,
  instanceName: string,
  supabaseUrl: string,
) {
  try {
    const inboundWebhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

    await fetch(`${baseUrl}/webhook/set/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: inboundWebhookUrl,
          webhookByEvents: false,
          webhookBase64: false,
          events: ["MESSAGES_UPSERT", "GROUP_PARTICIPANTS_UPDATE", "CONNECTION_UPDATE"],
        },
      }),
    });
  } catch (e) {
    console.error(`Failed to register inbound webhook for ${instanceName}:`, e);
  }
}

async function createInstanceAndFetchQRCode(
  baseUrl: string,
  apiKey: string,
  instanceName: string,
  supabaseUrl: string,
  signal: AbortSignal,
) {
  const createRes = await fetch(`${baseUrl}/instance/create`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
    signal,
  });

  const createDataRaw = await createRes.text();
  const createData = parseUnknown(createDataRaw);

  if (!createRes.ok) {
    const message = getErrorMessage(createData);
    const alreadyExists =
      createRes.status === 403 ||
      createRes.status === 409 ||
      /already|já existe|exist/i.test(message);

    if (alreadyExists) {
      await registerInboundWebhook(baseUrl, apiKey, instanceName, supabaseUrl);
      return await getQRCode(
        baseUrl,
        apiKey,
        instanceName,
        supabaseUrl,
        signal,
        false,
      );
    }

    return jsonResponse({
      success: false,
      error: `Erro ao criar instância: ${createRes.status}`,
      details: createData,
    });
  }

  await registerInboundWebhook(baseUrl, apiKey, instanceName, supabaseUrl);

  const qr = (createData as Record<string, unknown>)?.qrcode as Record<string, unknown> | undefined;
  if (qr?.base64 || qr?.pairingCode) {
    return jsonResponse({
      success: true,
      action: "qrcode",
      qrcode: qr.base64 || null,
      pairingCode: qr.pairingCode || null,
      instance: (createData as Record<string, unknown>)?.instance || null,
      instance_name: instanceName,
    });
  }

  return await getQRCode(
    baseUrl,
    apiKey,
    instanceName,
    supabaseUrl,
    signal,
    false,
  );
}

async function getQRCode(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  supabaseUrl: string,
  signal: AbortSignal,
  allowAutoCreate = true,
) {
  const candidates = await resolveInstanceCandidates(baseUrl, apiKey, requestedInstanceName, signal);

  for (const candidate of candidates) {
    const statusRes = await fetch(
      `${baseUrl}/instance/connectionState/${encodeURIComponent(candidate)}`,
      { headers: { apikey: apiKey }, signal },
    );

    if (!statusRes.ok) {
      await statusRes.text();
      continue;
    }

    const statusData = await statusRes.json();
    if (statusData?.instance?.state === "open") {
      await registerInboundWebhook(baseUrl, apiKey, candidate, supabaseUrl);
      return jsonResponse({
        success: true,
        action: "connected",
        message: "Instância já está conectada!",
        state: "open",
        instance_name: candidate,
      });
    }
  }

  let lastError: { status: number; details: unknown; instance: string } | null = null;

  for (const candidate of candidates) {
    const qrRes = await fetch(`${baseUrl}/instance/connect/${encodeURIComponent(candidate)}`, {
      headers: { apikey: apiKey },
      signal,
    });

    const qrRaw = await qrRes.text();
    const qrData = parseUnknown(qrRaw) as Record<string, unknown>;

    if (qrRes.ok) {
      return jsonResponse({
        success: true,
        action: "qrcode",
        qrcode: qrData.base64 || null,
        pairingCode: qrData.pairingCode || null,
        code: qrData.code || null,
        instance_name: candidate,
      });
    }

    lastError = { status: qrRes.status, details: qrData, instance: candidate };

    if (!isInstanceNotFound(qrRes.status, qrData)) {
      break;
    }
  }

  if (
    allowAutoCreate &&
    lastError &&
    isInstanceNotFound(lastError.status, lastError.details)
  ) {
    return await createInstanceAndFetchQRCode(
      baseUrl,
      apiKey,
      requestedInstanceName,
      supabaseUrl,
      signal,
    );
  }

  return jsonResponse({
    success: false,
    error: lastError
      ? `Erro ao obter QR Code: ${lastError.status}`
      : "Instância não encontrada na Evolution API",
    details: lastError?.details || null,
    instance_name: lastError?.instance || requestedInstanceName,
    instance_candidates: candidates,
  });
}

async function resolveInstanceCandidates(
  baseUrl: string,
  apiKey: string,
  requestedInstanceName: string,
  signal: AbortSignal,
): Promise<string[]> {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s_-]+/g, "");

  const requested = requestedInstanceName.trim();
  const target = normalize(requested);

  const candidates = new Set<string>([
    requested,
    requested.toLowerCase(),
    requested.replace(/\s+/g, "-"),
    requested.replace(/\s+/g, "_"),
    requested.replace(/\s+/g, ""),
  ]);

  try {
    const instancesResponse = await fetch(`${baseUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: { apikey: apiKey },
      signal,
    });

    if (!instancesResponse.ok) {
      await instancesResponse.text();
      return Array.from(candidates).filter(Boolean);
    }

    const rawInstances = await instancesResponse.json();
    const instances = Array.isArray(rawInstances) ? rawInstances : [];

    for (const item of instances) {
      const record = item as Record<string, unknown>;
      const nested = record.instance as Record<string, unknown> | undefined;
      const possibleName =
        (typeof record.instanceName === "string" && record.instanceName) ||
        (typeof record.name === "string" && record.name) ||
        (typeof nested?.instanceName === "string" && nested.instanceName) ||
        (typeof nested?.name === "string" && nested.name) ||
        "";

      if (possibleName && normalize(possibleName) === target) {
        candidates.add(possibleName);
      }
    }
  } catch {
    // fallback local
  }

  return Array.from(candidates).filter(Boolean);
}

function parseUnknown(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
}

function getErrorMessage(value: unknown): string {
  if (!value || typeof value !== "object") return String(value || "");
  const data = value as Record<string, unknown>;
  const response = data.response as Record<string, unknown> | undefined;

  const message =
    data.message ||
    data.error ||
    response?.message ||
    response?.error ||
    "";

  if (Array.isArray(message)) {
    return message.map((item) => String(item)).join(" ");
  }

  return String(message || "");
}

function isInstanceNotFound(status: number, data: unknown): boolean {
  if (status !== 404 && status !== 400) return false;

  const message = getErrorMessage(data).toLowerCase();
  return (
    message.includes("instance") &&
    (
      message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("não existe") ||
      message.includes("inexistente")
    )
  );
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
