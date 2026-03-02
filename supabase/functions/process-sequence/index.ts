import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find enrollments that need processing (next_step_at <= now, status = active)
    const { data: pendingEnrollments, error: fetchError } = await supabase
      .from("sequence_enrollments")
      .select("*, sequences(*)")
      .eq("status", "active")
      .lte("next_step_at", new Date().toISOString())
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingEnrollments || pendingEnrollments.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const enrollment of pendingEnrollments) {
      try {
        const sequence = enrollment.sequences;
        if (!sequence || sequence.status !== "active") {
          await supabase
            .from("sequence_enrollments")
            .update({ status: "paused" })
            .eq("id", enrollment.id);
          continue;
        }

        // Get the current step
        const { data: steps } = await supabase
          .from("sequence_steps")
          .select("*")
          .eq("sequence_id", enrollment.sequence_id)
          .eq("is_active", true)
          .order("step_order", { ascending: true });

        if (!steps || enrollment.current_step >= steps.length) {
          // Sequence completed
          await supabase
            .from("sequence_enrollments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);

          await supabase
            .from("sequences")
            .update({
              completed_count: (sequence.completed_count || 0) + 1,
            })
            .eq("id", sequence.id);

          processed++;
          continue;
        }

        const currentStep = steps[enrollment.current_step];

        // Execute step action
        await executeStepAction(supabase, supabaseUrl, serviceKey, currentStep, enrollment, sequence);

        // Determine next step
        const nextStepIndex = enrollment.current_step + 1;
        const hasNextStep = nextStepIndex < steps.length;

        if (hasNextStep) {
          const nextStep = steps[nextStepIndex];
          const delayMs = (nextStep.delay_minutes || 0) * 60 * 1000;
          const nextStepAt = new Date(Date.now() + delayMs).toISOString();

          await supabase
            .from("sequence_enrollments")
            .update({
              current_step: nextStepIndex,
              next_step_at: nextStepAt,
            })
            .eq("id", enrollment.id);
        } else {
          await supabase
            .from("sequence_enrollments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              current_step: nextStepIndex,
            })
            .eq("id", enrollment.id);

          await supabase
            .from("sequences")
            .update({
              completed_count: (sequence.completed_count || 0) + 1,
            })
            .eq("id", sequence.id);
        }

        processed++;
      } catch (stepError) {
        console.error("Error processing enrollment:", enrollment.id, stepError);
        errors++;

        await supabase
          .from("sequence_enrollments")
          .update({ status: "failed" })
          .eq("id", enrollment.id);
      }
    }

    return new Response(
      JSON.stringify({ processed, errors, total: pendingEnrollments.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process sequence error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function executeStepAction(
  supabase: any,
  supabaseUrl: string,
  serviceKey: string,
  step: any,
  enrollment: any,
  sequence: any
) {
  const content = step.content || {};

  switch (step.action_type) {
    case "send_message": {
      // Get contact info
      const { data: contact } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", enrollment.contact_id)
        .single();

      if (!contact) throw new Error("Contact not found");

      const whatsappNumber = contact.whatsapp || contact.phone;
      if (sequence.channel === "whatsapp" && whatsappNumber) {
        // Check if org has any WhatsApp integration configured
        const { data: orgIntegrations } = await supabase
          .from("organization_integrations")
          .select("id")
          .eq("organization_id", sequence.organization_id)
          .in("integration_type", ["evolution_api", "whatsapp_business"])
          .eq("is_active", true)
          .limit(1);

        if (orgIntegrations && orgIntegrations.length > 0) {
          const message = (content.message || "")
            .replace(/\{\{nome\}\}/g, contact.first_name || "")
            .replace(/\{\{telefone\}\}/g, whatsappNumber || "");

          // Send directly via Evolution API or Business API (bypassing auth since this is a server-side cron)
          await sendWhatsAppDirect(supabase, sequence.organization_id, whatsappNumber, message);
        }
      }
      break;
    }

    case "send_email": {
      const { data: contact } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", enrollment.contact_id)
        .single();

      if (contact?.email) {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            to: contact.email,
            subject: content.subject || "Mensagem automática",
            html: content.body || content.message || "",
            organization_id: sequence.organization_id,
          }),
        });
      }
      break;
    }

    case "add_tag": {
      if (content.tag_id) {
        await supabase.from("contact_tags").insert({
          contact_id: enrollment.contact_id,
          tag_id: content.tag_id,
        });
      }
      break;
    }

    case "condition": {
      // Conditions are evaluated to determine if we skip or continue
      // For now, conditions always pass (future: evaluate condition_config)
      break;
    }

    case "wait": {
      // Wait steps are handled by the delay_minutes in next_step_at calculation
      break;
    }

    default:
      console.log("Unknown step action:", step.action_type);
  }
}

// Direct WhatsApp sending without auth (server-side only, uses service role)
async function sendWhatsAppDirect(
  supabase: any,
  organizationId: string,
  phoneNumber: string,
  message: string
) {
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Try Evolution API first
  const { data: evolutionInt } = await supabase
    .from("organization_integrations")
    .select("config")
    .eq("organization_id", organizationId)
    .eq("integration_type", "evolution_api")
    .eq("is_active", true)
    .maybeSingle();

  if (evolutionInt) {
    // Fetch global Evolution API config
    const { data: globalConfig } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "evolution_api")
      .single();

    const globalEvo = globalConfig?.value as Record<string, string> | null;
    const orgConfig = evolutionInt.config as Record<string, string>;

    const apiUrl = globalEvo?.api_url || orgConfig.api_url || "";
    const apiKey = globalEvo?.api_key || orgConfig.api_key || "";
    const instanceName = (orgConfig.instance_name || "").trim();

    if (apiUrl && apiKey && instanceName) {
      const resp = await fetch(`${apiUrl.replace(/\/+$/, "")}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({ number: cleanPhone, text: message }),
      });
      const body = await resp.text();
      if (!resp.ok) console.error("Evolution API error (sequence):", body);
      else console.log("WhatsApp sent via Evolution API (sequence)");
      return;
    }
  }

  // Try WhatsApp Business API
  const { data: businessInt } = await supabase
    .from("organization_integrations")
    .select("config")
    .eq("organization_id", organizationId)
    .eq("integration_type", "whatsapp_business")
    .eq("is_active", true)
    .maybeSingle();

  if (businessInt) {
    const config = businessInt.config as Record<string, string>;
    const { access_token, phone_number_id } = config;
    if (access_token && phone_number_id) {
      const resp = await fetch(`https://graph.facebook.com/v18.0/${phone_number_id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: true, body: message },
        }),
      });
      const body = await resp.text();
      if (!resp.ok) console.error("WhatsApp Business API error (sequence):", body);
      else console.log("WhatsApp sent via Business API (sequence)");
      return;
    }
  }

  console.error("No WhatsApp integration configured for org:", organizationId);
}
