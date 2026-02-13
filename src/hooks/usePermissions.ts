import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { toast } from 'sonner';

export type AppModule = 
  | 'contacts'
  | 'companies'
  | 'pipeline'
  | 'tasks'
  | 'inbox'
  | 'email'
  | 'whatsapp'
  | 'automations'
  | 'lead_scoring'
  | 'forms'
  | 'analytics'
  | 'integrations'
  | 'settings'
  | 'organization'
  | 'admin';

export type AppAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import' | 'manage';

export interface Permission {
  module: AppModule;
  action: AppAction;
}

export interface PermissionProfile {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  permissions: Permission[];
  created_at: string;
}

export function usePermissions() {
  const { user } = useAuth();
  const { currentOrganization, currentRole } = useOrganization();
  const { isUserMode } = useAdminView();
  const queryClient = useQueryClient();

  // Fetch permission profiles
  const profilesQuery = useQuery({
    queryKey: ['permission_profiles', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_profiles')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${currentOrganization?.id}`)
        .order('is_system', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        permissions: (d.permissions || []) as unknown as Permission[],
      })) as PermissionProfile[];
    },
    enabled: !!currentOrganization?.id,
  });

  // Get current user's permission profile
  const userProfileQuery = useQuery({
    queryKey: ['user_permission_profile', user?.id, currentOrganization?.id],
    queryFn: async () => {
      if (!user?.id || !currentOrganization?.id) return null;

      const { data, error } = await supabase
        .from('organization_members')
        .select('permission_profile_id, role, permission_profiles(*)')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .single();

      if (error) throw error;
      
      // Parse permissions from the profile
      if (data?.permission_profiles) {
        const profile = data.permission_profiles as any;
        return {
          ...data,
          permission_profiles: {
            ...profile,
            permissions: (profile.permissions || []) as Permission[],
          } as PermissionProfile,
        };
      }
      return data;
    },
    enabled: !!user?.id && !!currentOrganization?.id,
  });

  // Check if user has permission (client-side check)
  const hasPermission = (module: AppModule, action: AppAction): boolean => {
    // When in user mode, treat as a regular member (no admin/owner bypass)
    if (isUserMode) {
      // Simulate member-level permissions
      return ['view', 'create', 'edit'].includes(action) && module !== 'admin';
    }

    // Owner has all permissions
    if (currentRole === 'owner') return true;
    
    // Admin has all permissions except admin module
    if (currentRole === 'admin' && module !== 'admin') return true;

    // Get permissions from profile
    const profile = userProfileQuery.data?.permission_profiles as PermissionProfile | null;
    
    if (!profile?.permissions) {
      // Default role-based permissions
      if (currentRole === 'viewer') return action === 'view';
      if (currentRole === 'member') return ['view', 'create', 'edit'].includes(action);
      return false;
    }

    // Check specific permissions
    return profile.permissions.some(p => 
      (p.module === module && p.action === action) ||
      (p.module === module && p.action === 'manage')
    );
  };

  // Server-side permission check via RPC
  const checkPermission = async (module: AppModule, action: AppAction): Promise<boolean> => {
    if (!user?.id || !currentOrganization?.id) return false;

    const { data, error } = await supabase.rpc('has_permission', {
      _user_id: user.id,
      _org_id: currentOrganization.id,
      _module: module,
      _action: action,
    });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data as boolean;
  };

  // Assign permission profile to a member
  const assignProfile = useMutation({
    mutationFn: async ({ memberId, profileId }: { memberId: string; profileId: string | null }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ permission_profile_id: profileId })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_members'] });
      queryClient.invalidateQueries({ queryKey: ['user_permission_profile'] });
      toast.success('Perfil de permissão atribuído!');
    },
    onError: (error) => {
      toast.error('Erro ao atribuir perfil: ' + error.message);
    },
  });

  // Create custom permission profile
  const createProfile = useMutation({
    mutationFn: async (profile: { name: string; slug: string; description?: string; permissions: Permission[] }) => {
      if (!currentOrganization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('permission_profiles')
        .insert({
          name: profile.name,
          slug: profile.slug,
          description: profile.description || null,
          permissions: profile.permissions as unknown as any,
          organization_id: currentOrganization.id,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_profiles'] });
      toast.success('Perfil criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar perfil: ' + error.message);
    },
  });

  // Update permission profile
  const updateProfile = useMutation({
    mutationFn: async ({ id, name, description, permissions }: { id: string; name?: string; description?: string; permissions?: Permission[] }) => {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (permissions !== undefined) updateData.permissions = permissions as unknown as any;

      const { error } = await supabase
        .from('permission_profiles')
        .update(updateData)
        .eq('id', id)
        .eq('is_system', false); // Can't update system profiles

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_profiles'] });
      toast.success('Perfil atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });

  // Delete permission profile
  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('permission_profiles')
        .delete()
        .eq('id', id)
        .eq('is_system', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_profiles'] });
      toast.success('Perfil removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover perfil: ' + error.message);
    },
  });

  return {
    profiles: profilesQuery.data ?? [],
    userProfile: userProfileQuery.data,
    isLoading: profilesQuery.isLoading,
    hasPermission,
    checkPermission,
    assignProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}

// Constants for module display
export const MODULE_LABELS: Record<AppModule, string> = {
  contacts: 'Contatos',
  companies: 'Empresas',
  pipeline: 'Pipeline',
  tasks: 'Tarefas',
  inbox: 'SAC',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  automations: 'Automações',
  lead_scoring: 'Lead Scoring',
  forms: 'Formulários',
  analytics: 'Analytics',
  integrations: 'Integrações',
  settings: 'Configurações',
  organization: 'Organização',
  admin: 'Administração',
};

export const ACTION_LABELS: Record<AppAction, string> = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
  export: 'Exportar',
  import: 'Importar',
  manage: 'Gerenciar (Todos)',
};
