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
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts[1] === "forms" && pathParts[2] && pathParts[3] === "submit" && req.method === "POST") {
      return await handlePublicFormSubmit(supabase, pathParts[2], req);
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

    // Determine resource from already-parsed URL
    const resource = pathParts[1];
    const resourceId = pathParts[2];

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
      case "metrics": {
        if (method !== "GET") {
          result = { error: "Method not allowed" };
          break;
        }
        const subResource = pathParts[2];
        result = await handleMetrics(supabase, orgId, subResource, req);
        break;
      }
      default:
        return new Response(
          JSON.stringify({
            error: "Unknown resource",
            code: "NOT_FOUND",
            available_resources: ["contacts", "companies", "deals", "tags", "metrics"],
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: result.error ? 400 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    default:
      return {
        error: "Unknown metrics endpoint",
        available: ["overview", "email", "leads", "pipeline", "automations"],
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
