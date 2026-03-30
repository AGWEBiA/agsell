import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_APP_ID = "912565888176650";
const GRAPH_API_VERSION = "v25.0";
const GRAPH_API_VERSIONS = ["v25.0", "v24.0", "v23.0", "v22.0", "v21.0"] as const;

type ResolvedInstagramProfile = {
  instagram_user_id: string;
  username: string;
  full_name: string | null;
  profile_picture_url: string | null;
  page_id: string | null;
  page_access_token: string | null;
};

function extractErrorMessage(payload: any, fallback = "Erro desconhecido"): string {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  return payload?.error?.message || payload?.message || fallback;
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sanitizeAccessToken(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^"+|"+$/g, "");
}

function expandTokenCandidates(raw: unknown): string[] {
  const primary = sanitizeAccessToken(raw);
  if (!primary) return [];

  const candidates = new Set<string>([primary]);

  try {
    const decoded = decodeURIComponent(primary);
    const normalizedDecoded = sanitizeAccessToken(decoded);
    if (normalizedDecoded) {
      candidates.add(normalizedDecoded);
    }
  } catch {
    // token may not be urlencoded; ignore
  }

  return Array.from(candidates);
}

function isFacebookUserToken(token: string): boolean {
  return sanitizeAccessToken(token).startsWith("EAA");
}

async function requestWithToken(baseUrl: string, token: string): Promise<{ ok: boolean; data: any }> {
  const queryUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`;

  const queryResponse = await fetch(queryUrl);
  const queryRaw = await queryResponse.text();
  const queryData = safeJsonParse(queryRaw);

  if (queryResponse.ok && !queryData?.error) {
    return { ok: true, data: queryData };
  }

  const headerResponse = await fetch(baseUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const headerRaw = await headerResponse.text();
  const headerData = safeJsonParse(headerRaw);

  if (headerResponse.ok && !headerData?.error) {
    return { ok: true, data: headerData };
  }

  return { ok: false, data: headerData || queryData || queryRaw || headerRaw };
}

function normalizeTokenPayload(payload: any): { access_token?: string; user_id?: string } {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  if (Array.isArray(payload.data) && payload.data.length > 0) {
    const first = payload.data[0] ?? {};
    return {
      access_token: first.access_token,
      user_id: first.user_id,
    };
  }

  return {
    access_token: payload.access_token,
    user_id: payload.user_id,
  };
}

async function exchangeLongLivedToken(shortLivedToken: string, appSecret: string): Promise<{ access_token?: string; expires_in?: number; error?: any }> {
  const errors: any[] = [];

  for (const tokenCandidate of expandTokenCandidates(shortLivedToken)) {
    const attempts: Array<{ name: string; url: string; method: "GET" | "POST"; body?: URLSearchParams }> = [];

    for (const version of GRAPH_API_VERSIONS) {
      const igVersionedGetUrl = `https://graph.instagram.com/${version}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(tokenCandidate)}`;
      attempts.push({ name: `instagram_get_${version}`, url: igVersionedGetUrl, method: "GET" });
    }

    const igGetUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(tokenCandidate)}`;
    attempts.push({ name: "instagram_get", url: igGetUrl, method: "GET" });

    const igPostBody = new URLSearchParams();
    igPostBody.append("grant_type", "ig_exchange_token");
    igPostBody.append("client_secret", appSecret);
    igPostBody.append("access_token", tokenCandidate);
    attempts.push({ name: "instagram_post", url: "https://graph.instagram.com/access_token", method: "POST", body: igPostBody });

    const fbGetUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?client_id=${encodeURIComponent(INSTAGRAM_APP_ID)}&client_secret=${encodeURIComponent(appSecret)}&grant_type=fb_exchange_token&fb_exchange_token=${encodeURIComponent(tokenCandidate)}`;
    attempts.push({ name: "facebook_get", url: fbGetUrl, method: "GET" });

    for (const attempt of attempts) {
      const response = await fetch(attempt.url, {
        method: attempt.method,
        headers: attempt.method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
        body: attempt.body,
      });

      const raw = await response.text();
      const data = safeJsonParse(raw);

      if (response.ok && data?.access_token) {
        console.log("[INSTAGRAM-OAUTH] Long-lived token success", {
          provider: attempt.name,
          tokenPrefix: sanitizeAccessToken(data.access_token).slice(0, 4),
        });
        return {
          access_token: sanitizeAccessToken(data.access_token),
          expires_in: data.expires_in,
        };
      }

      errors.push({ provider: attempt.name, error: data || raw });
    }
  }

  return { error: errors };
}

