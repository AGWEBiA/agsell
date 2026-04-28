// Public REST API Gateway with API Key Authentication, Rate Limiting, Cursor Pagination & Input Validation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface ApiKeyRecord {
  id: string;
  organization_id: string;
  permissions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  requests_today: number;
  requests_this_minute: number;
  last_minute_reset: string;
  last_day_reset: string;
  is_active: boolean;
  expires_at: string | null;
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Input Validation Helpers ---
function validateString(val: unknown, maxLen = 255): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val !== "string") return null;
  return val.trim().substring(0, maxLen) || null;
}

function validateEmail(val: unknown): string | null {
  const s = validateString(val, 320);
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function validateNumber(val: unknown): number | null {
  if (val === undefined || val === null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// Whitelist-based body sanitization per resource
function sanitizeContactBody(body: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (body.first_name) clean.first_name = validateString(body.first_name, 100);
  if (body.last_name !== undefined) clean.last_name = validateString(body.last_name, 100);
  if (body.email !== undefined) clean.email = validateEmail(body.email);
  if (body.phone !== undefined) clean.phone = validateString(body.phone, 30);
  if (body.whatsapp !== undefined) clean.whatsapp = validateString(body.whatsapp, 30);
  if (body.position !== undefined) clean.position = validateString(body.position, 100);
  if (body.source !== undefined) clean.source = validateString(body.source, 50);
  if (body.status !== undefined) clean.status = validateString(body.status, 30);
  if (body.notes !== undefined) clean.notes = validateString(body.notes, 5000);
  if (body.company_id !== undefined) clean.company_id = validateString(body.company_id, 36);
  if (body.lead_score !== undefined) clean.lead_score = validateNumber(body.lead_score);
  return clean;
}

function sanitizeCompanyBody(body: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (body.name) clean.name = validateString(body.name, 200);
  if (body.domain !== undefined) clean.domain = validateString(body.domain, 255);
  if (body.industry !== undefined) clean.industry = validateString(body.industry, 100);
  if (body.size !== undefined) clean.size = validateString(body.size, 50);
  if (body.phone !== undefined) clean.phone = validateString(body.phone, 30);
  if (body.email !== undefined) clean.email = validateEmail(body.email);
  if (body.address !== undefined) clean.address = validateString(body.address, 500);
  if (body.city !== undefined) clean.city = validateString(body.city, 100);
  if (body.state !== undefined) clean.state = validateString(body.state, 100);
  if (body.country !== undefined) clean.country = validateString(body.country, 100);
  if (body.notes !== undefined) clean.notes = validateString(body.notes, 5000);
  return clean;
}

function sanitizeDealBody(body: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (body.title) clean.title = validateString(body.title, 200);
  if (body.value !== undefined) clean.value = validateNumber(body.value);
  if (body.probability !== undefined) clean.probability = validateNumber(body.probability);
  if (body.currency !== undefined) clean.currency = validateString(body.currency, 10);
  if (body.status !== undefined) clean.status = validateString(body.status, 30);
  if (body.notes !== undefined) clean.notes = validateString(body.notes, 5000);
  if (body.contact_id !== undefined) clean.contact_id = validateString(body.contact_id, 36);
  if (body.company_id !== undefined) clean.company_id = validateString(body.company_id, 36);
  if (body.stage_id !== undefined) clean.stage_id = validateString(body.stage_id, 36);
  if (body.expected_close_date !== undefined) clean.expected_close_date = validateString(body.expected_close_date, 30);
  return clean;
}

function sanitizeTagBody(body: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (body.name) clean.name = validateString(body.name, 100);
  if (body.color !== undefined) clean.color = validateString(body.color, 20);
  return clean;
}

// Shared pagination helper with cursor support
function parsePaginationParams(url: URL) {
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50"), 1), 100);
  const cursor = url.searchParams.get("cursor") || null;
  const direction = url.searchParams.get("direction") === "prev" ? "prev" : "next";
  const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : null;
  return { limit, cursor, direction, offset };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Check if this is a public form submission (no API key needed)
    // Supports: /public-api/forms/:id/submit (legacy) and /public-api/v1[.1]/forms/:id/submit
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const _maybeVer = (pathParts[1] || "").toLowerCase();
    const _verOffset = (_maybeVer === "v1" || _maybeVer === "v1.1") ? 1 : 0;
    if (
      pathParts[1 + _verOffset] === "forms" &&
      pathParts[2 + _verOffset] &&
      pathParts[3 + _verOffset] === "submit" &&
      req.method === "POST"
    ) {
      return await handlePublicFormSubmit(supabase, pathParts[2 + _verOffset], req);
    }

    // Extract API key from header
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key required", code: "MISSING_API_KEY" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse key prefix (first 8 chars) and hash full key
    const keyPrefix = apiKey.substring(0, 8);
    const keyHash = await hashApiKey(apiKey);

    // Find API key record
    const { data: keyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_prefix", keyPrefix)
      .eq("key_hash", keyHash)
      .single();

    if (keyError || !keyRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid API key", code: "INVALID_API_KEY" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKeyData = keyRecord as ApiKeyRecord;

    // Check if key is active
    if (!apiKeyData.is_active) {
      return new Response(
        JSON.stringify({ error: "API key is disabled", code: "KEY_DISABLED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "API key has expired", code: "KEY_EXPIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting logic
    const now = new Date();
    const lastMinuteReset = new Date(apiKeyData.last_minute_reset);
    const lastDayReset = new Date(apiKeyData.last_day_reset);

    let requestsThisMinute = apiKeyData.requests_this_minute;
    let requestsToday = apiKeyData.requests_today;

    if (now.getTime() - lastMinuteReset.getTime() > 60000) {
      requestsThisMinute = 0;
    }

    const today = now.toISOString().split("T")[0];
    if (apiKeyData.last_day_reset !== today) {
      requestsToday = 0;
    }

    if (requestsThisMinute >= apiKeyData.rate_limit_per_minute) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded (per minute)",
          code: "RATE_LIMIT_MINUTE",
          retry_after: 60 - Math.floor((now.getTime() - lastMinuteReset.getTime()) / 1000),
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (requestsToday >= apiKeyData.rate_limit_per_day) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded (per day)", code: "RATE_LIMIT_DAY" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update rate limit counters
    await supabase
      .from("api_keys")
      .update({
        requests_this_minute: requestsThisMinute + 1,
        requests_today: requestsToday + 1,
        last_request_at: now.toISOString(),
        last_minute_reset:
          now.getTime() - lastMinuteReset.getTime() > 60000
            ? now.toISOString()
            : apiKeyData.last_minute_reset,
        last_day_reset: today,
      })
      .eq("id", apiKeyData.id);

    // Determine version + resource from already-parsed URL.
    // Supabase pathname is /public-api/<rest>, so pathParts[0] === "public-api".
    // Supported layouts:
    //   /public-api/v1/<resource>/<id>/<sub>      (versioned, recommended)
    //   /public-api/v1.1/<resource>/<id>/<sub>    (versioned v1.1)
    //   /public-api/<resource>/<id>/<sub>         (legacy, no version)
    const maybeVersion = (pathParts[1] || "").toLowerCase();
    const isVersioned = maybeVersion === "v1" || maybeVersion === "v1.1";
    const apiVersion = isVersioned ? maybeVersion : "v1";
    const isV11 = apiVersion === "v1.1";
    const resource = isVersioned ? pathParts[2] : pathParts[1];
    const resourceId = isVersioned ? pathParts[3] : pathParts[2];
    const subResource = isVersioned ? pathParts[4] : pathParts[3];

    // Check permissions
    const permissions = apiKeyData.permissions as string[];
    const method = req.method;

    const requiredPermission =
      method === "GET"
        ? "read"
        : method === "POST"
        ? "write"
        : method === "PUT" || method === "PATCH"
        ? "write"
        : method === "DELETE"
        ? "delete"
        : "read";

    if (!permissions.includes(requiredPermission) && !permissions.includes("admin")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions", code: "FORBIDDEN" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different resources
    const orgId = apiKeyData.organization_id;
    let result;

    switch (resource) {
      case "contacts":
        result = await handleContacts(supabase, method, orgId, resourceId, req);
        break;
      case "companies":
        result = await handleCompanies(supabase, method, orgId, resourceId, req);
        break;
      case "deals":
        result = await handleDeals(supabase, method, orgId, resourceId, req);
        break;
      case "tags":
        result = await handleTags(supabase, method, orgId, resourceId, req);
        break;
      case "forms": {
        // /forms or /forms/:id/submissions
        result = await handleFormSubmissions(supabase, method, orgId, resourceId, subResource, req);
        break;
      }
      case "metrics": {
        if (method !== "GET") {
          result = { error: "Method not allowed" };
          break;
        }
        // /metrics/<type> — `<type>` lives where resourceId would be
        result = await handleMetrics(supabase, orgId, resourceId, req);
        break;
      }
      case "messages": {
        // POST /v1/messages — send via channel
        // v1.1 additions:
        //   POST   /v1.1/messages              -> send (returns message_id, delivery_status, tracking_url)
        //   GET    /v1.1/messages/:id          -> fetch a message
        //   GET    /v1.1/messages/:id/status   -> delivery status w/ timeline
        //   POST   /v1.1/messages/:id/status   -> provider status callback (signed)
        if (isV11 && method === "GET" && resourceId && subResource === "status") {
          result = await handleMessageStatus(supabase, orgId, resourceId);
        } else if (isV11 && method === "GET" && resourceId) {
          result = await handleGetMessage(supabase, orgId, resourceId);
        } else if (isV11 && method === "POST" && resourceId && subResource === "status") {
          result = await handleMessageStatusCallback(supabase, orgId, resourceId, req);
        } else if (method === "POST" && !resourceId) {
          result = await handleSendMessage(supabase, orgId, req, isV11);
        } else {
          result = { error: "Method not allowed" };
        }
        break;
      }
      case "automations": {
        // POST /v1/automations/:id/trigger
        if (method === "POST" && subResource === "trigger" && resourceId) {
          result = await handleTriggerAutomation(supabase, orgId, resourceId, req);
        } else if (method === "GET") {
          result = resourceId
            ? await (async () => {
                const { data, error } = await supabase.from("automations").select("*").eq("id", resourceId).eq("organization_id", orgId).single();
                return error ? { error: "Automation not found" } : { data };
              })()
            : await paginatedList(supabase, "automations", orgId, req, "id,name,trigger_type,is_active,executions_count,created_at");
        } else { result = { error: "Method not allowed" }; }
        break;
      }
      case "conversations": {
        if (method !== "GET") { result = { error: "Method not allowed" }; break; }
        result = resourceId
          ? await (async () => {
              const { data, error } = await supabase.from("conversations").select("*, contacts(first_name,last_name,email,phone)").eq("id", resourceId).eq("organization_id", orgId).single();
              return error ? { error: "Conversation not found" } : { data };
            })()
          : await paginatedList(supabase, "conversations", orgId, req, "id,channel,status,last_message_at,contact_id,unread_count,created_at");
        break;
      }
      case "webhooks": {
        // v1: GET/POST/DELETE /webhooks(/{id})
        // v1.1 additions:
        //   GET  /v1.1/webhooks/events            -> list supported event names
        //   POST /v1.1/webhooks/:id/test          -> send a test event
        //   POST /v1.1/webhooks/:id/rotate-secret -> rotate signing secret
        if (isV11 && method === "GET" && resourceId === "events" && !subResource) {
          result = handleListWebhookEvents();
        } else if (isV11 && method === "POST" && resourceId && subResource === "test") {
          result = await handleTestWebhook(supabase, orgId, resourceId);
        } else if (isV11 && method === "POST" && resourceId && subResource === "rotate-secret") {
          result = await handleRotateWebhookSecret(supabase, orgId, resourceId);
        } else {
          result = await handleWebhooks(supabase, method, orgId, resourceId, req, isV11);
        }
        break;
      }
      default:
        return new Response(
          JSON.stringify({
            error: "Unknown resource",
            code: "NOT_FOUND",
            api_version: apiVersion,
            available_resources: ["contacts", "companies", "deals", "tags", "forms", "metrics", "messages", "automations", "conversations", "webhooks"],
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify({ ...result, api_version: apiVersion }), {
      status: result.error ? 400 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-API-Version": apiVersion },
    });
  } catch (error: unknown) {
    console.error("Public API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Generic paginated list with cursor support
// deno-lint-ignore no-explicit-any
async function paginatedList(
  supabase: any,
  table: string,
  orgId: string,
  req: Request,
  selectFields = "*",
) {
  const url = new URL(req.url);
  const { limit, cursor, offset } = parsePaginationParams(url);

  let query = supabase
    .from(table)
    .select(selectFields, { count: "exact" })
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  } else if (offset !== null) {
    query = query.range(offset, offset + limit);
    const { data, error, count } = await query;
    return error
      ? { error: "Failed to fetch data" }
      : { data, meta: { total: count, limit, offset } };
  }

  const { data, error, count } = await query;
  if (error) return { error: "Failed to fetch data" };

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].created_at : null;

  return {
    data: items,
    meta: {
      total: count,
      limit,
      has_more: hasMore,
      next_cursor: nextCursor,
    },
  };
}

// --- Resource handlers with input validation ---

// Get org owner user_id for inserts
// deno-lint-ignore no-explicit-any
async function getOrgOwnerUserId(supabase: any, orgId: string): Promise<string | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  return data?.user_id || null;
}

// deno-lint-ignore no-explicit-any
async function handleContacts(supabase: any, method: string, orgId: string, id: string | undefined, req: Request) {
  if (method === "GET") {
    if (id) {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id).eq("organization_id", orgId).single();
      return error ? { error: "Contact not found" } : { data };
    }
    return paginatedList(supabase, "contacts", orgId, req);
  }

  if (method === "POST") {
    const rawBody = await req.json();
    const body = sanitizeContactBody(rawBody);
    if (!body.first_name) return { error: "first_name is required" };
    const userId = await getOrgOwnerUserId(supabase, orgId);
    if (!userId) return { error: "Organization owner not found" };
    const { data, error } = await supabase.from("contacts").insert({ ...body, organization_id: orgId, user_id: userId }).select().single();
    return error ? { error: "Failed to create contact" } : { data };
  }

  if (method === "PUT" || method === "PATCH") {
    if (!id) return { error: "ID required for update" };
    const rawBody = await req.json();
    const body = sanitizeContactBody(rawBody);
    const { data, error } = await supabase.from("contacts").update(body).eq("id", id).eq("organization_id", orgId).select().single();
    return error ? { error: "Failed to update contact" } : { data };
  }

  if (method === "DELETE") {
    if (!id) return { error: "ID required for delete" };
    const { error } = await supabase.from("contacts").delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: "Failed to delete contact" } : { success: true };
  }

  return { error: "Method not allowed" };
}

// deno-lint-ignore no-explicit-any
async function handleCompanies(supabase: any, method: string, orgId: string, id: string | undefined, req: Request) {
  if (method === "GET") {
    if (id) {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id).eq("organization_id", orgId).single();
      return error ? { error: "Company not found" } : { data };
    }
    return paginatedList(supabase, "companies", orgId, req);
  }

  if (method === "POST") {
    const rawBody = await req.json();
    const body = sanitizeCompanyBody(rawBody);
    if (!body.name) return { error: "name is required" };
    const userId = await getOrgOwnerUserId(supabase, orgId);
    if (!userId) return { error: "Organization owner not found" };
    const { data, error } = await supabase.from("companies").insert({ ...body, organization_id: orgId, user_id: userId }).select().single();
    return error ? { error: "Failed to create company" } : { data };
  }

  if (method === "PUT" || method === "PATCH") {
    if (!id) return { error: "ID required for update" };
    const rawBody = await req.json();
    const body = sanitizeCompanyBody(rawBody);
    const { data, error } = await supabase.from("companies").update(body).eq("id", id).eq("organization_id", orgId).select().single();
    return error ? { error: "Failed to update company" } : { data };
  }

  if (method === "DELETE") {
    if (!id) return { error: "ID required for delete" };
    const { error } = await supabase.from("companies").delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: "Failed to delete company" } : { success: true };
  }

  return { error: "Method not allowed" };
}

// deno-lint-ignore no-explicit-any
async function handleDeals(supabase: any, method: string, orgId: string, id: string | undefined, req: Request) {
  if (method === "GET") {
    if (id) {
      const { data, error } = await supabase.from("deals").select("*, contacts(*), companies(*)").eq("id", id).eq("organization_id", orgId).single();
      return error ? { error: "Deal not found" } : { data };
    }
    return paginatedList(supabase, "deals", orgId, req, "*, contacts(first_name, last_name, email), companies(name)");
  }

  if (method === "POST") {
    const rawBody = await req.json();
    const body = sanitizeDealBody(rawBody);
    if (!body.title) return { error: "title is required" };
    const userId = await getOrgOwnerUserId(supabase, orgId);
    if (!userId) return { error: "Organization owner not found" };
    const { data, error } = await supabase.from("deals").insert({ ...body, organization_id: orgId, user_id: userId }).select().single();
    return error ? { error: "Failed to create deal" } : { data };
  }

  if (method === "PUT" || method === "PATCH") {
    if (!id) return { error: "ID required for update" };
    const rawBody = await req.json();
    const body = sanitizeDealBody(rawBody);
    const { data, error } = await supabase.from("deals").update(body).eq("id", id).eq("organization_id", orgId).select().single();
    return error ? { error: "Failed to update deal" } : { data };
  }

  if (method === "DELETE") {
    if (!id) return { error: "ID required for delete" };
    const { error } = await supabase.from("deals").delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: "Failed to delete deal" } : { success: true };
  }

  return { error: "Method not allowed" };
}

// deno-lint-ignore no-explicit-any
async function handleTags(supabase: any, method: string, orgId: string, id: string | undefined, req: Request) {
  if (method === "GET") {
    if (id) {
      const { data, error } = await supabase.from("tags").select("*").eq("id", id).eq("organization_id", orgId).single();
      return error ? { error: "Tag not found" } : { data };
    }
    return paginatedList(supabase, "tags", orgId, req);
  }

  if (method === "POST") {
    const rawBody = await req.json();
    const body = sanitizeTagBody(rawBody);
    if (!body.name) return { error: "name is required" };
    const userId = await getOrgOwnerUserId(supabase, orgId);
    if (!userId) return { error: "Organization owner not found" };
    const { data, error } = await supabase.from("tags").insert({ ...body, organization_id: orgId, user_id: userId }).select().single();
    return error ? { error: "Failed to create tag" } : { data };
  }

  if (method === "DELETE") {
    if (!id) return { error: "ID required for delete" };
    const { error } = await supabase.from("tags").delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: "Failed to delete tag" } : { success: true };
  }

  return { error: "Method not allowed" };
}

// --- Metrics Handlers ---
function parsePeriodDays(period: string | null): number {
  switch (period) {
    case "today": return 0;
    case "7d": return 7;
    case "90d": return 90;
    case "30d": default: return 30;
  }
}

function getDateRange(period: string | null): { from: string; to: string } {
  const now = new Date();
  const days = parsePeriodDays(period);
  const from = new Date(now);
  if (days === 0) {
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(from.getDate() - days);
  }
  return { from: from.toISOString(), to: now.toISOString() };
}

// deno-lint-ignore no-explicit-any
async function handleMetrics(supabase: any, orgId: string, subResource: string | undefined, req: Request) {
  const url = new URL(req.url);
  const period = url.searchParams.get("period");
  const { from, to } = getDateRange(period);
  const tagFilter = url.searchParams.get("tag");
  const sourceFilter = url.searchParams.get("source");
  const statusFilter = url.searchParams.get("status");

  switch (subResource) {
    case "overview":
      return await metricsOverview(supabase, orgId, from, to);
    case "email":
      return await metricsEmail(supabase, orgId, from, to);
    case "leads":
      return await metricsLeads(supabase, orgId, from, to, { tag: tagFilter, source: sourceFilter, status: statusFilter });
    case "pipeline":
      return await metricsPipeline(supabase, orgId, from, to);
    case "automations":
      return await metricsAutomations(supabase, orgId, from, to);
    case "forms":
      return await metricsForms(supabase, orgId, from, to);
    default:
      return {
        error: "Unknown metrics endpoint",
        available: ["overview", "email", "leads", "pipeline", "automations", "forms"],
      };
  }
}

// deno-lint-ignore no-explicit-any
async function metricsOverview(supabase: any, orgId: string, from: string, to: string) {
  const [contacts, deals, emails, automations] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("created_at", from).lte("created_at", to),
    supabase.from("deals").select("id, value, status", { count: "exact" }).eq("organization_id", orgId).gte("created_at", from).lte("created_at", to),
    supabase.from("email_campaigns").select("sent_count, open_count, click_count").eq("organization_id", orgId).gte("created_at", from).lte("created_at", to),
    supabase.from("automation_executions").select("id, status", { count: "exact" }).gte("created_at", from).lte("created_at", to),
  ]);

  const emailData = emails.data || [];
  const totalSent = emailData.reduce((s: number, e: { sent_count: number | null }) => s + (e.sent_count || 0), 0);
  const totalOpens = emailData.reduce((s: number, e: { open_count: number | null }) => s + (e.open_count || 0), 0);
  const totalClicks = emailData.reduce((s: number, e: { click_count: number | null }) => s + (e.click_count || 0), 0);

  const dealsData = deals.data || [];
  const totalDealValue = dealsData.reduce((s: number, d: { value: number | null }) => s + (d.value || 0), 0);
  const wonDeals = dealsData.filter((d: { status: string | null }) => d.status === "won").length;

  return {
    data: {
      period: { from, to },
      contacts: { new: contacts.count || 0 },
      deals: { total: deals.count || 0, won: wonDeals, total_value: totalDealValue },
      email: { sent: totalSent, opens: totalOpens, clicks: totalClicks, open_rate: totalSent ? +(totalOpens / totalSent * 100).toFixed(1) : 0 },
      automations: { executions: automations.count || 0 },
    },
  };
}

// deno-lint-ignore no-explicit-any
async function metricsEmail(supabase: any, orgId: string, from: string, to: string) {
  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("id, name, status, sent_count, open_count, click_count, sent_at, created_at")
    .eq("organization_id", orgId)
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = campaigns || [];
  const totalSent = list.reduce((s: number, e: { sent_count: number | null }) => s + (e.sent_count || 0), 0);
  const totalOpens = list.reduce((s: number, e: { open_count: number | null }) => s + (e.open_count || 0), 0);
  const totalClicks = list.reduce((s: number, e: { click_count: number | null }) => s + (e.click_count || 0), 0);

  return {
    data: {
      period: { from, to },
      totals: {
        campaigns: list.length,
        sent: totalSent,
        opens: totalOpens,
        clicks: totalClicks,
        open_rate: totalSent ? +(totalOpens / totalSent * 100).toFixed(1) : 0,
        click_rate: totalSent ? +(totalClicks / totalSent * 100).toFixed(1) : 0,
      },
      campaigns: list.map((c: Record<string, unknown>) => ({
        id: c.id, name: c.name, status: c.status,
        sent: c.sent_count, opens: c.open_count, clicks: c.click_count,
        sent_at: c.sent_at,
      })),
    },
  };
}

// deno-lint-ignore no-explicit-any
async function metricsLeads(supabase: any, orgId: string, from: string, to: string, filters: { tag: string | null; source: string | null; status: string | null }) {
  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, email, source, status, lead_score, created_at, contact_tags(tag_id, tags(name))", { count: "exact" })
    .eq("organization_id", orgId)
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.source) query = query.eq("source", filters.source);
  if (filters.status) query = query.eq("status", filters.status);

  const { data: contacts, count } = await query;
  let filteredContacts = contacts || [];

  // Filter by tag name if provided
  if (filters.tag) {
    filteredContacts = filteredContacts.filter((c: Record<string, unknown>) => {
      const tags = c.contact_tags as Array<{ tags: { name: string } | null }> | null;
      return tags?.some(ct => ct.tags?.name?.toLowerCase() === filters.tag!.toLowerCase());
    });
  }

  // Aggregate by source
  const bySource: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const c of filteredContacts) {
    const src = (c as Record<string, string>).source || "unknown";
    const st = (c as Record<string, string>).status || "unknown";
    bySource[src] = (bySource[src] || 0) + 1;
    byStatus[st] = (byStatus[st] || 0) + 1;
  }

  return {
    data: {
      period: { from, to },
      total: count || 0,
      filtered: filteredContacts.length,
      by_source: bySource,
      by_status: byStatus,
      leads: filteredContacts.slice(0, 50).map((c: Record<string, unknown>) => ({
        id: c.id, name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        email: c.email, source: c.source, status: c.status,
        lead_score: c.lead_score, created_at: c.created_at,
      })),
    },
  };
}

// deno-lint-ignore no-explicit-any
async function metricsPipeline(supabase: any, orgId: string, from: string, to: string) {
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, value, status, probability, stage_id, pipeline_stages(name), created_at")
    .eq("organization_id", orgId)
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false })
    .limit(200);

  const list = deals || [];
  const totalValue = list.reduce((s: number, d: { value: number | null }) => s + (d.value || 0), 0);
  const wonDeals = list.filter((d: { status: string | null }) => d.status === "won");
  const wonValue = wonDeals.reduce((s: number, d: { value: number | null }) => s + (d.value || 0), 0);

  // Group by stage
  const byStage: Record<string, { count: number; value: number }> = {};
  for (const d of list) {
    const stageName = (d as Record<string, unknown>).pipeline_stages
      ? ((d as Record<string, unknown>).pipeline_stages as { name: string }).name
      : "Sem etapa";
    if (!byStage[stageName]) byStage[stageName] = { count: 0, value: 0 };
    byStage[stageName].count++;
    byStage[stageName].value += (d as { value: number | null }).value || 0;
  }

  return {
    data: {
      period: { from, to },
      totals: {
        deals: list.length,
        total_value: totalValue,
        won: wonDeals.length,
        won_value: wonValue,
        win_rate: list.length ? +(wonDeals.length / list.length * 100).toFixed(1) : 0,
      },
      by_stage: byStage,
    },
  };
}

