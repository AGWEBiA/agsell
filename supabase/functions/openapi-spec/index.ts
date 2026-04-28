// Public OpenAPI 3.1 spec for Agsell Public API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const PROJECT_REF = Deno.env.get("SUPABASE_URL")?.replace("https://", "").split(".")[0] ?? "";
const SERVER_URL_V1 = `https://${PROJECT_REF}.supabase.co/functions/v1/public-api/v1`;
const SERVER_URL_V11 = `https://${PROJECT_REF}.supabase.co/functions/v1/public-api/v1.1`;
const SERVER_URL = SERVER_URL_V1; // default base used by OpenAPI / Postman

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Agsell Public API",
    version: "1.1.0",
    description:
      "REST API oficial do Agsell.\n\n" +
      "**Autenticação:** header `X-API-Key`.\n" +
      "**Rate limit:** 60 req/min, paginação por cursor.\n\n" +
      "**Versões disponíveis:**\n" +
      "- `v1` — endpoints estáveis (envio simples, CRUD).\n" +
      "- `v1.1` — endpoints estendidos com tracking de entrega, status de mensagens, " +
      "webhooks assinados (HMAC SHA-256), test/rotate de webhooks e fan-out de eventos.\n",
    contact: { name: "Agsell Support", url: "https://site.agsell.com.br/support" },
  },
  servers: [
    { url: SERVER_URL_V1, description: "Production · v1" },
    { url: SERVER_URL_V11, description: "Production · v1.1 (recomendado para integrações nativas)" },
  ],
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
      MessageStatusUpdate: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "queued", "sent", "delivered", "read", "failed", "bounced"] },
          info: { type: "string", description: "Detalhe opcional (motivo de falha, código do provedor, etc.)" },
        },
        required: ["status"],
      },
      MessageSentV11: {
        type: "object",
        properties: {
          channel: { type: "string", enum: ["whatsapp", "email", "sms"] },
          to: { type: "string" },
          message_id: { type: "string", format: "uuid", description: "ID interno (use em /messages/:id/status)" },
          external_id: { type: "string", nullable: true, description: "ID retornado pelo provedor (ex: WhatsApp wamid)" },
          delivery_status: { type: "string", example: "sent" },
          tracking_url: { type: "string", format: "uri", nullable: true },
          sent_at: { type: "string", format: "date-time" },
        },
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
      get: {
        tags: ["Contacts"], summary: "Listar contatos",
        parameters: [{ $ref: "#/components/parameters/Limit" }, { $ref: "#/components/parameters/Cursor" }],
        responses: {
          "200": {
            description: "Lista paginada de contatos",
            content: { "application/json": { example: { data: [{ id: "550e8400-e29b-41d4-a716-446655440000", first_name: "João", last_name: "Silva", email: "joao@example.com", phone: "+5511999999999", created_at: "2026-04-28T10:00:00Z" }], pagination: { total: 142, limit: 50, has_more: true, next_cursor: "2026-04-27T10:00:00Z" } } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
      post: {
        tags: ["Contacts"], summary: "Criar contato",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Contact" }, example: { first_name: "Maria", last_name: "Souza", email: "maria@example.com", phone: "+5511988887777", source: "site" } } },
        },
        responses: {
          "201": { description: "Criado", content: { "application/json": { example: { id: "660e8400-e29b-41d4-a716-446655440001", first_name: "Maria", created_at: "2026-04-28T11:00:00Z" } } } },
          "400": { description: "Dados inválidos" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/contacts/{id}": {
      get: { tags: ["Contacts"], summary: "Buscar contato por ID", parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK", content: { "application/json": { example: { id: "550e...", first_name: "João" } } } }, "404": { description: "Não encontrado" } } },
      patch: { tags: ["Contacts"], summary: "Atualizar contato", parameters: [{ $ref: "#/components/parameters/ResourceId" }], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Contact" }, example: { phone: "+5511977776666", status: "qualified" } } } }, responses: { "200": { description: "Atualizado" } } },
      delete: { tags: ["Contacts"], summary: "Remover contato", parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "204": { description: "Removido" } } },
    },
    "/companies": {
      get: { tags: ["Companies"], summary: "Listar empresas", responses: { "200": { description: "OK", content: { "application/json": { example: { data: [{ id: "...", name: "Acme Corp", domain: "acme.com" }] } } } } } },
      post: { tags: ["Companies"], summary: "Criar empresa", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Company" }, example: { name: "Acme Corp", domain: "acme.com", industry: "SaaS" } } } }, responses: { "201": { description: "Criada" } } },
    },
    "/companies/{id}": {
      get: { tags: ["Companies"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } },
      patch: { tags: ["Companies"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } },
      delete: { tags: ["Companies"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "204": { description: "Removida" } } },
    },
    "/deals": {
      get: { tags: ["Deals"], summary: "Listar negócios", responses: { "200": { description: "OK", content: { "application/json": { example: { data: [{ id: "...", title: "Proposta Q1", value: 5000, status: "open" }] } } } } } },
      post: { tags: ["Deals"], summary: "Criar negócio", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Deal" }, example: { title: "Proposta Q1", value: 5000, currency: "BRL", contact_id: "550e..." } } } }, responses: { "201": { description: "Criado" } } },
    },
    "/deals/{id}": {
      get: { tags: ["Deals"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } },
      patch: { tags: ["Deals"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } },
      delete: { tags: ["Deals"], parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "204": { description: "Removido" } } },
    },
    "/tags": {
      get: { tags: ["Tags"], summary: "Listar tags", responses: { "200": { description: "OK", content: { "application/json": { example: { data: [{ id: "...", name: "Lead Quente", color: "#ef4444" }] } } } } } },
      post: { tags: ["Tags"], summary: "Criar tag", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Tag" }, example: { name: "Lead Quente", color: "#ef4444" } } } }, responses: { "201": { description: "Criada" } } },
    },
    "/messages": {
      post: {
        tags: ["Messages"], summary: "Enviar mensagem (WhatsApp / Email / SMS)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MessageRequest" },
              examples: {
                whatsapp: { summary: "WhatsApp", value: { channel: "whatsapp", to: "+5511999999999", message: "Olá! Mensagem via API." } },
                email: { summary: "Email", value: { channel: "email", to: "cliente@example.com", subject: "Boas-vindas", message: "Conteúdo em texto", html: "<p>Conteúdo HTML</p>" } },
                sms: { summary: "SMS", value: { channel: "sms", to: "+5511988887777", message: "Código: 1234" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Mensagem enviada (v1: resposta simples · v1.1: tracking completo)",
            content: { "application/json": {
              examples: {
                v1: { summary: "Resposta v1", value: { data: { channel: "whatsapp", to: "+5511999999999", sent: true } } },
                v11: { summary: "Resposta v1.1", value: { data: { channel: "whatsapp", to: "+5511999999999", message_id: "550e8400-e29b-41d4-a716-446655440000", external_id: "wamid.HBgMNTUx...", delivery_status: "sent", tracking_url: "https://.../v1.1/messages/550e.../status", sent_at: "2026-04-28T12:00:00Z" } } },
              },
              schema: { $ref: "#/components/schemas/MessageSentV11" },
            } },
          },
          "400": { description: "Validação falhou", content: { "application/json": { example: { error: "channel must be whatsapp|email|sms", code: "INVALID_CHANNEL" } } } },
        },
      },
    },
    "/automations": { get: { tags: ["Automations"], summary: "Listar automações", responses: { "200": { description: "OK", content: { "application/json": { example: { data: [{ id: "...", name: "Boas-vindas", is_active: true, executions_count: 142 }] } } } } } } },
    "/automations/{id}/trigger": {
      post: {
        tags: ["Automations"], summary: "Disparar automação manualmente",
        parameters: [{ $ref: "#/components/parameters/ResourceId" }],
        requestBody: { content: { "application/json": { example: { contact_id: "550e...", custom_data: { plano: "premium" } } } } },
        responses: { "200": { description: "Disparada", content: { "application/json": { example: { success: true, execution_id: "exec_xyz789" } } } } },
      },
    },
    "/conversations": { get: { tags: ["Inbox"], summary: "Listar conversas do inbox", responses: { "200": { description: "OK", content: { "application/json": { example: { data: [{ id: "...", channel: "whatsapp", contact_id: "...", status: "open", last_message_at: "2026-04-28T11:30:00Z" }] } } } } } } },
    "/conversations/{id}": { get: { tags: ["Inbox"], summary: "Buscar conversa com mensagens", parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } } },
    "/forms": { get: { tags: ["Forms"], summary: "Listar formulários", responses: { "200": { description: "OK" } } } },
    "/forms/{id}/submissions": { get: { tags: ["Forms"], summary: "Listar submissões", parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "200": { description: "OK" } } } },
    "/forms/{id}/submit": { post: { tags: ["Forms"], summary: "Submissão pública (sem auth)", security: [], parameters: [{ $ref: "#/components/parameters/ResourceId" }], requestBody: { content: { "application/json": { example: { name: "João", email: "joao@example.com", message: "Quero uma proposta" } } } }, responses: { "200": { description: "Recebido" } } } },
    "/webhooks": {
      get: { tags: ["Webhooks"], summary: "Listar assinaturas de webhook", responses: { "200": { description: "OK" } } },
      post: {
        tags: ["Webhooks"], summary: "Criar assinatura de webhook",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Webhook" }, example: { name: "Sync ERP", url: "https://meusite.com/webhook", events: ["contact.created", "deal.won", "message.received"] } } } },
        responses: { "201": { description: "Criada", content: { "application/json": { example: { id: "wh_abc123", secret: "whsec_xxxx", events: ["contact.created"] } } } } },
      },
    },
    "/webhooks/{id}": { delete: { tags: ["Webhooks"], summary: "Remover assinatura", parameters: [{ $ref: "#/components/parameters/ResourceId" }], responses: { "204": { description: "Removida" } } } },
    "/metrics/{type}": {
      get: {
        tags: ["Metrics"], summary: "Métricas (overview|email|leads|pipeline|automations|forms)",
        parameters: [{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["overview", "email", "leads", "pipeline", "automations", "forms"] } }, { name: "period", in: "query", schema: { type: "string", enum: ["today", "7d", "30d", "90d"], default: "30d" } }],
        responses: { "200": { description: "OK", content: { "application/json": { example: { period: "30d", contacts: 142, deals_won: 12, revenue: 45000 } } } } },
      },
    },

    // ================== v1.1 — Integrações Nativas ==================
    "/messages/{id}": {
      get: {
        tags: ["Messages v1.1"], summary: "[v1.1] Buscar mensagem por ID",
        description: "Retorna o registro completo da mensagem persistida no envio (apenas v1.1).",
        parameters: [{ $ref: "#/components/parameters/ResourceId" }],
        responses: {
          "200": { description: "OK", content: { "application/json": { example: { data: { id: "msg-uuid", conversation_id: "conv-uuid", content: "Olá!", message_type: "text", delivery_status: "delivered", external_id: "wamid.HBg...", created_at: "2026-04-28T12:00:00Z", sender_type: "agent" } } } } },
          "404": { description: "Mensagem não encontrada" },
        },
      },
    },
    "/messages/{id}/status": {
      get: {
        tags: ["Messages v1.1"], summary: "[v1.1] Status de entrega + timeline",
        description: "Retorna o status atual e a linha do tempo (`queued → sent → delivered → read` ou `failed`).",
        parameters: [{ $ref: "#/components/parameters/ResourceId" }],
        responses: {
          "200": { description: "Status atual", content: { "application/json": { example: {
            data: {
              message_id: "msg-uuid", external_id: "wamid.HBgM...", channel: "whatsapp",
              delivery_status: "delivered", created_at: "2026-04-28T12:00:00Z",
              timeline: [
                { status: "queued", at: "2026-04-28T12:00:00Z" },
                { status: "sent", at: "2026-04-28T12:00:01Z" },
                { status: "delivered", at: "2026-04-28T12:00:05Z" },
              ],
            },
          } } } },
        },
      },
      post: {
        tags: ["Messages v1.1"], summary: "[v1.1] Atualizar status (callback de provedor)",
        description: "Endpoint para integrações reportarem mudanças de status (delivered/read/failed/bounced).",
        parameters: [{ $ref: "#/components/parameters/ResourceId" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MessageStatusUpdate" }, example: { status: "delivered", info: "Entregue ao dispositivo" } } },
        },
        responses: {
          "200": { description: "Atualizado", content: { "application/json": { example: { data: { message_id: "msg-uuid", delivery_status: "delivered", updated_at: "2026-04-28T12:00:05Z" } } } } },
          "400": { description: "Status inválido" },
        },
      },
    },
    "/webhooks/events": {
      get: {
        tags: ["Webhooks v1.1"], summary: "[v1.1] Listar eventos suportados",
        responses: { "200": { description: "OK", content: { "application/json": { example: {
          data: { count: 21, events: [
            { name: "message_sent" }, { name: "delivered" }, { name: "read" }, { name: "failed" },
            { name: "tag_added", description: "Tag aplicada a um contato" },
            { name: "tag_removed", description: "Tag removida de um contato" },
            { name: "tag_created", description: "Nova tag criada" },
            { name: "tag_deleted", description: "Tag excluída" },
            { name: "contact.created" }, { name: "deal.won" }, { name: "form.submitted" },
          ] },
        } } } } },
      },
    },
    "/webhooks/{id}/test": {
      post: {
        tags: ["Webhooks v1.1"], summary: "[v1.1] Disparar evento de teste",
        description: "Envia evento `webhook.test` assinado (`X-Agsell-Signature: sha256=...`) para a URL cadastrada.",
        parameters: [{ $ref: "#/components/parameters/ResourceId" }],
        responses: { "200": { description: "Resultado da entrega", content: { "application/json": { example: { data: { delivered: true, status_code: 200, url: "https://meusite.com/webhook", sent_at: "2026-04-28T12:10:00Z" } } } } } },
      },
    },
    "/webhooks/{id}/rotate-secret": {
      post: {
        tags: ["Webhooks v1.1"], summary: "[v1.1] Rotacionar secret HMAC",
        description: "Gera um novo `secret`. O valor antigo é invalidado imediatamente.",
        parameters: [{ $ref: "#/components/parameters/ResourceId" }],
        responses: { "200": { description: "OK", content: { "application/json": { example: { data: { id: "wh_abc123", secret: "whsec_NEW_VALUE_2f8a...", rotated_at: "2026-04-28T12:15:00Z" } } } } } },
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
    { name: "Messages v1.1", description: "[v1.1] Envio com tracking, status de entrega e callbacks" },
    { name: "Webhooks v1.1", description: "[v1.1] Eventos suportados, teste de entrega e rotação de secret" },
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
