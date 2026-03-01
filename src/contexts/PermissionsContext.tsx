import React, { createContext, useContext, useMemo } from 'react';
import { usePermissions, AppModule, AppAction, PermissionProfile } from '@/hooks/usePermissions';
import { usePlans, Plan, PlanLimitCheck } from '@/hooks/usePlans';

interface PermissionsContextType {
  // Permission checks
  hasPermission: (module: AppModule, action: AppAction) => boolean;
  checkPermission: (module: AppModule, action: AppAction) => Promise<boolean>;
  
  // Permission profiles
  profiles: PermissionProfile[];
  
  // Plan info
  currentPlan: Plan | null | undefined;
  checkPlanLimit: (resource: 'users' | 'contacts' | 'emails' | 'whatsapp' | 'automations' | 'forms' | 'ai_requests', currentCount?: number) => Promise<PlanLimitCheck>;
  hasFeature: (feature: string) => boolean;
  
  // Loading state
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { 
    profiles, 
    hasPermission, 
    checkPermission, 
    isLoading: permissionsLoading 
  } = usePermissions();
  
  const { 
    currentPlan, 
    checkPlanLimit, 
    isLoading: plansLoading 
  } = usePlans();

  const hasFeature = useMemo(() => {
    return (feature: string) => currentPlan?.features?.includes(feature) ?? false;
  }, [currentPlan]);

  const value = useMemo(() => ({
    hasPermission,
    checkPermission,
    profiles,
    currentPlan,
    checkPlanLimit,
    hasFeature,
    isLoading: permissionsLoading || plansLoading,
  }), [hasPermission, checkPermission, profiles, currentPlan, checkPlanLimit, hasFeature, permissionsLoading, plansLoading]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
}

// HOC for protecting components based on permissions
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  module: AppModule,
  action: AppAction,
  fallback?: React.ReactNode
) {
  return function PermissionGuard(props: P) {
    const { hasPermission, isLoading } = usePermissionsContext();

    if (isLoading) {
      return null;
    }

    if (!hasPermission(module, action)) {
      return fallback ? <>{fallback}</> : null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Component for conditional rendering based on permissions
export function PermissionGate({ 
  module, 
  action, 
  children, 
  fallback 
}: { 
  module: AppModule; 
  action: AppAction; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { hasPermission, isLoading } = usePermissionsContext();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(module, action)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Component for conditional rendering based on plan features
export function FeatureGate({ 
  feature, 
  children, 
  fallback 
}: { 
  feature: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { hasFeature, isLoading } = usePermissionsContext();

  if (isLoading) {
    return null;
  }

  if (!hasFeature(feature)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
