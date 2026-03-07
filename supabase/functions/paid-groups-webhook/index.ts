import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedEvent {
  action: "add" | "remove";
  externalProductId: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  subscriptionId?: string;
  gateway: string;
}

// ============ GATEWAY PARSERS ============

function parseStripeEvent(body: any): ParsedEvent | null {
  const type = body?.type;
  const obj = body?.data?.object;
  if (!obj) return null;
  const action = ["checkout.session.completed", "invoice.paid", "customer.subscription.updated"].includes(type) ? "add"
    : ["customer.subscription.deleted", "charge.refunded", "charge.dispute.created"].includes(type) ? "remove" : null;
  if (!action) return null;
  const productId = obj.metadata?.product_id || obj.lines?.data?.[0]?.price?.product || obj.subscription || "";
  return { action, externalProductId: String(productId), customerEmail: obj.customer_email || obj.receipt_email, customerName: obj.customer_name, customerPhone: obj.customer_phone || obj.metadata?.phone, subscriptionId: obj.subscription || obj.id, gateway: "stripe" };
}

function parseKiwifyEvent(body: any): ParsedEvent | null {
  const status = body?.order_status || body?.subscription_status;
  const action = ["paid", "approved", "active", "completed"].includes(status) ? "add"
    : ["refunded", "chargedback", "canceled", "cancelled", "expired"].includes(status) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: body.product?.id || body.Product?.id || body.product_id || "", customerEmail: body.Customer?.email || body.customer?.email, customerName: body.Customer?.full_name || body.customer?.name, customerPhone: body.Customer?.mobile || body.customer?.phone, subscriptionId: body.subscription_id || body.order_id, gateway: "kiwify" };
}

function parseHotmartEvent(body: any): ParsedEvent | null {
  const event = body?.event;
  const data = body?.data;
  if (!data) return null;
  const action = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "SUBSCRIPTION_ACTIVE"].includes(event) ? "add"
    : ["PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "SUBSCRIPTION_CANCELLATION", "PURCHASE_CANCELED"].includes(event) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(data.product?.id || ""), customerEmail: data.buyer?.email, customerName: data.buyer?.name, customerPhone: data.buyer?.phone || data.buyer?.cel_phone, subscriptionId: data.subscription?.subscriber?.code || data.purchase?.transaction, gateway: "hotmart" };
}

function parseEduzzEvent(body: any): ParsedEvent | null {
  const event = body?.event_type || body?.trans_status;
  const action = ["contract.invoice_paid", "3", "paid"].includes(String(event)) ? "add"
    : ["contract.invoice_refunded", "4", "6", "7", "refunded", "chargeback"].includes(String(event)) ? "remove" : null;
  if (!action) return null;
  const cust = body?.customer || body?.client || {};
  return { action, externalProductId: String(body.product?.id || body.product_id || ""), customerEmail: cust.email, customerName: cust.name, customerPhone: cust.phone || cust.cel_phone, subscriptionId: body.contract_id || body.trans_cod, gateway: "eduzz" };
}

function parseMonetizzeEvent(body: any): ParsedEvent | null {
  const status = body?.tipoPostback?.cod || body?.status;
  const action = [1, 2, "1", "2", "Ativa", "Completa", "paid"].includes(status) ? "add"
    : [4, 6, 7, "4", "6", "7", "Reembolsada", "Cancelada", "Chargeback"].includes(status) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.produto?.cod || body.product_id || ""), customerEmail: body.comprador?.email || body.customer?.email, customerName: body.comprador?.nome || body.customer?.name, customerPhone: body.comprador?.telefone || body.customer?.phone, subscriptionId: body.venda?.cod || body.transaction_id, gateway: "monetizze" };
}

function parsePerfectPayEvent(body: any): ParsedEvent | null {
  const status = body?.sale_status_enum || body?.status;
  const action = ["approved", "paid", "completed"].includes(status) ? "add"
    : ["refunded", "chargeback", "canceled", "cancelled"].includes(status) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.code || body.product_id || ""), customerEmail: body.customer?.email, customerName: body.customer?.full_name || body.customer?.name, customerPhone: body.customer?.phone_number || body.customer?.phone, subscriptionId: body.sale?.code || body.transaction_id, gateway: "perfectpay" };
}

