import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_APP_ID = "1231864369151883";
const GRAPH_API_VERSION = "v21.0";

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
  const attempts: Array<{ name: string; url: string; method: "GET" | "POST"; body?: URLSearchParams }> = [];

  const igGetUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortLivedToken)}`;
  attempts.push({ name: "instagram_get", url: igGetUrl, method: "GET" });

  const igPostBody = new URLSearchParams();
  igPostBody.append("grant_type", "ig_exchange_token");
  igPostBody.append("client_secret", appSecret);
  igPostBody.append("access_token", shortLivedToken);
  attempts.push({ name: "instagram_post", url: "https://graph.instagram.com/access_token", method: "POST", body: igPostBody });

  const fbGetUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?client_id=${encodeURIComponent(INSTAGRAM_APP_ID)}&client_secret=${encodeURIComponent(appSecret)}&grant_type=fb_exchange_token&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;
  attempts.push({ name: "facebook_get", url: fbGetUrl, method: "GET" });

  const errors: any[] = [];

  for (const attempt of attempts) {
    const response = await fetch(attempt.url, {
      method: attempt.method,
      headers: attempt.method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
      body: attempt.body,
    });

    const raw = await response.text();
    const data = safeJsonParse(raw);

    if (response.ok && data?.access_token) {
      console.log("[INSTAGRAM-OAUTH] Long-lived token success", { provider: attempt.name });
      return {
        access_token: data.access_token,
        expires_in: data.expires_in,
      };
    }

    errors.push({ provider: attempt.name, error: data || raw });
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
    `https://graph.instagram.com/me?fields=id,user_id,username,name,profile_picture_url,account_type&access_token=${encodeURIComponent(accessToken)}`,
    `https://graph.instagram.com/${GRAPH_API_VERSION}/me?fields=id,user_id,username,name,profile_picture_url,account_type&access_token=${encodeURIComponent(accessToken)}`,
  ];

  let lastError = "Erro ao buscar perfil no graph.instagram.com";

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint);
    const raw = await response.text();
    const data = safeJsonParse(raw);

    if (response.ok && !data?.error) {
      const mapped = mapProfileFromAnyPayload(data);
      if (mapped) {
        return { profile: mapped };
      }
      lastError = "Resposta inválida ao buscar perfil no graph.instagram.com";
      continue;
    }

    lastError = extractErrorMessage(data, lastError);
  }

  return { error: lastError };
}

async function fetchProfileViaInstagramUserId(accessToken: string, igUserId?: string): Promise<{ profile?: ResolvedInstagramProfile; error?: string }> {
  if (!igUserId) {
    return { error: "IG User ID indisponível para lookup de perfil" };
  }

  const endpoints = [
    `https://graph.instagram.com/${igUserId}?fields=id,user_id,username,name,profile_picture_url,account_type&access_token=${encodeURIComponent(accessToken)}`,
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}?fields=id,user_id,username,name,profile_picture_url,account_type&access_token=${encodeURIComponent(accessToken)}`,
  ];

  let lastError = "Erro ao buscar perfil por ID no graph.instagram.com";

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint);
    const raw = await response.text();
    const data = safeJsonParse(raw);

    if (response.ok && !data?.error) {
      const mapped = mapProfileFromAnyPayload(data);
      if (mapped) {
        return { profile: mapped };
      }
      lastError = "Resposta inválida ao buscar perfil por ID no graph.instagram.com";
      continue;
    }

    lastError = extractErrorMessage(data, lastError);
  }

  return { error: lastError };
}

async function fetchProfileViaFacebookGraph(accessToken: string): Promise<{ profile?: ResolvedInstagramProfile; error?: string }> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(accessToken)}`
  );
  const raw = await response.text();
  const data = safeJsonParse(raw);

  if (!response.ok || data?.error) {
    return {
      error: data?.error?.message || data?.message || "Erro ao buscar páginas no graph.facebook.com",
    };
  }

  const pages = Array.isArray(data?.data) ? data.data : [];
  const pageWithInstagram = pages.find((page: any) => page?.instagram_business_account?.id && page?.instagram_business_account?.username);

  if (!pageWithInstagram) {
    return {
      error: "Nenhuma Página do Facebook com Instagram Business/Creator vinculada foi encontrada.",
    };
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
      page_access_token: pageWithInstagram.access_token || null,
    },
  };
}

async function resolveInstagramProfile(primaryToken: string, fallbackToken?: string, igUserId?: string): Promise<{ profile?: ResolvedInstagramProfile; error?: string }> {
  const attempts = [primaryToken, fallbackToken].filter((token, index, arr): token is string => !!token && arr.indexOf(token) === index);
  const errors: string[] = [];

  for (const token of attempts) {
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

    const viaFacebook = await fetchProfileViaFacebookGraph(token);
    if (viaFacebook.profile) {
      return viaFacebook;
    }
    if (viaFacebook.error) {
      errors.push(viaFacebook.error);
      console.warn("[INSTAGRAM-OAUTH] graph.facebook.com profile lookup failed", { error: viaFacebook.error });
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

    // Step 1: Exchange code for short-lived Instagram token
    const tokenForm = new URLSearchParams();
    tokenForm.append("client_id", INSTAGRAM_APP_ID);
    tokenForm.append("client_secret", INSTAGRAM_APP_SECRET);
    tokenForm.append("grant_type", "authorization_code");
    tokenForm.append("redirect_uri", redirect_uri);
    tokenForm.append("code", code);

    console.log("[INSTAGRAM-OAUTH] Step 1: Exchanging code for short-lived token", { redirect_uri });

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenForm,
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error_type || tokenData.error_message) {
      console.error("[INSTAGRAM-OAUTH] Token exchange error:", JSON.stringify(tokenData));
      return new Response(
        JSON.stringify({ error: tokenData.error_message || "Erro ao trocar código por token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedTokenData = normalizeTokenPayload(tokenData);
    const shortLivedToken = normalizedTokenData.access_token;
    const igUserId = normalizedTokenData.user_id;

    if (!shortLivedToken) {
      console.error("[INSTAGRAM-OAUTH] Step 1 returned no access_token", tokenData);
      return new Response(
        JSON.stringify({ error: "Não foi possível obter token de acesso do Instagram" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[INSTAGRAM-OAUTH] Step 1 OK: Got short-lived token", { igUserId });

    // Step 2: Exchange for long-lived token (Instagram endpoint)
    console.log("[INSTAGRAM-OAUTH] Step 2: Exchanging for long-lived token");
    const longLivedData = await exchangeLongLivedToken(shortLivedToken, INSTAGRAM_APP_SECRET);
    let finalToken = longLivedData.access_token || shortLivedToken;
    let expiresIn = longLivedData.expires_in || 3600;

    if (!longLivedData.access_token && longLivedData.error) {
      console.error("[INSTAGRAM-OAUTH] Long-lived token exchange failed, using short-lived fallback", longLivedData.error);
    }

    console.log("[INSTAGRAM-OAUTH] Step 3: Fetching profile");
    const resolvedProfile = await resolveInstagramProfile(finalToken, shortLivedToken, igUserId);

    if (!resolvedProfile.profile) {
      const normalizedError = (resolvedProfile.error || "").toLowerCase();
      const userSafeError = normalizedError.includes("unsupported request - method type")
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