// deno-lint-ignore no-explicit-any
async function metricsAutomations(supabase: any, orgId: string, from: string, to: string) {
  // Get automations for this org
  const { data: automations } = await supabase
    .from("automations")
    .select("id, name, is_active, executions_count")
    .eq("organization_id", orgId);

  const automationIds = (automations || []).map((a: { id: string }) => a.id);

  let executions: Record<string, unknown>[] = [];
  if (automationIds.length > 0) {
    const { data } = await supabase
      .from("automation_executions")
      .select("id, automation_id, status, trigger_event, created_at")
      .in("automation_id", automationIds)
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .limit(200);
    executions = data || [];
  }

  const completed = executions.filter((e: Record<string, unknown>) => e.status === "completed").length;
  const failed = executions.filter((e: Record<string, unknown>) => e.status === "failed").length;

  return {
    data: {
      period: { from, to },
      totals: {
        automations: (automations || []).length,
        active: (automations || []).filter((a: { is_active: boolean | null }) => a.is_active).length,
        executions: executions.length,
        completed,
        failed,
        success_rate: executions.length ? +(completed / executions.length * 100).toFixed(1) : 0,
      },
      automations: (automations || []).map((a: Record<string, unknown>) => ({
        id: a.id,
        name: a.name,
        is_active: a.is_active,
        total_executions: a.executions_count,
      })),
    },
  };
}

