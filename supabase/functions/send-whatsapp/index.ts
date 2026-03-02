// WhatsApp Message Sender via Evolution API or WhatsApp Business API
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsAppRequest {
  organization_id: string;
  to: string;
  message: string;
  media_url?: string;
  media_type?: "image" | "video" | "audio" | "document";
  template_name?: string;
  template_params?: string[];
}

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

    const whatsappReq = (await req.json()) as WhatsAppRequest;

    // Validate organization membership
    if (whatsappReq.organization_id) {
      const { data: isMember } = await supabase.rpc('is_org_member', {
        _org_id: whatsappReq.organization_id,
        _user_id: user.id,
      });
      if (!isMember) {
        return new Response(
          JSON.stringify({ error: "Forbidden - not a member of this organization" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Format phone number
    const phoneNumber = whatsappReq.to.replace(/\D/g, "");

    // Try Evolution API first — use GLOBAL config + org instance name
    const { data: evolutionInt } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", whatsappReq.organization_id)
      .eq("integration_type", "evolution_api")
      .eq("is_active", true)
      .maybeSingle();

    if (evolutionInt) {
      // Fetch global Evolution API config
      const { data: globalConfig } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "evolution_api")
        .single();

      const globalEvo = globalConfig?.value as Record<string, string> | null;
      const orgConfig = evolutionInt.config as Record<string, string>;

      // Merge: global URL + key, org instance_name
      const mergedConfig: Record<string, string> = {
        api_url: globalEvo?.api_url || orgConfig.api_url || "",
        api_key: globalEvo?.api_key || orgConfig.api_key || "",
        instance_name: (orgConfig.instance_name || "").trim(),
      };

      if (mergedConfig.api_url && mergedConfig.api_key && mergedConfig.instance_name) {
        return await sendWithEvolutionAPI(mergedConfig, phoneNumber, whatsappReq);
      }
    }

    // Try WhatsApp Business API
    const { data: businessInt } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", whatsappReq.organization_id)
      .eq("integration_type", "whatsapp_business")
      .eq("is_active", true)
      .maybeSingle();

    if (businessInt) {
      return await sendWithBusinessAPI(businessInt.config as Record<string, string>, phoneNumber, whatsappReq);
    }

    return new Response(
      JSON.stringify({ error: "No WhatsApp integration configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending WhatsApp:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendWithEvolutionAPI(
  config: Record<string, string>,
  phoneNumber: string,
  whatsappReq: WhatsAppRequest
) {
  const baseUrl = config.api_url.replace(/\/+$/, "");
  const apiKey = config.api_key;
  const instanceName = encodeURIComponent(config.instance_name);

  if (!baseUrl || !apiKey || !instanceName) {
    return new Response(
      JSON.stringify({ error: "Evolution API not fully configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const normalizeInstanceName = (value: string) =>
    value.toLowerCase().replace(/[\s_-]+/g, "");

  const configuredInstanceName = decodeURIComponent(config.instance_name).trim();
  let resolvedInstanceName = configuredInstanceName;

  try {
    const instancesResponse = await fetch(`${baseUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: { apikey: apiKey },
    });

    if (instancesResponse.ok) {
      const rawInstances = await instancesResponse.json();
      const instances = Array.isArray(rawInstances) ? rawInstances : [];

      const extractName = (item: Record<string, unknown>): string | null => {
        if (typeof item.instanceName === "string") return item.instanceName;
        if (typeof item.name === "string") return item.name;

        const nestedInstance = item.instance as Record<string, unknown> | undefined;
        if (nestedInstance) {
          if (typeof nestedInstance.instanceName === "string") return nestedInstance.instanceName;
          if (typeof nestedInstance.name === "string") return nestedInstance.name;
        }

        return null;
      };

      const targetNormalized = normalizeInstanceName(configuredInstanceName);
      const matched = instances
        .map((instance) => extractName(instance as Record<string, unknown>))
        .find((name) => !!name && normalizeInstanceName(name) === targetNormalized);

      if (matched) {
        resolvedInstanceName = matched;
      }
    } else {
      await instancesResponse.text();
    }
  } catch {
    // Se falhar a descoberta, segue com fallback local
  }

  const instanceCandidates = Array.from(
    new Set([
      resolvedInstanceName,
      configuredInstanceName,
      configuredInstanceName.toLowerCase(),
      configuredInstanceName.replace(/\s+/g, "-"),
      configuredInstanceName.replace(/\s+/g, "_"),
      configuredInstanceName.replace(/\s+/g, ""),
    ].filter(Boolean))
  );

  const sendWithInstanceFallback = async (endpoint: "sendText" | "sendMedia", payload: Record<string, unknown>) => {
    let lastError: { status: number; data: any; instance: string } | null = null;

    for (const candidate of instanceCandidates) {
      const response = await fetch(`${baseUrl}/message/${endpoint}/${encodeURIComponent(candidate)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        return { ok: true as const, data, instance: candidate };
      }

      lastError = { status: response.status, data, instance: candidate };

      const message = data?.response?.message?.[0] || data?.message || "";
      const isInstanceNotFound = response.status === 404 && /instance does not exist/i.test(String(message));
      if (!isInstanceNotFound) break;
    }

    return { ok: false as const, ...(lastError || { status: 500, data: { message: "Unknown Evolution API error" }, instance: rawInstanceName }) };
  };

  if (!whatsappReq.media_url) {
    const result = await sendWithInstanceFallback("sendText", {
      number: phoneNumber,
      text: whatsappReq.message,
    });

    if (!result.ok) {
      console.error("Evolution API error:", result.data);
      return new Response(
        JSON.stringify({ error: `Evolution API error: ${result.data?.message || result.status}` }),
        { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider: "evolution_api", data: result.data, instance_used: result.instance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const result = await sendWithInstanceFallback("sendMedia", {
    number: phoneNumber,
    mediatype: whatsappReq.media_type || "image",
    media: whatsappReq.media_url,
    caption: whatsappReq.message,
  });

  if (!result.ok) {
    console.error("Evolution API error:", result.data);
    return new Response(
      JSON.stringify({ error: `Evolution API error: ${result.data?.message || result.status}` }),
      { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, provider: "evolution_api", data: result.data, instance_used: result.instance }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function sendWithBusinessAPI(
  config: Record<string, string>,
  phoneNumber: string,
  whatsappReq: WhatsAppRequest
) {
  const accessToken = config.access_token;
  const phoneNumberId = config.phone_number_id;

  if (!accessToken || !phoneNumberId) {
    return new Response(
      JSON.stringify({ error: "WhatsApp Business API not fully configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  let messageBody: Record<string, unknown>;

  if (whatsappReq.template_name) {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "template",
      template: {
        name: whatsappReq.template_name,
        language: { code: "pt_BR" },
        components: whatsappReq.template_params
          ? [
              {
                type: "body",
                parameters: whatsappReq.template_params.map((p) => ({
                  type: "text",
                  text: p,
                })),
              },
            ]
          : [],
      },
    };
  } else if (whatsappReq.media_url) {
    const mediaType = whatsappReq.media_type || "image";
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: mediaType,
      [mediaType]: {
        link: whatsappReq.media_url,
        caption: whatsappReq.message,
      },
    };
  } else {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        preview_url: true,
        body: whatsappReq.message,
      },
    };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageBody),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp Business API error:", data);
    return new Response(
      JSON.stringify({ error: `WhatsApp API error: ${data.error?.message || response.status}` }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, provider: "whatsapp_business", message_id: data.messages?.[0]?.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
