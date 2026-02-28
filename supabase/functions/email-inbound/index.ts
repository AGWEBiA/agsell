// Email Inbound Webhook - Routes incoming emails to SAC Inbox
// Supports generic webhook format from email providers (SendGrid Inbound Parse, Resend, etc.)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let payload: Record<string, unknown>;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      payload = {};
      formData.forEach((value, key) => {
        payload[key] = value;
      });
    } else {
      payload = await req.json().catch(() => ({}));
    }

    console.log("Email inbound received:", JSON.stringify(payload).slice(0, 500));

    // Extract email fields - support multiple provider formats
    const fromEmail = extractField(payload, ["from", "sender", "From", "envelope.from"]);
    const fromName = extractField(payload, ["from_name", "fromName", "sender_name"]);
    const subject = extractField(payload, ["subject", "Subject"]);
    const body = extractField(payload, ["text", "body", "plain", "stripped-text", "html", "content"]);
    const toEmail = extractField(payload, ["to", "To", "envelope.to", "recipient"]);

    if (!fromEmail) {
      return new Response(
        JSON.stringify({ error: "Missing sender email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine org from the "to" address domain or direct org lookup
    let organizationId: string | null = null;
    let userId: string | null = null;

    // Try to find org via email domain
    if (toEmail) {
      const domain = typeof toEmail === "string" ? toEmail.split("@")[1]?.toLowerCase() : null;
      if (domain) {
        const { data: emailDomain } = await supabase
          .from("email_domains")
          .select("organization_id")
          .eq("domain", domain)
          .eq("is_active", true)
          .maybeSingle();

        if (emailDomain) {
          organizationId = emailDomain.organization_id;
        }
      }
    }

    // Fallback: try to match sender email to an existing contact
    if (!organizationId) {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("organization_id")
        .eq("email", fromEmail)
        .limit(1)
        .maybeSingle();

      if (existingContact) {
        organizationId = existingContact.organization_id;
      }
    }

    if (!organizationId) {
      console.log("Could not determine organization for inbound email from:", fromEmail);
      return new Response(
        JSON.stringify({ error: "Organization not found for this email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get org owner
    const { data: orgOwner } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("role", "owner")
      .maybeSingle();

    userId = orgOwner?.user_id || null;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Organization has no owner" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or create contact by email
    let contactId: string | null = null;
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", fromEmail)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const contactName = typeof fromName === "string" && fromName
        ? fromName
        : fromEmail.split("@")[0];

      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          first_name: contactName,
          email: fromEmail,
          source: "email_inbound",
          status: "active",
        })
        .select("id")
        .single();

      if (newContact) contactId = newContact.id;
    }

    // Find or create conversation
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id, contact_id")
      .eq("organization_id", organizationId)
      .eq("channel", "email")
      .filter("metadata->>email_sender", "eq", fromEmail)
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          status: "open",
          contact_id: contactId || existingConv.contact_id,
        })
        .eq("id", conversationId);
    } else {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          organization_id: organizationId,
          channel: "email",
          status: "open",
          contact_id: contactId,
          last_message_at: new Date().toISOString(),
          metadata: {
            email_sender: fromEmail,
            email_subject: subject || "(sem assunto)",
          },
        })
        .select("id")
        .single();

      if (convError) {
        console.error("Error creating email conversation:", convError);
        return new Response(
          JSON.stringify({ error: "Failed to create conversation" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      conversationId = newConv.id;
    }

    // Build message content
    const messageContent = subject
      ? `**${subject}**\n\n${body || ""}`
      : (body as string) || "(mensagem vazia)";

    const { error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content: messageContent,
        sender_type: "contact",
        is_read: false,
      });

    if (msgError) {
      console.error("Error inserting email message:", msgError);
    } else {
      console.log("Email routed to inbox, conversation:", conversationId);
    }

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversationId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email inbound error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractField(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let current: unknown = obj;
      for (const part of parts) {
        if (current && typeof current === "object") {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current && typeof current === "string") return current;
    } else if (obj[key] && typeof obj[key] === "string") {
      return obj[key] as string;
    }
  }
  return null;
}
