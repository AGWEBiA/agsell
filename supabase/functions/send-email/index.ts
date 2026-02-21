// SendGrid / Resend / Amazon SES Email Sender
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  organization_id: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailReq = (await req.json()) as EmailRequest;

    // --- Resolve sender address from verified domain ---
    let resolvedFrom = emailReq.from;
    if (!resolvedFrom && emailReq.organization_id) {
      const { data: verifiedDomain } = await supabase
        .from("email_domains")
        .select("from_email, from_name, domain")
        .eq("organization_id", emailReq.organization_id)
        .eq("status", "verified")
        .eq("is_active", true)
        .order("verified_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (verifiedDomain) {
        const name = verifiedDomain.from_name || "";
        const email = verifiedDomain.from_email || `noreply@${verifiedDomain.domain}`;
        resolvedFrom = name ? `${name} <${email}>` : email;
      }
    }

    // --- Find active email provider (global) ---
    // Look for any active email integration across all orgs (global provider set by admin)
    const { data: activeIntegration } = await supabase
      .from("organization_integrations")
      .select("integration_type, config")
      .in("integration_type", ["resend", "amazon_ses", "sendgrid"])
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!activeIntegration) {
      return new Response(
        JSON.stringify({ error: "No email integration configured. Admin must configure a provider." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = activeIntegration.config as Record<string, string>;
    // Use resolved from, or config default, or platform fallback
    const finalFrom = resolvedFrom || config.from_email || "noreply@agsell.com";
    const emailReqWithFrom = { ...emailReq, from: finalFrom };

    switch (activeIntegration.integration_type) {
      case "sendgrid":
        return await sendWithSendGrid(config, emailReqWithFrom);
      case "resend":
        return await sendWithResend(config, emailReqWithFrom);
      case "amazon_ses":
        return await sendWithAmazonSES(config, emailReqWithFrom);
      default:
        return new Response(
          JSON.stringify({ error: `Unknown provider: ${activeIntegration.integration_type}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendWithSendGrid(config: Record<string, string>, emailReq: EmailRequest) {
  const apiKey = config.api_key;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "SendGrid API key not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const toAddresses = Array.isArray(emailReq.to)
    ? emailReq.to.map((email) => ({ email }))
    : [{ email: emailReq.to }];

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: toAddresses }],
      from: { email: emailReq.from || config.from_email || "noreply@agsell.com" },
      reply_to: emailReq.reply_to ? { email: emailReq.reply_to } : undefined,
      subject: emailReq.subject,
      content: [
        ...(emailReq.text ? [{ type: "text/plain", value: emailReq.text }] : []),
        { type: "text/html", value: emailReq.html },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("SendGrid error:", errorText);
    return new Response(
      JSON.stringify({ error: `SendGrid error: ${response.status}` }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, provider: "sendgrid" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function sendWithResend(config: Record<string, string>, emailReq: EmailRequest) {
  const apiKey = config.api_key;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Resend API key not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailReq.from || config.from_email || "AG Sell <noreply@agsell.com>",
      to: Array.isArray(emailReq.to) ? emailReq.to : [emailReq.to],
      reply_to: emailReq.reply_to,
      subject: emailReq.subject,
      html: emailReq.html,
      text: emailReq.text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Resend error:", data);
    return new Response(
      JSON.stringify({ error: `Resend error: ${data.message || response.status}` }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, provider: "resend", id: data.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function sendWithAmazonSES(config: Record<string, string>, emailReq: EmailRequest) {
  const access_key_id = (config.access_key_id || '').trim();
  const secret_access_key = (config.secret_access_key || '').trim();
  const region = (config.region || '').trim();
  const from_email = (config.from_email || '').trim();

  if (!access_key_id || !secret_access_key || !region) {
    return new Response(
      JSON.stringify({ error: "Amazon SES credentials not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const toAddresses = Array.isArray(emailReq.to) ? emailReq.to : [emailReq.to];
  const fromAddress = emailReq.from || from_email || "noreply@agsell.com";

  const params = new URLSearchParams();
  params.append('Action', 'SendEmail');
  params.append('Source', fromAddress);
  params.append('Message.Subject.Data', emailReq.subject);
  params.append('Message.Body.Html.Data', emailReq.html);
  if (emailReq.text) {
    params.append('Message.Body.Text.Data', emailReq.text);
  }
  toAddresses.forEach((addr, i) => {
    params.append(`Destination.ToAddresses.member.${i + 1}`, addr);
  });
  if (emailReq.reply_to) {
    params.append('ReplyToAddresses.member.1', emailReq.reply_to);
  }
  params.append('Version', '2010-12-01');

  const endpoint = `https://email.${region}.amazonaws.com/`;
  const body = params.toString();

  try {
    const { AwsClient } = await import("npm:aws4fetch@1.0.20");
    console.log("SES config - region:", region, "keyId:", access_key_id.substring(0, 4) + "...", "secretLen:", secret_access_key.length);
    
    // Use SESv2 SendEmail API (JSON-based, simpler signing)
    const sesV2Endpoint = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;
    
    const emailPayload = {
      FromEmailAddress: fromAddress,
      Destination: {
        ToAddresses: toAddresses,
      },
      Content: {
        Simple: {
          Subject: {
            Data: emailReq.subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: emailReq.html,
              Charset: "UTF-8",
            },
            ...(emailReq.text ? {
              Text: {
                Data: emailReq.text,
                Charset: "UTF-8",
              },
            } : {}),
          },
        },
      },
      ...(emailReq.reply_to ? {
        ReplyToAddresses: [emailReq.reply_to],
      } : {}),
    };

    const aws = new AwsClient({
      accessKeyId: access_key_id,
      secretAccessKey: secret_access_key,
      region: region,
    });

    console.log("Sending SES v2 request to:", sesV2Endpoint);
    const response = await aws.fetch(sesV2Endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Amazon SES error:", responseText);
      return new Response(
        JSON.stringify({ error: `Amazon SES error: ${response.status}`, details: responseText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SES v2 returns JSON
    let messageId = null;
    try {
      const jsonResponse = JSON.parse(responseText);
      messageId = jsonResponse.MessageId;
    } catch {
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
      messageId = messageIdMatch ? messageIdMatch[1] : null;
    }

    return new Response(
      JSON.stringify({ success: true, provider: "amazon_ses", id: messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Amazon SES request error:", error);
    return new Response(
      JSON.stringify({ error: `Amazon SES request failed: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
