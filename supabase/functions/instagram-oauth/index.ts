import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTAGRAM_APP_ID = "1231864369151883";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INSTAGRAM_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub as string;

    const { code, redirect_uri, organization_id } = await req.json();

    if (!code || !redirect_uri || !organization_id) {
      return new Response(
        JSON.stringify({ error: "code, redirect_uri e organization_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is member of org
    const { data: isMember } = await supabaseAuth.rpc("is_org_member", {
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

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenForm,
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error_type || tokenData.error_message) {
      console.error("Instagram token exchange error:", tokenData);
      return new Response(
        JSON.stringify({ error: tokenData.error_message || "Erro ao trocar código por token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shortLivedToken = tokenData.access_token;
    const igUserId = tokenData.user_id;

    // Step 2: Exchange for long-lived token
    const longLivedUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(INSTAGRAM_APP_SECRET)}&access_token=${encodeURIComponent(shortLivedToken)}`;
    
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      console.error("Long-lived token error:", longLivedData.error);
      return new Response(
        JSON.stringify({ error: "Erro ao obter token de longa duração" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // ~60 days

    // Step 3: Get Instagram profile info
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,profile_picture_url,account_type&access_token=${encodeURIComponent(longLivedToken)}`
    );
    const profileData = await profileRes.json();

    if (profileData.error) {
      console.error("Profile fetch error:", profileData.error);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar perfil do Instagram" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const instagramAccount = {
      instagram_user_id: String(profileData.user_id || igUserId),
      username: profileData.username,
      full_name: profileData.name || null,
      profile_picture_url: profileData.profile_picture_url || null,
    };

    // Step 4: Save to DB using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
          access_token: longLivedToken,
          page_access_token: null,
          page_id: null,
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
        access_token: longLivedToken,
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
