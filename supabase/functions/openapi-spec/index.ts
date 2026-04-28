// Public OpenAPI 3.1 spec for Agsell Public API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const PROJECT_REF = Deno.env.get("SUPABASE_URL")?.replace("https://", "").split(".")[0] ?? "";
const SERVER_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/public-api/v1`;

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Agsell Public API",
    version: "1.1.0",
    description:
      "REST API oficial do Agsell. Autenticação via header `X-API-Key`. Rate limit: 60 req/min, paginação via cursor.",
    contact: { name: "Agsell Support", url: "https://site.agsell.com.br/support" },
  },
  servers: [{ url: SERVER_URL, description: "Production" }],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" },
    },
    schemas: {
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer" }, limit: { type: "integer" },
          has_more: { type: "boolean" }, next_cursor: { type: "string", nullable: true },
        },
      },
      Contact: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          first_name: { type: "string" }, last_name: { type: "string" },
          email: { type: "string", format: "email" }, phone: { type: "string" },
          whatsapp: { type: "string" }, position: { type: "string" },
          source: { type: "string" }, status: { type: "string" },
          notes: { type: "string" }, lead_score: { type: "number" },
          created_at: { type: "string", format: "date-time" },
        },
        required: ["first_name"],
      },
      Company: {
        type: "object",
        properties: {
          id: { type: "string" }, name: { type: "string" }, domain: { type: "string" },
          industry: { type: "string" }, size: { type: "string" }, phone: { type: "string" },
          email: { type: "string" }, city: { type: "string" }, country: { type: "string" },
        },
        required: ["name"],
      },
      Deal: {
        type: "object",
        properties: {
          id: { type: "string" }, title: { type: "string" }, value: { type: "number" },
          probability: { type: "number" }, currency: { type: "string", default: "BRL" },
          status: { type: "string" }, contact_id: { type: "string" },
          company_id: { type: "string" }, stage_id: { type: "string" },
          expected_close_date: { type: "string", format: "date" },
        },
        required: ["title"],
      },
      Tag: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, color: { type: "string" } }, required: ["name"] },
      MessageRequest: {
        type: "object",
        properties: {
          channel: { type: "string", enum: ["whatsapp", "email", "sms"] },
          to: { type: "string", description: "Telefone (com DDI) ou email" },
          message: { type: "string" },
          subject: { type: "string", description: "Apenas para email" },
          html: { type: "string", description: "Apenas para email (opcional)" },
          instance_id: { type: "string", description: "Apenas para whatsapp (opcional)" },
          media_url: { type: "string", description: "URL de mídia (opcional)" },
        },
        required: ["channel", "to"],
      },
      Webhook: {
        type: "object",
        properties: {
          id: { type: "string" }, name: { type: "string" }, url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" }, example: ["contact.created", "deal.won"] },
          is_active: { type: "boolean" }, secret: { type: "string" },
        },
        required: ["url", "events"],
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" }, code: { type: "string" } },
      },
    },
    responses: {
      Unauthorized: { description: "API key inválida", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      RateLimited: { description: "Rate limit excedido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
    },
    parameters: {
      Limit: { name: "limit", in: "query", schema: { type: "integer", default: 50, minimum: 1, maximum: 100 } },
      Cursor: { name: "cursor", in: "query", schema: { type: "string" }, description: "ISO timestamp para paginação" },
      ResourceId: { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
    },
  },
  paths: {
    "/contacts": {
      get: { tags: ["Contacts"], summary: "Listar contatos", parameters: [{ $ref: "#/components/parameters/Limit" }, { $ref: "#/components/parameters/Cursor" }], responses: { "200": { description: "OK" } } },
      post: { tags: ["Contacts"], summary: "Criar contato", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Contact" } } } }, responses: { "200": { description: "Created" } } },
    },
    "/contacts/{id}": {
      get: { tags: ["Contacts"], summary: "Buscar contato", parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } },
      patch: { tags: ["Contacts"], summary: "Atualizar contato", parameters: [{ $ref: "#/components/parameters/ResourceId" }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Contact" } } } }, responses: { "200": { description: "OK" } } },
      delete: { tags: ["Contacts"], summary: "Remover contato", parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } },
    },
    "/companies": { get: { tags: ["Companies"], summary: "Listar empresas", responses: { "200": { description: "OK" } } }, post: { tags: ["Companies"], summary: "Criar empresa", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } }, responses: { "200": { description: "OK" } } } },
    "/companies/{id}": { get: { tags: ["Companies"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } }, patch: { tags: ["Companies"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } }, delete: { tags: ["Companies"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } } },
    "/deals": { get: { tags: ["Deals"], summary: "Listar negócios", responses: { "200": { description: "OK" } } }, post: { tags: ["Deals"], summary: "Criar negócio", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Deal" } } } }, responses: { "200": { description: "OK" } } } },
    "/deals/{id}": { get: { tags: ["Deals"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } }, patch: { tags: ["Deals"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } }, delete: { tags: ["Deals"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } } },
    "/tags": { get: { tags: ["Tags"], responses: { "200": { description: "OK" } } }, post: { tags: ["Tags"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Tag" } } } }, responses: { "200": { description: "OK" } } } },
    "/messages": {
      post: {
        tags: ["Messages"], summary: "Enviar mensagem (WhatsApp / Email / SMS)",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MessageRequest" } } } },
        responses: { "200": { description: "Mensagem enfileirada" } },
      },
    },
    "/automations": { get: { tags: ["Automations"], summary: "Listar automações", responses: { "200": { description: "OK" } } } },
    "/automations/{id}/trigger": {
      post: {
        tags: ["Automations"], summary: "Disparar automação",
        parameters: [{ $ref: "#/components/parameters/ResourceId" }],
        requestBody: { content: { "application/json": { schema: { type: "object", description: "Dados arbitrários para o trigger" } } } },
        responses: { "200": { description: "Disparada" } },
      },
    },
    "/conversations": { get: { tags: ["Inbox"], summary: "Listar conversas", responses: { "200": { description: "OK" } } } },
    "/conversations/{id}": { get: { tags: ["Inbox"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } } },
    "/forms": { get: { tags: ["Forms"], responses: { "200": { description: "OK" } } } },
    "/forms/{id}/submissions": { get: { tags: ["Forms"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } } },
    "/forms/{id}/submit": { post: { tags: ["Forms"], summary: "Submissão pública (sem auth)", security: [], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } } },
    "/webhooks": {
      get: { tags: ["Webhooks"], summary: "Listar assinaturas", responses: { "200": { description: "OK" } } },
      post: { tags: ["Webhooks"], summary: "Criar assinatura", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Webhook" } } } }, responses: { "200": { description: "OK" } } },
    },
    "/webhooks/{id}": { delete: { tags: ["Webhooks"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } } },
    "/metrics/{type}": {
      get: {
        tags: ["Metrics"], summary: "Métricas (overview|email|leads|pipeline|automations|forms)",
        parameters: [{ name: "type", in: "path", required: true, schema: { type: "string" } }, { name: "period", in: "query", schema: { type: "string", enum: ["today", "7d", "30d", "90d"], default: "30d" } }],
        responses: { "200": { description: "OK" } },
      },
    },
  },
  tags: [
    { name: "Contacts", description: "Gestão de contatos do CRM" },
    { name: "Companies", description: "Empresas/organizações" },
    { name: "Deals", description: "Negócios e pipeline" },
    { name: "Tags", description: "Etiquetas para segmentação" },
    { name: "Messages", description: "Envio de mensagens omnichannel" },
    { name: "Automations", description: "Disparo de automações" },
    { name: "Inbox", description: "Conversas do inbox unificado" },
    { name: "Forms", description: "Formulários e submissões" },
    { name: "Webhooks", description: "Assinaturas de eventos" },
    { name: "Metrics", description: "Estatísticas e relatórios" },
  ],
};

// Build Postman Collection v2.1.0 from the OpenAPI spec
function buildPostmanCollection() {
  const tagFolders: Record<string, any> = {};
  for (const tag of spec.tags) {
    tagFolders[tag.name] = { name: tag.name, description: tag.description, item: [] };
  }

  const sampleBody = (schemaRef: string | undefined): string | undefined => {
    if (!schemaRef) return undefined;
    const name = schemaRef.split("/").pop() || "";
    const samples: Record<string, any> = {
      Contact: { first_name: "João", last_name: "Silva", email: "joao@example.com", phone: "+5511999999999" },
      Company: { name: "Acme Corp", domain: "acme.com", industry: "SaaS" },
      Deal: { title: "Proposta Q1", value: 5000, currency: "BRL", contact_id: "{{contact_id}}" },
      Tag: { name: "Lead Quente", color: "#ef4444" },
      MessageRequest: { channel: "whatsapp", to: "+5511999999999", message: "Olá! Mensagem via API." },
      Webhook: { name: "Meu Webhook", url: "https://meusite.com/webhook", events: ["contact.created", "deal.won"] },
    };
    return samples[name] ? JSON.stringify(samples[name], null, 2) : undefined;
  };

  for (const [pathStr, methods] of Object.entries(spec.paths)) {
    for (const [method, opRaw] of Object.entries(methods as Record<string, any>)) {
      const op = opRaw as any;
      const tag = (op.tags && op.tags[0]) || "Default";
      if (!tagFolders[tag]) tagFolders[tag] = { name: tag, item: [] };

      const pmPath = pathStr.replace(/^\//, "").split("/").map((seg) =>
        seg.startsWith("{") && seg.endsWith("}") ? `:${seg.slice(1, -1)}` : seg
      );

      const queryParams = (op.parameters || [])
        .map((p: any) => {
          if (p.$ref) {
            const refName = p.$ref.split("/").pop();
            const resolved = (spec.components.parameters as any)[refName];
            return resolved;
          }
          return p;
        })
        .filter((p: any) => p && p.in === "query")
        .map((p: any) => ({ key: p.name, value: p.schema?.default?.toString() ?? "", disabled: true, description: p.description }));

      const variables = (op.parameters || [])
        .map((p: any) => p.$ref ? (spec.components.parameters as any)[p.$ref.split("/").pop()] : p)
        .filter((p: any) => p && p.in === "path")
        .map((p: any) => ({ key: p.name, value: "", description: p.description || "" }));

      const bodySchemaRef = op.requestBody?.content?.["application/json"]?.schema?.$ref;
      const rawBody = sampleBody(bodySchemaRef);

      const isPublic = Array.isArray(op.security) && op.security.length === 0;
      const headers = [
        { key: "Content-Type", value: "application/json" },
      ];
      if (!isPublic) headers.push({ key: "X-API-Key", value: "{{api_key}}" });

      tagFolders[tag].item.push({
        name: `${method.toUpperCase()} ${op.summary || pathStr}`,
        request: {
          method: method.toUpperCase(),
          header: headers,
          url: {
            raw: `{{base_url}}/${pmPath.join("/")}${queryParams.length ? "?" + queryParams.map((q: any) => `${q.key}=${q.value}`).join("&") : ""}`,
            host: ["{{base_url}}"],
            path: pmPath,
            query: queryParams.length ? queryParams : undefined,
            variable: variables.length ? variables : undefined,
          },
          ...(rawBody ? { body: { mode: "raw", raw: rawBody, options: { raw: { language: "json" } } } } : {}),
          description: op.summary,
        },
        response: [],
      });
    }
  }

  return {
    info: {
      _postman_id: crypto.randomUUID(),
      name: "Agsell Public API",
      description: "Coleção oficial Agsell — Importe e configure as variáveis `base_url` e `api_key` no Environment.\n\n**Base URL padrão:** " + SERVER_URL + "\n\n**Header de auth:** `X-API-Key`\n\n**Rate limit:** 60 req/min",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    auth: {
      type: "apikey",
      apikey: [
        { key: "key", value: "X-API-Key", type: "string" },
        { key: "value", value: "{{api_key}}", type: "string" },
        { key: "in", value: "header", type: "string" },
      ],
    },
    variable: [
      { key: "base_url", value: SERVER_URL, type: "string" },
      { key: "api_key", value: "ags_live_SUA_CHAVE_AQUI", type: "string" },
    ],
    item: Object.values(tagFolders),
  };
}

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  if (format === "postman") {
    const collection = buildPostmanCollection();
    return new Response(JSON.stringify(collection, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="agsell-public-api.postman_collection.json"',
      },
    });
  }

  return new Response(JSON.stringify(spec, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