function parseBraipEvent(body: any): ParsedEvent | null {
  const event = body?.event;
  const action = ["purchase_approved", "purchase_complete"].includes(event) ? "add"
    : ["purchase_refunded", "purchase_chargeback", "subscription_canceled"].includes(event) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || ""), customerEmail: body.client?.email, customerName: body.client?.name, customerPhone: body.client?.phone, subscriptionId: body.purchase?.id, gateway: "braip" };
}

function parseGuruEvent(body: any): ParsedEvent | null {
  const event = body?.event;
  const action = ["sale_approved", "subscription_active"].includes(event) ? "add"
    : ["sale_refund", "sale_chargeback", "subscription_canceled"].includes(event) ? "remove" : null;
  if (!action) return null;
  const contact = body?.contact || body?.subscriber || {};
  return { action, externalProductId: String(body.product?.id || ""), customerEmail: contact.email, customerName: contact.name || contact.first_name, customerPhone: contact.phone_number || contact.phone, subscriptionId: body.sale?.id || body.subscription?.id, gateway: "guru" };
}

function parseLastlinkEvent(body: any): ParsedEvent | null {
  const event = body?.type || body?.event;
  const action = ["subscription_created", "payment_approved"].includes(event) ? "add"
    : ["subscription_canceled", "payment_refunded", "subscription_expired"].includes(event) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || body.plan?.id || ""), customerEmail: body.subscriber?.email || body.customer?.email, customerName: body.subscriber?.name || body.customer?.name, customerPhone: body.subscriber?.phone || body.customer?.phone, subscriptionId: body.subscription?.id, gateway: "lastlink" };
}

function parsePepperEvent(body: any): ParsedEvent | null {
  const status = body?.purchase_status || body?.status;
  const action = ["approved", "completed"].includes(status) ? "add"
    : ["refunded", "chargeback", "canceled"].includes(status) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || body.prod || ""), customerEmail: body.buyer_email || body.email, customerName: body.buyer_name || body.name, customerPhone: body.buyer_phone || body.phone, subscriptionId: body.transaction || body.purchase_id, gateway: "pepper" };
}

function parseYampiEvent(body: any): ParsedEvent | null {
  const event = body?.event;
  const resource = body?.resource;
  const status = resource?.status?.data?.name?.toLowerCase() || "";
  const action = ["paid", "approved"].includes(status) ? "add"
    : ["cancelled", "refunded", "chargeback"].includes(status) ? "remove" : null;
  if (!action) return null;
  const customer = resource?.customer?.data || {};
  return { action, externalProductId: String(resource?.items?.data?.[0]?.sku_id || ""), customerEmail: customer.email, customerName: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(), customerPhone: customer.phone?.full_number || customer.phone_number, subscriptionId: String(resource?.id || ""), gateway: "yampi" };
}

function parseTictoEvent(body: any): ParsedEvent | null {
  const status = body?.status;
  const action = ["approved", "paid", "completed"].includes(status) ? "add"
    : ["refunded", "chargeback", "canceled"].includes(status) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || body.product_id || ""), customerEmail: body.customer?.email, customerName: body.customer?.name, customerPhone: body.customer?.phone, subscriptionId: body.transaction_id || body.order_id, gateway: "ticto" };
}

function parseKirvanoEvent(body: any): ParsedEvent | null {
  const event = body?.event || body?.type;
  const action = ["sale_approved", "subscription_active", "purchase_approved"].includes(event) ? "add"
    : ["sale_refund", "sale_chargeback", "subscription_canceled", "purchase_refunded"].includes(event) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || ""), customerEmail: body.customer?.email, customerName: body.customer?.name, customerPhone: body.customer?.phone, subscriptionId: body.sale?.id || body.subscription?.id, gateway: "kirvano" };
}

function parsePaytEvent(body: any): ParsedEvent | null {
  const status = body?.status || body?.payment_status;
  const action = ["approved", "paid", "completed"].includes(status) ? "add"
    : ["refunded", "chargeback", "canceled", "cancelled"].includes(status) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || body.product_id || ""), customerEmail: body.customer?.email || body.buyer?.email, customerName: body.customer?.name || body.buyer?.name, customerPhone: body.customer?.phone || body.buyer?.phone, subscriptionId: body.transaction_id || body.order_id, gateway: "payt" };
}

