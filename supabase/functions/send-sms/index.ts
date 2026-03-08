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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { to, message, organization_id } = await req.json();

    if (!to || !message || !organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, message, organization_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get platform-level SMS provider config
    const { data: smsProviderData } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "sms_provider")
      .maybeSingle();

    const providerConfig = (smsProviderData?.value as Record<string, unknown>) ?? {};
    const provider = (providerConfig.provider as string) || "zenvia";

    // Also check org-level sms_configs for backward compat
    const { data: smsConfig } = await supabase
      .from("sms_configs")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const activeProvider = smsConfig?.provider || provider;

    // Check SMS credits
    const { data: credits } = await supabase
      .from("sms_credits")
      .select("balance")
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (!credits || credits.balance < 1) {
      return new Response(
        JSON.stringify({ error: "Créditos SMS insuficientes. Adquira mais créditos." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number
    let cleanPhone = to.replace(/\D/g, "");
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11 && !cleanPhone.startsWith("55")) {
      cleanPhone = "55" + cleanPhone;
    }

    let result: Record<string, unknown>;

    if (activeProvider === "zenvia") {
      // ─── Zenvia SMS API v2 ───
      const zenviaToken = providerConfig.zenvia_api_token as string ||
        Deno.env.get("ZENVIA_API_TOKEN");

      if (!zenviaToken) {
        return new Response(
          JSON.stringify({ error: "Zenvia API token not configured. Admin must set ZENVIA_API_TOKEN." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const zenviaFrom = (providerConfig.zenvia_sender_name as string) || "AG Sell";

      const response = await fetch("https://api.zenvia.com/v2/channels/sms/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Token": zenviaToken,
        },
        body: JSON.stringify({
          from: zenviaFrom,
          to: cleanPhone,
          contents: [
            {
              type: "text",
              text: message,
            },
          ],
        }),
      });

      result = await response.json();

      if (!response.ok) {
        console.error("[SEND-SMS] Zenvia error:", JSON.stringify(result));
        throw new Error((result as any).message || (result as any).code || "Zenvia API error");
      }

      console.log(`[SEND-SMS] Zenvia SMS sent to ${cleanPhone}: ${(result as any).id}`);

    } else if (activeProvider === "twilio") {
      // ─── Twilio ───
      const org = await supabase.from("organizations").select("settings").eq("id", organization_id).single();
      const settings = (org.data?.settings as Record<string, string>) || {};
      const accountSid = settings.twilio_account_sid;
      const authToken = settings.twilio_auth_token;

      if (!accountSid || !authToken) {
        return new Response(
          JSON.stringify({ error: "Twilio credentials not configured." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `+${cleanPhone}`,
          From: smsConfig?.from_number || "",
          Body: message,
        }),
      });

      result = await response.json();
      if (!response.ok) throw new Error((result as any).message || "Twilio API error");

    } else if (activeProvider === "vonage") {
      // ─── Vonage ───
      const org = await supabase.from("organizations").select("settings").eq("id", organization_id).single();
      const settings = (org.data?.settings as Record<string, string>) || {};
      const apiKey = settings.vonage_api_key;
      const apiSecret = settings.vonage_api_secret;

      if (!apiKey || !apiSecret) {
        return new Response(
          JSON.stringify({ error: "Vonage credentials not configured." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch("https://rest.nexmo.com/sms/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          to: cleanPhone,
          from: smsConfig?.from_number || "AG Sell",
          text: message,
        }),
      });

      result = await response.json();
      if ((result as any).messages?.[0]?.status !== "0") {
        throw new Error((result as any).messages?.[0]?.["error-text"] || "Vonage API error");
      }
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported SMS provider: ${activeProvider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct 1 SMS credit
    await supabase
      .from("sms_credits")
      .update({ balance: Math.max(0, credits.balance - 1) })
      .eq("organization_id", organization_id);

    // Record transaction
    await supabase.from("sms_transactions").insert({
      organization_id,
      type: "consumption",
      amount: 1,
      description: `SMS enviado para ${cleanPhone}`,
    });

    // Update legacy counter if exists
    if (smsConfig) {
      await supabase
        .from("sms_configs")
        .update({ messages_sent: (smsConfig.messages_sent || 0) + 1 })
        .eq("id", smsConfig.id);
    }

    return new Response(
      JSON.stringify({ success: true, provider: activeProvider, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[SEND-SMS] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