async function exchangeCodeForFacebookUserToken(
  code: string,
  redirectUri: string,
  appSecret: string,
): Promise<{ access_token?: string; error?: any }> {
  const errors: any[] = [];

  const endpoints = [
    ...GRAPH_API_VERSIONS.map((version) => `https://graph.facebook.com/${version}/oauth/access_token`),
    "https://graph.facebook.com/oauth/access_token",
  ];

  for (const endpoint of endpoints) {
    const url = `${endpoint}?client_id=${encodeURIComponent(INSTAGRAM_APP_ID)}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`;

    const response = await fetch(url, { method: "GET" });
    const raw = await response.text();
    const data = safeJsonParse(raw);

    if (response.ok && data?.access_token) {
      return { access_token: sanitizeAccessToken(data.access_token) };
    }

    errors.push({ endpoint, error: data || raw });
  }

  return { error: errors };
}

function mapProfileFromAnyPayload(payload: any): ResolvedInstagramProfile | null {
  const user = Array.isArray(payload?.data) ? payload.data[0] : payload;

  if (!user?.username || !(user?.user_id || user?.id)) {
    return null;
  }

  return {
    instagram_user_id: String(user.user_id || user.id),
    username: user.username,
    full_name: user.name || null,
    profile_picture_url: user.profile_picture_url || null,
    page_id: null,
    page_access_token: null,
  };
}

async function fetchProfileViaInstagramGraph(accessToken: string): Promise<{ profile?: ResolvedInstagramProfile; error?: string }> {
  const endpoints = [
    "https://graph.instagram.com/me?fields=id,user_id,username,name,profile_picture_url,account_type",
    ...GRAPH_API_VERSIONS.map((version) => `https://graph.instagram.com/${version}/me?fields=id,user_id,username,name,profile_picture_url,account_type`),
  ];

  let lastError = "Erro ao buscar perfil no graph.instagram.com";

  for (const endpoint of endpoints) {
    const response = await requestWithToken(endpoint, accessToken);

    if (response.ok && !response.data?.error) {
      const mapped = mapProfileFromAnyPayload(response.data);
      if (mapped) {
        return { profile: mapped };
      }
      lastError = "Resposta inválida ao buscar perfil no graph.instagram.com";
      continue;
    }

    lastError = extractErrorMessage(response.data, lastError);
  }

  return { error: lastError };
}

async function fetchProfileViaInstagramUserId(accessToken: string, igUserId?: string): Promise<{ profile?: ResolvedInstagramProfile; error?: string }> {
  if (!igUserId) {
    return { error: "IG User ID indisponível para lookup de perfil" };
  }

  const endpoints = [
    `https://graph.instagram.com/${igUserId}?fields=id,user_id,username,name,profile_picture_url,account_type`,
    ...GRAPH_API_VERSIONS.map((version) => `https://graph.instagram.com/${version}/${igUserId}?fields=id,user_id,username,name,profile_picture_url,account_type`),
  ];

  let lastError = "Erro ao buscar perfil por ID no graph.instagram.com";

  for (const endpoint of endpoints) {
    const response = await requestWithToken(endpoint, accessToken);

    if (response.ok && !response.data?.error) {
      const mapped = mapProfileFromAnyPayload(response.data);
      if (mapped) {
        return { profile: mapped };
      }
      lastError = "Resposta inválida ao buscar perfil por ID no graph.instagram.com";
      continue;
    }

    lastError = extractErrorMessage(response.data, lastError);
  }

  return { error: lastError };
}

