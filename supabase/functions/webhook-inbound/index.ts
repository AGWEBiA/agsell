// Inbound Webhook Handler - Receives data from external systems
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface WebhookConfig {
  id: string;
  organization_id: string;
  name: string;
  secret_token: string;
  is_active: boolean;
  target_action: string;
  field_mapping: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Extract endpoint ID from URL path
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const endpointId = pathParts[pathParts.length - 1];

  if (!endpointId || endpointId === "webhook-inbound") {
    return new Response(
      JSON.stringify({ error: "Endpoint ID required", code: "MISSING_ENDPOINT" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let logId: string | null = null;
  let webhookId: string | null = null;

  try {
    // Find webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from("inbound_webhooks")
      .select("*")
      .eq("endpoint_id", endpointId)
      .single();

    if (webhookError || !webhook) {
      return new Response(
        JSON.stringify({ error: "Webhook not found", code: "NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = webhook as WebhookConfig;
    webhookId = config.id;

    // Check if webhook is active
    if (!config.is_active) {
      return new Response(
        JSON.stringify({ error: "Webhook is disabled", code: "DISABLED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify secret token if provided
    const providedSecret = req.headers.get("x-webhook-secret");
    if (providedSecret && providedSecret !== config.secret_token) {
      return new Response(
        JSON.stringify({ error: "Invalid secret token", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        body[key] = value;
      }
    } else {
      // Try to parse as JSON anyway
      try {
        body = await req.json();
      } catch {
        body = { raw: await req.text() };
      }
    }

    // Extract headers
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Create initial log entry
    const { data: logEntry, error: logError } = await supabase
      .from("webhook_logs")
      .insert({
        webhook_id: config.id,
        status: "processing",
        request_headers: headers,
        request_body: body,
      })
      .select()
      .single();

    if (logEntry) {
      logId = logEntry.id;
    }

    // Process based on target action
    let result: Record<string, unknown> = { success: true };
    let processedData: Record<string, unknown> = {};

    // Apply field mapping
    const fieldMapping = config.field_mapping || {};
    for (const [targetField, sourceField] of Object.entries(fieldMapping)) {
      const sourcePath = (sourceField as string).split(".");
      let value: unknown = body;
      for (const key of sourcePath) {
        if (value && typeof value === "object" && key in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[key];
        } else {
          value = undefined;
          break;
        }
      }
      if (value !== undefined) {
        processedData[targetField] = value;
      }
    }

    // Execute target action
    switch (config.target_action) {
      case "create_contact": {
        // Get first admin user of the organization to use as user_id
        const { data: member } = await supabase
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", config.organization_id)
          .eq("role", "owner")
          .limit(1)
          .single();

        if (!member) {
          throw new Error("No organization owner found");
        }

        const contactData = {
          first_name: processedData.first_name || processedData.name || body.first_name || body.name || "Webhook Lead",
          last_name: processedData.last_name || body.last_name || null,
          email: processedData.email || body.email || null,
          phone: processedData.phone || body.phone || body.telefone || null,
          whatsapp: processedData.whatsapp || body.whatsapp || body.celular || null,
          source: `webhook:${config.name}`,
          organization_id: config.organization_id,
          user_id: member.user_id,
        };

        const { data: contact, error: contactError } = await supabase
          .from("contacts")
          .insert(contactData)
          .select()
          .single();

        if (contactError) throw contactError;
        result = { success: true, action: "create_contact", contact_id: contact.id };
        break;
      }

      case "update_contact": {
        const email = processedData.email || body.email;
        if (!email) {
          throw new Error("Email is required to update contact");
        }

        const { data: existing } = await supabase
          .from("contacts")
          .select("id")
          .eq("email", email)
          .eq("organization_id", config.organization_id)
          .single();

        if (existing) {
          const updateData: Record<string, unknown> = {};
          if (processedData.first_name) updateData.first_name = processedData.first_name;
          if (processedData.last_name) updateData.last_name = processedData.last_name;
          if (processedData.phone) updateData.phone = processedData.phone;
          if (processedData.lead_score) updateData.lead_score = processedData.lead_score;

          await supabase
            .from("contacts")
            .update(updateData)
            .eq("id", existing.id);

          result = { success: true, action: "update_contact", contact_id: existing.id };
        } else {
          result = { success: false, error: "Contact not found" };
        }
        break;
      }

      case "create_deal": {
        const { data: member } = await supabase
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", config.organization_id)
          .eq("role", "owner")
          .limit(1)
          .single();

        if (!member) throw new Error("No organization owner found");

        const dealData = {
          title: processedData.title || body.title || body.produto || "Webhook Deal",
          value: processedData.value || body.value || body.valor || 0,
          organization_id: config.organization_id,
          user_id: member.user_id,
        };

        const { data: deal, error: dealError } = await supabase
          .from("deals")
          .insert(dealData)
          .select()
          .single();

        if (dealError) throw dealError;
        result = { success: true, action: "create_deal", deal_id: deal.id };
        break;
      }

      case "log_only":
      default:
        result = { success: true, action: "log_only", received: true };
        break;
    }

    // Update log with success
    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({
          status: "success",
          status_code: 200,
          response_body: result,
          processed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    // Update webhook stats
    await supabase
      .from("inbound_webhooks")
      .update({
        requests_count: (webhook.requests_count || 0) + 1,
        last_request_at: new Date().toISOString(),
      })
      .eq("id", config.id);

    // Trigger linked automation if configured
    const automationId = (webhook as Record<string, unknown>).automation_id;
    const contactId = (result as Record<string, unknown>).contact_id;
    if (automationId && contactId) {
      try {
        await supabase.functions.invoke("process-automation", {
          body: {
            automation_id: automationId,
            contact_id: contactId,
            trigger_event: "webhook_received",
          },
        });
        (result as Record<string, unknown>).automation_triggered = true;
      } catch (autoErr) {
        console.error("Automation trigger error:", autoErr);
        (result as Record<string, unknown>).automation_triggered = false;
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Processing failed";

    // Update log with error
    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({
          status: "error",
          status_code: 500,
          error_message: message,
          processed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ error: message, code: "PROCESSING_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
