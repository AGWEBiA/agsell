
-- Tabela de agentes de IA
CREATE TABLE public.ai_agents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    system_prompt TEXT NOT NULL DEFAULT 'Você é um assistente útil.',
    model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
    temperature NUMERIC NOT NULL DEFAULT 0.7,
    is_active BOOLEAN NOT NULL DEFAULT true,
    channels TEXT[] NOT NULL DEFAULT '{}',
    knowledge_base TEXT,
    welcome_message TEXT,
    fallback_message TEXT DEFAULT 'Desculpe, não consegui entender. Posso te transferir para um atendente humano?',
    max_tokens INTEGER DEFAULT 2048,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

-- Tabela de documentos de conhecimento dos agentes
CREATE TABLE public.ai_agent_knowledge (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de conversas dos agentes
CREATE TABLE public.ai_agent_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    satisfaction_rating INTEGER,
    transferred_to_human BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for ai_agents
CREATE POLICY "Members can view agents" ON public.ai_agents
    FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can insert agents" ON public.ai_agents
    FOR INSERT WITH CHECK (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update agents" ON public.ai_agents
    FOR UPDATE USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can delete agents" ON public.ai_agents
    FOR DELETE USING (is_org_admin(organization_id, auth.uid()));

-- Policies for ai_agent_knowledge
CREATE POLICY "Members can view knowledge" ON public.ai_agent_knowledge
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.ai_agents a
        WHERE a.id = ai_agent_knowledge.agent_id
        AND is_org_member(a.organization_id, auth.uid())
    ));

CREATE POLICY "Admins can manage knowledge" ON public.ai_agent_knowledge
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.ai_agents a
        WHERE a.id = ai_agent_knowledge.agent_id
        AND is_org_admin(a.organization_id, auth.uid())
    ));

-- Policies for ai_agent_conversations
CREATE POLICY "Members can view agent conversations" ON public.ai_agent_conversations
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.ai_agents a
        WHERE a.id = ai_agent_conversations.agent_id
        AND is_org_member(a.organization_id, auth.uid())
    ));

CREATE POLICY "System can insert agent conversations" ON public.ai_agent_conversations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update agent conversations" ON public.ai_agent_conversations
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.ai_agents a
        WHERE a.id = ai_agent_conversations.agent_id
        AND is_org_member(a.organization_id, auth.uid())
    ));

-- Indexes
CREATE INDEX idx_ai_agents_org ON public.ai_agents(organization_id);
CREATE INDEX idx_ai_agent_knowledge_agent ON public.ai_agent_knowledge(agent_id);
CREATE INDEX idx_ai_agent_conversations_agent ON public.ai_agent_conversations(agent_id);

-- Updated at triggers
CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agent_knowledge_updated_at
    BEFORE UPDATE ON public.ai_agent_knowledge
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