async function fetchProfileViaFacebookGraph(accessToken: string): Promise<{ profile?: ResolvedInstagramProfile; error?: string }> {
  let lastError = "Erro ao buscar páginas no graph.facebook.com";

  for (const version of GRAPH_API_VERSIONS) {
    const response = await requestWithToken(
      `https://graph.facebook.com/${version}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}`,
      accessToken,
    );

    if (!response.ok || response.data?.error) {
      lastError = extractErrorMessage(response.data, lastError);
      continue;
    }

    const pages = Array.isArray(response.data?.data) ? response.data.data : [];
    const pageWithInstagram = pages.find((page: any) => page?.instagram_business_account?.id && page?.instagram_business_account?.username);

    if (!pageWithInstagram) {
      lastError = "Nenhuma Página do Facebook com Instagram Business/Creator vinculada foi encontrada.";
      continue;
    }

    return {
      profile: {
        instagram_user_id: String(pageWithInstagram.instagram_business_account.id),
        username: pageWithInstagram.instagram_business_account.username,
        full_name:
          pageWithInstagram.instagram_business_account.name ||
          pageWithInstagram.name ||
          null,
        profile_picture_url: pageWithInstagram.instagram_business_account.profile_picture_url || null,
        page_id: pageWithInstagram.id || null,
        page_access_token: sanitizeAccessToken(pageWithInstagram.access_token) || null,
      },
    };
  }

  return { error: lastError };
}

