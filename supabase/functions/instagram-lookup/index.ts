import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token } = await req.json();

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: "access_token is required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user profile from Instagram Graph API
    const igResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url,account_type&access_token=${encodeURIComponent(access_token)}`
    );

    if (!igResponse.ok) {
      const errorData = await igResponse.json().catch(() => ({}));
      const msg = errorData?.error?.message || "Token inválido ou expirado";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile = await igResponse.json();

    return new Response(
      JSON.stringify({
        instagram_user_id: profile.id,
        username: profile.username,
        full_name: profile.name || null,
        profile_picture_url: profile.profile_picture_url || null,
        account_type: profile.account_type || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Instagram lookup error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao buscar dados do Instagram" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
