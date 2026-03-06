import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);

    // GET: Fetch org info by slug or ticket by protocol
    if (req.method === "GET") {
      const action = url.searchParams.get("action");

      if (action === "org-info") {
        const slug = url.searchParams.get("slug");
        if (!slug) {
          return new Response(JSON.stringify({ error: "Slug obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: org, error } = await supabase
          .from("organizations")
          .select("id, name, logo_url, slug, settings, plan_id")
          .eq("slug", slug)
          .single();

        if (error || !org) {
          return new Response(
            JSON.stringify({ error: "Organização não encontrada" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Check if org has the feature enabled
        if (org.plan_id) {
          const { data: plan } = await supabase
            .from("plans")
            .select("features")
            .eq("id", org.plan_id)
            .single();

          if (
            !plan?.features?.includes("customer_support_center")
          ) {
            return new Response(
              JSON.stringify({ error: "Portal de suporte não disponível" }),
              {
                status: 403,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: "Portal de suporte não disponível" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const portalConfig = (org.settings as any)?.support_portal ?? {};

        return new Response(
          JSON.stringify({
            name: org.name,
            logo_url: org.logo_url,
            slug: org.slug,
            portal: {
              welcome_message:
                portalConfig.welcome_message ??
                "Como podemos ajudar você?",
              categories: portalConfig.categories ?? [
                "Dúvida",
                "Problema técnico",
                "Financeiro",
                "Sugestão",
                "Outro",
              ],
              business_hours:
                portalConfig.business_hours ??
                "Segunda a Sexta, 9h às 18h",
              chat_enabled: portalConfig.chat_enabled ?? false,
              chat_whatsapp: portalConfig.chat_whatsapp ?? null,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (action === "track-ticket") {
        const protocol = url.searchParams.get("protocol");
        const orgSlug = url.searchParams.get("org");
        if (!protocol || !orgSlug) {
          return new Response(
            JSON.stringify({ error: "Protocolo e organização obrigatórios" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Get org id from slug
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", orgSlug)
          .single();

        if (!org) {
          return new Response(
            JSON.stringify({ error: "Organização não encontrada" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data: ticket, error } = await supabase
          .from("support_tickets")
          .select(
            "protocol_number, title, status, priority, category, created_at, sla_deadline_at, resolved_at, closed_at"
          )
          .eq("protocol_number", protocol.toUpperCase())
          .eq("organization_id", org.id)
          .maybeSingle();

        if (error || !ticket) {
          return new Response(
            JSON.stringify({ error: "Ticket não encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify(ticket), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: Create ticket
    if (req.method === "POST") {
      const body = await req.json();
      const { org_slug, name, email, phone, title, description, category, priority } = body;

      if (!org_slug || !name || !title) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios: org_slug, name, title" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get org
      const { data: org } = await supabase
        .from("organizations")
        .select("id, plan_id")
        .eq("slug", org_slug)
        .single();

      if (!org) {
        return new Response(
          JSON.stringify({ error: "Organização não encontrada" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify feature access
      if (org.plan_id) {
        const { data: plan } = await supabase
          .from("plans")
          .select("features")
          .eq("id", org.plan_id)
          .single();

        if (!plan?.features?.includes("customer_support_center")) {
          return new Response(
            JSON.stringify({ error: "Portal não disponível" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Get org owner
      const { data: owner } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", org.id)
        .eq("role", "owner")
        .limit(1)
        .single();

      if (!owner) {
        return new Response(
          JSON.stringify({ error: "Organização sem proprietário" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Find or create contact
      let contactId: string | null = null;

      if (email) {
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id")
          .eq("organization_id", org.id)
          .ilike("email", email.trim())
          .limit(1)
          .maybeSingle();

        if (existingContact) {
          contactId = existingContact.id;
        }
      }

      if (!contactId && phone) {
        const digits = phone.replace(/\D/g, "");
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id")
          .eq("organization_id", org.id)
          .ilike("phone", `%${digits.slice(-10)}`)
          .limit(1)
          .maybeSingle();

        if (existingContact) {
          contactId = existingContact.id;
        }
      }

      if (!contactId) {
        const { data: newContact } = await supabase
          .from("contacts")
          .insert({
            first_name: name,
            email: email || null,
            phone: phone || null,
            whatsapp: phone || null,
            user_id: owner.user_id,
            organization_id: org.id,
            source: "support_portal",
          })
          .select("id")
          .single();

        contactId = newContact?.id ?? null;
      }

      // Generate protocol
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const rand = String(Math.floor(Math.random() * 99999 + 1)).padStart(5, "0");
      const protocolNumber = `SUP-${dateStr}-${rand}`;

      // Insert ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          organization_id: org.id,
          created_by: owner.user_id,
          contact_id: contactId,
          title,
          description: description || null,
          category: category || "duvida",
          priority: priority || "medium",
          protocol_number: protocolNumber,
          status: "open",
        })
        .select("protocol_number, title, status, created_at")
        .single();

      if (ticketError) {
        console.error("Error creating ticket:", ticketError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar ticket" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify(ticket), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Portal error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
