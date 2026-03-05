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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, platform, api_url, api_key, organization_id, user_id, import_options } = body;

    if (action === "test_connection") {
      if (platform === "activecampaign") {
        const res = await fetch(`${api_url}/api/3/contacts?limit=1`, {
          headers: { "Api-Token": api_key },
        });
        if (!res.ok) throw new Error(`ActiveCampaign API retornou ${res.status}`);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (platform === "rdstation") {
        const res = await fetch("https://api.rd.services/platform/contacts?limit=1", {
          headers: { Authorization: `Bearer ${api_url}` },
        });
        if (!res.ok) throw new Error(`RD Station API retornou ${res.status}`);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      throw new Error("Plataforma não suportada para conexão via API");
    }

    if (action === "migrate") {
      let totalImported = 0;
      let totalErrors = 0;
      let totalItems = 0;

      // ---- ActiveCampaign Migration ----
      if (platform === "activecampaign") {
        // Contacts
        if (import_options.includes("contacts")) {
          let offset = 0;
          const limit = 100;
          let hasMore = true;

          while (hasMore) {
            const res = await fetch(`${api_url}/api/3/contacts?limit=${limit}&offset=${offset}`, {
              headers: { "Api-Token": api_key },
            });
            const data = await res.json();
            const contacts = data.contacts || [];
            totalItems += contacts.length;

            for (const c of contacts) {
              const { error } = await supabase.from("contacts").insert({
                first_name: c.firstName || c.email?.split("@")[0] || "Lead",
                last_name: c.lastName || null,
                email: c.email || null,
                phone: c.phone || null,
                source: "activecampaign",
                user_id,
                organization_id,
              });
              if (error) totalErrors++;
              else totalImported++;
            }

            hasMore = contacts.length === limit;
            offset += limit;
          }
        }

        // Tags
        if (import_options.includes("tags")) {
          const res = await fetch(`${api_url}/api/3/tags?limit=100`, {
            headers: { "Api-Token": api_key },
          });
          const data = await res.json();
          const tags = data.tags || [];
          totalItems += tags.length;

          for (const t of tags) {
            const { error } = await supabase.from("tags").insert({
              name: t.tag,
              color: "#3B82F6",
              user_id,
              organization_id,
            });
            if (error && !error.message.includes("duplicate")) totalErrors++;
            else totalImported++;
          }
        }

        // Automations
        if (import_options.includes("automations")) {
          const res = await fetch(`${api_url}/api/3/automations?limit=100`, {
            headers: { "Api-Token": api_key },
          });
          const data = await res.json();
          const automations = data.automations || [];
          totalItems += automations.length;

          for (const a of automations) {
            const { error } = await supabase.from("automations").insert({
              name: `[AC] ${a.name}`,
              trigger_type: "contact_created",
              actions: [],
              is_active: false,
              user_id,
              organization_id,
            });
            if (error) totalErrors++;
            else totalImported++;
          }
        }

        // Campaigns
        if (import_options.includes("campaigns")) {
          const res = await fetch(`${api_url}/api/3/campaigns?limit=100`, {
            headers: { "Api-Token": api_key },
          });
          const data = await res.json();
          const campaigns = data.campaigns || [];
          totalItems += campaigns.length;

          for (const c of campaigns) {
            const { error } = await supabase.from("email_campaigns").insert({
              name: `[AC] ${c.name}`,
              subject: c.subject || c.name,
              content: c.body || "",
              status: "draft",
              user_id,
              organization_id,
            });
            if (error) totalErrors++;
            else totalImported++;
          }
        }
      }

      // ---- RD Station Migration ----
      if (platform === "rdstation") {
        const rdToken = api_url; // token is passed as api_url for RD

        if (import_options.includes("contacts")) {
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const res = await fetch(`https://api.rd.services/platform/contacts?page=${page}&page_size=100`, {
              headers: { Authorization: `Bearer ${rdToken}` },
            });
            const data = await res.json();
            const contacts = data.contacts || [];
            totalItems += contacts.length;

            for (const c of contacts) {
              const { error } = await supabase.from("contacts").insert({
                first_name: c.name?.split(" ")[0] || c.email?.split("@")[0] || "Lead",
                last_name: c.name?.split(" ").slice(1).join(" ") || null,
                email: c.email || null,
                phone: c.personal_phone || c.mobile_phone || null,
                source: "rdstation",
                user_id,
                organization_id,
              });
              if (error) totalErrors++;
              else totalImported++;
            }

            hasMore = contacts.length === 100;
            page++;
          }
        }

        // Tags (RD calls them "tags")
        if (import_options.includes("tags")) {
          const res = await fetch("https://api.rd.services/platform/tags", {
            headers: { Authorization: `Bearer ${rdToken}` },
          });
          const data = await res.json();
          const tags = data.tags || [];
          totalItems += tags.length;

          for (const t of tags) {
            const { error } = await supabase.from("tags").insert({
              name: t.name,
              color: "#8B5CF6",
              user_id,
              organization_id,
            });
            if (error && !error.message.includes("duplicate")) totalErrors++;
            else totalImported++;
          }
        }

        // Automations (RD calls them "automation flows")
        if (import_options.includes("automations")) {
          const res = await fetch("https://api.rd.services/platform/automation_flows", {
            headers: { Authorization: `Bearer ${rdToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            const flows = data.automation_flows || data.flows || [];
            totalItems += flows.length;

            for (const f of flows) {
              const { error } = await supabase.from("automations").insert({
                name: `[RD] ${f.name}`,
                trigger_type: "contact_created",
                actions: [],
                is_active: false,
                user_id,
                organization_id,
              });
              if (error) totalErrors++;
              else totalImported++;
            }
          }
        }

        // Email campaigns
        if (import_options.includes("campaigns")) {
          const res = await fetch("https://api.rd.services/platform/emails", {
            headers: { Authorization: `Bearer ${rdToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            const emails = data.emails || [];
            totalItems += emails.length;

            for (const e of emails) {
              const { error } = await supabase.from("email_campaigns").insert({
                name: `[RD] ${e.name || e.subject}`,
                subject: e.subject || e.name,
                content: e.body || "",
                status: "draft",
                user_id,
                organization_id,
              });
              if (error) totalErrors++;
              else totalImported++;
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          total: totalItems,
          processed: totalImported,
          errors: totalErrors,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Ação inválida");
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