function parseGreennEvent(body: any): ParsedEvent | null {
  const status = body?.status;
  const action = ["approved", "paid", "active"].includes(status) ? "add"
    : ["refunded", "chargeback", "canceled", "cancelled", "expired"].includes(status) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || body.prod || ""), customerEmail: body.customer?.email, customerName: body.customer?.name, customerPhone: body.customer?.phone, subscriptionId: body.transaction || body.subscription_id, gateway: "greenn" };
}

function parseCartPandaEvent(body: any): ParsedEvent | null {
  const event = body?.event || body?.type;
  const action = ["approved", "paid", "order_paid"].includes(event) ? "add"
    : ["refunded", "chargeback", "canceled", "order_refunded"].includes(event) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || body.items?.[0]?.product_id || ""), customerEmail: body.customer?.email, customerName: body.customer?.name, customerPhone: body.customer?.phone || body.customer?.phone_number, subscriptionId: body.order?.id || body.transaction_id, gateway: "cartpanda" };
}

function parseHeroSparkEvent(body: any): ParsedEvent | null {
  const event = body?.event;
  const action = ["purchase.approved", "subscription.active"].includes(event) ? "add"
    : ["purchase.refunded", "purchase.chargeback", "subscription.canceled"].includes(event) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || ""), customerEmail: body.buyer?.email, customerName: body.buyer?.name, customerPhone: body.buyer?.phone, subscriptionId: body.purchase?.transaction || body.subscription?.id, gateway: "herospark" };
}

function parseAppMaxEvent(body: any): ParsedEvent | null {
  const event = body?.event;
  const action = ["approved", "sale_approved"].includes(event) ? "add"
    : ["refunded", "chargeback", "canceled"].includes(event) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || ""), customerEmail: body.customer?.email, customerName: body.customer?.name, customerPhone: body.customer?.phone, subscriptionId: body.sale?.id || body.transaction_id, gateway: "appmax" };
}

function parseDoppusEvent(body: any): ParsedEvent | null {
  const status = body?.status || body?.payment_status;
  const action = ["paid", "approved", "active"].includes(status) ? "add"
    : ["refunded", "chargeback", "canceled", "cancelled"].includes(status) ? "remove" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product?.id || body.product_id || ""), customerEmail: body.customer?.email, customerName: body.customer?.name, customerPhone: body.customer?.phone, subscriptionId: body.transaction_id || body.subscription_id, gateway: "doppus" };
}

function parseGenericEvent(body: any): ParsedEvent | null {
  const action = body?.action === "remove" ? "remove" : body?.action === "add" ? "add" : null;
  if (!action) return null;
  return { action, externalProductId: String(body.product_id || body.external_product_id || ""), customerEmail: body.email || body.customer_email, customerName: body.name || body.customer_name, customerPhone: body.phone || body.customer_phone, subscriptionId: body.subscription_id || body.transaction_id, gateway: "generic" };
}