// deno-lint-ignore no-explicit-any
async function metricsForms(supabase: any, orgId: string, from: string, to: string) {
  const [formsRes, submissionsRes] = await Promise.all([
    supabase
      .from("forms")
      .select("id, name, is_active, submissions_count, created_at")
      .eq("organization_id", orgId),
    supabase
      .from("form_submissions")
      .select("id, form_id, contact_id, created_at, forms!inner(organization_id)")
      .eq("forms.organization_id", orgId)
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const forms = formsRes.data || [];
  const submissions = submissionsRes.data || [];

  const totalSubmissions = submissions.length;
  const withContact = submissions.filter((s: Record<string, unknown>) => s.contact_id !== null).length;

  // Per-form breakdown
  const byForm: Record<string, { name: string; submissions: number; conversions: number }> = {};
  for (const f of forms) {
    byForm[f.id as string] = { name: f.name as string, submissions: 0, conversions: 0 };
  }
  for (const s of submissions) {
    const fid = s.form_id as string;
    if (!byForm[fid]) byForm[fid] = { name: "Unknown", submissions: 0, conversions: 0 };
    byForm[fid].submissions++;
    if (s.contact_id) byForm[fid].conversions++;
  }

  return {
    data: {
      period: { from, to },
      totals: {
        forms: forms.length,
        active_forms: forms.filter((f: Record<string, unknown>) => f.is_active).length,
        submissions: totalSubmissions,
        conversions: withContact,
        conversion_rate: totalSubmissions ? +(withContact / totalSubmissions * 100).toFixed(1) : 0,
      },
      by_form: Object.entries(byForm).map(([id, v]) => ({
        id,
        name: v.name,
        submissions: v.submissions,
        conversions: v.conversions,
        conversion_rate: v.submissions ? +(v.conversions / v.submissions * 100).toFixed(1) : 0,
      })),
    },
  };
}

// --- Form Submissions via API Key (authenticated) ---
// deno-lint-ignore no-explicit-any
async function handleFormSubmissions(supabase: any, method: string, orgId: string, formId: string | undefined, subResource: string | undefined, req: Request) {
  if (method !== "GET") return { error: "Method not allowed. Use GET to list form submissions." };

  // GET /forms — list all forms
  if (!formId) {
    const { data, error, count } = await supabase
      .from("forms")
      .select("id, name, is_active, submissions_count, created_at, fields", { count: "exact" })
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);
    return error ? { error: "Failed to fetch forms" } : { data, meta: { total: count } };
  }

  // GET /forms/:id — form details
  if (!subResource) {
    const { data, error } = await supabase
      .from("forms")
      .select("id, name, is_active, submissions_count, fields, created_at")
      .eq("id", formId)
      .eq("organization_id", orgId)
      .single();
    return error ? { error: "Form not found" } : { data };
  }

  // GET /forms/:id/submissions
  // Supports: ?field=profissao&value=medico (single filter)
  //           ?filter.profissao=medico&filter.cidade=SP (multiple filters)
  //           ?fields=nome,profissao,email (select specific data fields)
  if (subResource === "submissions") {
    const url = new URL(req.url);
    const { limit, cursor, offset } = parsePaginationParams(url);
    const fieldFilter = url.searchParams.get("field");
    const valueFilter = url.searchParams.get("value");
    const selectFields = url.searchParams.get("fields"); // comma-separated data field names

    // Collect multiple filters: ?filter.profissao=medico&filter.cidade=SP
    const multiFilters: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      if (key.startsWith("filter.")) {
        multiFilters[key.substring(7)] = val;
      }
    });
    // Legacy single filter
    if (fieldFilter && valueFilter) {
      multiFilters[fieldFilter] = valueFilter;
    }

    // Verify form belongs to org
    const { data: form, error: fErr } = await supabase
      .from("forms")
      .select("id")
      .eq("id", formId)
      .eq("organization_id", orgId)
      .single();
    if (fErr || !form) return { error: "Form not found" };

    let query = supabase
      .from("form_submissions")
      .select("id, form_id, data, contact_id, created_at", { count: "exact" })
      .eq("form_id", formId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) query = query.lt("created_at", cursor);
    else if (offset !== null) query = query.range(offset, offset + limit);

    const { data: submissions, error: sErr, count } = await query;
    if (sErr) return { error: "Failed to fetch submissions" };

    let items = submissions || [];

    // Apply all field filters
    if (Object.keys(multiFilters).length > 0) {
      items = items.filter((s: Record<string, unknown>) => {
        const d = s.data as Record<string, unknown>;
        if (!d) return false;
        return Object.entries(multiFilters).every(([fk, fv]) => {
          const val = String(d[fk] || "").toLowerCase();
          return val.includes(fv.toLowerCase());
        });
      });
    }

    const hasMore = items.length > limit;
    const finalItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && finalItems.length > 0 ? finalItems[finalItems.length - 1].created_at : null;

    // Project specific fields if requested
    const projectedItems = selectFields
      ? finalItems.map((s: Record<string, unknown>) => {
          const d = s.data as Record<string, unknown> || {};
          const selectedKeys = selectFields.split(",").map((k: string) => k.trim());
          const projected: Record<string, unknown> = {};
          for (const k of selectedKeys) {
            if (k in d) projected[k] = d[k];
          }
          return { id: s.id, form_id: s.form_id, contact_id: s.contact_id, created_at: s.created_at, data: projected };
        })
      : finalItems;

    return {
      data: projectedItems,
      meta: { total: count, limit, has_more: hasMore, next_cursor: nextCursor, filters_applied: Object.keys(multiFilters).length > 0 ? multiFilters : undefined, fields_selected: selectFields || undefined },
    };
  }

  return { error: "Unknown sub-resource. Use /forms/:id/submissions" };
}

