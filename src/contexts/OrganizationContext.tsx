import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Organization = Tables<'organizations'>;
type OrganizationMember = Tables<'organization_members'>;

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  currentRole: string | null;
  loading: boolean;
  setCurrentOrganization: (org: Organization | null) => void;
  createOrganization: (name: string, slug: string) => Promise<{ data: Organization | null; error: Error | null }>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!user?.id) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
      return;
    }

    try {
      // Get organizations where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setOrganizations([]);
        setCurrentOrganization(null);
        setLoading(false);
        return;
      }

      const orgIds = memberships.map(m => m.organization_id);
      
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgError) throw orgError;

      setOrganizations(orgs || []);

      // Set current organization from localStorage or first available
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      const savedOrg = orgs?.find(o => o.id === savedOrgId);
      const orgToSet = savedOrg || orgs?.[0] || null;
      
      setCurrentOrganization(orgToSet);

      // Set role for current org
      if (orgToSet) {
        const membership = memberships.find(m => m.organization_id === orgToSet.id);
        setCurrentRole(membership?.role || null);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user?.id]);

  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganizationId', currentOrganization.id);
    }
  }, [currentOrganization]);

  const createOrganization = async (name: string, slug: string): Promise<{ data: Organization | null; error: Error | null }> => {
    try {
      const { data, error } = await supabase.rpc('create_organization_with_owner', {
        org_name: name,
        org_slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      });

      if (error) throw error;

      // Fetch the newly created organization
      const { data: newOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      await fetchOrganizations();
      setCurrentOrganization(newOrg);

      return { data: newOrg, error: null };
    } catch (error) {
      console.error('Error creating organization:', error);
      return { data: null, error: error as Error };
    }
  };

  const handleSetCurrentOrganization = async (org: Organization | null) => {
    setCurrentOrganization(org);
    if (org && user?.id) {
      // Update role when changing organization using RPC
      const { data } = await supabase.rpc('get_org_role', {
        _org_id: org.id,
        _user_id: user.id
      });
      setCurrentRole(data || null);
    } else {
      setCurrentRole(null);
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        currentRole,
        loading,
        setCurrentOrganization: handleSetCurrentOrganization,
        createOrganization,
        refreshOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
