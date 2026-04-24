// WhatsApp Message Sender via Evolution API or WhatsApp Business API
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsAppButton {
  id?: string;        // optional reply id (defaults to text)
  text: string;       // visible button label
}

interface WhatsAppListRow {
  title: string;
  description?: string;
  rowId?: string;
}

interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

interface WhatsAppRequest {
  organization_id: string;
  instance_id?: string; // Optional: specify which instance to use
  to: string;
  message: string;
  // ── kind drives which Evolution endpoint we call ──
  // Defaults to "text" (or "media" if media_url present) for full backward compatibility.
  message_kind?:
    | "text"
    | "media"
    | "buttons"
    | "list"
    | "presence"
    | "audio_ptt"
    | "location"
    | "contact"
    | "poll"
    | "reaction"
    | "sticker";
  // Buttons (interactive reply buttons, max 3)
  buttons?: WhatsAppButton[];
  buttons_footer?: string;
  // List message
  list_button_text?: string; // ex: "Ver opções"
  list_sections?: WhatsAppListSection[];
  list_footer?: string;
  list_title?: string;
  // Presence (typing indicator)
  presence_state?: "composing" | "recording" | "paused";
  presence_delay_ms?: number; // how long to keep state on
  // Media (image/video/audio/document)
  media_url?: string;
  media_type?: "image" | "video" | "audio" | "document";
  media_filename?: string; // for documents
  media_caption?: string;  // optional caption override
  // Audio PTT (voice note) — sent via /message/sendWhatsAppAudio
  audio_url?: string;
  // Location
  latitude?: number;
  longitude?: number;
  location_name?: string;
  location_address?: string;
  // Contact / vCard
  contact_full_name?: string;
  contact_phone?: string;
  contact_organization?: string;
  contact_email?: string;
  // Templates (Cloud API)
  template_name?: string;
  template_params?: string[];
  quoted_message_external_id?: string; // External WhatsApp message ID to quote/reply to
  // Phase 3 — Poll
  poll_name?: string;          // question
  poll_values?: string[];      // up to 12 options
  poll_selectable_count?: number; // 1 = single, >1 = multi
  // Phase 3 — Reaction
  reaction_emoji?: string;     // single emoji (or "" to remove)
  reaction_external_id?: string; // external message id to react to
  reaction_from_me?: boolean;  // whether the original message was sent by us
  reaction_remote_jid?: string; // override remoteJid (defaults to "to")
  // Phase 3 — Sticker
  sticker_url?: string;        // public webp URL
  // Phase 3 — Mentions (works only when "to" is a group JID)
  mentions?: string[];         // list of phone numbers in international format (no "+")
  mentions_everyone?: boolean; // mention all group participants
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

    // Format phone number — ensure country code (default Brazil +55)
    let phoneNumber = whatsappReq.to.replace(/\D/g, "");
    if (phoneNumber.length >= 10 && phoneNumber.length <= 11 && !phoneNumber.startsWith("55")) {
      phoneNumber = "55" + phoneNumber;
    }

