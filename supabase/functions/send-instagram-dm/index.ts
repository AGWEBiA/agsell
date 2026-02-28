import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { broadcast_id } = await req.json();
    if (!broadcast_id) {
      return new Response(
        JSON.stringify({ error: "broadcast_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabaseAdmin
      .from("instagram_dm_broadcasts")
      .select("*")
      .eq("id", broadcast_id)
      .single();

    if (broadcastError || !broadcast) {
      return new Response(
        JSON.stringify({ error: "Broadcast não encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is member of org
    const { data: isMember } = await supabaseAuth.rpc("is_org_member", {
      _org_id: broadcast.organization_id,
      _user_id: user.id,
    });
    if (!isMember) {
      return new Response(
        JSON.stringify({ error: "Sem permissão" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Instagram account with access token
    const { data: igAccount, error: igError } = await supabaseAdmin
      .from("instagram_accounts")
      .select("access_token, instagram_user_id")
      .eq("id", broadcast.instagram_account_id)
      .single();

    if (igError || !igAccount?.access_token) {
      await supabaseAdmin.from("instagram_dm_broadcasts").update({
        status: "failed",
        error_message: "Conta do Instagram não encontrada ou sem token",
        completed_at: new Date().toISOString(),
      }).eq("id", broadcast_id);

      return new Response(
        JSON.stringify({ error: "Conta do Instagram não encontrada" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pending recipients
    const { data: recipients } = await supabaseAdmin
      .from("instagram_dm_broadcast_recipients")
      .select("*")
      .eq("broadcast_id", broadcast_id)
      .eq("status", "pending");

    if (!recipients?.length) {
      await supabaseAdmin.from("instagram_dm_broadcasts").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", broadcast_id);

      return new Response(
        JSON.stringify({ success: true, message: "Nenhum destinatário pendente" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark broadcast as processing
    await supabaseAdmin.from("instagram_dm_broadcasts").update({
      status: "processing",
    }).eq("id", broadcast_id);

    let sentCount = broadcast.sent_count || 0;
    let failedCount = broadcast.failed_count || 0;

    // Process each recipient with delay
    for (const recipient of recipients) {
      try {
        // Step 1: Get user ID from username using Instagram API
        // Note: The Instagram API requires the recipient's Instagram-scoped ID
        // For Business Login, we need to use the messaging endpoint
        const sendRes = await fetch(
          `https://graph.instagram.com/v21.0/${igAccount.instagram_user_id}/messages`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${igAccount.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipient: { username: recipient.username },
              message: { text: broadcast.message },
            }),
          }
        );

        const sendData = await sendRes.json();

        if (sendData.error) {
          console.error(`Failed to send DM to @${recipient.username}:`, sendData.error);
          await supabaseAdmin.from("instagram_dm_broadcast_recipients").update({
            status: "failed",
            error_message: sendData.error.message || "Erro ao enviar",
          }).eq("id", recipient.id);
          failedCount++;
        } else {
          await supabaseAdmin.from("instagram_dm_broadcast_recipients").update({
            status: "sent",
            sent_at: new Date().toISOString(),
          }).eq("id", recipient.id);
          sentCount++;
        }

        // Update broadcast counts
        await supabaseAdmin.from("instagram_dm_broadcasts").update({
          sent_count: sentCount,
          failed_count: failedCount,
        }).eq("id", broadcast_id);

        // Delay between messages to avoid rate limiting (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`Error processing @${recipient.username}:`, err);
        await supabaseAdmin.from("instagram_dm_broadcast_recipients").update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Erro desconhecido",
        }).eq("id", recipient.id);
        failedCount++;
      }
    }

    // Mark broadcast as completed
    await supabaseAdmin.from("instagram_dm_broadcasts").update({
      status: "completed",
      sent_count: sentCount,
      failed_count: failedCount,
      completed_at: new Date().toISOString(),
    }).eq("id", broadcast_id);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send Instagram DM error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar envio" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
