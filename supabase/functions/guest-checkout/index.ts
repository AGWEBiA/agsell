import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Input Validation ---
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

function sanitizeString(val: string, maxLen = 200): string {
  return val.trim().substring(0, maxLen);
}

// --- Rate Limiting (in-memory, per-instance) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5; // max requests per window per email
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.json();
    const planId = sanitizeString(rawBody.planId || "", 36);
    const billingCycle = rawBody.billingCycle === "yearly" ? "yearly" : "monthly";
    const name = sanitizeString(rawBody.name || "", 200);
    const email = sanitizeString(rawBody.email || "", 320).toLowerCase();
    const organizationName = sanitizeString(rawBody.organizationName || "", 200);
    const couponCode = rawBody.couponCode ? sanitizeString(rawBody.couponCode, 50) : undefined;

    // Validate required fields
    if (!planId || !name || !email || !organizationName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit by email
    if (!checkRateLimit(email)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isFree = plan.price_monthly === 0;

    // For free plans or test mode (no Stripe key), create account directly
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (isFree || !stripeSecretKey) {
      const result = await createAccountDirectly(supabase, {
        email, name, organizationName, planId, billingCycle,
        planName: plan.name, isFree,
      });
      return new Response(
        JSON.stringify(result),
        { status: result.error ? 400 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Real Stripe checkout
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Check for existing customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { organization_name: organizationName },
      });
      customerId = customer.id;
    }

    // Use pre-configured Stripe price ID or create dynamically
    const stripePriceId = billingCycle === "yearly"
      ? plan.stripe_price_id_yearly
      : plan.stripe_price_id_monthly;

    let priceId: string;
    if (stripePriceId) {
      priceId = stripePriceId;
      console.log(`Using pre-configured Stripe price: ${priceId}`);
    } else {
      const amount = billingCycle === "yearly"
        ? Math.round(plan.price_yearly * 100)
        : Math.round(plan.price_monthly * 100);

      const price = await stripe.prices.create({
        currency: "brl",
        unit_amount: amount,
        recurring: { interval: billingCycle === "yearly" ? "year" : "month" },
        product_data: {
          name: `AG Sell - ${plan.name}`,
          metadata: { plan_id: plan.id },
        },
      });
      priceId = price.id;
    }

    // Validate coupon if provided
    let discounts: { coupon: string }[] | undefined;
    if (couponCode) {
      try {
        const coupons = await stripe.coupons.list({ limit: 100 });
        const matchingCoupon = coupons.data.find(
          (c: Stripe.Coupon) => c.name?.toLowerCase() === couponCode.toLowerCase() || c.id.toLowerCase() === couponCode.toLowerCase()
        );
        if (matchingCoupon && matchingCoupon.valid) {
          discounts = [{ coupon: matchingCoupon.id }];
        }
      } catch (couponError) {
        console.error("Error validating coupon:", couponError);
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      discounts,
      allow_promotion_codes: !discounts,
      success_url: `${req.headers.get("origin")}/purchase-success?plan=${encodeURIComponent(plan.name)}`,
      cancel_url: `${req.headers.get("origin")}/pricing?canceled=true`,
      metadata: {
        plan_id: planId,
        billing_cycle: billingCycle,
        user_name: name,
        user_email: email,
        organization_name: organizationName,
        is_new_user: 'true',
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Guest checkout error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// --- Shared account creation logic ---
// deno-lint-ignore no-explicit-any
async function createAccountDirectly(supabase: any, params: {
  email: string; name: string; organizationName: string;
  planId: string; billingCycle: string; planName: string; isFree: boolean;
}) {
  const { email, name, organizationName, planId, billingCycle, planName, isFree } = params;
  const password = generatePassword();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, full_name: name },
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      return { error: "Este e-mail já está cadastrado. Faça login." };
    }
    return { error: "Failed to create account" };
  }

  const userId = authData.user.id;

  const slug = organizationName.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data: orgId } = await supabase.rpc('create_organization_with_owner', {
    org_name: organizationName,
    org_slug: `${slug}-${Date.now()}`,
  });

  await supabase.from('organization_members').delete().eq('organization_id', orgId);
  await supabase.from('organization_members').insert({
    organization_id: orgId, user_id: userId, role: 'owner',
  });
  await supabase.from('organizations').update({ plan_id: planId }).eq('id', orgId);

  const periodDays = isFree ? 365 : (billingCycle === 'yearly' ? 365 : 30);
  await supabase.from('subscriptions').insert({
    organization_id: orgId as string,
    plan_id: planId,
    status: 'active',
    billing_cycle: isFree ? 'monthly' : billingCycle,
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString(),
  });

  await sendWelcomeEmail({ email, name, password, planName, organizationName });
  return { success: true, message: "Account created" };
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendWelcomeEmail(data: {
  email: string; name: string; password: string; planName: string; organizationName: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email");
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
          <head>
            <meta charset="utf-8">
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
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
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
                  <div class="credential-item">
                    <div class="label">Organização</div>
                    <div class="value">${data.organizationName}</div>
                  </div>
                  <div class="credential-item">
                    <div class="label">Plano Contratado</div>
                    <div class="value">${data.planName}</div>
                  </div>
                  <div class="credential-item">
                    <div class="label">E-mail de Login</div>
                    <div class="value">${data.email}</div>
                  </div>
                  <div class="credential-item">
                    <div class="label">Senha Temporária</div>
                    <div class="value" style="font-family: monospace;">${data.password}</div>
                  </div>
                </div>
                <p><strong>⚠️ Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso.</p>
                <center>
                  <a href="https://agsell.lovable.app/login" class="button">Acessar AG Sell</a>
                </center>
                <div class="footer">
                  <p>Se você não solicitou esta conta, por favor ignore este e-mail.</p>
                  <p>© ${new Date().getFullYear()} AG Sell. Todos os direitos reservados.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", errorData);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