    // If instance_id is provided, use that specific instance
    if (whatsappReq.instance_id) {
      const { data: specificInt } = await supabase
        .from("organization_integrations")
        .select("config, integration_type")
        .eq("id", whatsappReq.instance_id)
        .eq("organization_id", whatsappReq.organization_id)
        .eq("is_active", true)
        .single();

      if (!specificInt) {
        return new Response(
          JSON.stringify({ error: "Specified instance not found or inactive" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (specificInt.integration_type === "evolution_api") {
        const { data: globalConfig } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "evolution_api")
          .single();

        const globalEvo = globalConfig?.value as Record<string, string> | null;
        const orgConfig = specificInt.config as Record<string, string>;
        const mergedConfig: Record<string, string> = {
          api_url: globalEvo?.api_url || orgConfig.api_url || "",
          api_key: globalEvo?.api_key || orgConfig.api_key || "",
          instance_name: (orgConfig.instance_name || "").trim(),
        };
        return await sendWithEvolutionAPI(mergedConfig, phoneNumber, whatsappReq);
      } else {
        return await sendWithBusinessAPI(specificInt.config as Record<string, string>, phoneNumber, whatsappReq);
      }
    }

    // Try Evolution API first — use default or first active instance
    const { data: evolutionInt } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", whatsappReq.organization_id)
      .eq("integration_type", "evolution_api")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
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
      .order("created_at", { ascending: true })
      .limit(1)
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

  // Auto-configure webhook on Evolution API instance
  try {
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook`;
    const primaryInstance = instanceCandidates[0];
    const webhookResponse = await fetch(`${baseUrl}/webhook/set/${encodeURIComponent(primaryInstance)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          webhookBase64: false,
          events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "GROUP_PARTICIPANTS_UPDATE", "CONNECTION_UPDATE"],
        },
      }),
    });
    if (webhookResponse.ok) {
      console.log(`Webhook auto-configured for instance: ${primaryInstance}`);
    } else {
      const webhookErr = await webhookResponse.text();
      console.log(`Webhook config attempt (non-blocking): ${webhookResponse.status} - ${webhookErr}`);
    }
  } catch (e) {
    console.log("Webhook auto-config failed (non-blocking):", e);
  }

  // (legacy sendWithInstanceFallback removed — replaced by `dispatch` below)

  // Generic dispatcher (works for sendText, sendMedia, sendButtons, sendList, sendPresence)
  const dispatch = async (endpoint: string, payload: Record<string, unknown>) => {
    let lastError: { status: number; data: any; instance: string } | null = null;
    for (const candidate of instanceCandidates) {
      const response = await fetch(`${baseUrl}/${endpoint}/${encodeURIComponent(candidate)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return { ok: true as const, data, instance: candidate };
      lastError = { status: response.status, data, instance: candidate };
      const message = data?.response?.message?.[0] || data?.message || "";
      const isInstanceNotFound = response.status === 404 && /instance does not exist/i.test(String(message));
      if (!isInstanceNotFound) break;
    }
    return { ok: false as const, ...(lastError || { status: 500, data: { message: "Unknown Evolution API error" }, instance: configuredInstanceName }) };
  };

  const okResponse = (data: unknown, instance: string) =>
    new Response(
      JSON.stringify({ success: true, provider: "evolution_api", data, instance_used: instance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  const errResponse = (status: number, data: any) =>
    new Response(
      JSON.stringify({ error: `Evolution API error: ${data?.message || status}` }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  const kind = whatsappReq.message_kind ?? (whatsappReq.media_url ? "media" : "text");

  // ── Presence (typing/recording indicator) ──
  if (kind === "presence") {
    const presence = whatsappReq.presence_state || "composing";
    const delay = Math.min(Math.max(whatsappReq.presence_delay_ms ?? 2000, 200), 20000);
    const result = await dispatch("chat/sendPresence", {
      number: phoneNumber,
      presence,
      delay,
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── Buttons (interactive reply buttons) ──
  if (kind === "buttons") {
    const buttons = (whatsappReq.buttons || []).slice(0, 3).map((b, i) => ({
      buttonId: b.id || `btn_${i + 1}`,
      buttonText: { displayText: b.text },
      type: 1,
    }));
    if (buttons.length === 0) {
      return new Response(
        JSON.stringify({ error: "No buttons provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const result = await dispatch("message/sendButtons", {
      number: phoneNumber,
      title: "",
      description: whatsappReq.message,
      footer: whatsappReq.buttons_footer || "",
      buttons,
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── List (interactive list / menu) ──
  if (kind === "list") {
    const sections = (whatsappReq.list_sections || []).map(sec => ({
      title: sec.title,
      rows: (sec.rows || []).slice(0, 10).map((r, idx) => ({
        title: r.title,
        description: r.description || "",
        rowId: r.rowId || `row_${idx + 1}`,
      })),
    }));
    if (sections.length === 0 || sections.every(s => s.rows.length === 0)) {
      return new Response(
        JSON.stringify({ error: "No list rows provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const result = await dispatch("message/sendList", {
      number: phoneNumber,
      title: whatsappReq.list_title || "",
      description: whatsappReq.message,
      buttonText: whatsappReq.list_button_text || "Ver opções",
      footerText: whatsappReq.list_footer || "",
      sections,
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── Audio PTT (voice note via sendWhatsAppAudio) ──
  if (kind === "audio_ptt") {
    const audioUrl = whatsappReq.audio_url || whatsappReq.media_url;
    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: "audio_url is required for audio_ptt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const result = await dispatch("message/sendWhatsAppAudio", {
      number: phoneNumber,
      audio: audioUrl,
      encoding: true,
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── Location ──
  if (kind === "location") {
    if (whatsappReq.latitude == null || whatsappReq.longitude == null) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required for location" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const result = await dispatch("message/sendLocation", {
      number: phoneNumber,
      latitude: Number(whatsappReq.latitude),
      longitude: Number(whatsappReq.longitude),
      name: whatsappReq.location_name || "",
      address: whatsappReq.location_address || "",
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── Contact (vCard) ──
  if (kind === "contact") {
    const fullName = whatsappReq.contact_full_name || "";
    const cPhone = (whatsappReq.contact_phone || "").replace(/\D/g, "");
    if (!fullName || !cPhone) {
      return new Response(
        JSON.stringify({ error: "contact_full_name and contact_phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const result = await dispatch("message/sendContact", {
      number: phoneNumber,
      contact: [
        {
          fullName,
          wuid: cPhone,
          phoneNumber: cPhone,
          ...(whatsappReq.contact_organization ? { organization: whatsappReq.contact_organization } : {}),
          ...(whatsappReq.contact_email ? { email: whatsappReq.contact_email } : {}),
        },
      ],
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── Poll (enquete) ──
  if (kind === "poll") {
    const name = (whatsappReq.poll_name || whatsappReq.message || "").trim();
    const values = (whatsappReq.poll_values || []).map(v => String(v).trim()).filter(Boolean).slice(0, 12);
    if (!name || values.length < 2) {
      return new Response(
        JSON.stringify({ error: "poll_name and at least 2 poll_values are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const selectableCount = Math.max(1, Math.min(Number(whatsappReq.poll_selectable_count ?? 1), values.length));
    const result = await dispatch("message/sendPoll", {
      number: phoneNumber,
      name,
      selectableCount,
      values,
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── Reaction (reage a uma mensagem específica) ──
  if (kind === "reaction") {
    const emoji = whatsappReq.reaction_emoji ?? "";
    const targetId = whatsappReq.reaction_external_id;
    if (!targetId) {
      return new Response(
        JSON.stringify({ error: "reaction_external_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const remoteJid =
      whatsappReq.reaction_remote_jid ||
      (phoneNumber.includes("@") ? phoneNumber : `${phoneNumber}@s.whatsapp.net`);
    const result = await dispatch("message/sendReaction", {
      key: {
        remoteJid,
        fromMe: !!whatsappReq.reaction_from_me,
        id: targetId,
      },
      reaction: emoji,
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── Sticker (figurinha webp) ──
  if (kind === "sticker") {
    const stickerUrl = whatsappReq.sticker_url || whatsappReq.media_url;
    if (!stickerUrl) {
      return new Response(
        JSON.stringify({ error: "sticker_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const result = await dispatch("message/sendSticker", {
      number: phoneNumber,
      sticker: stickerUrl,
    });
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // Helper to build mentions array (only useful in groups)
  const isGroupTarget = phoneNumber.includes("@g.us") || (whatsappReq.to || "").includes("@g.us");
  const buildMentions = (): { mentioned?: string[]; mentionsEveryOne?: boolean } => {
    const out: { mentioned?: string[]; mentionsEveryOne?: boolean } = {};
    if (!isGroupTarget) return out;
    if (whatsappReq.mentions_everyone) out.mentionsEveryOne = true;
    if (whatsappReq.mentions?.length) {
      out.mentioned = whatsappReq.mentions
        .map(m => String(m).replace(/\D/g, ""))
        .filter(Boolean);
    }
    return out;
  };

  // ── Text (default) ──
  if (kind === "text") {
    const textPayload: Record<string, unknown> = {
      number: phoneNumber,
      text: whatsappReq.message,
      ...buildMentions(),
    };
    if (whatsappReq.quoted_message_external_id) {
      textPayload.quoted = { key: { id: whatsappReq.quoted_message_external_id } };
    }
    const result = await dispatch("message/sendText", textPayload);
    if (!result.ok) return errResponse(result.status, result.data);
    return okResponse(result.data, result.instance);
  }

  // ── Media (image/video/audio/document via sendMedia) ──
  const mediaPayload: Record<string, unknown> = {
    number: phoneNumber,
    mediatype: whatsappReq.media_type || "image",
    media: whatsappReq.media_url,
    caption: whatsappReq.media_caption ?? whatsappReq.message ?? "",
    ...buildMentions(),
  };
  if (whatsappReq.media_type === "document" && whatsappReq.media_filename) {
    mediaPayload.fileName = whatsappReq.media_filename;
  }
  const result = await dispatch("message/sendMedia", mediaPayload);
  if (!result.ok) return errResponse(result.status, result.data);
  return okResponse(result.data, result.instance);
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
  const businessKind = whatsappReq.message_kind ?? (whatsappReq.template_name ? "text" : (whatsappReq.media_url ? "media" : "text"));

  if (businessKind === "buttons" && whatsappReq.buttons?.length) {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: whatsappReq.message },
        ...(whatsappReq.buttons_footer ? { footer: { text: whatsappReq.buttons_footer } } : {}),
        action: {
          buttons: whatsappReq.buttons.slice(0, 3).map((b, i) => ({
            type: "reply",
            reply: { id: b.id || `btn_${i + 1}`, title: b.text.slice(0, 20) },
          })),
        },
      },
    };
  } else if (businessKind === "list" && whatsappReq.list_sections?.length) {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "interactive",
      interactive: {
        type: "list",
        ...(whatsappReq.list_title ? { header: { type: "text", text: whatsappReq.list_title } } : {}),
        body: { text: whatsappReq.message },
        ...(whatsappReq.list_footer ? { footer: { text: whatsappReq.list_footer } } : {}),
        action: {
          button: (whatsappReq.list_button_text || "Ver opções").slice(0, 20),
          sections: whatsappReq.list_sections.map(sec => ({
            title: sec.title.slice(0, 24),
            rows: sec.rows.slice(0, 10).map((r, idx) => ({
              id: r.rowId || `row_${idx + 1}`,
              title: r.title.slice(0, 24),
              ...(r.description ? { description: r.description.slice(0, 72) } : {}),
            })),
          })),
        },
      },
    };
  } else if (businessKind === "presence") {
    // Cloud API doesn't support arbitrary presence — silently no-op success
    return new Response(
      JSON.stringify({ success: true, provider: "whatsapp_business", skipped: "presence_not_supported_on_cloud_api" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } else if (businessKind === "audio_ptt") {
    const audioUrl = whatsappReq.audio_url || whatsappReq.media_url;
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "audio",
      audio: { link: audioUrl },
    };
  } else if (businessKind === "location") {
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "location",
      location: {
        latitude: Number(whatsappReq.latitude),
        longitude: Number(whatsappReq.longitude),
        ...(whatsappReq.location_name ? { name: whatsappReq.location_name } : {}),
        ...(whatsappReq.location_address ? { address: whatsappReq.location_address } : {}),
      },
    };
  } else if (businessKind === "contact") {
    const cPhone = (whatsappReq.contact_phone || "").replace(/\D/g, "");
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "contacts",
      contacts: [
        {
          name: { formatted_name: whatsappReq.contact_full_name, first_name: whatsappReq.contact_full_name },
          phones: [{ phone: cPhone, type: "CELL", wa_id: cPhone }],
          ...(whatsappReq.contact_organization
            ? { org: { company: whatsappReq.contact_organization } }
            : {}),
          ...(whatsappReq.contact_email ? { emails: [{ email: whatsappReq.contact_email, type: "WORK" }] } : {}),
        },
      ],
    };
  } else if (businessKind === "reaction") {
    if (!whatsappReq.reaction_external_id) {
      return new Response(
        JSON.stringify({ error: "reaction_external_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "reaction",
      reaction: {
        message_id: whatsappReq.reaction_external_id,
        emoji: whatsappReq.reaction_emoji ?? "",
      },
    };
  } else if (businessKind === "sticker") {
    const stickerUrl = whatsappReq.sticker_url || whatsappReq.media_url;
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "sticker",
      sticker: { link: stickerUrl },
    };
  } else if (businessKind === "poll") {
    // Cloud API doesn't expose poll send — gracefully skip
    return new Response(
      JSON.stringify({ success: true, provider: "whatsapp_business", skipped: "poll_not_supported_on_cloud_api" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } else if (whatsappReq.template_name) {
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
    const mediaObj: Record<string, unknown> = {
      link: whatsappReq.media_url,
    };
    if (mediaType !== "audio") {
      mediaObj.caption = whatsappReq.media_caption ?? whatsappReq.message ?? "";
    }
    if (mediaType === "document" && whatsappReq.media_filename) {
      mediaObj.filename = whatsappReq.media_filename;
    }
    messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: mediaType,
      [mediaType]: mediaObj,
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