const PARSERS: Record<string, (body: any) => ParsedEvent | null> = {
  stripe: parseStripeEvent,
  kiwify: parseKiwifyEvent,
  hotmart: parseHotmartEvent,
  eduzz: parseEduzzEvent,
  monetizze: parseMonetizzeEvent,
  perfectpay: parsePerfectPayEvent,
  braip: parseBraipEvent,
  guru: parseGuruEvent,
  lastlink: parseLastlinkEvent,
  pepper: parsePepperEvent,
  yampi: parseYampiEvent,
  ticto: parseTictoEvent,
  kirvano: parseKirvanoEvent,
  payt: parsePaytEvent,
  greenn: parseGreennEvent,
  cartpanda: parseCartPandaEvent,
  herospark: parseHeroSparkEvent,
  appmax: parseAppMaxEvent,
  doppus: parseDoppusEvent,
  generic: parseGenericEvent,
};

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Expected: /paid-groups-webhook/{secret}/{gateway}
    const secret = pathParts[1] || url.searchParams.get("secret") || "";
    const gateway = pathParts[2] || url.searchParams.get("gateway") || "generic";

    if (!secret) {
      return new Response(JSON.stringify({ error: "Missing webhook secret" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find config by webhook secret
    const { data: config, error: configError } = await supabase
      .from("paid_groups_config")
      .select("*")
      .eq("webhook_secret", secret)
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      console.error("Config not found for secret:", secret);
      return new Response(JSON.stringify({ error: "Invalid webhook secret" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    console.log(`[paid-groups-webhook] gateway=${gateway}, org=${config.organization_id}`, JSON.stringify(body).slice(0, 500));

    const parser = PARSERS[gateway] || PARSERS.generic;
    const parsed = parser(body);

    if (!parsed) {
      console.log("Could not parse event, ignoring");
      return new Response(JSON.stringify({ ok: true, message: "Event ignored" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find matching product by gateway_mappings
    const { data: products } = await supabase
      .from("paid_group_products")
      .select("*")
      .eq("organization_id", config.organization_id)
      .eq("is_active", true);

    const matchedProduct = products?.find((p: any) => {
      const mappings = p.gateway_mappings || {};
      const ids = mappings[parsed.gateway] || mappings[gateway] || [];
      const idArray = Array.isArray(ids) ? ids : [ids];
      return idArray.map(String).includes(String(parsed.externalProductId));
    });

    if (!matchedProduct) {
      console.log(`No product matched for gateway=${parsed.gateway}, externalId=${parsed.externalProductId}`);
      return new Response(JSON.stringify({ ok: true, message: "No matching product" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get linked groups
    const { data: links } = await supabase
      .from("paid_group_product_links")
      .select("group_id")
      .eq("product_id", matchedProduct.id);

    const groupIds = links?.map((l: any) => l.group_id) || [];
    if (groupIds.length === 0) {
      console.log("No groups linked to product");
      return new Response(JSON.stringify({ ok: true, message: "No groups linked" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: groups } = await supabase
      .from("paid_groups")
      .select("*")
      .in("id", groupIds)
      .eq("is_active", true);

    if (!groups || groups.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No active groups" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const phone = parsed.customerPhone ? normalizePhone(parsed.customerPhone) : null;
    if (!phone) {
      console.log("No phone number in event");
      return new Response(JSON.stringify({ ok: true, message: "No phone number" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const jid = phone.endsWith("@s.whatsapp.net") ? phone : `${phone}@s.whatsapp.net`;
    const evolutionUrl = config.evolution_api_url?.replace(/\/$/, "");
    const evolutionKey = config.evolution_api_key;

    for (const group of groups) {
      const instanceName = group.instance_name || "default";

      if (parsed.action === "add") {
        // Add to group via Evolution API
        try {
          const resp = await fetch(`${evolutionUrl}/group/updateParticipant/${instanceName}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", apikey: evolutionKey },
            body: JSON.stringify({ groupJid: group.group_jid, action: "add", participants: [jid] }),
          });
          const result = await resp.json();
          console.log(`Added ${jid} to group ${group.group_jid}:`, JSON.stringify(result));
        } catch (e) {
          console.error(`Error adding to group ${group.group_jid}:`, e);
        }

        // Upsert member
        await supabase.from("paid_group_members").upsert({
          organization_id: config.organization_id,
          group_id: group.id,
          product_id: matchedProduct.id,
          phone_number: phone,
          customer_name: parsed.customerName || null,
          customer_email: parsed.customerEmail || null,
          gateway_source: parsed.gateway,
          external_subscription_id: parsed.subscriptionId || null,
          status: "active",
          added_at: new Date().toISOString(),
          removed_at: null,
        }, { onConflict: "organization_id,group_id,phone_number" });
      } else {
        // Remove from group
        try {
          const resp = await fetch(`${evolutionUrl}/group/updateParticipant/${instanceName}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", apikey: evolutionKey },
            body: JSON.stringify({ groupJid: group.group_jid, action: "remove", participants: [jid] }),
          });
          const result = await resp.json();
          console.log(`Removed ${jid} from group ${group.group_jid}:`, JSON.stringify(result));
        } catch (e) {
          console.error(`Error removing from group ${group.group_jid}:`, e);
        }

        // Update member status
        await supabase.from("paid_group_members")
          .update({ status: "removed", removed_at: new Date().toISOString() })
          .eq("organization_id", config.organization_id)
          .eq("group_id", group.id)
          .eq("phone_number", phone);
      }
    }

    return new Response(JSON.stringify({ ok: true, action: parsed.action, groups: groups.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("paid-groups-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
