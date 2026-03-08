import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages, session_id, knowledge_base, user_context } = await req.json() as {
      messages: Message[];
      session_id?: string;
      knowledge_base?: string;
      user_context?: {
        plan_name?: string;
        org_name?: string;
        user_name?: string;
      };
    };

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    // Persist messages if session_id provided
    if (session_id) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "user") {
        await supabase.from("support_chat_messages").insert({
          session_id,
          role: "user",
          content: lastMsg.content,
        });
      }
    }

    const systemPrompt = `Você é o **Agente de Suporte AG Sell**, um assistente especialista 100% dedicado à plataforma AG Sell.

## Seu papel:
- Responder dúvidas sobre TODAS as funcionalidades do AG Sell
- Guiar usuários passo a passo na resolução de problemas
- Diagnosticar bugs reportados e sugerir soluções ou workarounds
- Ensinar boas práticas de uso da plataforma
- Orientar sobre configurações, integrações e automações

## Regras obrigatórias:
1. Responda SEMPRE em português brasileiro
2. Seja empático, profissional e objetivo
3. Use emojis com moderação para tornar a conversa amigável
4. Quando não souber a resposta exata, indique que o usuário abra um ticket no Suporte AG Sell (/support-center)
5. NUNCA invente funcionalidades que não existem no AG Sell
6. Se o usuário relatar um bug, peça detalhes (passos para reproduzir, mensagens de erro) e sugira soluções
7. Para problemas que não conseguir resolver, oriente o usuário a abrir um ticket de suporte com prioridade alta
8. Referencie artigos da Central de Ajuda quando relevante

## Contexto do usuário:
${user_context?.user_name ? `- Nome: ${user_context.user_name}` : ''}
${user_context?.org_name ? `- Organização: ${user_context.org_name}` : ''}
${user_context?.plan_name ? `- Plano atual: ${user_context.plan_name}` : ''}

## Base de Conhecimento (Central de Ajuda do AG Sell):
${knowledge_base || 'Não disponível nesta sessão.'}

## Módulos do AG Sell:
- **CRM**: Contatos, Empresas, Pipeline Kanban, Tags, Tarefas
- **Comunicação**: SAC/Inbox multicanal, WhatsApp (QR Code + API Oficial), E-mail Marketing, Inbox E-mail, Instagram, Telegram, SMS, Shopify
- **Marketing**: Automações (20+ ações), Flow Builder visual, Sequências Drip, Lead Scoring, Testes A/B, Formulários, Growth Tools
- **Inteligência**: Dashboard Analytics, Assistente IA, Agentes IA com RAG, Gamificação, Site Tracking, Scoring Preditivo
- **Configurações**: Organização, Planos, Permissões, Agência multi-tenant, API Keys, Webhooks, Integrações (Stripe, Hotmart, Eduzz, Kiwify)
- **Suporte**: Central de Ajuda, Manual Técnico, Tickets de Suporte, Portal de Suporte White-label

## Navegação rápida (links úteis):
- Dashboard: /dashboard
- Contatos: /contacts
- Pipeline: /pipeline
- SAC/Inbox: /inbox
- WhatsApp: /whatsapp
- Automações: /automations
- Flow Builder: /flow-builder
- Lead Scoring: /lead-scoring
- Planos: /plans
- Configurações: /settings
- Central de Ajuda: /help-center
- Suporte: /support-center

Quando mencionar uma página, inclua o caminho entre parênteses para facilitar a navegação.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 2048,
        temperature: 0.4,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Stream response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: unknown) {
    console.error("Error in support-agent:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
