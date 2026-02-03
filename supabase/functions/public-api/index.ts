// Public REST API Gateway with API Key Authentication and Rate Limiting
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
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

    // Reset minute counter if more than 1 minute passed
    if (now.getTime() - lastMinuteReset.getTime() > 60000) {
      requestsThisMinute = 0;
    }

    // Reset daily counter if new day
    const today = now.toISOString().split("T")[0];
    if (apiKeyData.last_day_reset !== today) {
      requestsToday = 0;
    }

    // Check rate limits
    if (requestsThisMinute >= apiKeyData.rate_limit_per_minute) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded (per minute)", 
          code: "RATE_LIMIT_MINUTE",
          retry_after: 60 - Math.floor((now.getTime() - lastMinuteReset.getTime()) / 1000)
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (requestsToday >= apiKeyData.rate_limit_per_day) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded (per day)", 
          code: "RATE_LIMIT_DAY" 
        }),
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
        last_minute_reset: now.getTime() - lastMinuteReset.getTime() > 60000 ? now.toISOString() : apiKeyData.last_minute_reset,
        last_day_reset: today,
      })
      .eq("id", apiKeyData.id);

    // Parse URL path to determine resource
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const resource = pathParts[1]; // e.g., /public-api/contacts -> "contacts"
    const resourceId = pathParts[2]; // e.g., /public-api/contacts/123 -> "123"

    // Check permissions
    const permissions = apiKeyData.permissions as string[];
    const method = req.method;
    
    const requiredPermission = 
      method === "GET" ? "read" :
      method === "POST" ? "write" :
      method === "PUT" || method === "PATCH" ? "write" :
      method === "DELETE" ? "delete" : "read";

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
      default:
        return new Response(
          JSON.stringify({ 
            error: "Unknown resource", 
            code: "NOT_FOUND",
            available_resources: ["contacts", "companies", "deals", "tags"]
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
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message, code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Resource handlers
async function handleContacts(supabase: any, method: string, orgId: string, id: string | undefined, req: Request) {
  const table = supabase.from("contacts");

  if (method === "GET") {
    if (id) {
      const { data, error } = await table.select("*").eq("id", id).eq("organization_id", orgId).single();
      return error ? { error: error.message } : { data };
    }
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const { data, error, count } = await table
      .select("*", { count: "exact" })
      .eq("organization_id", orgId)
      .range(offset, offset + limit - 1);
    return error ? { error: error.message } : { data, meta: { total: count, limit, offset } };
  }

  if (method === "POST") {
    const body = await req.json();
    const { data, error } = await table.insert({ ...body, organization_id: orgId }).select().single();
    return error ? { error: error.message } : { data };
  }

  if (method === "PUT" || method === "PATCH") {
    if (!id) return { error: "ID required for update" };
    const body = await req.json();
    const { data, error } = await table.update(body).eq("id", id).eq("organization_id", orgId).select().single();
    return error ? { error: error.message } : { data };
  }

  if (method === "DELETE") {
    if (!id) return { error: "ID required for delete" };
    const { error } = await table.delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: error.message } : { success: true };
  }

  return { error: "Method not allowed" };
}

async function handleCompanies(supabase: any, method: string, orgId: string, id: string | undefined, req: Request) {
  const table = supabase.from("companies");

  if (method === "GET") {
    if (id) {
      const { data, error } = await table.select("*").eq("id", id).eq("organization_id", orgId).single();
      return error ? { error: error.message } : { data };
    }
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const { data, error, count } = await table
      .select("*", { count: "exact" })
      .eq("organization_id", orgId)
      .range(offset, offset + limit - 1);
    return error ? { error: error.message } : { data, meta: { total: count, limit, offset } };
  }

  if (method === "POST") {
    const body = await req.json();
    const { data, error } = await table.insert({ ...body, organization_id: orgId }).select().single();
    return error ? { error: error.message } : { data };
  }

  if (method === "PUT" || method === "PATCH") {
    if (!id) return { error: "ID required for update" };
    const body = await req.json();
    const { data, error } = await table.update(body).eq("id", id).eq("organization_id", orgId).select().single();
    return error ? { error: error.message } : { data };
  }

  if (method === "DELETE") {
    if (!id) return { error: "ID required for delete" };
    const { error } = await table.delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: error.message } : { success: true };
  }

  return { error: "Method not allowed" };
}

async function handleDeals(supabase: any, method: string, orgId: string, id: string | undefined, req: Request) {
  const table = supabase.from("deals");

  if (method === "GET") {
    if (id) {
      const { data, error } = await table.select("*, contacts(*), companies(*)").eq("id", id).eq("organization_id", orgId).single();
      return error ? { error: error.message } : { data };
    }
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const { data, error, count } = await table
      .select("*, contacts(first_name, last_name, email), companies(name)", { count: "exact" })
      .eq("organization_id", orgId)
      .range(offset, offset + limit - 1);
    return error ? { error: error.message } : { data, meta: { total: count, limit, offset } };
  }

  if (method === "POST") {
    const body = await req.json();
    const { data, error } = await table.insert({ ...body, organization_id: orgId }).select().single();
    return error ? { error: error.message } : { data };
  }

  if (method === "PUT" || method === "PATCH") {
    if (!id) return { error: "ID required for update" };
    const body = await req.json();
    const { data, error } = await table.update(body).eq("id", id).eq("organization_id", orgId).select().single();
    return error ? { error: error.message } : { data };
  }

  if (method === "DELETE") {
    if (!id) return { error: "ID required for delete" };
    const { error } = await table.delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: error.message } : { success: true };
  }

  return { error: "Method not allowed" };
}

async function handleTags(supabase: any, method: string, orgId: string, id: string | undefined, req: Request) {
  const table = supabase.from("tags");

  if (method === "GET") {
    if (id) {
      const { data, error } = await table.select("*").eq("id", id).eq("organization_id", orgId).single();
      return error ? { error: error.message } : { data };
    }
    const { data, error } = await table.select("*").eq("organization_id", orgId);
    return error ? { error: error.message } : { data };
  }

  if (method === "POST") {
    const body = await req.json();
    const { data, error } = await table.insert({ ...body, organization_id: orgId }).select().single();
    return error ? { error: error.message } : { data };
  }

  if (method === "DELETE") {
    if (!id) return { error: "ID required for delete" };
    const { error } = await table.delete().eq("id", id).eq("organization_id", orgId);
    return error ? { error: error.message } : { success: true };
  }

  return { error: "Method not allowed" };
}
