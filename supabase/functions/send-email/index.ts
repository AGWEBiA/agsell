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

    // Try SendGrid first
    const { data: sendgridInt } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", emailReq.organization_id)
      .eq("integration_type", "sendgrid")
      .eq("is_active", true)
      .maybeSingle();

    if (sendgridInt) {
      return await sendWithSendGrid(sendgridInt.config as Record<string, string>, emailReq);
    }

    // Try Resend
    const { data: resendInt } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", emailReq.organization_id)
      .eq("integration_type", "resend")
      .eq("is_active", true)
      .maybeSingle();

    if (resendInt) {
      return await sendWithResend(resendInt.config as Record<string, string>, emailReq);
    }

    // Try Amazon SES
    const { data: sesInt } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("organization_id", emailReq.organization_id)
      .eq("integration_type", "amazon_ses")
      .eq("is_active", true)
      .maybeSingle();

    if (sesInt) {
      return await sendWithAmazonSES(sesInt.config as Record<string, string>, emailReq);
    }

    return new Response(
      JSON.stringify({ error: "No email integration configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

// AWS Signature V4 helper functions
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return toHex(hashBuffer);
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  
  const kDate = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey("raw", encoder.encode("AWS4" + key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    encoder.encode(dateStamp)
  );
  
  const kRegion = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey("raw", kDate, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    encoder.encode(region)
  );
  
  const kService = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey("raw", kRegion, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    encoder.encode(service)
  );
  
  const kSigning = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey("raw", kService, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    encoder.encode("aws4_request")
  );
  
  return kSigning;
}

async function signRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  service: string
): Promise<Record<string, string>> {
  const parsedUrl = new URL(url);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  
  headers['x-amz-date'] = amzDate;
  headers['host'] = parsedUrl.host;
  
  const signedHeaders = Object.keys(headers).sort().join(';').toLowerCase();
  const canonicalHeaders = Object.entries(headers)
    .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
    .join('\n') + '\n';
  
  const payloadHash = await sha256(body);
  
  const canonicalRequest = [
    method,
    parsedUrl.pathname,
    parsedUrl.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const canonicalRequestHash = await sha256(canonicalRequest);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey("raw", signingKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    encoder.encode(stringToSign)
  );
  const signature = toHex(signatureBuffer);
  
  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return headers;
}

async function sendWithAmazonSES(config: Record<string, string>, emailReq: EmailRequest) {
  const { access_key_id, secret_access_key, region, from_email } = config;
  
  if (!access_key_id || !secret_access_key || !region) {
    return new Response(
      JSON.stringify({ error: "Amazon SES credentials not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const toAddresses = Array.isArray(emailReq.to) ? emailReq.to : [emailReq.to];
  const fromAddress = emailReq.from || from_email || "noreply@agsell.com";

  // Build SES API request body
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

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const signedHeaders = await signRequest(
    'POST',
    endpoint,
    requestHeaders,
    body,
    access_key_id,
    secret_access_key,
    region,
    'ses'
  );

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: signedHeaders,
      body: body,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Amazon SES error:", responseText);
      return new Response(
        JSON.stringify({ error: `Amazon SES error: ${response.status}`, details: responseText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract MessageId from XML response
    const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
    const messageId = messageIdMatch ? messageIdMatch[1] : null;

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