// --- Public Form Submission (no API key required) ---
// deno-lint-ignore no-explicit-any
async function handlePublicFormSubmit(supabase: any, formId: string, req: Request) {
  try {
    // Validate form exists and is active
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, is_active, organization_id")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: "Form not found", code: "FORM_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!form.is_active) {
      return new Response(
        JSON.stringify({ error: "Form is not active", code: "FORM_INACTIVE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid request body", code: "INVALID_BODY" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert submission
    const { data: submission, error: subError } = await supabase
      .from("form_submissions")
      .insert({ form_id: formId, data: body })
      .select()
      .single();

    if (subError) {
      return new Response(
        JSON.stringify({ error: "Failed to submit form", code: "SUBMIT_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update submissions count
    await supabase.rpc("increment_form_submissions", { form_id_param: formId }).catch(() => {
      // Fallback: direct update
      supabase.from("forms").update({ submissions_count: form.submissions_count + 1 }).eq("id", formId);
    });

    // Trigger automations
    try {
      const { data: automations } = await supabase
        .from("automations")
        .select("id")
        .eq("organization_id", form.organization_id)
        .eq("trigger_type", "form_submitted")
        .eq("is_active", true);

      if (automations?.length) {
        await Promise.allSettled(
          automations.map((a: { id: string }) =>
            supabase.functions.invoke("process-automation", {
              body: { automation_id: a.id, contact_id: submission?.contact_id ?? null, trigger_event: "form_submitted" },
            })
          )
        );
      }
    } catch {}

    // Dispatch outbound webhook if configured
    try {
      const { data: formWithWebhook } = await supabase
        .from("forms")
        .select("webhook_url, webhook_headers, name")
        .eq("id", formId)
        .single();

      if (formWithWebhook?.webhook_url) {
        const webhookPayload = {
          event: "form_submission",
          form_id: formId,
          form_name: formWithWebhook.name,
          submission_id: submission.id,
          contact_id: submission.contact_id || null,
          data: body,
          submitted_at: new Date().toISOString(),
        };

        const webhookHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "AGSell-Webhook/1.0",
          ...(formWithWebhook.webhook_headers || {}),
        };

        // Fire-and-forget — don't block the response
        fetch(formWithWebhook.webhook_url, {
          method: "POST",
          headers: webhookHeaders,
          body: JSON.stringify(webhookPayload),
        }).catch((err) => console.error("Webhook dispatch failed:", err));
      }
    } catch (webhookErr) {
      console.error("Webhook lookup error:", webhookErr);
    }

    return new Response(
      JSON.stringify({ success: true, submission_id: submission.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Form submit error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// ===== Send messages via channel =====
// In v1.1 we also persist the message in `messages` (creating an outbound conversation
// if needed) so we can return a stable `message_id` and expose delivery status.
// deno-lint-ignore no-explicit-any
async function handleSendMessage(supabase: any, orgId: string, req: Request, isV11 = false) {
  const body = await req.json().catch(() => ({}));
  const channel = validateString(body.channel, 20);
  const to = validateString(body.to, 320);
  const message = validateString(body.message, 4096);
  if (!channel || !to) return { error: "channel and to are required", code: "INVALID_REQUEST" };
  if (!["whatsapp", "email", "sms"].includes(channel)) return { error: "channel must be whatsapp|email|sms", code: "INVALID_CHANNEL" };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let fnName = "";
  let payload: Record<string, unknown> = { organization_id: orgId };
  if (channel === "whatsapp") {
    fnName = "send-whatsapp";
    payload = { ...payload, to, message, instance_id: body.instance_id, media_url: body.media_url, media_type: body.media_type };
  } else if (channel === "email") {
    fnName = "send-email";
    payload = { ...payload, to, subject: validateString(body.subject, 300), html: body.html || message, from: body.from };
  } else if (channel === "sms") {
    fnName = "send-sms";
    payload = { ...payload, to, message };
  }

  // v1.1: pre-create a tracked message row before invoking the channel function.
  let trackedMessageId: string | null = null;
  if (isV11) {
    try {
      // Find or create an outbound conversation for this destination + channel.
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("organization_id", orgId)
        .eq("channel", channel)
        .or(`contact_phone.eq.${to},contact_email.eq.${to}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversationId: string | null = existingConv?.id || null;
      if (!conversationId) {
        const userId = await getOrgOwnerUserId(supabase, orgId);
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            organization_id: orgId,
            user_id: userId,
            channel,
            status: "open",
            contact_phone: channel !== "email" ? to : null,
            contact_email: channel === "email" ? to : null,
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        conversationId = newConv?.id || null;
      }

      if (conversationId) {
        const { data: msgRow } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_type: "agent",
            content: message || (channel === "email" ? validateString(body.subject, 300) || "" : ""),
            message_type: body.media_url ? "media" : "text",
            media_url: body.media_url || null,
            delivery_status: "pending",
            metadata: { source: "public_api_v1.1", channel, to },
          })
          .select("id")
          .single();
        trackedMessageId = msgRow?.id || null;
      }
    } catch (e) {
      console.error("v1.1 send: failed to pre-create message row", e);
    }
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ ...payload, _tracked_message_id: trackedMessageId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (trackedMessageId) {
        await supabase.from("messages").update({
          delivery_status: "failed",
          metadata: { error: data?.error || `Channel error ${res.status}`, source: "public_api_v1.1" },
        }).eq("id", trackedMessageId);
      }
      return { error: data?.error || `Failed to send ${channel}`, code: "CHANNEL_ERROR", status: res.status };
    }

    // Update tracked row with provider id when available.
    const externalId = data?.external_id || data?.message_id || data?.id || null;
    if (trackedMessageId) {
      await supabase.from("messages").update({
        delivery_status: "sent",
        external_id: externalId,
      }).eq("id", trackedMessageId);
    }

    if (isV11) {
      const baseUrl = `${supabaseUrl}/functions/v1/public-api/v1.1`;
      return {
        data: {
          channel,
          to,
          message_id: trackedMessageId,
          external_id: externalId,
          delivery_status: "sent",
          tracking_url: trackedMessageId ? `${baseUrl}/messages/${trackedMessageId}/status` : null,
          provider_response: data,
          sent_at: new Date().toISOString(),
        },
      };
    }
    return { data: { channel, to, sent: true, ...data } };
  } catch (e) {
    if (trackedMessageId) {
      await supabase.from("messages").update({ delivery_status: "failed" }).eq("id", trackedMessageId);
    }
    return { error: `Failed to send: ${(e as Error).message}`, code: "NETWORK_ERROR" };
  }
}

// ===== v1.1: GET /messages/:id =====
// deno-lint-ignore no-explicit-any
async function handleGetMessage(supabase: any, orgId: string, messageId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, content, message_type, media_url, delivery_status, external_id, created_at, sender_type, metadata, conversations!inner(organization_id, channel, contact_phone, contact_email)")
    .eq("id", messageId)
    .eq("conversations.organization_id", orgId)
    .single();
  if (error || !data) return { error: "Message not found", code: "NOT_FOUND" };
  return { data };
}

// ===== v1.1: GET /messages/:id/status =====
// deno-lint-ignore no-explicit-any
async function handleMessageStatus(supabase: any, orgId: string, messageId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, delivery_status, external_id, created_at, metadata, conversations!inner(organization_id, channel)")
    .eq("id", messageId)
    .eq("conversations.organization_id", orgId)
    .single();
  if (error || !data) return { error: "Message not found", code: "NOT_FOUND" };

  // Build a simple status timeline from metadata.history[] if present.
  const history = Array.isArray(data.metadata?.history) ? data.metadata.history : [];
  return {
    data: {
      message_id: data.id,
      external_id: data.external_id,
      channel: data.conversations?.channel,
      delivery_status: data.delivery_status,
      created_at: data.created_at,
      timeline: [
        { status: "queued", at: data.created_at },
        ...history.map((h: Record<string, unknown>) => ({ status: h.status, at: h.at, info: h.info })),
        { status: data.delivery_status, at: data.metadata?.last_status_at || data.created_at },
      ],
    },
  };
}

// ===== v1.1: POST /messages/:id/status (provider callback) =====
// deno-lint-ignore no-explicit-any
async function handleMessageStatusCallback(supabase: any, orgId: string, messageId: string, req: Request) {
  const body = await req.json().catch(() => ({}));
  const status = validateString(body.status, 30);
  if (!status) return { error: "status is required", code: "INVALID_REQUEST" };
  const allowed = ["pending", "queued", "sent", "delivered", "read", "failed", "bounced"];
  if (!allowed.includes(status)) return { error: `status must be one of ${allowed.join(", ")}`, code: "INVALID_STATUS" };

  // Verify ownership through conversation
  const { data: msg, error: mErr } = await supabase
    .from("messages")
    .select("id, metadata, conversations!inner(organization_id)")
    .eq("id", messageId)
    .eq("conversations.organization_id", orgId)
    .single();
  if (mErr || !msg) return { error: "Message not found", code: "NOT_FOUND" };

  const history = Array.isArray(msg.metadata?.history) ? msg.metadata.history : [];
  history.push({ status, at: new Date().toISOString(), info: validateString(body.info, 500) });

  const { error: uErr } = await supabase.from("messages").update({
    delivery_status: status,
    metadata: { ...(msg.metadata || {}), history, last_status_at: new Date().toISOString() },
  }).eq("id", messageId);

  if (uErr) return { error: "Failed to update status", code: "UPDATE_ERROR" };

  // Fan-out to subscribed webhooks (event: message.status_updated)
  fanoutWebhookEvent(supabase, orgId, "message.status_updated", {
    message_id: messageId, status, updated_at: new Date().toISOString(), info: body.info ?? null,
  }).catch((e) => console.error("fanout error:", e));

  return { data: { message_id: messageId, delivery_status: status, updated_at: new Date().toISOString() } };
}

// ===== Trigger automation =====
// deno-lint-ignore no-explicit-any
async function handleTriggerAutomation(supabase: any, orgId: string, automationId: string, req: Request) {
  const body = await req.json().catch(() => ({}));
  const { data: auto, error } = await supabase
    .from("automations").select("id, is_active").eq("id", automationId).eq("organization_id", orgId).single();
  if (error || !auto) return { error: "Automation not found" };
  if (!auto.is_active) return { error: "Automation is not active" };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/process-automation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ automation_id: automationId, organization_id: orgId, trigger_data: body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.error || "Failed to trigger automation" };
    return { data: { triggered: true, automation_id: automationId, ...data } };
  } catch (e) {
    return { error: `Failed: ${(e as Error).message}` };
  }
}

// ===== Outbound Webhook subscriptions =====
const SUPPORTED_WEBHOOK_EVENTS = [
  "contact.created", "contact.updated", "contact.deleted", "contact.tagged",
  "deal.created", "deal.updated", "deal.stage_changed", "deal.won", "deal.lost",
  "message.received", "message.sent", "message.status_updated",
  "form.submitted",
  "automation.completed", "automation.failed",
  "conversation.assigned", "conversation.closed",
] as const;

function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "whsec_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function handleListWebhookEvents() {
  return {
    data: {
      events: SUPPORTED_WEBHOOK_EVENTS.map((name) => ({ name })),
      count: SUPPORTED_WEBHOOK_EVENTS.length,
    },
  };
}

// deno-lint-ignore no-explicit-any
async function handleWebhooks(supabase: any, method: string, orgId: string, id: string | undefined, req: Request, isV11 = false) {
  if (method === "GET") {
    if (id) {
      const { data, error } = await supabase.from("api_webhook_subscriptions")
        .select("id, name, url, events, is_active, last_triggered_at, failure_count, created_at, updated_at, secret")
        .eq("id", id).eq("organization_id", orgId).single();
      if (error) return { error: "Webhook not found" };
      // Mask secret unless v1.1 explicitly requested
      if (!isV11) delete (data as Record<string, unknown>).secret;
      return { data };
    }
    const { data, error, count } = await supabase
      .from("api_webhook_subscriptions")
      .select("id, name, url, events, is_active, last_triggered_at, failure_count, created_at", { count: "exact" })
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);
    return error ? { error: "Failed to fetch webhooks" } : { data, meta: { total: count } };
  }

  if (method === "POST") {
    const body = await req.json().catch(() => ({}));
    const url = validateString(body.url, 500);
    const events = Array.isArray(body.events) ? body.events.slice(0, 50).filter((e: unknown) => typeof e === "string") : [];
    if (!url || events.length === 0) return { error: "url and events[] are required", code: "INVALID_REQUEST" };
    if (!/^https?:\/\//i.test(url)) return { error: "url must be a valid http(s) URL", code: "INVALID_URL" };

    // Validate events against supported list (warn-only: store unknown events too)
    const unknownEvents = events.filter((e: string) => !SUPPORTED_WEBHOOK_EVENTS.includes(e as never));

    const userId = await getOrgOwnerUserId(supabase, orgId);
    const secret = generateWebhookSecret();
    const { data, error } = await supabase.from("api_webhook_subscriptions").insert({
      url, events, name: validateString(body.name, 100) || "API Webhook",
      is_active: body.is_active !== false, organization_id: orgId, user_id: userId, secret,
    }).select().single();
    if (error) return { error: "Failed to create webhook: " + error.message };
    // Always return the secret on creation (only chance to capture it).
    return {
      data,
      ...(unknownEvents.length ? { warnings: [`Unknown events (still subscribed): ${unknownEvents.join(", ")}`] } : {}),
    };
  }

  if (method === "DELETE" && id) {
    const { error } = await supabase.from("api_webhook_subscriptions").delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: "Failed to delete" } : { success: true };
  }
  return { error: "Method not allowed" };
}

// ===== v1.1: POST /webhooks/:id/test =====
// deno-lint-ignore no-explicit-any
async function handleTestWebhook(supabase: any, orgId: string, webhookId: string) {
  const { data: hook, error } = await supabase
    .from("api_webhook_subscriptions")
    .select("id, url, secret, is_active")
    .eq("id", webhookId).eq("organization_id", orgId).single();
  if (error || !hook) return { error: "Webhook not found", code: "NOT_FOUND" };
  if (!hook.is_active) return { error: "Webhook is inactive", code: "INACTIVE" };

  const payload = {
    event: "webhook.test",
    timestamp: new Date().toISOString(),
    organization_id: orgId,
    data: { message: "Test event from Agsell API v1.1", webhook_id: webhookId },
  };
  const signature = await signPayload(JSON.stringify(payload), hook.secret || "");

  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Agsell-Webhook/1.1",
        "X-Agsell-Event": "webhook.test",
        "X-Agsell-Signature": signature,
        "X-Agsell-Timestamp": payload.timestamp,
      },
      body: JSON.stringify(payload),
    });
    return {
      data: {
        delivered: res.ok,
        status_code: res.status,
        url: hook.url,
        sent_at: payload.timestamp,
      },
    };
  } catch (e) {
    return { error: `Delivery failed: ${(e as Error).message}`, code: "DELIVERY_FAILED" };
  }
}

// ===== v1.1: POST /webhooks/:id/rotate-secret =====
// deno-lint-ignore no-explicit-any
async function handleRotateWebhookSecret(supabase: any, orgId: string, webhookId: string) {
  const newSecret = generateWebhookSecret();
  const { data, error } = await supabase
    .from("api_webhook_subscriptions")
    .update({ secret: newSecret })
    .eq("id", webhookId).eq("organization_id", orgId)
    .select("id, secret, updated_at").single();
  if (error || !data) return { error: "Webhook not found", code: "NOT_FOUND" };
  return { data: { id: data.id, secret: data.secret, rotated_at: data.updated_at } };
}

// ===== Helpers shared by v1.1 webhooks =====
async function signPayload(payload: string, secret: string): Promise<string> {
  if (!secret) return "";
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256=${hex}`;
}

// deno-lint-ignore no-explicit-any
async function fanoutWebhookEvent(supabase: any, orgId: string, eventName: string, data: Record<string, unknown>) {
  const { data: hooks } = await supabase
    .from("api_webhook_subscriptions")
    .select("id, url, secret, events")
    .eq("organization_id", orgId)
    .eq("is_active", true);
  if (!hooks?.length) return;
  const matching = hooks.filter((h: { events: string[] }) => Array.isArray(h.events) && h.events.includes(eventName));
  const payload = { event: eventName, timestamp: new Date().toISOString(), organization_id: orgId, data };
  const body = JSON.stringify(payload);
  await Promise.allSettled(matching.map(async (h: { id: string; url: string; secret: string }) => {
    const sig = await signPayload(body, h.secret || "");
    return fetch(h.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Agsell-Webhook/1.1",
        "X-Agsell-Event": eventName,
        "X-Agsell-Signature": sig,
        "X-Agsell-Timestamp": payload.timestamp,
      },
      body,
    }).then((res) => supabase.from("api_webhook_subscriptions").update({
      last_triggered_at: new Date().toISOString(),
      failure_count: res.ok ? 0 : undefined,
    }).eq("id", h.id));
  }));
}
