import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ExternalLink, Loader2, RefreshCw, Search, Smartphone, Users, Check } from 'lucide-react';

import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type InlineGroup = {
  id: string;
  name: string;
  description: string | null;
  external_group_id: string | null;
  member_count: number | null;
  is_active: boolean;
  tags: string[] | null;
  settings: Record<string, unknown> | null;
};

export function GroupsManagementInline({ config, onChange }: { config: Record<string, unknown>; onChange: (config: Record<string, unknown>) => void }) {
  const selectedGroupIds = (config.group_ids as string[]) || [];

  const { currentOrganization } = useOrganization();
  const [search, setSearch] = useState('');

  const groupsQuery = useQuery({
    queryKey: ['flow-builder-inline-groups', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [] as InlineGroup[];

      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('id, name, description, external_group_id, member_count, is_active, tags, settings')
        .eq('organization_id', currentOrganization.id)
        .order('is_active', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as InlineGroup[];
    },
    enabled: !!currentOrganization?.id,
  });

  const groups = groupsQuery.data ?? [];

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;

    return groups.filter((group) => {
      const instanceName = typeof group.settings?.instance_name === 'string'
        ? group.settings.instance_name
        : '';

      const searchableValues = [
        group.name,
        group.description ?? '',
        group.external_group_id ?? '',
        instanceName,
        ...(group.tags ?? []),
      ];

      return searchableValues.some((value) => value.toLowerCase().includes(term));
    });
  }, [groups, search]);

  const toggleGroupSelection = (groupId: string) => {
    const newSelection = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter(id => id !== groupId)
      : [...selectedGroupIds, groupId];
    onChange({ ...config, group_ids: newSelection });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-sm font-medium">Atenção</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A gestão de grupos requer uma instância WhatsApp conectada via Evolution API.
          Grupos da API Oficial do WhatsApp não são suportados para automação.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            placeholder="Buscar grupo, JID, tag ou instância..."
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => groupsQuery.refetch()}
            disabled={!currentOrganization?.id || groupsQuery.isFetching}
          >
            {groupsQuery.isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/whatsapp?tab=groups', '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Gerenciador Completo
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {groups.length > 0
          ? `${filteredGroups.length} de ${groups.length} grupo(s) encontrado(s) nesta organização.`
          : 'Aqui você pode pesquisar os grupos já importados da sua organização sem sair do Flow Builder.'}
      </div>

      <div className="max-h-[340px] overflow-y-auto rounded-lg border">
        {!currentOrganization?.id ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Selecione uma organização para carregar os grupos.
          </div>
        ) : groupsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando grupos...
          </div>
        ) : groups.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum grupo foi importado para esta organização ainda.
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum grupo corresponde à sua busca.
          </div>
        ) : (
          <div className="divide-y">
            {filteredGroups.map((group) => {
              const isSelected = selectedGroupIds.includes(group.id);
              const instanceName = typeof group.settings?.instance_name === 'string'
                ? group.settings.instance_name
                : null;

              return (
                <div 
                  key={group.id} 
                  className={cn(
                    "space-y-2 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",
                    isSelected && "bg-primary/5 border-l-4 border-primary"
                  )}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{group.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {group.external_group_id || 'Sem JID externo vinculado'}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {isSelected && <Badge variant="default" className="bg-primary text-white">Selecionado</Badge>}
                      <Badge variant={group.is_active ? 'default' : 'secondary'}>
                        {group.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {instanceName && <Badge variant="outline">{instanceName}</Badge>}
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {group.member_count ?? 0} membro(s)
                    </span>

                    {instanceName && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Smartphone className="h-3.5 w-3.5" />
                        {instanceName}
                      </span>
                    )}

                    {(group.tags ?? []).map((tag) => (
                      <Badge key={`${group.id}-${tag}`} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Para gerenciamento completo de membros, eventos e importação de grupos, use o gerenciador completo do WhatsApp.
      </p>
    </div>
  );
}