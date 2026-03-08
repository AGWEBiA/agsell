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
    const { action, phoneNumber, contactId, dealId, callId, recordingUrl } = await req.json();

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

    // Get user's org
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership?.organization_id) throw new Error("No organization found");
    const orgId = membership.organization_id;

    // Get VoIP provider settings
    const { data: providerData } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "voip_provider")
      .maybeSingle();

    const config = (providerData?.value as Record<string, unknown>) ?? {};

    switch (action) {
      case "initiate": {
        // Phase 2: Initiate a WebRTC call
        if (!config.enabled || config.provider === "none") {
          return new Response(
            JSON.stringify({ error: "VoIP WebRTC not configured. Using tel: fallback." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const cleanPhone = (phoneNumber || "").replace(/\D/g, "");
        const fullPhone = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;

        // Check credits
        const { data: credits } = await supabase
          .from("voip_credits")
          .select("balance")
          .eq("organization_id", orgId)
          .maybeSingle();

        if (!credits || credits.balance < 1) {
          return new Response(
            JSON.stringify({ error: "Créditos insuficientes. Adquira mais créditos em VoIP & Ligações." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create call record
        const { data: callRecord, error: callError } = await supabase
          .from("calls")
          .insert({
            organization_id: orgId,
            user_id: user.id,
            phone_number: cleanPhone,
            contact_id: contactId || null,
            deal_id: dealId || null,
            direction: "outbound",
            status: "initiated",
            started_at: new Date().toISOString(),
            metadata: { provider: config.provider },
          })
          .select()
          .single();

        if (callError) throw callError;

        // Generate WebRTC token based on provider
        let token = null;
        if (config.provider === "twilio") {
          // In production, this would use Twilio's API to generate a capability token
          // The admin will configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, etc.
          console.log(`[VOIP-CALL] Twilio call initiated to ${fullPhone} by ${user.email}`);
          token = `twilio_token_placeholder_${callRecord.id}`;
        } else if (config.provider === "vonage") {
          console.log(`[VOIP-CALL] Vonage call initiated to ${fullPhone} by ${user.email}`);
          token = `vonage_token_placeholder_${callRecord.id}`;
        }

        return new Response(
          JSON.stringify({
            callId: callRecord.id,
            token,
            provider: config.provider,
            phoneNumber: fullPhone,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "end": {
        // End a call and process recording
        if (!callId) throw new Error("callId is required");

        const now = new Date().toISOString();
        const { data: callData } = await supabase
          .from("calls")
          .select("started_at")
          .eq("id", callId)
          .single();

        const durationSeconds = callData?.started_at
          ? Math.round((Date.now() - new Date(callData.started_at).getTime()) / 1000)
          : 0;

        const creditsUsed = Math.max(1, Math.ceil(durationSeconds / 60) * ((config.credits_per_minute as number) || 1));

        // Update call record
        await supabase
          .from("calls")
          .update({
            status: "completed",
            ended_at: now,
            duration_seconds: durationSeconds,
            credits_used: creditsUsed,
            recording_url: recordingUrl || null,
          })
          .eq("id", callId);

        // Deduct credits
        await supabase.rpc("increment_automation_executions", { automation_id: callId }); // placeholder
        const { data: currentCredits } = await supabase
          .from("voip_credits")
          .select("balance, total_used")
          .eq("organization_id", orgId)
          .maybeSingle();

        if (currentCredits) {
          await supabase
            .from("voip_credits")
            .update({
              balance: Math.max(0, currentCredits.balance - creditsUsed),
              total_used: currentCredits.total_used + creditsUsed,
            })
            .eq("organization_id", orgId);
        }

        // Record transaction
        await supabase.from("voip_transactions").insert({
          organization_id: orgId,
          user_id: user.id,
          type: "consumption",
          amount: creditsUsed,
          description: `Chamada ${durationSeconds}s → ${creditsUsed} créditos`,
        });

        // Phase 3: Auto-transcribe if enabled and recording exists
        if (config.auto_transcribe && recordingUrl) {
          try {
            const transcribeResp = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ audioUrl: recordingUrl }),
            });
            const transcribeData = await transcribeResp.json();

            if (transcribeData.text) {
              await supabase
                .from("calls")
                .update({ transcript: transcribeData.text })
                .eq("id", callId);

              console.log(`[VOIP-CALL] Transcription completed for call ${callId}`);

              // Phase 3: Auto-analyze sentiment if enabled
              if (config.auto_sentiment) {
                try {
                  const sentimentResp = await fetch(`${supabaseUrl}/functions/v1/analyze-sentiment`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({ text: transcribeData.text }),
                  });
                  const sentimentData = await sentimentResp.json();

                  if (sentimentData.sentiment) {
                    await supabase
                      .from("calls")
                      .update({
                        metadata: {
                          provider: config.provider,
                          sentiment: sentimentData.sentiment,
                          sentiment_score: sentimentData.score,
                          sentiment_summary: sentimentData.summary,
                        },
                      })
                      .eq("id", callId);
                    console.log(`[VOIP-CALL] Sentiment analysis: ${sentimentData.sentiment} for call ${callId}`);
                  }
                } catch (sentErr) {
                  console.error("[VOIP-CALL] Sentiment analysis failed:", sentErr);
                }
              }
            }
          } catch (transErr) {
            console.error("[VOIP-CALL] Transcription failed:", transErr);
          }
        }

        return new Response(
          JSON.stringify({ success: true, duration: durationSeconds, creditsUsed }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("[VOIP-CALL] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
