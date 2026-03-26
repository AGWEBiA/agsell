import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();
    if (!campaignId) throw new Error("campaignId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) throw new Error("Authentication failed");

    // Get campaign
    const { data: campaign, error: campError } = await supabase
      .from("voip_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campError || !campaign) throw new Error("Campaign not found");

    // Verify user belongs to org
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", campaign.organization_id)
      .maybeSingle();

    if (!membership) throw new Error("Unauthorized");

    // Get VoIP provider config
    const { data: providerData } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "voip_provider")
      .maybeSingle();

    const config = (providerData?.value as Record<string, unknown>) ?? {};

    // Get contacts by tags
    const { data: contactIds } = await supabase
      .from("contact_tags")
      .select("contact_id")
      .in("tag_id", campaign.target_tags || []);

    const uniqueContactIds = [...new Set((contactIds || []).map((c: { contact_id: string }) => c.contact_id))];

    if (uniqueContactIds.length === 0) {
      await supabase
        .from("voip_campaigns")
        .update({ status: "completed", completed_at: new Date().toISOString(), target_count: 0 })
        .eq("id", campaignId);

      return new Response(
        JSON.stringify({ success: true, message: "No contacts found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get contacts with phone numbers
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, phone, whatsapp, first_name")
      .in("id", uniqueContactIds)
      .not("phone", "is", null);

    const validContacts = (contacts || []).filter(c => c.phone && c.phone.length >= 10);

    // Update target count
    await supabase
      .from("voip_campaigns")
      .update({ target_count: validContacts.length, status: "processing" })
      .eq("id", campaignId);

    // Check credits
    const { data: credits } = await supabase
      .from("voip_credits")
      .select("balance")
      .eq("organization_id", campaign.organization_id)
      .maybeSingle();

    const requiredCredits = validContacts.length * (campaign.credits_per_call || 1);
    if (!credits || credits.balance < requiredCredits) {
      await supabase
        .from("voip_campaigns")
        .update({ status: "failed" })
        .eq("id", campaignId);

      return new Response(
        JSON.stringify({ error: "Créditos insuficientes para esta campanha" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process calls (batch)
    let sentCount = 0;
    let failedCount = 0;

    for (const contact of validContacts) {
      try {
        const cleanPhone = (contact.phone || "").replace(/\D/g, "");
        const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

        // Create call record
        await supabase.from("calls").insert({
          organization_id: campaign.organization_id,
          user_id: campaign.user_id,
          phone_number: cleanPhone,
          contact_id: contact.id,
          direction: "outbound",
          status: "initiated",
          started_at: new Date().toISOString(),
          credits_used: campaign.credits_per_call || 1,
          metadata: { campaign_id: campaignId, type: "voice_torpedo" },
        });

        // If Zenvia is configured, initiate call via API
        if (config.provider === "zenvia") {
          const zenviaToken = (config.zenvia_api_token as string) || Deno.env.get("ZENVIA_API_TOKEN");
          const callerNumber = (config.zenvia_caller_number as string) || "";

          if (zenviaToken && callerNumber) {
            const response = await fetch("https://voice-api.zenvia.com/v2/chamada", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Access-Token": zenviaToken,
              },
              body: JSON.stringify({
                numero_origem: callerNumber,
                numero_destino: fullPhone,
                gravar_audio: config.record_calls ?? false,
                detectar_caixa: true,
                url_audio: campaign.audio_url,
              }),
            });

            if (!response.ok) {
              console.error(`[VOIP-CAMPAIGN] Failed to call ${fullPhone}`);
              failedCount++;
              continue;
            }
          }
        }

        sentCount++;

        // Update progress every 10 calls
        if (sentCount % 10 === 0) {
          await supabase
            .from("voip_campaigns")
            .update({ sent_count: sentCount, failed_count: failedCount })
            .eq("id", campaignId);
        }

        // Small delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`[VOIP-CAMPAIGN] Error processing contact ${contact.id}:`, err);
        failedCount++;
      }
    }

    // Deduct credits
    const totalCreditsUsed = sentCount * (campaign.credits_per_call || 1);
    if (totalCreditsUsed > 0) {
      const { data: currentCredits } = await supabase
        .from("voip_credits")
        .select("balance, total_used")
        .eq("organization_id", campaign.organization_id)
        .maybeSingle();

      if (currentCredits) {
        await supabase
          .from("voip_credits")
          .update({
            balance: Math.max(0, currentCredits.balance - totalCreditsUsed),
            total_used: currentCredits.total_used + totalCreditsUsed,
          })
          .eq("organization_id", campaign.organization_id);
      }

      await supabase.from("voip_transactions").insert({
        organization_id: campaign.organization_id,
        user_id: campaign.user_id,
        type: "consumption",
        amount: totalCreditsUsed,
        description: `Torpedo de Voz "${campaign.name}" → ${totalCreditsUsed} créditos (${sentCount} chamadas)`,
      });
    }

    // Final update
    await supabase
      .from("voip_campaigns")
      .update({
        status: "completed",
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    console.log(`[VOIP-CAMPAIGN] Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sentCount, failedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[VOIP-CAMPAIGN] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
