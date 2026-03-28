// Shared Edge Function utilities
// Import via: import { corsHeaders, handleCors, validateAuth, createErrorResponse, createSuccessResponse } from './shared.ts'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

export function createErrorResponse(message: string, status = 400, details?: unknown): Response {
  return new Response(
    JSON.stringify({ error: message, ...(details ? { details } : {}) }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export function createSuccessResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export async function validateAuth(req: Request): Promise<{ userId: string; token: string } | Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return createErrorResponse('Missing authorization header', 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return createErrorResponse('Invalid or expired token', 401);
  }
  
  return { userId: user.id, token };
}

export function validateRequiredFields(body: Record<string, unknown>, fields: string[]): string | null {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
}

export function rateLimitCheck(key: string, maxRequests: number, windowMs: number): boolean {
  // Simple in-memory rate limiter (resets on function cold start)
  const now = Date.now();
  const store = (globalThis as any).__rateLimits = (globalThis as any).__rateLimits || {};
  
  if (!store[key]) {
    store[key] = { count: 1, resetAt: now + windowMs };
    return true;
  }
  
  if (now > store[key].resetAt) {
    store[key] = { count: 1, resetAt: now + windowMs };
    return true;
  }
  
  store[key].count++;
  return store[key].count <= maxRequests;
}
