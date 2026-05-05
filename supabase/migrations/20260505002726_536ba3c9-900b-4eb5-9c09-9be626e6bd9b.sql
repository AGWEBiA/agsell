-- Tabela para fila de sincronização de membros de grupos de WhatsApp
CREATE TABLE IF NOT EXISTS public.wa_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('add_member', 'remove_member', 'sync_user')),
    group_id UUID REFERENCES public.plan_whatsapp_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    phone_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.wa_sync_queue ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (admin/service_role podem ver tudo, usuários vêm via organização)
CREATE POLICY "Serviço pode gerenciar fila" ON public.wa_sync_queue
    FOR ALL USING (true);

-- Tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS public.wa_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.wa_sync_queue(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    action_type TEXT,
    status TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nos logs
ALTER TABLE public.wa_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Serviço pode gerenciar logs" ON public.wa_sync_logs
    FOR ALL USING (true);

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wa_sync_queue_updated_at
    BEFORE UPDATE ON public.wa_sync_queue
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
