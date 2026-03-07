import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TemplateRequest {
  organization_id: string;
  action: "create" | "sync" | "delete" | "status";
  template_id?: string; // local DB template ID
  waba_id?: string;
  access_token?: string;
  // For sync filters
  filters?: { name?: string; category?: string; language?: string; status?: string };
}

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

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
      return json({ success: false, error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = (await req.json()) as TemplateRequest;
    if (!body.organization_id) {
      return json({ success: false, error: "organization_id é obrigatório" });
    }

    // Validate org membership
    const { data: isMember } = await supabase.rpc("is_org_member", {
      _org_id: body.organization_id,
      _user_id: user.id,
    });
    if (!isMember) {
      return json({ success: false, error: "Sem permissão" }, 403);
    }

    // Get WhatsApp Business credentials from organization_integrations
    const credentials = await getWabaCredentials(supabase, body.organization_id, body.waba_id, body.access_token);
    if (!credentials.waba_id || !credentials.access_token) {
      return json({
        success: false,
        error: "Credenciais da API Oficial (WABA ID e Access Token) não encontradas. Configure na página de Canais.",
      });
    }

    const { waba_id, access_token } = credentials;

    switch (body.action) {
      case "create":
        return await createTemplate(supabase, body, waba_id, access_token);
      case "sync":
        return await syncTemplates(supabase, body, waba_id, access_token);
      case "delete":
        return await deleteTemplate(supabase, body, waba_id, access_token);
      case "status":
        return await getTemplateStatus(supabase, body, waba_id, access_token);
      default:
        return json({ success: false, error: "Ação inválida" });
    }
  } catch (error) {
    console.error("whatsapp-templates error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});

async function getWabaCredentials(
  supabase: any,
  orgId: string,
  overrideWabaId?: string,
  overrideToken?: string
) {
  if (overrideWabaId && overrideToken) {
    return { waba_id: overrideWabaId, access_token: overrideToken };
  }

  // Look for whatsapp_business integration
  const { data: integrations } = await supabase
    .from("organization_integrations")
    .select("config")
    .eq("organization_id", orgId)
    .eq("integration_type", "whatsapp_business")
    .eq("is_active", true)
    .limit(1);

  if (integrations?.length) {
    const config = integrations[0].config as Record<string, string>;
    return {
      waba_id: config?.waba_id || config?.whatsapp_business_account_id || "",
      access_token: config?.access_token || config?.permanent_token || "",
    };
  }

  return { waba_id: "", access_token: "" };
}

async function createTemplate(
  supabase: any,
  body: TemplateRequest,
  wabaId: string,
  accessToken: string
) {
  if (!body.template_id) {
    return json({ success: false, error: "template_id é obrigatório" });
  }

  // Get template from DB
  const { data: template, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .eq("id", body.template_id)
    .single();

  if (error || !template) {
    return json({ success: false, error: "Template não encontrado" });
  }

  // Build Meta API payload
  const components: any[] = [];

  // Header
  if (template.header_type && template.header_type !== "none") {
    if (template.header_type === "text") {
      components.push({ type: "HEADER", format: "TEXT", text: template.header_content || "" });
    } else {
      components.push({ type: "HEADER", format: template.header_type.toUpperCase() });
    }
  }

  // Body
  const bodyComponent: any = { type: "BODY", text: template.content || "" };
  const variables = (template.variables || []) as Array<{ key: string; example: string }>;
  if (variables.length > 0) {
    bodyComponent.example = {
      body_text: [variables.map((v: any) => v.example || "exemplo")],
    };
  }
  components.push(bodyComponent);

  // Footer
  if (template.footer_text) {
    components.push({ type: "FOOTER", text: template.footer_text });
  }

  // Buttons
  const buttons = (template.buttons || []) as Array<{ type: string; text: string; url?: string; phone?: string }>;
  if (buttons.length > 0) {
    const btnComponents = buttons.map((btn: any) => {
      if (btn.type === "url") {
        return { type: "URL", text: btn.text, url: btn.url };
      } else if (btn.type === "phone") {
        return { type: "PHONE_NUMBER", text: btn.text, phone_number: btn.phone };
      }
      return { type: "QUICK_REPLY", text: btn.text };
    });
    components.push({ type: "BUTTONS", buttons: btnComponents });
  }

  const metaPayload = {
    name: template.name,
    language: template.language || "pt_BR",
    category: (template.category || "MARKETING").toUpperCase(),
    components,
  };

  // Submit to Meta
  const res = await fetch(`${META_GRAPH_URL}/${wabaId}/message_templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metaPayload),
  });

  const result = await res.json();

  if (!res.ok) {
    const errorMsg = result?.error?.message || `Erro Meta API: ${res.status}`;
    await supabase
      .from("whatsapp_templates")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", body.template_id);
    return json({ success: false, error: errorMsg, details: result });
  }

  // Update local template with Meta ID and status
  await supabase
    .from("whatsapp_templates")
    .update({
      external_template_id: result.id,
      status: result.status?.toLowerCase() || "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.template_id);

  return json({
    success: true,
    message: "Template enviado para aprovação da Meta!",
    meta_id: result.id,
    status: result.status,
  });
}

async function syncTemplates(
  supabase: any,
  body: TemplateRequest,
  wabaId: string,
  accessToken: string
) {
  // Fetch templates from Meta
  let url = `${META_GRAPH_URL}/${wabaId}/message_templates?limit=100`;
  const filters = body.filters || {};
  if (filters.name) url += `&name=${encodeURIComponent(filters.name)}`;
  if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
  if (filters.status) url += `&status=${encodeURIComponent(filters.status)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const result = await res.json();
  if (!res.ok) {
    return json({
      success: false,
      error: result?.error?.message || `Erro Meta API: ${res.status}`,
    });
  }

  const metaTemplates = result.data || [];
  let synced = 0;
  let created = 0;

  for (const mt of metaTemplates) {
    // Filter by language if specified
    if (filters.language && mt.language !== filters.language) continue;

    // Check if template exists locally
    const { data: existing } = await supabase
      .from("whatsapp_templates")
      .select("id")
      .eq("organization_id", body.organization_id)
      .eq("external_template_id", mt.id)
      .limit(1);

    const bodyComponent = mt.components?.find((c: any) => c.type === "BODY");
    const headerComponent = mt.components?.find((c: any) => c.type === "HEADER");
    const footerComponent = mt.components?.find((c: any) => c.type === "FOOTER");
    const buttonsComponent = mt.components?.find((c: any) => c.type === "BUTTONS");

    const templateData: Record<string, unknown> = {
      name: mt.name,
      language: mt.language,
      category: mt.category,
      status: mt.status?.toLowerCase() || "pending",
      content: bodyComponent?.text || "",
      header_type: headerComponent ? headerComponent.format?.toLowerCase() || "text" : null,
      header_content: headerComponent?.text || null,
      footer_text: footerComponent?.text || null,
      buttons: buttonsComponent?.buttons?.map((b: any) => ({
        type: b.type === "URL" ? "url" : b.type === "PHONE_NUMBER" ? "phone" : "quick_reply",
        text: b.text || "",
        url: b.url || undefined,
        phone: b.phone_number || undefined,
      })) || [],
      external_template_id: mt.id,
      updated_at: new Date().toISOString(),
    };

    if (existing?.length) {
      // Update existing
      await supabase
        .from("whatsapp_templates")
        .update(templateData)
        .eq("id", existing[0].id);
      synced++;
    } else {
      // Create new
      await supabase.from("whatsapp_templates").insert({
        ...templateData,
        organization_id: body.organization_id,
      });
      created++;
    }
  }

  return json({
    success: true,
    message: `Sincronização concluída! ${created} novos, ${synced} atualizados.`,
    total: metaTemplates.length,
    created,
    synced,
  });
}

async function deleteTemplate(
  supabase: any,
  body: TemplateRequest,
  wabaId: string,
  accessToken: string
) {
  if (!body.template_id) {
    return json({ success: false, error: "template_id é obrigatório" });
  }

  const { data: template } = await supabase
    .from("whatsapp_templates")
    .select("name, external_template_id")
    .eq("id", body.template_id)
    .single();

  if (!template) {
    return json({ success: false, error: "Template não encontrado" });
  }

  // Delete from Meta if it has an external ID
  if (template.external_template_id || template.name) {
    const deleteUrl = `${META_GRAPH_URL}/${wabaId}/message_templates?name=${encodeURIComponent(template.name)}`;
    const res = await fetch(deleteUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const result = await res.json();
      console.error("Meta delete error:", result);
      // Continue with local delete even if Meta fails
    }
  }

  // Delete locally
  await supabase.from("whatsapp_templates").delete().eq("id", body.template_id);

  return json({ success: true, message: "Template removido!" });
}

async function getTemplateStatus(
  supabase: any,
  body: TemplateRequest,
  wabaId: string,
  accessToken: string
) {
  if (!body.template_id) {
    return json({ success: false, error: "template_id é obrigatório" });
  }

  const { data: template } = await supabase
    .from("whatsapp_templates")
    .select("name, external_template_id")
    .eq("id", body.template_id)
    .single();

  if (!template?.name) {
    return json({ success: false, error: "Template não encontrado" });
  }

  const res = await fetch(
    `${META_GRAPH_URL}/${wabaId}/message_templates?name=${encodeURIComponent(template.name)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const result = await res.json();
  if (!res.ok) {
    return json({ success: false, error: result?.error?.message || "Erro ao consultar status" });
  }

  const metaTemplate = result.data?.[0];
  if (!metaTemplate) {
    return json({ success: false, error: "Template não encontrado na Meta" });
  }

  // Update local status
  const newStatus = metaTemplate.status?.toLowerCase() || "pending";
  await supabase
    .from("whatsapp_templates")
    .update({
      status: newStatus,
      external_template_id: metaTemplate.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.template_id);

  return json({
    success: true,
    status: newStatus,
    rejected_reason: metaTemplate.rejected_reason || null,
    quality_score: metaTemplate.quality_score || null,
  });
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
