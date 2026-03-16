// Webhook Handler for Kiwify Events — Subscription Lifecycle
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.203.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.203.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-kiwify-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface KiwifyPayload {
  order_id: string;
  order_status: string;
  product_id?: string;
  product_name?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  Customer: {
    email: string;
    full_name: string;
    mobile: string;
  };
  Subscription?: {
    id: string;
    status: string;
    plan?: {
      id: string;
      name: string;
    };
    start_date?: string;
    next_payment?: string;
  };
  Commissions?: {
    charge_amount?: number;
    product_base_price?: number;
  };
  payment_method: string;
  payment_status: string;
  order_value?: number;
  checkout_link?: string;
  subscription_id?: string;
  created_at: string;
  custom_fields?: {
    organization_name?: string;
    user_name?: string;
  };
  [key: string]: unknown;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[KIWIFY-WEBHOOK] ${step}${detailsStr}`);
};

// Extract product_id from various payload locations
function extractProductId(payload: KiwifyPayload): string | undefined {
  return payload.Product?.product_id || payload.product_id || undefined;
}

// Extract order value in BRL (convert from centavos if needed)
function extractOrderValue(payload: KiwifyPayload): number {
  if (payload.order_value) return payload.order_value;
  const chargeAmount = payload.Commissions?.charge_amount || payload.Commissions?.product_base_price;
  if (chargeAmount) return chargeAmount / 100; // centavos to BRL
  return 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    const payload = JSON.parse(rawBody) as KiwifyPayload;
    const signature = req.headers.get("x-kiwify-signature");

    const productId = extractProductId(payload);
    const customerEmail = payload.Customer?.email?.toLowerCase();

    logStep("Webhook received", { status: payload.order_status, email: customerEmail, product: productId, checkoutLink: payload.checkout_link });

    // --- Signature verification ---
    const kiwifySecret = Deno.env.get("KIWIFY_WEBHOOK_SECRET");
    if (kiwifySecret && signature) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(kiwifySecret);
      const messageData = encoder.encode(rawBody);
      const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
      const expectedSignature = encodeHex(new Uint8Array(signatureBuffer));

      if (signature !== expectedSignature) {
        logStep("ERROR: Invalid signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      logStep("Signature verified");
    }

    // --- Map Kiwify status ---
    const eventTypeMap: Record<string, string> = {
      paid: "purchase.approved",
      waiting_payment: "purchase.pending",
      refused: "purchase.refused",
      refunded: "purchase.refunded",
      chargedback: "purchase.chargeback",
      completed: "purchase.approved",
    };
    const eventType = eventTypeMap[payload.order_status] || `unknown.${payload.order_status}`;

    // --- Find plan by Kiwify product ID ---
    let plan: { id: string; name: string; slug: string; price_monthly: number } | null = null;
    const orderValue = extractOrderValue(payload);
    const checkoutLink = payload.checkout_link; // e.g., "iCnaIJs"

    // Strategy 1: Match by checkout_link (most precise — each plan has unique checkout URL)
    if (checkoutLink && !plan) {
      const { data: allPlans } = await supabase
        .from("plans")
        .select("id, name, slug, price_monthly, kiwify_checkout_url, kiwify_checkout_url_yearly")
        .eq("is_active", true);

      if (allPlans) {
        for (const p of allPlans) {
          const monthlyUrl = p.kiwify_checkout_url || "";
          const yearlyUrl = p.kiwify_checkout_url_yearly || "";
          if (monthlyUrl.includes(checkoutLink) || yearlyUrl.includes(checkoutLink)) {
            plan = { id: p.id, name: p.name, slug: p.slug, price_monthly: p.price_monthly };
            logStep("Plan matched by checkout_link", { link: checkoutLink, plan: p.name });
            break;
          }
        }
      }
    }

    // Strategy 2: Match by Subscription.plan.name
    if (!plan && payload.Subscription?.plan?.name) {
      const subPlanName = payload.Subscription.plan.name;
      const { data: namedPlan } = await supabase
        .from("plans")
        .select("id, name, slug, price_monthly")
        .ilike("name", `%${subPlanName}%`)
        .eq("is_active", true)
        .maybeSingle();
      if (namedPlan) {
        plan = namedPlan;
        logStep("Plan matched by subscription name", { subPlanName, plan: namedPlan.name });
      }
    }

    // Strategy 3: Match by product_id (single match)
    if (!plan && productId) {
      const { data: matchedPlans } = await supabase
        .from("plans")
        .select("id, name, slug, price_monthly")
        .or(`kiwify_product_id.eq.${productId},kiwify_product_id_yearly.eq.${productId}`)
        .eq("is_active", true);

      if (matchedPlans && matchedPlans.length === 1) {
        plan = matchedPlans[0];
      } else if (matchedPlans && matchedPlans.length > 1 && orderValue > 0) {
        // Multiple plans — match by closest price
        const closestPlan = matchedPlans.reduce((best, p) => {
          const diff = Math.abs(p.price_monthly - orderValue);
          const bestDiff = Math.abs(best.price_monthly - orderValue);
          return diff < bestDiff ? p : best;
        }, matchedPlans[0]);
        plan = closestPlan;
        logStep("Multiple plans matched, selected by price", { selected: closestPlan.name, orderValue });
      }
    }

    // Strategy 4: Fallback from checkout_leads
    if (!plan && customerEmail) {
      const { data: lead } = await supabase
        .from("checkout_leads")
        .select("plan_id")
        .ilike("email", customerEmail)
        .not("plan_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lead?.plan_id) {
        const { data: leadPlan } = await supabase
          .from("plans")
          .select("id, name, slug, price_monthly")
          .eq("id", lead.plan_id)
          .single();
        if (leadPlan) {
          plan = leadPlan;
          logStep("Plan resolved from checkout_lead", { planName: leadPlan.name });
        }
      }
    }

    logStep("Plan lookup", { productId, found: !!plan, planName: plan?.name });

    // --- Store webhook event ---
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        source: "kiwify",
        event_type: eventType,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      logStep("ERROR storing webhook", webhookError);
      throw webhookError;
    }

    // customerEmail already defined above

    // --- Update checkout_leads with payment status ---
    if (customerEmail) {
      const paymentMethod = (payload.payment_method || "").toLowerCase();
      let leadStatus = "started";

      if (payload.order_status === "paid" || payload.order_status === "completed") {
        leadStatus = "converted";
      } else if (payload.order_status === "waiting_payment") {
        if (paymentMethod.includes("boleto") || paymentMethod === "bank_slip") {
          leadStatus = "boleto_generated";
        } else if (paymentMethod.includes("pix")) {
          leadStatus = "pix_generated";
        } else {
          leadStatus = "waiting_payment";
        }
      } else if (payload.order_status === "refused") {
        leadStatus = "expired";
      } else if (payload.order_status === "refunded") {
        leadStatus = "refunded";
      } else if (payload.order_status === "chargedback") {
        leadStatus = "refunded";
      }

      const leadUpdate: Record<string, unknown> = {
        status: leadStatus,
        source: "kiwify",
        updated_at: new Date().toISOString(),
      };
      if (leadStatus === "converted") {
        leadUpdate.converted = true;
        leadUpdate.converted_at = new Date().toISOString();
      }

      const { data: existingLead } = await supabase
        .from("checkout_leads")
        .select("id")
        .ilike("email", customerEmail)
        .maybeSingle();

      if (existingLead) {
        await supabase.from("checkout_leads").update(leadUpdate).eq("id", existingLead.id);
        logStep("checkout_leads updated", { email: customerEmail, status: leadStatus });
      } else {
        await supabase.from("checkout_leads").insert({
          email: customerEmail,
          name: payload.Customer?.full_name || "Kiwify Lead",
          plan_id: plan?.id || null,
          billing_cycle: detectBillingCycle(payload),
          source: "kiwify",
          status: leadStatus,
          converted: leadStatus === "converted",
          converted_at: leadStatus === "converted" ? new Date().toISOString() : null,
        });
        logStep("checkout_leads created", { email: customerEmail, status: leadStatus });
      }
    }

    // --- Process based on event type ---
    if ((payload.order_status === "paid" || payload.order_status === "completed") && customerEmail) {
      logStep("Processing approved purchase");

      // Find existing user by email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const existingUser = userData?.users?.find(u => u.email?.toLowerCase() === customerEmail);

      if (existingUser) {
        // Existing user — activate/update subscription
        logStep("Found existing user", { userId: existingUser.id });

        // Find user's organization
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", existingUser.id)
          .limit(1)
          .maybeSingle();

        if (membership && plan) {
          await activateSubscription(supabase, {
            organizationId: membership.organization_id,
            planId: plan.id,
            kiwifyOrderId: payload.order_id,
            kiwifySubscriptionId: payload.Subscription?.id,
            billingCycle: detectBillingCycle(payload),
          });
          logStep("Subscription activated for existing user");
        } else if (!membership && plan) {
          // Existing user without organization — create org + subscription
          logStep("Existing user without org, creating one");
          const customerName = existingUser.user_metadata?.full_name || payload.Customer.full_name || "Usuário";
          const orgName = `Org de ${customerName}`;
          const slug = orgName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          const { data: newOrg } = await supabase
            .from('organizations')
            .insert({ name: orgName, slug: `${slug}-${Date.now()}` })
            .select('id')
            .single();

          if (newOrg?.id) {
            await supabase.from('organization_members').insert({
              organization_id: newOrg.id, user_id: existingUser.id, role: 'owner',
            });
            await activateSubscription(supabase, {
              organizationId: newOrg.id,
              planId: plan.id,
              kiwifyOrderId: payload.order_id,
              kiwifySubscriptionId: payload.Subscription?.id,
              billingCycle: detectBillingCycle(payload),
            });
            logStep("Org + subscription created for existing user", { orgId: newOrg.id });
          }
        }
      } else if (plan) {
        // New user — create account + org + subscription
        logStep("Creating new user account");

        const customerName = payload.Customer.full_name || "Usuário Kiwify";
        const orgName = (payload as any).custom_fields?.organization_name || `Org de ${customerName}`;
        const password = generatePassword();

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: customerEmail,
          password,
          email_confirm: true,
          user_metadata: { name: customerName, full_name: customerName },
        });

        if (authError) {
          logStep("ERROR creating user", authError.message);
          // If user already exists but wasn't found (edge case), try to continue
          if (!authError.message.includes("already been registered")) {
            throw authError;
          }
        }

        const userId = authData?.user?.id;
        if (userId) {
          const slug = orgName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          // Create organization directly (RPC uses auth.uid() which is null in service context)
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: orgName, slug: `${slug}-${Date.now()}` })
            .select('id')
            .single();

          const orgId = newOrg?.id;
          if (orgError || !orgId) {
            logStep("ERROR creating organization", orgError?.message);
          } else {
            // Add user as owner
            await supabase.from('organization_members').insert({
              organization_id: orgId, user_id: userId, role: 'owner',
            });

            await activateSubscription(supabase, {
              organizationId: orgId,
              planId: plan.id,
              kiwifyOrderId: payload.order_id,
              kiwifySubscriptionId: payload.Subscription?.id,
              billingCycle: detectBillingCycle(payload),
            });

            // Send welcome email
            await sendWelcomeEmail(supabase, {
              email: customerEmail,
              name: customerName,
              password,
              planName: plan.name,
              organizationName: orgName,
            });

            logStep("New account created and subscription activated", { userId, orgId });
          }
        }
      }

      // Create/update contact
      if (plan) {
        await upsertContact(supabase, payload, plan.name);
      }

      await supabase.from("webhook_events").update({
        processed: true,
        processed_at: new Date().toISOString(),
      }).eq("id", webhookEvent.id);

      // Sync WhatsApp groups
      if (existingUser) {
        await callSyncUser(existingUser.id, true);
      }
    }

    // --- Handle refunds and chargebacks ---
    if ((payload.order_status === "refunded" || payload.order_status === "chargedback") && customerEmail) {
      logStep("Processing cancellation/refund");

      const { data: userData } = await supabase.auth.admin.listUsers();
      const existingUser = userData?.users?.find(u => u.email?.toLowerCase() === customerEmail);

      if (existingUser) {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", existingUser.id)
          .limit(1)
          .single();

        if (membership) {
          await supabase.from("subscriptions")
            .update({
              status: payload.order_status === "refunded" ? "canceled" : "past_due",
            })
            .eq("organization_id", membership.organization_id);

          logStep("Subscription deactivated due to " + payload.order_status);
        }

        // Sync WhatsApp groups - remove
        await callSyncUser(existingUser.id, false);
      }

      await supabase.from("webhook_events").update({
        processed: true,
        processed_at: new Date().toISOString(),
      }).eq("id", webhookEvent.id);
    }

    return new Response(
      JSON.stringify({ success: true, event_id: webhookEvent.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[KIWIFY-WEBHOOK] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// --- Helper Functions ---

function detectBillingCycle(payload: KiwifyPayload): "monthly" | "yearly" {
  const subPlan = payload.Subscription?.plan?.name?.toLowerCase() || "";
  if (subPlan.includes("anual") || subPlan.includes("yearly") || subPlan.includes("annual")) {
    return "yearly";
  }
  return "monthly";
}

// deno-lint-ignore no-explicit-any
async function activateSubscription(supabase: any, params: {
  organizationId: string;
  planId: string;
  kiwifyOrderId: string;
  kiwifySubscriptionId?: string;
  billingCycle: "monthly" | "yearly";
}) {
  const { organizationId, planId, kiwifyOrderId, kiwifySubscriptionId, billingCycle } = params;

  // Check if there's an existing subscription with a different provider
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, payment_provider, provider_subscription_id, stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  // If switching FROM Stripe, attempt to cancel the Stripe subscription
  if (existingSub?.payment_provider === "stripe" && existingSub?.provider_subscription_id) {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const { default: Stripe } = await import("https://esm.sh/stripe@14.21.0");
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        await stripe.subscriptions.update(existingSub.provider_subscription_id, {
          cancel_at_period_end: true,
        });
        logStep("Cancelled previous Stripe subscription", { subId: existingSub.provider_subscription_id });
      } catch (err) {
        logStep("Warning: could not cancel Stripe subscription", err);
      }
    }
  }

  // Update org plan
  await supabase.from("organizations").update({ plan_id: planId }).eq("id", organizationId);

  const periodDays = billingCycle === "yearly" ? 365 : 30;
  const subData = {
    organization_id: organizationId,
    plan_id: planId,
    status: "active" as const,
    billing_cycle: billingCycle,
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString(),
    payment_provider: "kiwify",
    provider_subscription_id: kiwifySubscriptionId || kiwifyOrderId,
  };

  if (existingSub) {
    await supabase.from("subscriptions").update(subData).eq("id", existingSub.id);
  } else {
    await supabase.from("subscriptions").insert(subData);
  }
}

// deno-lint-ignore no-explicit-any
async function upsertContact(supabase: any, payload: KiwifyPayload, planName: string) {
  const customer = payload.Customer;
  if (!customer?.email) return;

  // Find an org that has this kiwify product configured
  const { data: orgIntegration } = await supabase
    .from("organization_integrations")
    .select("organization_id")
    .eq("integration_type", "kiwify")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!orgIntegration) return;

  const orgId = orgIntegration.organization_id;

  const { data: owner } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (!owner) return;

  const nameParts = customer.full_name.split(" ");

  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("email", customer.email.toLowerCase())
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!existingContact) {
    await supabase.from("contacts").insert({
      organization_id: orgId,
      user_id: owner.user_id,
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(" ") || null,
      email: customer.email.toLowerCase(),
      phone: customer.mobile,
      source: "kiwify",
      status: "customer",
      notes: `Produto: ${payload.product_name} | Plano: ${planName} | Pedido: ${payload.order_id}`,
    });
  }
}

async function callSyncUser(userId: string, shouldBeActive: boolean) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const response = await fetch(`${supabaseUrl}/functions/v1/subscription-whatsapp-groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ action: "sync_user", user_id: userId, should_be_active: shouldBeActive }),
    });
    const result = await response.text();
    logStep("WhatsApp group sync result", result);
  } catch (err) {
    logStep("Error calling subscription-whatsapp-groups", err);
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// deno-lint-ignore no-explicit-any
async function sendWelcomeEmail(supabase: any, data: {
  email: string; name: string; password: string; planName: string; organizationName: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    logStep("RESEND_API_KEY not configured, skipping welcome email");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AG Sell <noreply@agsell.com.br>",
        to: [data.email],
        subject: `Bem-vindo ao AG Sell - Suas credenciais de acesso`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B1538 0%, #5C0F26 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .credentials { background: white; border: 2px solid #8B1538; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .credential-item { margin: 10px 0; }
              .label { color: #666; font-size: 12px; text-transform: uppercase; }
              .value { font-size: 18px; font-weight: bold; color: #8B1538; }
              .button { display: inline-block; background: #8B1538; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 Bem-vindo ao AG Sell!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Sua conta foi criada com sucesso</p>
              </div>
              <div class="content">
                <p>Olá <strong>${data.name}</strong>,</p>
                <p>Sua conta no AG Sell foi criada com sucesso! Abaixo estão suas credenciais de acesso:</p>
                <div class="credentials">
                  <div class="credential-item"><div class="label">Organização</div><div class="value">${data.organizationName}</div></div>
                  <div class="credential-item"><div class="label">Plano</div><div class="value">${data.planName}</div></div>
                  <div class="credential-item"><div class="label">E-mail</div><div class="value">${data.email}</div></div>
                  <div class="credential-item"><div class="label">Senha Temporária</div><div class="value" style="font-family: monospace;">${data.password}</div></div>
                </div>
                <p><strong>⚠️ Importante:</strong> Altere sua senha após o primeiro acesso.</p>
                <center><a href="https://site.agsell.com.br/login" class="button">Acessar AG Sell</a></center>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });
    if (!response.ok) {
      const txt = await response.text();
      logStep("Resend error", txt);
    }
  } catch (error) {
    logStep("Error sending email", error);
  }
}