async function resolveInstagramProfile(
  primaryToken: string,
  fallbackToken?: string,
  igUserId?: string,
  facebookUserToken?: string,
): Promise<{ profile?: ResolvedInstagramProfile; error?: string }> {
  const attempts = [primaryToken, fallbackToken, facebookUserToken]
    .flatMap((token) => expandTokenCandidates(token))
    .filter((token, index, arr) => arr.indexOf(token) === index);

  const errors: string[] = [];

  for (const token of attempts) {
    if (!isFacebookUserToken(token)) {
      const viaInstagram = await fetchProfileViaInstagramGraph(token);
      if (viaInstagram.profile) {
        return viaInstagram;
      }
      if (viaInstagram.error) {
        errors.push(viaInstagram.error);
        console.warn("[INSTAGRAM-OAUTH] graph.instagram.com profile lookup failed", { error: viaInstagram.error });
      }

      const viaInstagramById = await fetchProfileViaInstagramUserId(token, igUserId);
      if (viaInstagramById.profile) {
        return viaInstagramById;
      }
      if (viaInstagramById.error) {
        errors.push(viaInstagramById.error);
        console.warn("[INSTAGRAM-OAUTH] graph.instagram.com profile-by-id lookup failed", { error: viaInstagramById.error });
      }
    }

    if (isFacebookUserToken(token)) {
      const viaFacebook = await fetchProfileViaFacebookGraph(token);
      if (viaFacebook.profile) {
        return viaFacebook;
      }
      if (viaFacebook.error) {
        errors.push(viaFacebook.error);
        console.warn("[INSTAGRAM-OAUTH] graph.facebook.com profile lookup failed", { error: viaFacebook.error });
      }
    }
  }

  return {
    error:
      errors[errors.length - 1] ||
      "Não foi possível identificar o perfil do Instagram com os tokens retornados.",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET");
    if (!INSTAGRAM_APP_SECRET) {
      return new Response(
        JSON.stringify({ error: "Instagram App Secret não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = userData.user.id;

    const { code, redirect_uri, organization_id } = await req.json();
    console.log("[INSTAGRAM-OAUTH] Request received", { redirect_uri, organization_id, hasCode: !!code, userId });

    if (!code || !redirect_uri || !organization_id) {
      return new Response(
        JSON.stringify({ error: "code, redirect_uri e organization_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is member of org
    const { data: isMember } = await supabaseAdmin.rpc("is_org_member", {
      _org_id: organization_id,
      _user_id: userId,
    });
    if (!isMember) {
      return new Response(
        JSON.stringify({ error: "Você não é membro desta organização" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Try exchanging code for short-lived Instagram token
    const tokenForm = new URLSearchParams();
    tokenForm.append("client_id", INSTAGRAM_APP_ID);
    tokenForm.append("client_secret", INSTAGRAM_APP_SECRET);
    tokenForm.append("grant_type", "authorization_code");
    tokenForm.append("redirect_uri", redirect_uri);
    tokenForm.append("code", code);

    console.log("[INSTAGRAM-OAUTH] Step 1: Exchanging code for short-lived token", { redirect_uri });

    let shortLivedToken = "";
    let igUserId: string | undefined;
    let step1ErrorMessage: string | null = null;

    try {
      const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        body: tokenForm,
      });
      const tokenRaw = await tokenRes.text();
      const tokenData = safeJsonParse(tokenRaw) || {};
      const normalizedTokenData = normalizeTokenPayload(tokenData);

      shortLivedToken = sanitizeAccessToken(normalizedTokenData.access_token);
      igUserId = normalizedTokenData.user_id ? String(normalizedTokenData.user_id) : undefined;

      if (tokenRes.ok && shortLivedToken && !tokenData.error_type && !tokenData.error_message) {
        console.log("[INSTAGRAM-OAUTH] Step 1 OK: Got short-lived token", {
          igUserId,
          tokenPrefix: shortLivedToken.slice(0, 4),
          tokenLength: shortLivedToken.length,
        });
      } else {
        step1ErrorMessage = extractErrorMessage(
          tokenData,
          `Erro ao trocar código por token do Instagram (HTTP ${tokenRes.status})`,
        );
        console.warn("[INSTAGRAM-OAUTH] Step 1 unavailable, continuing with Facebook fallback", {
          status: tokenRes.status,
          error: step1ErrorMessage,
        });
      }
    } catch (step1Error) {
      step1ErrorMessage =
        step1Error instanceof Error
          ? step1Error.message
          : "Erro ao trocar código por token do Instagram";
      console.warn("[INSTAGRAM-OAUTH] Step 1 request failed, continuing with Facebook fallback", {
        error: step1ErrorMessage,
      });
    }

    console.log("[INSTAGRAM-OAUTH] Step 1B: Exchanging code for Facebook user token fallback");
    const facebookTokenData = await exchangeCodeForFacebookUserToken(code, redirect_uri, INSTAGRAM_APP_SECRET);
    const facebookUserToken = sanitizeAccessToken(facebookTokenData.access_token);
    if (facebookUserToken) {
      console.log("[INSTAGRAM-OAUTH] Step 1B OK: Got Facebook user token fallback", {
        tokenPrefix: facebookUserToken.slice(0, 4),
      });
    } else if (facebookTokenData.error) {
      console.warn("[INSTAGRAM-OAUTH] Facebook user token fallback unavailable", facebookTokenData.error);
    }

    if (!shortLivedToken && !facebookUserToken) {
      const normalizedError = (step1ErrorMessage || "").toLowerCase();
      const userSafeError = normalizedError.includes("error validating application") || normalizedError.includes("application info")
        ? "A Meta rejeitou a validação desta aplicação para este login. Verifique no app da Meta se ele está em modo Live, com permissões de produção aprovadas e contrato de Business Login aceito, depois tente novamente."
        : step1ErrorMessage || "Não foi possível obter um token válido retornado pela Meta.";

      return new Response(
        JSON.stringify({ error: userSafeError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 2: Exchange for long-lived token (Instagram endpoint) when available
    console.log("[INSTAGRAM-OAUTH] Step 2: Exchanging for long-lived token");
    let finalToken = shortLivedToken;
    let expiresIn = 3600;

    if (shortLivedToken) {
      const longLivedData = await exchangeLongLivedToken(shortLivedToken, INSTAGRAM_APP_SECRET);
      finalToken = sanitizeAccessToken(longLivedData.access_token || shortLivedToken);
      expiresIn = longLivedData.expires_in || 3600;

      if (!longLivedData.access_token && longLivedData.error) {
        console.error("[INSTAGRAM-OAUTH] Long-lived token exchange failed, using short-lived fallback", longLivedData.error);
      }
    }

    if (!finalToken && facebookUserToken) {
      finalToken = facebookUserToken;
      console.log("[INSTAGRAM-OAUTH] Using Facebook user token as primary token fallback", {
        tokenPrefix: facebookUserToken.slice(0, 4),
      });
    }

    if (!finalToken) {
      return new Response(
        JSON.stringify({ error: "Não foi possível validar token de acesso retornado pelo Instagram" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[INSTAGRAM-OAUTH] Step 3: Fetching profile");
    const resolvedProfile = await resolveInstagramProfile(finalToken, shortLivedToken, igUserId, facebookUserToken);

    if (!resolvedProfile.profile) {
      const normalizedError = (resolvedProfile.error || "").toLowerCase();
      const userSafeError = normalizedError.includes("cannot parse access token")
        ? "A Meta rejeitou o token retornado nesta conexão. Tente novamente e, se persistir, reconecte a conta no Instagram Business Login para gerar um novo token válido."
        : normalizedError.includes("error validating application") || normalizedError.includes("application info")
        ? "A Meta rejeitou a validação desta aplicação para este login. Verifique no app da Meta se ele está em modo Live, com permissões de produção aprovadas e contrato de Business Login aceito, depois tente novamente."
        : normalizedError.includes("unsupported request - method type")
        ? "Não foi possível concluir a conexão com os dados retornados pela Meta para essa conta. Confirme se a conta é Business/Creator e se está vinculada a uma Página do Facebook, então tente novamente."
        : (resolvedProfile.error || "Erro ao buscar perfil do Instagram");

      return new Response(
        JSON.stringify({ error: userSafeError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const instagramAccount = {
      instagram_user_id: String(resolvedProfile.profile.instagram_user_id || igUserId),
      username: resolvedProfile.profile.username,
      full_name: resolvedProfile.profile.full_name || null,
      profile_picture_url: resolvedProfile.profile.profile_picture_url || null,
      page_id: resolvedProfile.profile.page_id,
      page_access_token: resolvedProfile.profile.page_access_token,
    };

    // Use supabaseAdmin already created above

    const { data: existing } = await supabaseAdmin
      .from("instagram_accounts")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("instagram_user_id", instagramAccount.instagram_user_id)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("instagram_accounts")
        .update({
           access_token: finalToken,
          page_access_token: instagramAccount.page_access_token,
          page_id: instagramAccount.page_id,
          username: instagramAccount.username,
          full_name: instagramAccount.full_name,
          profile_picture_url: instagramAccount.profile_picture_url,
          is_active: true,
          token_expires_at: expiresIn
            ? new Date(Date.now() + expiresIn * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      return new Response(
        JSON.stringify({ success: true, updated: true, account: instagramAccount }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new
    const { error: insertError } = await supabaseAdmin
      .from("instagram_accounts")
      .insert({
        organization_id,
        access_token: finalToken,
        page_access_token: instagramAccount.page_access_token,
        page_id: instagramAccount.page_id,
        instagram_user_id: instagramAccount.instagram_user_id,
        username: instagramAccount.username,
        full_name: instagramAccount.full_name,
        profile_picture_url: instagramAccount.profile_picture_url,
        connected_by: userId,
        token_expires_at: expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar conta: " + insertError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, updated: false, account: instagramAccount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Instagram OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar autenticação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
