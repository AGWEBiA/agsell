import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// deno-lint-ignore no-explicit-any
type SupabaseClientType = SupabaseClient<any, "public", any>;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    let event: Stripe.Event;

    // SECURITY: Require webhook signature verification
    if (!stripeWebhookSecret || !signature) {
      console.error("Webhook rejected: missing webhook secret or signature");
      return new Response(
        JSON.stringify({ error: "Webhook signature verification required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Stripe webhook received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is a new user signup
        if (session.metadata?.is_new_user === 'true') {
          await handleNewUserSignup(supabase, session);
        }

        // Sync WhatsApp groups for the user
        if (session.customer_details?.email) {
          await syncWhatsAppGroupsByEmail(supabase, session.customer_details.email, true);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabase, subscription);

        // Sync WhatsApp groups - remove from groups
        const { data: canceledSub } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
        if (canceledSub) {
          const { data: members } = await supabase
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', canceledSub.organization_id);
          for (const m of members || []) {
            await callSyncUser(supabase, m.user_id, false);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded for invoice:", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Stripe webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleNewUserSignup(
  supabase: SupabaseClientType,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata || {};
  const email = metadata.user_email || session.customer_details?.email;
  const name = metadata.user_name || session.customer_details?.name || 'Usuário';
  const organizationName = metadata.organization_name || 'Minha Organização';
  const planId = metadata.plan_id;
  const billingCycle = metadata.billing_cycle || 'monthly';

  if (!email || !planId) {
    console.error("Missing required metadata for new user signup");
    return;
  }

  // Check if user already exists
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const userExists = existingUser.users.some((u: { email?: string }) => u.email === email);
  
  if (userExists) {
    console.log("User already exists:", email);
    return;
  }

  // Generate password
  const password = generatePassword();

  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, full_name: name },
  });

  if (authError) {
    console.error("Error creating user:", authError);
    return;
  }

  const userId = authData.user.id;

  // Create organization
  const slug = organizationName.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data: orgId, error: orgError } = await supabase.rpc('create_organization_with_owner', {
    org_name: organizationName,
    org_slug: `${slug}-${Date.now()}`,
  });

  if (orgError) {
    console.error("Error creating organization:", orgError);
    return;
  }

  const orgIdStr = orgId as string;

  // Fix organization membership
  await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgIdStr);

  await supabase
    .from('organization_members')
    .insert({
      organization_id: orgIdStr,
      user_id: userId,
      role: 'owner',
    });

  // Update organization with plan
  await supabase
    .from('organizations')
    .update({ plan_id: planId })
    .eq('id', orgIdStr);

  // Create subscription record
  const periodDays = billingCycle === 'yearly' ? 365 : 30;
  await supabase
    .from('subscriptions')
    .insert({
      organization_id: orgIdStr,
      plan_id: planId,
      status: 'active',
      billing_cycle: billingCycle,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString(),
    });

  // Get plan name
  const { data: plan } = await supabase
    .from('plans')
    .select('name')
    .eq('id', planId)
    .single();

  const planName = (plan as { name: string } | null)?.name || 'Plano';

  // Send welcome email
  await sendWelcomeEmail({
    email,
    name,
    password,
    planName,
    organizationName,
  });

  // Mark checkout lead as converted
  await supabase
    .from('checkout_leads')
    .update({ converted: true, converted_at: new Date().toISOString(), status: 'converted', organization_id: orgIdStr })
    .eq('email', email);

  console.log("New user account created successfully:", email);
}

async function handleSubscriptionUpdate(
  supabase: SupabaseClientType,
  subscription: Stripe.Subscription
) {
  const stripeSubscriptionId = subscription.id;
  
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', stripeSubscriptionId);

  console.log("Subscription updated:", stripeSubscriptionId);
}

async function handleSubscriptionCanceled(
  supabase: SupabaseClientType,
  subscription: Stripe.Subscription
) {
  const stripeSubscriptionId = subscription.id;
  
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', stripeSubscriptionId);

  console.log("Subscription canceled:", stripeSubscriptionId);
}

async function handlePaymentFailed(
  supabase: SupabaseClientType,
  invoice: Stripe.Invoice
) {
  const stripeSubscriptionId = invoice.subscription as string;
  
  if (stripeSubscriptionId) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);
  }

  console.log("Payment failed for subscription:", stripeSubscriptionId);
}

async function syncWhatsAppGroupsByEmail(supabase: SupabaseClientType, email: string, shouldBeActive: boolean) {
  try {
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      await callSyncUser(supabase, user.id, shouldBeActive);
    }
  } catch (err) {
    console.error("Error syncing WhatsApp groups:", err);
  }
}

async function callSyncUser(supabase: SupabaseClientType, userId: string, shouldBeActive: boolean) {
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
    console.log("WhatsApp group sync result:", result);
  } catch (err) {
    console.error("Error calling subscription-whatsapp-groups:", err);
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

async function sendWelcomeEmail(data: {
  email: string;
  name: string;
  password: string;
  planName: string;
  organizationName: string;
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
