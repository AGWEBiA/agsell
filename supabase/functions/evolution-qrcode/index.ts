import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface QRCodeRequest {
  organization_id: string;
  instance_name: string;
  action: "create" | "connect" | "status" | "qrcode";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth
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

    if (!body.instance_name) {
      return jsonResponse({ success: false, error: "instance_name é obrigatório" });
    }

    // Validate org membership if provided
    if (body.organization_id) {
      const { data: isMember } = await supabase.rpc("is_org_member", {
        _org_id: body.organization_id,
        _user_id: user.id,
      });
      if (!isMember) {
        return jsonResponse({ success: false, error: "Sem permissão nesta organização" }, 403);
      }
    }

    // Fetch global Evolution API config
    const { data: globalConfig } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

    const evoConfig = globalConfig?.value as Record<string, string> | null;
    if (!evoConfig?.api_url || !evoConfig?.api_key) {
      return jsonResponse({
        success: false,
        error: "Evolution API não configurada globalmente. Contate o administrador.",
      });
    }

    const baseUrl = evoConfig.api_url.replace(/\/+$/, "");
    const apiKey = evoConfig.api_key;
    const instanceName = body.instance_name;
    const action = body.action || "connect";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      if (action === "create") {
        // Create instance in Evolution API
        const createRes = await fetch(`${baseUrl}/instance/create`, {
          method: "POST",
          headers: {
            apikey: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instanceName: instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
          }),
          signal: controller.signal,
        });

        const createData = await createRes.text();
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(createData);
        } catch {
          parsed = { raw: createData };
        }

        if (!createRes.ok) {
          // Instance might already exist — try to connect instead
          if (createRes.status === 403 || createRes.status === 409 ||
              (typeof parsed.message === "string" && parsed.message.toLowerCase().includes("already"))) {
            // Register sync webhook before returning QR
            await registerSyncWebhook(baseUrl, apiKey, instanceName, supabaseUrl);
            return await getQRCode(baseUrl, apiKey, instanceName, controller.signal);
          }
          return jsonResponse({
            success: false,
            error: `Erro ao criar instância: ${createRes.status}`,
            details: parsed,
          });
        }

        // Register sync webhook for reconnection events
        await registerSyncWebhook(baseUrl, apiKey, instanceName, supabaseUrl);

        // Check if QR came in the create response
        const qr = parsed.qrcode as Record<string, unknown> | undefined;
        if (qr?.base64 || qr?.pairingCode) {
          return jsonResponse({
            success: true,
            action: "qrcode",
            qrcode: qr.base64 || null,
            pairingCode: qr.pairingCode || null,
            instance: parsed.instance || null,
          });
        }

        // Otherwise fetch QR separately
        return await getQRCode(baseUrl, apiKey, instanceName, controller.signal);
      }

      if (action === "connect" || action === "qrcode") {
        return await getQRCode(baseUrl, apiKey, instanceName, controller.signal);
      }

      if (action === "status") {
        const statusRes = await fetch(
          `${baseUrl}/instance/connectionState/${instanceName}`,
          {
            headers: { apikey: apiKey },
            signal: controller.signal,
          },
        );
        const statusData = await statusRes.text();
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(statusData);
        } catch {
          parsed = statusData;
        }

        return jsonResponse({ success: statusRes.ok, data: parsed });
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

async function registerSyncWebhook(
  baseUrl: string,
  apiKey: string,
  instanceName: string,
  supabaseUrl: string,
) {
  try {
    const syncWebhookUrl = `${supabaseUrl}/functions/v1/sync-whatsapp-reconnect`;
    // Set webhook for connection events
    await fetch(`${baseUrl}/webhook/set/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: syncWebhookUrl,
        webhook_by_events: true,
        webhook_base64: false,
        events: ["CONNECTION_UPDATE"],
      }),
    });
    console.log(`Sync webhook registered for ${instanceName}`);
  } catch (e) {
    console.error(`Failed to register sync webhook for ${instanceName}:`, e);
  }
}

async function getQRCode(
  baseUrl: string,
  apiKey: string,
  instanceName: string,
  signal: AbortSignal,
) {
  // First check status
  const statusRes = await fetch(
    `${baseUrl}/instance/connectionState/${instanceName}`,
    { headers: { apikey: apiKey }, signal },
  );

  if (statusRes.ok) {
    const statusData = await statusRes.json();
    if (statusData?.instance?.state === "open") {
      return jsonResponse({
        success: true,
        action: "connected",
        message: "Instância já está conectada!",
        state: "open",
      });
    }
  } else {
    await statusRes.text(); // consume body
  }

  // Fetch QR code
  const qrRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
    headers: { apikey: apiKey },
    signal,
  });

  const qrRaw = await qrRes.text();
  let qrData: Record<string, unknown> = {};
  try {
    qrData = JSON.parse(qrRaw);
  } catch {
    qrData = { raw: qrRaw };
  }

  if (!qrRes.ok) {
    return jsonResponse({
      success: false,
      error: `Erro ao obter QR Code: ${qrRes.status}`,
      details: qrData,
    });
  }

  return jsonResponse({
    success: true,
    action: "qrcode",
    qrcode: qrData.base64 || null,
    pairingCode: qrData.pairingCode || null,
    code: qrData.code || null,
  });
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
